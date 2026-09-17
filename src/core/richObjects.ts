import { parseJsonData } from "./jsonData";
import { fail, record, keys, string, number, style, optionalCompatibility } from "./richValidation";
import type { CompatibilityData, RichObjectStyle } from "./richValidation";
export type { CompatibilityData, CompatibilityValue, RichObjectStyle } from "./richValidation";

export const RICH_OBJECT_KINDS = [
  "UpTriangle", "DownTriangle", "UpTriangleS", "DownTriangleS", "Circle", "Star", "Starm",
  "Square", "Diamond", "UpArrowC", "DownArrowC", "UpArrowR", "DownArrowR", "BarR",
  "Helix", "Helix2", "Strand", "Strand2", "Coil", "DashedLine", "ConnectUp", "ConnectDown", "Underline",
  "Box", "Rect", "BarGraph", "BarCGraph", "LineGraph", "LineCGraph", "GradGraph", "GradCGraph",
  "HSLGradGraph", "HSLGradCGraph", "OnebitGraph", "Text", "OutlineText",
  "Line", // Atlas version 1 also offers an explicit solid line.
] as const;
export type RichObjectKind = typeof RICH_OBJECT_KINDS[number];
export type RichObjectItem = {
  kind: RichObjectKind;
  column: number;
  style?: RichObjectStyle;
  text?: string;
  /** Already transformed drawing value; never infer an original measurement. */
  sample?: number;
  compatibility?: CompatibilityData;
};

/** One row-local segment. Linked segments retain their own styles and layer. */
export type RichObject = {
  id: string;
  rowId: string;
  multi: boolean;
  zIndex: number;
  previousId: string | null;
  nextId: string | null;
  items: RichObjectItem[];
  graph?: { height: number; cutoff: number; sampleSpace: "drawing" };
  analysisId?: string;
  compatibility?: CompatibilityData;
};

export function isRichGraphKind(kind: RichObjectKind): boolean {
  return kind.endsWith("Graph");
}


/** Data contract only. The full version-2 document parser is not yet adopted. */
export function parseRichObjects(source: string, rowIds: readonly string[]): RichObject[] {
  return validateRichObjects(parseJsonData(source), rowIds);
}

export function validateRichObjects(input: unknown, rowIds: readonly string[]): RichObject[] {
  if (!Array.isArray(input)) fail("objects", "expected an array");
  const rows = new Set(rowIds);
  if (rows.size !== rowIds.length || rowIds.some((id) => !id.trim())) fail("rows", "identifiers must be unique and nonempty");
  let itemCount = 0;
  const objects = input.map((value, index): RichObject => {
    const path = `objects[${index}]`;
    const object = record(value, path);
    keys(object, ["id", "rowId", "multi", "zIndex", "previousId", "nextId", "items", "graph", "analysisId", "compatibility"], path);
    const id = string(object.id, `${path}.id`, true);
    const rowId = string(object.rowId, `${path}.rowId`, true);
    if (!rows.has(rowId)) fail(path, "unknown row identifier");
    if (typeof object.multi !== "boolean") fail(path, "multi must be boolean");
    if (!Array.isArray(object.items)) fail(path, "items must be an array");
    const items = object.items.map((entry, itemIndex): RichObjectItem => {
      const at = `${path}.items[${itemIndex}]`;
      if (++itemCount > 1_000_000) fail(at, "item count exceeds limit");
      const item = record(entry, at);
      keys(item, ["kind", "column", "style", "text", "sample", "compatibility"], at);
      if (!(RICH_OBJECT_KINDS as readonly unknown[]).includes(item.kind)) fail(at, "unsupported object kind");
      const kind = item.kind as RichObjectKind;
      const column = number(item.column, `${at}.column`, true);
      if (!Number.isSafeInteger(column)) fail(at, "column must be a safe integer");
      const graph = isRichGraphKind(kind);
      if (!graph && Object.hasOwn(item, "sample")) fail(at, "sample is only valid for graphs");
      return { kind, column,
        ...(Object.hasOwn(item, "style") ? { style: style(item.style, `${at}.style`) } : {}),
        ...(Object.hasOwn(item, "text") ? { text: string(item.text, `${at}.text`) } : {}),
        ...(graph ? { sample: number(item.sample, `${at}.sample`) } : {}),
        ...optionalCompatibility(item, at),
      };
    });
    const result: RichObject = { id, rowId, multi: object.multi, zIndex: number(object.zIndex, `${path}.zIndex`),
      previousId: object.previousId === null ? null : string(object.previousId, `${path}.previousId`, true),
      nextId: object.nextId === null ? null : string(object.nextId, `${path}.nextId`, true),
      items, ...optionalCompatibility(object, path),
      ...(Object.hasOwn(object, "analysisId") ? { analysisId: string(object.analysisId, `${path}.analysisId`, true) } : {}),
    };
    if (Object.hasOwn(object, "graph")) {
      const graph = record(object.graph, `${path}.graph`);
      keys(graph, ["height", "cutoff", "sampleSpace"], `${path}.graph`);
      if (graph.sampleSpace !== "drawing") fail(path, "graph samples must explicitly use drawing space");
      result.graph = { height: number(graph.height, `${path}.graph.height`, true),
        cutoff: number(graph.cutoff, `${path}.graph.cutoff`), sampleSpace: "drawing" };
    }
    if (items.some((item) => isRichGraphKind(item.kind)) && !result.graph) fail(path, "graph settings are required");
    return result;
  });
  const byId = new Map<string, RichObject>();
  for (const object of objects) {
    if (byId.has(object.id)) fail("objects", `duplicate identifier ${object.id}`);
    byId.set(object.id, object);
  }
  for (const object of objects) {
    for (const [link, reciprocal] of [["previousId", "nextId"], ["nextId", "previousId"]] as const) {
      const target = object[link];
      if (target !== null && byId.get(target)?.[reciprocal] !== object.id) fail(`objects.${object.id}.${link}`, "dangling or nonreciprocal link");
    }
  }
  return objects;
}
