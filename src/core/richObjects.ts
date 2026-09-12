import type { RichTextStyle } from "./richRows";

export const RICH_OBJECT_KINDS = [
  "UpTriangle", "DownTriangle", "UpTriangleS", "DownTriangleS", "Circle", "Star", "Starm",
  "Square", "Diamond", "UpArrowC", "DownArrowC", "UpArrowR", "DownArrowR", "BarR",
  "Helix", "Helix2", "Strand", "Strand2", "Coil", "DashedLine", "ConnectUp", "ConnectDown", "Underline",
  "Box", "Rect", "BarGraph", "BarCGraph", "LineGraph", "LineCGraph", "GradGraph", "GradCGraph",
  "HSLGradGraph", "HSLGradCGraph", "OnebitGraph", "Text", "OutlineText",
  "Line", // Atlas version 1 also offers an explicit solid line.
] as const;
export type RichObjectKind = typeof RICH_OBJECT_KINDS[number];
export type CompatibilityValue = string | number | boolean | null | CompatibilityValue[] | { [key: string]: CompatibilityValue };
export type CompatibilityData = Record<string, CompatibilityValue>;

export type RichObjectStyle = RichTextStyle & { lineColor?: string; fillColor?: string; lineWidth?: number };
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
  compatibility?: CompatibilityData;
};

export function isRichGraphKind(kind: RichObjectKind): boolean {
  return kind.endsWith("Graph");
}

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected an object");
  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(path, `unrecognized field ${key}; retain extensions in compatibility data`);
  }
}

function string(value: unknown, path: string, nonempty = false): string {
  if (typeof value !== "string" || (nonempty && !value.trim())) fail(path, "expected a string" + (nonempty ? " identifier" : ""));
  return value;
}

function number(value: unknown, path: string, nonnegative = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || (nonnegative && value < 0)) fail(path, "expected a finite number" + (nonnegative ? " at least zero" : ""));
  return value;
}

function compatibility(value: unknown, path: string, depth = 0): CompatibilityValue {
  if (depth > 64) fail(path, "compatibility data exceeds depth limit");
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return number(value, path);
  if (Array.isArray(value)) return value.map((entry, index) => compatibility(entry, `${path}[${index}]`, depth + 1));
  const input = record(value, path);
  const result: CompatibilityData = Object.create(null);
  for (const [key, entry] of Object.entries(input)) result[key] = compatibility(entry, `${path}.${key}`, depth + 1);
  return result;
}

function optionalCompatibility(input: Record<string, unknown>, path: string): { compatibility?: CompatibilityData } {
  if (!Object.hasOwn(input, "compatibility")) return {};
  const value = record(input.compatibility, `${path}.compatibility`);
  return { compatibility: compatibility(value, `${path}.compatibility`) as CompatibilityData };
}

function style(value: unknown, path: string): RichObjectStyle {
  const input = record(value, path);
  const textKeys = ["foreground", "background", "fontFamily", "fontWeight", "fontSlant", "fontWidth", "anchor", "lineColor", "fillColor"];
  keys(input, [...textKeys, "fontSize", "lineWidth"], path);
  const result: Record<string, string | number> = {};
  for (const key of textKeys) if (Object.hasOwn(input, key)) result[key] = string(input[key], `${path}.${key}`);
  for (const key of ["fontSize", "lineWidth"]) if (Object.hasOwn(input, key)) result[key] = number(input[key], `${path}.${key}`, true);
  return result;
}

/** Data contract only. The full version-2 document parser is not yet adopted. */
export function parseRichObjects(source: string, rowIds: readonly string[]): RichObject[] {
  if (source.length > 16_000_000) fail("objects", "input exceeds size limit");
  let input: unknown;
  try { input = JSON.parse(source); } catch { fail("objects", "invalid JSON"); }
  if (!Array.isArray(input)) fail("objects", "expected an array");
  const rows = new Set(rowIds);
  if (rows.size !== rowIds.length || rowIds.some((id) => !id.trim())) fail("rows", "identifiers must be unique and nonempty");
  let itemCount = 0;
  const objects = input.map((value, index): RichObject => {
    const path = `objects[${index}]`;
    const object = record(value, path);
    keys(object, ["id", "rowId", "multi", "zIndex", "previousId", "nextId", "items", "graph", "compatibility"], path);
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
