import { expect, it } from "vitest";
import { applyRichCommand, createRichHistory, richHistoryReducer } from "./richCommands";
import { DEFAULT_RICH_LAYOUT, parseRichProject, serializeRichProject, type RichDocument } from "./richProject";

function fixture(): RichDocument {
  return { format: "atlas-alignment", version: 2, id: "d", name: "edit", columnCount: 4,
    layout: { ...DEFAULT_RICH_LAYOUT }, palettes: [], activePaletteId: null,
    rows: [
      { id: "s", kind: "sequence", name: "s", description: "", position: 1, numbering: { mode: "fixed" }, attachedTo: "a",
        cells: [{ text: "A", number: 10 }, { text: "C", number: null }, { text: "D", number: -0, style: { foreground: "red" }, compatibility: { original: true } }, { text: "E" }] },
      { id: "a", kind: "annotation", name: "a", description: "", position: 0, numbering: { mode: "fixed" }, attachedTo: "s", cells: [{ text: "label" }] },
    ],
    objects: [{ id: "g", rowId: "s", zIndex: 1, multi: false, previousId: "g", nextId: "g", graph: { height: 12, cutoff: 0, sampleSpace: "drawing" },
      items: [{ kind: "LineGraph", column: 3, sample: 2 }, { kind: "LineGraph", column: 1, sample: -1 }, { kind: "LineGraph", column: 3, sample: 3 }] }],
    analyses: [{ id: "analysis", provider: "fixture", method: "test", version: null, parameters: {}, inputs: [{ id: "in", rowId: "s", cells: ["A", "C", "D", "E"] }],
      series: [{ id: "raw", inputId: "in", label: "raw", valueSpace: "raw", values: [1, 2, 3, 4] }] }],
  };
}

it("splices cells and sparse object coverage without mutating metadata or measurements", () => {
  const document = fixture();
  const before = serializeRichProject(document);
  const next = applyRichCommand(document, { type: "splice-columns", start: 1, deleteCount: 1, insertCount: 2 });
  expect(next.columnCount).toBe(5);
  expect(next.rows[0].cells.map(cell => cell.text)).toEqual(["A", "-", "-", "D", "E"]);
  expect(next.rows[0].cells[3]).toBe(document.rows[0].cells[2]);
  expect(next.rows[1].cells.map(cell => cell.text)).toEqual(["label", "", ""]);
  expect(next.objects[0].items.map(item => [item.column, item.sample])).toEqual([[4, 2], [4, 3]]);
  expect(next.objects[0].nextId).toBe("g");
  expect(next.analyses).toBe(document.analyses);
  expect(serializeRichProject(document)).toBe(before);
  expect(parseRichProject(serializeRichProject(next))).toEqual(next);
});

it("leaves short rows short for distant edits and retains empty linked containers", () => {
  const document = fixture();
  const appended = applyRichCommand(document, { type: "splice-columns", start: 4, deleteCount: 0, insertCount: 1 });
  expect(appended.rows[1]).toBe(document.rows[1]);
  const empty = applyRichCommand(document, { type: "splice-columns", start: 0, deleteCount: 4, insertCount: 0 });
  expect(empty.columnCount).toBe(0);
  expect(empty.rows.every(row => row.cells.length === 0)).toBe(true);
  expect(empty.objects[0].items).toEqual([]);
  expect(empty.objects[0].nextId).toBe("g");
});

it("provides atomic undo/redo, saved identity, branching and no-op behavior", () => {
  const initial = createRichHistory(fixture());
  const changed = richHistoryReducer(initial, { type: "execute", command: { type: "splice-columns", start: 0, deleteCount: 1, insertCount: 0 } });
  expect(changed.past).toEqual([initial.present]);
  expect(changed.dirty).toBe(true);
  const saved = richHistoryReducer(changed, { type: "mark-saved" });
  const undo = richHistoryReducer(saved, { type: "undo" });
  expect(undo.present).toBe(initial.present);
  expect(undo.dirty).toBe(true);
  expect(richHistoryReducer(undo, { type: "redo" }).dirty).toBe(false);
  const noop = richHistoryReducer(undo, { type: "execute", command: { type: "splice-columns", start: 0, deleteCount: 0, insertCount: 0 } });
  expect(noop).toBe(undo);
  const branch = richHistoryReducer(undo, { type: "execute", command: { type: "splice-columns", start: 0, deleteCount: 0, insertCount: 1 } });
  expect(branch.future).toEqual([]);
  expect(richHistoryReducer(branch, { type: "open", document: initial.present })).toEqual(initial);
});

it("rejects invalid ranges and excessive allocation without changing history", () => {
  const state = createRichHistory(fixture());
  const before = serializeRichProject(state.present);
  for (const [start, deleteCount, insertCount] of [[-1, 0, 0], [5, 0, 1], [3, 2, 0], [0, 0, 1.5], [0, 0, 1_000_001]]) {
    expect(() => richHistoryReducer(state, { type: "execute", command: { type: "splice-columns", start, deleteCount, insertCount } })).toThrow();
  }
  expect(state.past).toEqual([]);
  expect(serializeRichProject(state.present)).toBe(before);
});

it("propagates row splices through cyclic attachments without touching unrelated rows", () => {
  const document = fixture();
  document.rows.push({ ...document.rows[0], id: "unrelated", attachedTo: null });
  document.objects.push({ ...document.objects[0], id: "other", rowId: "unrelated", previousId: "other", nextId: "other" });
  const state = createRichHistory(document);
  const next = richHistoryReducer(state, { type: "execute", command: { type: "splice-row", rowId: "a", start: 1, deleteCount: 0, insertCount: 2 } });
  expect(next.present.columnCount).toBe(6);
  expect(next.present.rows[0].cells.map(cell => cell.text)).toEqual(["A", "-", "-", "C", "D", "E"]);
  expect(next.present.rows[1].cells.map(cell => cell.text)).toEqual(["label", "", ""]);
  expect(next.present.rows[2]).toBe(document.rows[2]);
  expect(next.present.objects[0].items.map(item => item.column)).toEqual([5, 3, 5]);
  expect(next.present.objects[1]).toBe(document.objects[1]);
  expect(next.present.analyses).toBe(document.analyses);
  expect(next.past).toHaveLength(1);
  expect(richHistoryReducer(next, { type: "undo" }).present).toBe(document);
  expect(parseRichProject(serializeRichProject(next.present))).toEqual(next.present);
});

it("retains document width on local deletion and rejects unknown target rows", () => {
  const document = fixture();
  const next = applyRichCommand(document, { type: "splice-row", rowId: "s", start: 0, deleteCount: 4, insertCount: 0 });
  expect(next.columnCount).toBe(4);
  expect(next.rows.every(row => row.cells.length === 0)).toBe(true);
  expect(() => applyRichCommand(document, { type: "splice-row", rowId: "missing", start: 0, deleteCount: 0, insertCount: 0 })).toThrow(/Unknown row/);
});
