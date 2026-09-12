/** Data-only subset of old ALINE Data::Dumper files; never executes Perl. */
export type LegacyValue = string | number | null | LegacyList | LegacyMap | LegacyReference;
export interface LegacyList { kind: "list"; values: LegacyValue[] }
export interface LegacyMap { kind: "map"; entries: Record<string, LegacyValue> }
export interface LegacyPath { root: string; parts: (string | number)[] }
export interface LegacyReference { kind: "reference"; target: LegacyPath }
export interface LegacyData {
  parameters: LegacyMap;
  rows: LegacyList;
  categories: LegacyList;
  oldObjects: LegacyList;
  warnings: string[];
}

export interface LegacyReadLimits { maxCharacters: number; maxValues: number; maxDepth: number }
const defaults: LegacyReadLimits = { maxCharacters: 16_000_000, maxValues: 1_000_000, maxDepth: 128 };

export function parseLegacyData(source: string, limits: Partial<LegacyReadLimits> = {}): LegacyData {
  const budget = { ...defaults, ...limits };
  for (const value of Object.values(budget)) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error("Invalid legacy reader limit");
  }
  if (budget.maxDepth > 256) throw new Error("Legacy nesting limit cannot exceed 256");
  let position = 0;
  let count = 0;
  const fail = (message: string): never => { throw new Error(`${message} at character ${position + 1}`); };
  if (source.length > budget.maxCharacters) fail("Legacy input exceeds character limit");
  const header = /^### Aline 1\.0, [^\r\n]*(?:\r\n|\r|\n)/.exec(source);
  if (!header) return fail("Missing legacy ALINE header");
  position = header[0].length;
  const roots: Record<string, LegacyMap | LegacyList> = Object.create(null);
  const fixups: { from: LegacyPath; to: LegacyPath }[] = [];
  const references: LegacyPath[] = [];
  const space = () => {
    while (position < source.length) {
      if (/\s/.test(source[position])) position++;
      else if (source[position] === "#") {
        while (position < source.length && !/[\r\n]/.test(source[position])) position++;
      } else break;
    }
  };
  const take = (token: string) => {
    space();
    if (!source.startsWith(token, position)) return false;
    position += token.length;
    return true;
  };
  const need = (token: string) => { if (!take(token)) fail(`Expected ${token}`); };
  const identifier = () => {
    space();
    const match = /^[A-Za-z_][A-Za-z_0-9]*/.exec(source.slice(position));
    if (!match) return fail("Expected identifier");
    position += match[0].length;
    return match[0];
  };
  const string = () => {
    space();
    const quote = source[position++];
    let result = "";
    while (position < source.length) {
      const char = source[position++];
      if (char === quote) return result;
      if (quote === '"' && (char === "$" || char === "@")) fail("Perl interpolation is unsupported");
      if (char !== "\\") { result += char; continue; }
      if (position === source.length) fail("Unterminated string escape");
      const escaped = source[position++];
      if (escaped === quote || escaped === "\\") result += escaped;
      else if (quote === "'") result += `\\${escaped}`;
      else if (escaped === "$" || escaped === "@") result += escaped;
      else if (escaped === "n") result += "\n";
      else if (escaped === "r") result += "\r";
      else if (escaped === "t") result += "\t";
      else if (escaped === "a") result += "\x07";
      else if (escaped === "b") result += "\b";
      else if (escaped === "f") result += "\f";
      else if (escaped === "e") result += "\x1b";
      else if (escaped === "x") {
        const hex = /^(?:\{([0-9a-fA-F]+)\}|([0-9a-fA-F]{2}))/.exec(source.slice(position));
        if (!hex) return fail("Invalid hexadecimal string escape");
        const point = parseInt(hex[1] ?? hex[2], 16);
        if (point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) fail("Invalid Unicode scalar");
        position += hex[0].length;
        result += String.fromCodePoint(point);
      } else if (/[0-7]/.test(escaped)) {
        const rest = /^[0-7]{0,2}/.exec(source.slice(position))![0];
        position += rest.length;
        result += String.fromCharCode(parseInt(escaped + rest, 8));
      }
      else fail("Unsupported string escape");
    }
    return fail("Unterminated string");
  };
  const key = () => {
    space();
    return source[position] === "'" || source[position] === '"' ? string() : identifier();
  };
  const tick = (depth: number) => {
    if (++count > budget.maxValues) fail("Legacy input exceeds value limit");
    if (depth > budget.maxDepth) fail("Legacy input exceeds nesting limit");
  };
  const list = (end: string, depth: number): LegacyList => {
    const values: LegacyValue[] = [];
    if (!take(end)) {
      do {
        values.push(value(depth + 1));
        if (take(end)) return { kind: "list", values };
        need(",");
      } while (!take(end));
    }
    return { kind: "list", values };
  };
  const map = (end: string, depth: number): LegacyMap => {
    const entries: Record<string, LegacyValue> = Object.create(null);
    if (!take(end)) {
      do {
        const name = key();
        if (Object.hasOwn(entries, name)) fail("Duplicate map key");
        need("=>");
        entries[name] = value(depth + 1);
        if (take(end)) return { kind: "map", entries };
        need(",");
      } while (!take(end));
    }
    return { kind: "map", entries };
  };
  const value = (depth: number): LegacyValue => {
    tick(depth);
    space();
    if (source[position] === "'" || source[position] === '"') return string();
    if (take("[")) return list("]", depth);
    if (take("{")) return map("}", depth);
    if (source[position] === "$") {
      const target = path();
      references.push(target);
      return { kind: "reference", target };
    }
    if (/^undef\b/.test(source.slice(position))) { position += 5; return null; }
    const number = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(position));
    if (!number) return fail("Unsupported Perl expression");
    position += number[0].length;
    if (/^[+-]?0\d/.test(number[0])) fail("Ambiguous leading-zero number");
    const result = Number(number[0]);
    if (!Number.isFinite(result)) fail("Nonfinite number");
    return result;
  };
  const path = (): LegacyPath => {
    need("$");
    const root = identifier();
    const parts: (string | number)[] = [];
    while (true) {
      if (take("[")) {
        space();
        const match = /^\d+/.exec(source.slice(position));
        if (!match) fail("Invalid array reference index");
        const index = Number(match![0]);
        if (!Number.isSafeInteger(index)) fail("Invalid array reference index");
        position += match![0].length;
        parts.push(index);
        need("]");
      } else if (take("{")) { parts.push(key()); need("}"); }
      else break;
      if (parts.length > budget.maxDepth) fail("Reference path exceeds nesting limit");
    }
    if (!parts.length) fail("Reference path must select a value");
    return { root, parts };
  };
  while (true) {
    space();
    if (position === source.length) break;
    tick(0);
    if (source[position] === "$") {
      const from = path(); need("="); const to = path(); need(";");
      fixups.push({ from, to });
      references.push(to);
      continue;
    }
    const hash = take("%");
    if (!hash) need("@");
    const name = identifier();
    if ((hash && name !== "par") || (!hash && !["seq", "categories", "obj"].includes(name))) {
      fail("Unsupported top-level variable");
    }
    if (Object.hasOwn(roots, name)) fail("Duplicate top-level variable");
    need("="); need("(");
    roots[name] = hash ? map(")", 0) : list(")", 0);
    need(";");
  }
  for (const name of ["par", "seq", "categories"]) {
    if (!Object.hasOwn(roots, name)) fail(`Missing ${name} declaration`);
  }
  // References remain symbolic, so cyclic object links are JSON-serializable.
  const resolve = (target: LegacyPath): LegacyValue => {
    let steps = 0;
    const walk = (p: LegacyPath): LegacyValue => {
      let current: LegacyValue = roots[p.root];
      if (!current) return fail("Unknown reference root");
      for (const part of p.parts) {
        while (current && typeof current === "object" && current.kind === "reference") {
          if (++steps > budget.maxDepth) fail("Cyclic or excessive reference indirection");
          current = walk(current.target);
        }
        if (typeof part === "number" && current && typeof current === "object" && current.kind === "list") {
          if (part >= current.values.length) return fail("Array reference out of bounds");
          current = current.values[part];
        } else if (typeof part === "string" && current && typeof current === "object" && current.kind === "map") {
          if (!Object.hasOwn(current.entries, part)) return fail("Missing reference key");
          current = current.entries[part];
        } else return fail("Reference path type mismatch");
      }
      return current;
    };
    return walk(target);
  };
  for (const { from, to } of fixups) {
    const existing = resolve(from);
    const target = resolve(to);
    if (!target || typeof target !== "object" || target.kind === "reference") fail("Reference must target a container");
    if (existing !== null && !(typeof existing === "object" && existing.kind === "map" && !Object.keys(existing.entries).length)
      && !(typeof existing === "object" && existing.kind === "list" && !existing.values.length)) {
      fail("Reference fixup would overwrite data");
    }
    const parent = resolve({ root: from.root, parts: from.parts.slice(0, -1) });
    const last = from.parts[from.parts.length - 1];
    const reference: LegacyReference = { kind: "reference", target: to };
    if (parent && typeof parent === "object" && parent.kind === "list" && typeof last === "number") parent.values[last] = reference;
    else if (parent && typeof parent === "object" && parent.kind === "map" && typeof last === "string") parent.entries[last] = reference;
    else fail("Invalid reference destination");
  }
  for (const to of references) {
    let target = resolve(to);
    const seen = new Set<LegacyValue>();
    while (target && typeof target === "object" && target.kind === "reference") {
      if (seen.has(target) || seen.size >= budget.maxDepth) fail("Cyclic or excessive reference indirection");
      seen.add(target);
      target = resolve(target.target);
    }
  }
  return {
    parameters: roots.par as LegacyMap,
    rows: roots.seq as LegacyList,
    categories: roots.categories as LegacyList,
    oldObjects: (roots.obj ?? { kind: "list", values: [] }) as LegacyList,
    warnings: roots.obj?.kind === "list" && roots.obj.values.length
      ? ["Old top-level objects are retained but their drawing semantics are unsupported."] : [],
  };
}
