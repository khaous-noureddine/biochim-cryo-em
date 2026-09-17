import { parseJsonData, stringifyJsonData } from "./jsonData";
import { ATLAS_DOCUMENT_FORMAT } from "./model";
import { validateRichObjects, type RichObject, type RichObjectStyle } from "./richObjects";
import type { RichRow, RichCell } from "./richRows";
import { fail, record, keys, string, number, style, optionalCompatibility, compatibility, type CompatibilityData } from "./richValidation";

export const RICH_DOCUMENT_VERSION = 2 as const;
export type RichLayout = {
  cellWidth: number; rowHeight: number; titleColumns: number; wrapColumns: number;
  repeatNames: boolean; offsetX: number; offsetY: number; fontScale: number;
  numberColumns: number; aggressiveEditing: boolean; grid: boolean; blockGap: number; background: string;
};
export type RichPalette = {
  id: string; name: string;
  categories: { threshold: number; style: RichObjectStyle; compatibility?: CompatibilityData }[];
  compatibility?: CompatibilityData;
};
export type RichAnalysis = {
  id: string; provider: string; method: string; version: string | null;
  inputs: { id: string; rowId: string | null; cells: string[] }[];
  parameters: CompatibilityData;
  /** Values belong to the saved input snapshot, not current alignment columns. */
  series: { id: string; inputId: string; label: string; valueSpace: "raw"; values: (number | null)[] }[];
  compatibility?: CompatibilityData;
};
export type RichDocument = {
  format: typeof ATLAS_DOCUMENT_FORMAT; version: typeof RICH_DOCUMENT_VERSION;
  id: string; name: string; columnCount: number; rows: RichRow[]; objects: RichObject[];
  layout: RichLayout; palettes: RichPalette[]; activePaletteId: string | null;
  analyses: RichAnalysis[]; compatibility?: CompatibilityData;
};

export const DEFAULT_RICH_LAYOUT: RichLayout = {
  cellWidth: 12, rowHeight: 12, titleColumns: 10, wrapColumns: 40,
  repeatNames: true, offsetX: 50, offsetY: 50, fontScale: 1,
  numberColumns: 5, aggressiveEditing: false, grid: false, blockGap: 3, background: "#ffffff",
};

function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, "expected an array");
  return value;
}
function integer(value: unknown, path: string): number {
  const result = number(value, path, true);
  if (!Number.isSafeInteger(result)) fail(path, "expected a nonnegative safe integer");
  return result;
}
function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") fail(path, "expected a boolean");
  return value;
}
function identifiers<T extends { id: string }>(values: T[], path: string): Map<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    if (result.has(value.id)) fail(path, `duplicate identifier ${value.id}`);
    result.set(value.id, value);
  }
  return result;
}
function optionalAnalysis(value: Record<string, unknown>, path: string): { analysisId?: string } {
  return Object.hasOwn(value, "analysisId") ? { analysisId: string(value.analysisId, `${path}.analysisId`, true) } : {};
}
function readLayout(value: unknown): RichLayout {
  const input = record(value, "layout");
  keys(input, Object.keys(DEFAULT_RICH_LAYOUT), "layout");
  const result: RichLayout = {
    cellWidth: number(input.cellWidth, "layout.cellWidth", true),
    rowHeight: number(input.rowHeight, "layout.rowHeight", true),
    titleColumns: integer(input.titleColumns, "layout.titleColumns"),
    wrapColumns: integer(input.wrapColumns, "layout.wrapColumns"),
    repeatNames: boolean(input.repeatNames, "layout.repeatNames"),
    offsetX: number(input.offsetX, "layout.offsetX"), offsetY: number(input.offsetY, "layout.offsetY"),
    fontScale: number(input.fontScale, "layout.fontScale", true),
    numberColumns: integer(input.numberColumns, "layout.numberColumns"),
    aggressiveEditing: boolean(input.aggressiveEditing, "layout.aggressiveEditing"),
    grid: boolean(input.grid, "layout.grid"), blockGap: number(input.blockGap, "layout.blockGap", true),
    background: string(input.background, "layout.background"),
  };
  if (!result.cellWidth || !result.rowHeight || !result.fontScale || result.wrapColumns <= result.titleColumns) {
    fail("layout", "spacing/scale must be positive and wrapped width must leave room after the title");
  }
  return result;
}

