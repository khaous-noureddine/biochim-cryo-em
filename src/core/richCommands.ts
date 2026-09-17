import type { RichDocument } from "./richProject";
import { serializeRichProject } from "./richProject";
import type { RichCell, RichTextStyle } from "./richRows";
import { richAttachmentGroup } from "./richRows";
import { INSERT_GROWING_KINDS } from "./richObjects";
import { style as validateStyle } from "./richValidation";

export type RichCommand = ({ type: "splice-columns" } | { type: "splice-row"; rowId: string }) & {
  start: number;
  deleteCount: number;
  insertCount: number;
  copyLeftStyle?: boolean;
  defaultStyle?: RichTextStyle;
};

/** Column or connected-row editing with one atomic publication boundary. */
export function applyRichCommand(document: RichDocument, command: RichCommand): RichDocument {
  const { start, deleteCount, insertCount } = command;
  if (!["splice-columns", "splice-row"].includes(command.type) || ![start, deleteCount, insertCount].every(value => Number.isSafeInteger(value) && value >= 0)
    || start > document.columnCount || deleteCount > document.columnCount - start) {
    throw new Error("Invalid column splice.");
  }
  const affected = command.type === "splice-row"
    ? new Set(richAttachmentGroup(document.rows, command.rowId)) : null;
  if (command.copyLeftStyle !== undefined && typeof command.copyLeftStyle !== "boolean") throw new Error("Invalid insertion style policy.");
  const defaultStyle = command.defaultStyle === undefined ? undefined : validateStyle(command.defaultStyle, "defaultStyle", false);
  if (!deleteCount && !insertCount) return document;
  let columnCount = affected ? document.columnCount : document.columnCount - deleteCount + insertCount;
  if (!Number.isSafeInteger(columnCount)) throw new Error("Column count exceeds safe integer range.");
  const end = start + deleteCount;
  let count = 0;
  for (const row of document.rows) {
    const length = affected && !affected.has(row.id) ? row.cells.length
      : row.cells.length - Math.max(0, Math.min(row.cells.length, end) - start)
        + (start <= row.cells.length ? insertCount : 0);
    count += length;
    if (affected) columnCount = Math.max(columnCount, length);
    if (count > 1_000_000) throw new Error("Column splice exceeds cell limit.");
  }
  const rows = document.rows.map(row => {
    // Short rows do not acquire unrelated trailing cells from distant edits.
    if ((affected && !affected.has(row.id)) || start > row.cells.length) return row;
    const sourceStyle = command.copyLeftStyle && start > 0 ? row.cells[start - 1]?.style : defaultStyle;
    const inserted = Array.from({ length: insertCount }, (): RichCell => ({ text: row.kind === "sequence" ? "-" : "", number: null,
      ...(sourceStyle ? { style: { ...sourceStyle, anchor: "center" } } : {}) }));
    return { ...row, cells: [...row.cells.slice(0, start), ...inserted, ...row.cells.slice(end)] };
  });
  let itemCount = document.objects.reduce((sum, object) => sum + object.items.length, 0);
  const objects = document.objects.map(object => {
    if (affected && !affected.has(object.rowId)) return object;
    const remaining = object.items.filter(item => item.column < start || item.column >= end)
      .map(item => item.column < start ? item : { ...item, column: item.column - deleteCount });
    itemCount -= object.items.length - remaining.length;
    // Preserve array order. Grow only at the last boundary item with an
    // immediately preceding adjacent item, as in historical _InsertCells.
    let boundary = -1;
    remaining.forEach((item, index) => { if (item.column === start) boundary = index; });
    const grow = insertCount > 0 && boundary > 0 && remaining[boundary - 1].column === start - 1
      && INSERT_GROWING_KINDS.includes(remaining[boundary].kind);
    if (grow) itemCount += insertCount;
    if (itemCount > 1_000_000) throw new Error("Column splice exceeds object item limit.");
    return { ...object, items: remaining.flatMap((item, index) => {
      const column = item.column < start ? item.column : item.column + insertCount;
      if (affected) columnCount = Math.max(columnCount, column + 1);
      const shifted = column === item.column ? item : { ...item, column };
      return grow && index === boundary
        ? [...Array.from({ length: insertCount }, (_, offset) => ({ ...item, column: start + offset })), shifted]
        : [shifted];
    }) };
  });
  const result = { ...document, columnCount, rows, objects };
  // Validate atomically before a caller publishes the state or adds history.
  serializeRichProject(result);
  return result;
}

export type RichHistory = {
  past: RichDocument[]; present: RichDocument; future: RichDocument[]; saved: RichDocument; dirty: boolean;
};
export type RichHistoryAction = { type: "execute"; command: RichCommand }
  | { type: "undo" | "redo" | "mark-saved" } | { type: "open"; document: RichDocument };

export function createRichHistory(document: RichDocument): RichHistory {
  serializeRichProject(document);
  return { past: [], present: document, future: [], saved: document, dirty: false };
}

export function richHistoryReducer(state: RichHistory, action: RichHistoryAction): RichHistory {
  if (action.type === "open") return createRichHistory(action.document);
  if (action.type === "mark-saved") return { ...state, saved: state.present, dirty: false };
  if (action.type === "execute") {
    const present = applyRichCommand(state.present, action.command);
    return present === state.present ? state : { past: [...state.past, state.present], present, future: [], saved: state.saved, dirty: true };
  }
  if (action.type === "undo") {
    const present = state.past.at(-1);
    return present ? { past: state.past.slice(0, -1), present, future: [state.present, ...state.future], saved: state.saved, dirty: present !== state.saved } : state;
  }
  const present = state.future[0];
  return present ? { past: [...state.past, state.present], present, future: state.future.slice(1), saved: state.saved, dirty: present !== state.saved } : state;
}
