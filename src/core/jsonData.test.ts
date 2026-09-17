import { describe, expect, it } from "vitest";
import { parseJsonData, stringifyJsonData } from "./jsonData";

describe("lossless JSON data boundary", () => {
  it("retains nested data, escaped keys, empty strings and negative zero", () => {
    const value = { text: "α\n\"\\", empty: "", cells: [null, true, false, -0, -2.5, 1e30], nested: { a: [] } };
    const result = parseJsonData(stringifyJsonData(value));
    expect(result).toEqual(value);
    expect(Object.is((result as typeof value).cells[3], -0)).toBe(true);
  });
  it("rejects duplicate decoded names, including escaped aliases", () => {
    expect(() => parseJsonData('{"id":1,"id":2}')).toThrow(/duplicate/);
    expect(() => parseJsonData('{"id":1,"\\u0069d":2}')).toThrow(/duplicate/);
  });
  it("rejects numeric underflow while preserving representable subnormal values", () => {
    expect(() => parseJsonData("1e-999")).toThrow(/underflows/);
    expect(() => parseJsonData("-1e-999")).toThrow(/underflows/);
    expect(parseJsonData("0e-999")).toBe(0);
    expect(parseJsonData(stringifyJsonData(Number.MIN_VALUE))).toBe(Number.MIN_VALUE);
  });
  it("retains prototype-shaped keys as inert data", () => {
    const source = '{"__proto__":{"polluted":true},"constructor":0}';
    const result = parseJsonData(source) as Record<string, unknown>;
    expect(Object.getPrototypeOf(result)).toBe(null);
    expect(Object.hasOwn(result, "__proto__")).toBe(true);
    expect(stringifyJsonData(result)).toBe(source);
  });
  it.each(['[1,]', '{"a":1,}', '[01]', '[1.]', '[+1]', '[NaN]', '[1e999]', 'true false', '"\n"', '{a:1}'])("rejects malformed JSON %s", (source) => {
    expect(() => parseJsonData(source)).toThrow(/JSON/);
  });
  it("rejects values a normal writer would silently change", () => {
    for (const value of [{ value: undefined }, [undefined], [NaN], [Infinity], [BigInt(1)], new Date(), Array(2)]) {
      expect(() => stringifyJsonData(value)).toThrow();
    }
    const array = [1];
    Object.assign(array, { ignored: true });
    expect(() => stringifyJsonData(array)).toThrow();
  });
  it("never invokes accessors or serialization hooks", () => {
    let invoked = false;
    const value = { get secret() { invoked = true; return 1; } };
    expect(() => stringifyJsonData(value)).toThrow(/accessors/);
    expect(() => stringifyJsonData({ toJSON() { invoked = true; return {}; } })).toThrow();
    expect(invoked).toBe(false);
  });
  it("rejects cycles and excessive nesting while allowing repeated noncyclic values", () => {
    const value: unknown[] = []; value.push(value);
    expect(() => stringifyJsonData(value)).toThrow(/cycle/);
    expect(() => parseJsonData("[".repeat(130) + "0" + "]".repeat(130))).toThrow(/depth/);
    const shared = { number: 1 };
    expect(parseJsonData(stringifyJsonData([shared, shared]))).toEqual([shared, shared]);
  });
});