function readRows(value: unknown, columnCount: number): RichRow[] {
  let cellCount = 0;
  const rows = list(value, "rows").map((entry, index): RichRow => {
    const path = `rows[${index}]`;
    const input = record(entry, path);
    keys(input, ["id", "kind", "name", "description", "role", "position", "cells", "numbering", "attachedTo", "titleStyle", "analysisId", "compatibility"], path);
    if (input.kind !== "sequence" && input.kind !== "annotation") fail(path, "unknown row kind");
    const numbering = record(input.numbering, `${path}.numbering`);
    if (numbering.mode !== "fixed" && numbering.mode !== "automatic") fail(path, "unknown numbering mode");
    keys(numbering, numbering.mode === "fixed" ? ["mode"] : ["mode", "start"], `${path}.numbering`);
    const cells = list(input.cells, `${path}.cells`).map((entry, column): RichCell => {
      const at = `${path}.cells[${column}]`;
      if (++cellCount > 1_000_000) fail(at, "cell count exceeds limit");
      const cell = record(entry, at);
      keys(cell, ["text", "number", "style", "residueIdentity", "compatibility"], at);
      const result: RichCell = { text: string(cell.text, `${at}.text`), ...optionalCompatibility(cell, at) };
      if (Object.hasOwn(cell, "number")) result.number = cell.number === null ? null : number(cell.number, `${at}.number`);
      if (Object.hasOwn(cell, "style")) result.style = style(cell.style, `${at}.style`, false);
      if (Object.hasOwn(cell, "residueIdentity")) {
        const identity = record(cell.residueIdentity, `${at}.residueIdentity`);
        keys(identity, ["model", "authorChain", "labelChain", "authorNumber", "insertionCode"], `${at}.residueIdentity`);
        result.residueIdentity = {
          model: string(identity.model, `${at}.model`), authorChain: string(identity.authorChain, `${at}.authorChain`),
          labelChain: string(identity.labelChain, `${at}.labelChain`), authorNumber: string(identity.authorNumber, `${at}.authorNumber`),
          insertionCode: string(identity.insertionCode, `${at}.insertionCode`),
        };
      }
      return result;
    });
    if (cells.length > columnCount) fail(path, "cells exceed document width");
    return { id: string(input.id, `${path}.id`, true), kind: input.kind,
      name: string(input.name, `${path}.name`), description: string(input.description, `${path}.description`),
      position: number(input.position, `${path}.position`), cells,
      numbering: numbering.mode === "fixed" ? { mode: "fixed" } : { mode: "automatic", start: number(numbering.start, `${path}.numbering.start`) },
      attachedTo: input.attachedTo === null ? null : string(input.attachedTo, `${path}.attachedTo`, true),
      ...(Object.hasOwn(input, "role") ? { role: string(input.role, `${path}.role`) } : {}),
      ...(Object.hasOwn(input, "titleStyle") ? { titleStyle: style(input.titleStyle, `${path}.titleStyle`, false) } : {}),
      ...optionalAnalysis(input, path), ...optionalCompatibility(input, path),
    };
  });
  const byId = identifiers(rows, "rows");
  for (const row of rows) if (row.attachedTo !== null && !byId.has(row.attachedTo)) fail(`rows.${row.id}`, "dangling attachment");
  return rows;
}

function readPalettes(value: unknown): RichPalette[] {
  return list(value, "palettes").map((entry, index): RichPalette => {
    const path = `palettes[${index}]`;
    const input = record(entry, path);
    keys(input, ["id", "name", "categories", "compatibility"], path);
    const categories = list(input.categories, `${path}.categories`).map((entry, index) => {
      const at = `${path}.categories[${index}]`;
      const category = record(entry, at);
      keys(category, ["threshold", "style", "compatibility"], at);
      return { threshold: number(category.threshold, `${at}.threshold`), style: style(category.style, `${at}.style`), ...optionalCompatibility(category, at) };
    });
    if (!categories.length || categories.some((entry, index) => index > 0 && entry.threshold <= categories[index - 1].threshold)) {
      fail(path, "category thresholds must be nonempty and strictly increasing");
    }
    return { id: string(input.id, `${path}.id`, true), name: string(input.name, `${path}.name`), categories, ...optionalCompatibility(input, path) };
  });
}

