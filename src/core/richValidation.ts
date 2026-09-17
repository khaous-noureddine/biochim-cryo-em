import type { RichTextStyle } from "./richRows";
import type { JsonValue } from "./jsonData";

export type CompatibilityValue = JsonValue;
export type CompatibilityData = Record<string, CompatibilityValue>;
export type RichObjectStyle = RichTextStyle & { lineColor?: string; fillColor?: string; lineWidth?: number };

export function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

export function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected an object");
  return value as Record<string, unknown>;
}

export function keys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(path, `unrecognized field ${key}; retain extensions in compatibility data`);
  }
}

export function string(value: unknown, path: string, nonempty = false): string {
  if (typeof value !== "string" || (nonempty && !value.trim())) fail(path, "expected a string" + (nonempty ? " identifier" : ""));
  return value;
}

export function number(value: unknown, path: string, nonnegative = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || (nonnegative && value < 0)) fail(path, "expected a finite number" + (nonnegative ? " at least zero" : ""));
  return value;
}

export function compatibility(value: unknown, path: string, depth = 0): CompatibilityValue {
  if (depth > 64) fail(path, "compatibility data exceeds depth limit");
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return number(value, path);
  if (Array.isArray(value)) return value.map((entry, index) => compatibility(entry, `${path}[${index}]`, depth + 1));
  const input = record(value, path);
  const result: CompatibilityData = Object.create(null);
  for (const [key, entry] of Object.entries(input)) result[key] = compatibility(entry, `${path}.${key}`, depth + 1);
  return result;
}

export function optionalCompatibility(input: Record<string, unknown>, path: string): { compatibility?: CompatibilityData } {
  if (!Object.hasOwn(input, "compatibility")) return {};
  const value = record(input.compatibility, `${path}.compatibility`);
  return { compatibility: compatibility(value, `${path}.compatibility`) as CompatibilityData };
}

export function style(value: unknown, path: string, objectFields = true): RichObjectStyle {
  const input = record(value, path);
  const textKeys = ["foreground", "background", "fontFamily", "fontWeight", "fontSlant", "fontWidth", "anchor", ...(objectFields ? ["lineColor", "fillColor"] : [])];
  const numericKeys = ["fontSize", ...(objectFields ? ["lineWidth"] : [])];
  keys(input, [...textKeys, ...numericKeys], path);
  const result: Record<string, string | number> = {};
  for (const key of textKeys) if (Object.hasOwn(input, key)) result[key] = string(input[key], `${path}.${key}`);
  for (const key of numericKeys) if (Object.hasOwn(input, key)) result[key] = number(input[key], `${path}.${key}`, true);
  return result;
}

