export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export const JSON_DATA_LIMITS = { characters: 16_000_000, values: 2_000_000, depth: 128 } as const;

/** Strict project JSON: duplicate members and overflowing numbers are errors. */
export function parseJsonData(source: string): JsonValue {
  if (source.length > JSON_DATA_LIMITS.characters) throw new Error("JSON input exceeds size limit.");
  let offset = 0;
  let count = 0;
  const error = (message: string): never => { throw new Error(`JSON at ${offset}: ${message}.`); };
  const whitespace = () => { while (/[\x20\t\r\n]/.test(source[offset] ?? "!") && offset < source.length) offset++; };
  const quoted = (): string => {
    const start = offset++;
    while (offset < source.length) {
      const char = source[offset++];
      if (char === "\\") offset++;
      else if (char === '"') {
        try { return JSON.parse(source.slice(start, offset)) as string; }
        catch { error("invalid string"); }
      }
    }
    return error("unterminated string");
  };
  const numeric = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
  const read = (depth: number): JsonValue => {
    if (depth > JSON_DATA_LIMITS.depth || ++count > JSON_DATA_LIMITS.values) error("data exceeds depth or value limit");
    whitespace();
    const char = source[offset];
    if (char === '"') return quoted();
    if (char === "[" || char === "{") {
      offset++;
      const array = char === "[";
      const end = array ? "]" : "}";
      const result: JsonValue[] | Record<string, JsonValue> = array ? [] : Object.create(null);
      whitespace();
      if (source[offset] === end) { offset++; return result; }
      while (true) {
        if (array) (result as JsonValue[]).push(read(depth + 1));
        else {
          whitespace();
          if (source[offset] !== '"') error("expected a member name");
          const key = quoted();
          if (Object.hasOwn(result, key)) error(`duplicate member ${JSON.stringify(key)}`);
          whitespace();
          if (source[offset++] !== ":") error("expected colon");
          (result as Record<string, JsonValue>)[key] = read(depth + 1);
        }
        whitespace();
        const separator = source[offset++];
        if (separator === end) return result;
        if (separator !== ",") error("expected comma or closing delimiter");
      }
    }
    for (const [word, value] of [["true", true], ["false", false], ["null", null]] as const) {
      if (source.startsWith(word, offset)) { offset += word.length; return value; }
    }
    numeric.lastIndex = offset;
    const match = numeric.exec(source);
    if (!match) return error("expected a value");
    offset = numeric.lastIndex;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) error("number must be finite");
    if (value === 0 && /[1-9]/.test(match[0].split(/[eE]/)[0])) error("number underflows to zero");
    return value;
  };
  const value = read(0);
  whitespace();
  if (offset !== source.length) error("unexpected trailing data");
  return value;
}

/** Reject values that JSON.stringify would drop/coerce or execute via toJSON. */
export function stringifyJsonData(value: unknown): string {
  let count = 0;
  let length = 0;
  const chunks: string[] = [];
  const ancestors = new Set<object>();
  const emit = (text: string) => {
    length += text.length;
    if (length > JSON_DATA_LIMITS.characters) throw new Error("JSON output exceeds size limit.");
    chunks.push(text);
  };
  const write = (item: unknown, depth: number): void => {
    if (depth > JSON_DATA_LIMITS.depth || ++count > JSON_DATA_LIMITS.values) throw new Error("JSON data exceeds depth or value limit.");
    if (item === null || typeof item === "boolean" || typeof item === "string") { emit(JSON.stringify(item)); return; }
    if (typeof item === "number") {
      if (!Number.isFinite(item)) throw new Error("JSON number must be finite.");
      emit(Object.is(item, -0) ? "-0" : String(item)); return;
    }
    if (!item || typeof item !== "object") throw new Error("Value cannot be preserved as JSON data.");
    if (ancestors.has(item)) throw new Error("JSON data contains a cycle.");
    const array = Array.isArray(item);
    if (!array && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) {
      throw new Error("JSON data must contain plain objects.");
    }
    const names = Reflect.ownKeys(item).filter((key) => !(array && key === "length"));
    if (array && names.length !== item.length) throw new Error("JSON arrays must be dense and have no extra fields.");
    ancestors.add(item);
    emit(array ? "[" : "{");
    names.forEach((key, index) => {
      if (typeof key !== "string" || (array && key !== String(index))) throw new Error("JSON data has unsupported property keys.");
      const descriptor = Object.getOwnPropertyDescriptor(item, key)!;
      if (!descriptor.enumerable || !("value" in descriptor)) throw new Error("JSON data cannot contain accessors or hidden fields.");
      if (index) emit(",");
      if (!array) { emit(JSON.stringify(key)); emit(":"); }
      write(descriptor.value, depth + 1);
    });
    emit(array ? "]" : "}");
    ancestors.delete(item);
  };
  write(value, 0);
  return chunks.join("");
}
