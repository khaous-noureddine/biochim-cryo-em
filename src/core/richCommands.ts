import type { RichDocument } from "./richProject";
import { serializeRichProject } from "./richProject";
import type { RichCell } from "./richRows";

export type RichCommand = {
  type: "splice-columns";
  start: number;
  deleteCount: number;
  insertCount: number;
};

/** Global column editing. Row-local edits and attachment propagation are separate. */
export function applyRichCommand(document: RichDocument, command: RichCommand): RichDocument {
  const { start, deleteCount, insertCount } = command;
  if (command.type !== "splice-columns" || ![start, deleteCount, insertCount].every(value => Number.isSafeInteger(value) && value >= 0)
    || start > document.columnCount || deleteCount > document.columnCount - start) {
    throw new Error("Invalid column splice.");
  }
  if (!deleteCount && !insertCount) return document;
  const columnCount = document.columnCount - deleteCount + insertCount;
  if (!Number.isSafeInteger(columnCount)) throw new Error("Column count exceeds safe integer range.");
  const end = start + deleteCount;
  let count = 0;
  for (const row of document.rows) {
    count += row.cells.length - Math.max(0, Math.min(row.cells.length, end) - start)
      + (start <= row.cells.length ? insertCount : 0);
    if (count > 1_000_000) throw new Error("Column splice exceeds cell limit.");
  }
  const rows = document.rows.map(row => {
    // Short rows do not acquire unrelated trailing cells from distant edits.
    if (start > row.cells.length) return row;
    const inserted = Array.from({ length: insertCount }, (): RichCell => ({ text: row.kind === "sequence" ? "-" : "", number: null }));
    return { ...row, cells: [...row.cells.slice(0, start), ...inserted, ...row.cells.slice(end)] };
  });
  const objects = document.objects.map(object => ({ ...object,
    items: object.items.flatMap(item => {
      if (item.column >= start && item.column < end) return [];
      return [item.column < start ? item : { ...item, column: item.column - deleteCount + insertCount }];
    }),
  }));
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