function readAnalyses(value: unknown, rowIds: Set<string>): RichAnalysis[] {
  return list(value, "analyses").map((entry, index): RichAnalysis => {
    const path = `analyses[${index}]`;
    const input = record(entry, path);
    keys(input, ["id", "provider", "method", "version", "inputs", "parameters", "series", "compatibility"], path);
    const inputs = list(input.inputs, `${path}.inputs`).map((entry, index) => {
      const at = `${path}.inputs[${index}]`;
      const snapshot = record(entry, at);
      keys(snapshot, ["id", "rowId", "cells"], at);
      const rowId = snapshot.rowId === null ? null : string(snapshot.rowId, `${at}.rowId`, true);
      if (rowId !== null && !rowIds.has(rowId)) fail(at, "unknown input row");
      return { id: string(snapshot.id, `${at}.id`, true), rowId,
        cells: list(snapshot.cells, `${at}.cells`).map((cell, index) => string(cell, `${at}.cells[${index}]`)) };
    });
    const inputIds = identifiers(inputs, `${path}.inputs`);
    const series = list(input.series, `${path}.series`).map((entry, index): RichAnalysis["series"][number] => {
      const at = `${path}.series[${index}]`;
      const series = record(entry, at);
      keys(series, ["id", "inputId", "label", "valueSpace", "values"], at);
      const inputId = string(series.inputId, `${at}.inputId`, true);
      const snapshot = inputIds.get(inputId);
      if (!snapshot) fail(at, "unknown input snapshot");
      if (series.valueSpace !== "raw") fail(at, "measurement series must explicitly use raw space");
      const values = list(series.values, `${at}.values`).map((value, index) => value === null ? null : number(value, `${at}.values[${index}]`));
      if (values.length !== snapshot.cells.length) fail(at, "measurement count differs from input snapshot length");
      return { id: string(series.id, `${at}.id`, true), inputId, label: string(series.label, `${at}.label`), valueSpace: "raw", values };
    });
    identifiers(series, `${path}.series`);
    return { id: string(input.id, `${path}.id`, true), provider: string(input.provider, `${path}.provider`),
      method: string(input.method, `${path}.method`, true), version: input.version === null ? null : string(input.version, `${path}.version`),
      inputs, series, parameters: compatibility(record(input.parameters, `${path}.parameters`), `${path}.parameters`) as CompatibilityData,
      ...optionalCompatibility(input, path),
    };
  });
}

/** Reads version 2 only. Version-1 migration and application adoption are separate. */
export function parseRichProject(source: string): RichDocument {
  const input = record(parseJsonData(source), "project");
  keys(input, ["format", "version", "id", "name", "columnCount", "rows", "objects", "layout", "palettes", "activePaletteId", "analyses", "compatibility"], "project");
  if (input.format !== ATLAS_DOCUMENT_FORMAT || input.version !== RICH_DOCUMENT_VERSION) fail("project", "unsupported format or version");
  const columnCount = integer(input.columnCount, "columnCount");
  const rows = readRows(input.rows, columnCount);
  const rowIds = new Set(rows.map((row) => row.id));
  const objects = validateRichObjects(input.objects, [...rowIds]);
  for (const object of objects) for (const item of object.items) if (item.column >= columnCount) fail(`objects.${object.id}`, "coverage exceeds document width");
  const palettes = readPalettes(input.palettes);
  const paletteIds = identifiers(palettes, "palettes");
  const activePaletteId = input.activePaletteId === null ? null : string(input.activePaletteId, "activePaletteId", true);
  if (activePaletteId !== null && !paletteIds.has(activePaletteId)) fail("activePaletteId", "unknown palette");
  const analyses = readAnalyses(input.analyses, rowIds);
  const analysisIds = identifiers(analyses, "analyses");
  for (const entry of [...rows, ...objects]) if (entry.analysisId !== undefined && !analysisIds.has(entry.analysisId)) fail(entry.id, "unknown analysis");
  return { format: ATLAS_DOCUMENT_FORMAT, version: RICH_DOCUMENT_VERSION,
    id: string(input.id, "id", true), name: string(input.name, "name"), columnCount, rows, objects,
    layout: readLayout(input.layout), palettes, activePaletteId, analyses, ...optionalCompatibility(input, "project") };
}

export function serializeRichProject(document: RichDocument): string {
  // Validate before publication, including values native JSON.stringify loses.
  const source = stringifyJsonData(document);
  return stringifyJsonData(parseRichProject(source));
}
