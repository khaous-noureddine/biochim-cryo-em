import { expect, it } from "vitest";
import { ANNOTATION_KINDS, createAlignmentDocument } from "./model";
import { migrateV1Project } from "./migrateV1";
import { parseRichProject, serializeRichProject } from "./richProject";

it("migrates every annotation kind, text, linked regions and manual styles", () => {
  const old = createAlignmentDocument("Migration", [
    { id: "atlas-v1:lane:0", name: "First", description: "", residues: "A.-C", numberingStart: 0 },
    { id: "second", name: "Second", description: "retained", residues: "AC", numberingStart: 12 },
  ]);
  old.annotations = ANNOTATION_KINDS.map((kind, index) => ({ id: String(index), kind, start: 0, end: 0, lane: 0, color: "#123456", zIndex: index }));
  old.regions = [{ id: "0", kind: "rectangle", sequenceIds: ["second", "atlas-v1:lane:0"], start: 1, end: 3, lineColor: "#111111", fillColor: "#222222", lineWidth: 2 }];
  old.textAnnotations = [{ id: "0", kind: "outline-text", column: 2, lane: 1, text: "α beta", color: "#112233", outlineColor: "#445566", outlineWidth: 2, fontFamily: "Arial", fontSize: 14, fontWeight: "bold", italic: true, align: "right" }];
  old.cellStyles = [{ sequenceId: "second", column: 3, background: "#abcdef" }];
  const source = JSON.stringify(old);
  const { document, warnings } = migrateV1Project(source);
  expect(warnings).toHaveLength(2);
  expect(JSON.stringify(old)).toBe(source);
  expect(document.rows.map(row => row.id)).toEqual(["atlas-v1:lane:0:1", "atlas-v1:lane:1", "atlas-v1:lane:0", "second"]);
  expect(document.rows[2].cells.map(cell => cell.number)).toEqual([0, 1, null, 2]);
  expect(document.rows[3].cells[3]).toEqual({ text: "-", number: null, style: { background: "#abcdef" } });
  expect(new Set(document.objects.map(object => object.id)).size).toBe(document.objects.length);
  expect(document.objects.slice(0, ANNOTATION_KINDS.length).map(object => object.items[0].kind)).toEqual([
    "Helix", "Helix2", "Strand", "Strand2", "Coil", "Line", "DashedLine", "ConnectUp", "ConnectDown", "Underline",
    "UpTriangle", "DownTriangle", "UpTriangleS", "DownTriangleS", "Circle", "Star", "Starm", "Square", "Diamond", "UpArrowC", "DownArrowC", "UpArrowR", "DownArrowR", "BarR",
  ]);
  const text = document.objects.find(object => object.items[0].kind === "OutlineText")!;
  expect(text.items[0]).toMatchObject({ text: "α beta", column: 2, style: { anchor: "e", fontSlant: "italic", lineWidth: 2 } });
  const region = document.objects.slice(-2);
  expect(region.map(object => object.rowId)).toEqual(["second", "atlas-v1:lane:0"]);
  expect(region[0].nextId).toBe(region[1].id);
  expect(region[1].previousId).toBe(region[0].id);
  expect(region[0].items.map(item => item.column)).toEqual([1, 2, 3]);
  expect(document.compatibility!.atlasV1Source).toEqual(old);
  expect(parseRichProject(serializeRichProject(document))).toEqual(document);
});

it("retains original extension fields and spellings while reproducing v1 normalization", () => {
  const source = JSON.stringify({ format: "atlas-alignment", version: 1, id: "x", name: "x",
    extension: { future: true }, sequences: [{ id: "s", name: "s", residues: "ac", numberingStart: 1, extra: "keep" }] });
  const result = migrateV1Project(source);
  expect(result.document.rows[2].cells.map(cell => cell.text).join("")).toBe("AC");
  expect(result.document.compatibility!.atlasV1Source).toEqual(JSON.parse(source));
  expect(migrateV1Project(source)).toEqual(result);
});

it("rejects ambiguous, future, invalid and unsafe-numbered source projects", () => {
  expect(() => migrateV1Project('{"version":1,"version":2}')).toThrow(/duplicate/);
  const old = createAlignmentDocument("x", [{ id: "s", name: "s", description: "", residues: "AA", numberingStart: Number.MAX_SAFE_INTEGER }]);
  expect(() => migrateV1Project(JSON.stringify(old))).toThrow(/safe integer/);
  expect(() => migrateV1Project(JSON.stringify({ ...old, version: 3 }))).toThrow();
});
