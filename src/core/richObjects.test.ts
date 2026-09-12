import { describe, expect, it } from "vitest";
import legacySource from "../../aline_011208/bin/aline?raw";
import { isRichGraphKind, parseRichObjects, RICH_OBJECT_KINDS, type RichObject } from "./richObjects";

function object(overrides: Partial<RichObject> = {}): RichObject {
  return { id: "object", rowId: "row", multi: false, zIndex: 1,
    previousId: null, nextId: null, items: [], ...overrides };
}
const parse = (objects: unknown) => parseRichObjects(JSON.stringify(objects), ["row", "other"]);

describe("rich object data contract", () => {
  it("covers every kind in the actual historical registry and the Atlas solid line", () => {
    const registry = legacySource.match(/my %objectdata=\(([\s\S]*?)\n\);/)![1];
    const names = [...registry.matchAll(/^\s*(\w+)\s*=>\s*\[/gm)].map((match) => match[1]);
    expect(names).toHaveLength(36);
    expect([...RICH_OBJECT_KINDS].sort()).toEqual([...names, "Line"].sort());
  });

  it("round-trips all kinds with complete independent item typography and colours", () => {
    const objects = RICH_OBJECT_KINDS.map((kind, index) => object({ id: kind, zIndex: index, items: [{
      kind, column: index, text: "", ...(isRichGraphKind(kind) ? { sample: -0.25 } : {}),
      style: { foreground: "#123456789abc", background: "", fontFamily: "Helvetica", fontSize: 14,
        fontWeight: "Bold", fontSlant: "I", fontWidth: "condensed", anchor: "nw",
        lineColor: "red", fillColor: "light blue", lineWidth: 0.5 },
    }], ...(isRichGraphKind(kind) ? { graph: { height: 2.5, cutoff: -0.5, sampleSpace: "drawing" as const } } : {}) }));
    expect(parse(objects)).toEqual(objects);
    expect(parse(parse(objects))).toEqual(objects);
  });

  it("preserves sparse linked regions, per-segment layers, item order and duplicate coverage", () => {
    const objects = [object({ id: "first", nextId: "second", multi: true, items: [
      { kind: "Box", column: 0, style: { fillColor: "red" } },
      { kind: "Rect", column: 3, style: { fillColor: "blue" } },
      { kind: "Box", column: 0, text: "label" },
    ] }), object({ id: "second", rowId: "other", previousId: "first", multi: true,
      zIndex: 3, items: [{ kind: "Box", column: 2 }] })];
    expect(parse(objects)).toEqual(objects);
    expect(parse(objects)[0].items.map((item) => item.column)).toEqual([0, 3, 0]);
  });

  it("keeps negative, zero and positive graph samples without normalization or invented raw data", () => {
    const objects = [object({ graph: { height: 2, cutoff: 0.5, sampleSpace: "drawing" }, items:
      [-0.25, 0, 1.5].map((sample, column) => ({ kind: "LineGraph", column, sample })),
      compatibility: { originalRangeComment: "original dynamic range -2 to 9" },
    })];
    expect(parse(objects)).toEqual(objects);
    expect(parse(objects)[0].items[1].sample).toBe(0);
  });

  it("retains inert extension data and prototype-shaped keys without prototype mutation", () => {
    const source = '[{"id":"object","rowId":"row","multi":false,"zIndex":1,"previousId":null,"nextId":null,"items":[],"compatibility":{"__proto__":{"polluted":true},"nested":[null,false,0,""]}}]';
    const result = parseRichObjects(source, ["row"]);
    expect(Object.hasOwn(result[0].compatibility!, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(result[0].compatibility!)).toBe(null);
    expect(Object.hasOwn({}, "polluted")).toBe(false);
    expect(JSON.parse(JSON.stringify(result))).toEqual(JSON.parse(source));
  });

  it("preserves reciprocal cycles, self-links and empty containers as data", () => {
    const objects = [object({ id: "a", previousId: "b", nextId: "b" }),
      object({ id: "b", previousId: "a", nextId: "a" }),
      object({ id: "self", previousId: "self", nextId: "self" })];
    expect(parse(objects)).toEqual(objects);
  });

  it.each([
    ["row", { rowId: "missing" }],
    ["link", { nextId: "missing" }],
    ["layer", { zIndex: "1" }],
    ["column", { items: [{ kind: "Box", column: 0.5 }] }],
    ["negative column", { items: [{ kind: "Box", column: -1 }] }],
    ["kind", { items: [{ kind: "unknown", column: 0 }] }],
    ["graph sample", { items: [{ kind: "LineGraph", column: 0 }] }],
    ["non-graph sample", { items: [{ kind: "Box", column: 0, sample: 1 }] }],
    ["graph settings", { items: [{ kind: "LineGraph", column: 0, sample: 1 }] }],
    ["raw interpretation", { graph: { height: 1, cutoff: 0, sampleSpace: "raw" } }],
    ["style field", { items: [{ kind: "Text", column: 0, style: { ignored: "data" } }] }],
    ["negative width", { items: [{ kind: "Text", column: 0, style: { lineWidth: -1 } }] }],
    ["unknown field", { unknown: "would be lost" }],
  ])("rejects invalid %s before returning any objects", (_label, change) => {
    expect(() => parse([object(), { ...object({ id: "bad" }), ...change }])).toThrow();
  });

  it("rejects duplicate identifiers and nonreciprocal links", () => {
    expect(() => parse([object(), object()])).toThrow(/duplicate/);
    expect(() => parse([object({ nextId: "second" }), object({ id: "second" })])).toThrow(/nonreciprocal/);
    expect(() => parseRichObjects("[]", ["row", "row"])).toThrow(/unique/);
  });

  it("rejects overflowing JSON numbers, malformed JSON and excessive extension depth", () => {
    expect(() => parseRichObjects(JSON.stringify([object()]).replace('"zIndex":1', '"zIndex":1e999'), ["row"])).toThrow(/finite/);
    expect(() => parseRichObjects("[", ["row"])).toThrow(/JSON/);
    let nested: unknown = null;
    for (let i = 0; i < 70; i += 1) nested = [nested];
    expect(() => parse([{ ...object(), compatibility: { nested } }])).toThrow(/depth/);
  });
});
