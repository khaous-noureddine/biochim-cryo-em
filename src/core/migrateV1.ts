import { parseJsonData, stringifyJsonData } from "./jsonData";
import type { AnnotationKind } from "./model";
import { parseAtlasProject } from "./project";
import { DEFAULT_RICH_LAYOUT, parseRichProject, serializeRichProject, type RichDocument } from "./richProject";
import type { RichObject, RichObjectKind } from "./richObjects";
import type { RichRow } from "./richRows";

const KINDS: Record<AnnotationKind, RichObjectKind> = {
  helix: "Helix", "helix-alt": "Helix2", strand: "Strand", "strand-alt": "Strand2", coil: "Coil",
  line: "Line", "dashed-line": "DashedLine", "connector-up": "ConnectUp", "connector-down": "ConnectDown", underline: "Underline",
  "triangle-up": "UpTriangle", "triangle-down": "DownTriangle", "triangle-up-small": "UpTriangleS", "triangle-down-small": "DownTriangleS",
  circle: "Circle", star: "Star", "hollow-star": "Starm", square: "Square", diamond: "Diamond",
  "arrow-up": "UpArrowC", "arrow-down": "DownArrowC", "arrow-up-right": "UpArrowR", "arrow-down-right": "DownArrowR", "right-bar": "BarR",
};

/** Converts the version-1 visible document and retains its exact decoded source. */
export function migrateV1Project(source: string): { document: RichDocument; warnings: string[] } {
  const original = parseJsonData(source);
  const old = parseAtlasProject(stringifyJsonData(original));
  const columnCount = old.sequences[0].residues.length;
  const itemCount = old.annotations.reduce((sum, item) => sum + item.end - item.start + 1, 0)
    + old.regions.reduce((sum, item) => sum + (item.end - item.start + 1) * item.sequenceIds.length, 0)
    + old.textAnnotations.length;
  if (columnCount * old.sequences.length > 1_000_000 || itemCount > 1_000_000) {
    throw new Error("Migrated cells or object items exceed the version-2 resource limit.");
  }
  const used = new Set(old.sequences.map(row => row.id));
  const unique = (base: string) => {
    let id = base;
    let suffix = 0;
    while (used.has(id)) id = `${base}:${++suffix}`;
    used.add(id);
    return id;
  };
  const lanes = [unique("atlas-v1:lane:0"), unique("atlas-v1:lane:1")];
  const rows: RichRow[] = lanes.map((id, lane) => ({ id, kind: "annotation", name: "", description: "",
    role: "drawing-lane", position: lane, cells: [], numbering: { mode: "fixed" }, attachedTo: null }));
  for (const [index, sequence] of old.sequences.entries()) {
    let nextNumber = sequence.numberingStart;
    rows.push({ id: sequence.id, kind: "sequence", name: sequence.name, description: sequence.description,
      position: index + 2, attachedTo: null, numbering: { mode: "automatic", start: sequence.numberingStart },
      cells: [...sequence.residues].map(text => {
        if (text === "-") return { text, number: null };
        if (!Number.isSafeInteger(nextNumber)) throw new Error("Version-1 numbering exceeds the safe integer range.");
        return { text, number: nextNumber++ };
      }) });
  }
  const byId = new Map(rows.map(row => [row.id, row]));
  for (const entry of old.cellStyles) {
    const { sequenceId, column, ...style } = entry;
    byId.get(sequenceId)!.cells[column].style = style;
  }
  const objects: RichObject[] = [];
  const segment = (id: string, rowId: string, zIndex: number | undefined): RichObject => ({
    id, rowId, zIndex: zIndex ?? 0, multi: false, previousId: null, nextId: null, items: [],
  });
  for (const entry of old.annotations) {
    const object = segment(unique(`atlas-v1:annotation:${entry.id}`), lanes[entry.lane], entry.zIndex);
    for (let column = entry.start; column <= entry.end; column++) {
      object.items.push({ column, kind: KINDS[entry.kind], style: { lineColor: entry.color, fillColor: entry.color, foreground: entry.color } });
    }
    objects.push(object);
  }
  for (const entry of old.textAnnotations) {
    const object = segment(unique(`atlas-v1:text:${entry.id}`), lanes[entry.lane], entry.zIndex);
    object.items.push({ column: entry.column, kind: entry.kind === "text" ? "Text" : "OutlineText", text: entry.text,
      style: { foreground: entry.color, lineColor: entry.outlineColor, lineWidth: entry.outlineWidth,
        fontFamily: entry.fontFamily, fontSize: entry.fontSize, fontWeight: entry.fontWeight,
        fontSlant: entry.italic ? "italic" : "roman", anchor: { left: "w", center: "center", right: "e" }[entry.align] } });
    objects.push(object);
  }
  for (const entry of old.regions) {
    const segments = entry.sequenceIds.map((rowId, index) => segment(unique(`atlas-v1:region:${entry.id}:${index}`), rowId, entry.zIndex));
    segments.forEach((object, index) => {
      object.multi = true;
      object.previousId = segments[index - 1]?.id ?? null;
      object.nextId = segments[index + 1]?.id ?? null;
      for (let column = entry.start; column <= entry.end; column++) object.items.push({ column,
        kind: entry.kind === "box" ? "Box" : "Rect", style: { lineColor: entry.lineColor, fillColor: entry.fillColor, lineWidth: entry.lineWidth } });
    });
    objects.push(...segments);
  }
  const palette = old.colourPalette!;
  const document: RichDocument = {
    format: "atlas-alignment", version: 2, id: old.id, name: old.name, columnCount, rows, objects,
    layout: { ...DEFAULT_RICH_LAYOUT }, activePaletteId: "atlas-v1:palette", analyses: [],
    palettes: [{ id: "atlas-v1:palette", name: palette.name, categories: palette.categories.map(category => ({
      threshold: category.threshold, style: { fillColor: category.fill, lineColor: category.line, lineWidth: category.lineWidth,
        foreground: category.text, fontSize: category.fontSize, fontFamily: category.fontFamily,
        fontWeight: category.fontWeight, fontSlant: category.fontSlant },
    })) }],
    compatibility: { atlasV1Source: original },
  };
  return { document: parseRichProject(serializeRichProject(document)), warnings: [
    "Version-1 view settings were not saved; version-2 layout defaults were used.",
    "Original version-1 data is retained in compatibility.atlasV1Source, including fields not interpreted by the version-1 reader.",
  ] };
}
