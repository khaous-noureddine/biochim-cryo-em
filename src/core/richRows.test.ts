import { describe, expect, it } from "vitest";
import { renumberRichRow, richAttachmentGroup, type RichRow } from "./richRows";

function row(id: string, attachedTo: string | null = null): RichRow {
  return { id, kind: "sequence", name: id, description: "", position: 0,
    cells: [], numbering: { mode: "fixed" }, attachedTo };
}

describe("rich row numbering", () => {
  it("matches the historical gap definition for mixed annotation cells", () => {
    const source: RichRow = { ...row("consensus"), kind: "annotation", role: "consensus",
      numbering: { mode: "automatic", start: -2.5 },
      cells: ["A", "-", ".", "_", " ", "", "a", "+", "label", "--", "\t"].map((text) => ({ text, number: 99 })) };
    const result = renumberRichRow(source);
    expect(result.cells.map((cell) => cell.number)).toEqual([-2.5, null, null, null, null, null, -1.5, -0.5, 0.5, 1.5, 2.5]);
    expect(source.cells.every((cell) => cell.number === 99)).toBe(true);
    expect(result.cells.map((cell) => cell.text)).toEqual(source.cells.map((cell) => cell.text));
  });

  it("retains absent, null, zero and fractional numbers for fixed rows", () => {
    const source: RichRow = { ...row("pdb"), cells: [
      { text: "A" }, { text: "-", number: null }, { text: "C", number: 0 }, { text: "D", number: 1.0002 },
    ] };
    expect(renumberRichRow(source)).toBe(source);
    const reopened = JSON.parse(JSON.stringify(source)) as RichRow;
    expect(Object.hasOwn(reopened.cells[0], "number")).toBe(false);
    expect(reopened.cells.slice(1).map((cell) => cell.number)).toEqual([null, 0, 1.0002]);
  });

  it("preserves style and original structure identity during recalculation", () => {
    const source: RichRow = { ...row("pdb"), numbering: { mode: "automatic", start: 0 }, cells: [{
      text: "A", number: 42, style: { fontFamily: "Helvetica", foreground: "#123456" },
      residueIdentity: { model: "1", authorChain: "", labelChain: "AA", authorNumber: "42", insertionCode: "B" },
    }] };
    expect(renumberRichRow(source).cells[0]).toEqual({ ...source.cells[0], number: 0 });
    expect(source.cells[0].number).toBe(42);
  });

  it.each([NaN, Infinity, -Infinity, Number.MAX_VALUE])("rejects unsafe numbering %s without changing the row", (start) => {
    const source: RichRow = { ...row("bad"), numbering: { mode: "automatic", start }, cells: [{ text: "A", number: 7 }] };
    expect(() => renumberRichRow(source)).toThrow(/finite|precision/);
    expect(source.cells[0].number).toBe(7);
  });
});

describe("rich row attachments", () => {
  it("follows parent, children, siblings and cycles in stable document order", () => {
    const rows = [row("a", "b"), row("b", "c"), row("c", "a"), row("d", "b"), row("other")];
    expect(richAttachmentGroup(rows, "d")).toEqual(["a", "b", "c", "d"]);
    expect(richAttachmentGroup(rows, "a", true)).toEqual(["b", "c", "d"]);
    expect(richAttachmentGroup(rows, "other")).toEqual(["other"]);
    expect(rows.map((item) => item.attachedTo)).toEqual(["b", "c", "a", "b", null]);
  });

  it("handles self-links without recursion", () => {
    expect(richAttachmentGroup([row("self", "self")], "self")).toEqual(["self"]);
    expect(richAttachmentGroup([row("self", "self")], "self", true)).toEqual([]);
  });

  it("rejects ambiguous and dangling identifiers", () => {
    expect(() => richAttachmentGroup([row("a"), row("a")], "a")).toThrow(/unique/);
    expect(() => richAttachmentGroup([row("a", "missing")], "a")).toThrow(/target/);
    expect(() => richAttachmentGroup([row("a")], "missing")).toThrow(/Unknown row/);
  });

  it("handles a long chain with iterative traversal", () => {
    const rows = Array.from({ length: 20000 }, (_, i) => row(String(i), i ? String(i - 1) : null));
    expect(richAttachmentGroup(rows, "19999")).toHaveLength(20000);
  });
});
