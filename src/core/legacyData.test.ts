import { describe, expect, it } from "vitest";
import fixture from "../../tests/fixtures/aline/legacy-data-dumper.aline?raw";
import { parseLegacyData } from "./legacyData";

const header = "### Aline 1.0, test\n";
const document = (rows: string, suffix = "") => `${header}%par = (); @seq = (${rows}); @categories = (); ${suffix}`;

describe("data-only legacy ALINE reader", () => {
  it("reads the authored corpus without evaluating Perl", () => {
    const result = parseLegacyData(fixture);
    expect(result.parameters.entries.nch).toBe(40);
    expect(result.rows.values[0]).toMatchObject({ kind: "map", entries: {
      n: null,
      t: { kind: "map", entries: { text: "Protein", comment: "A quoted 'label'" } },
      e: { kind: "list", values: [
        { kind: "map", entries: { text: "A", seqnumber: 1 } },
        { kind: "map", entries: { text: "-", seqnumber: null } },
      ] },
    } });
    expect(result.warnings).toEqual([]);
  });

  it("preserves cyclic object links as serializable reference paths", () => {
    // Shape emitted by Data::Dumper with Purity(1), not executed as input.
    const data = document("{o => [{fwd => {rev => {}}}]}, {o => [{}]}",
      "$seq[0]{'o'}[0]{'fwd'}{'rev'} = $seq[0]{'o'}[0]; " +
      "$seq[1]{'o'}[0] = $seq[0]{'o'}[0]{'fwd'};");
    const result = parseLegacyData(data);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(result.rows.values[1]).toMatchObject({ entries: { o: { values: [
      { kind: "reference", target: { root: "seq", parts: [0, "o", 0, "fwd"] } },
    ] } } });
  });

  it("retains unsupported old objects and reports them", () => {
    const result = parseLegacyData(document("", "@obj = ({unknown => ['shape', 2]});"));
    expect(result.oldObjects.values).toHaveLength(1);
    expect(result.warnings).toEqual([expect.stringContaining("retained")]);
  });

  it("resolves aliases used as fixup parents and targets", () => {
    const result = parseLegacyData(document("{child => {}}, $seq[0], {text => 'A'}, $seq[2]",
      "$seq[1]{child} = $seq[3];"));
    expect(result.rows.values[0]).toMatchObject({ entries: {
      child: { kind: "reference", target: { root: "seq", parts: [3] } },
    } });
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it("retains inline aliases and escaped Unicode without interpolation", () => {
    const result = parseLegacyData(document(String.raw`{text => "\x{3b1}\101\x42"}, $seq[0]`));
    expect(result.rows.values[0]).toMatchObject({ entries: { text: "αAB" } });
    expect(result.rows.values[1]).toEqual({ kind: "reference", target: { root: "seq", parts: [0] } });
    expect(() => parseLegacyData(document("$seq[0]"))).toThrow(/Cyclic/);
    expect(() => parseLegacyData(document(String.raw`"\x{110000}"`))).toThrow(/Unicode/);
  });

  it("keeps prototype-shaped keys as inert data", () => {
    const result = parseLegacyData(document("{'__proto__' => {polluted => 1}, constructor => 'value'}"));
    expect(Object.getPrototypeOf(result.parameters.entries)).toBeNull();
    expect(JSON.stringify(result)).toContain('"__proto__"');
    expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false);
  });

  it("supports data strings, comments, trailing commas and finite exponents", () => {
    const result = parseLegacyData(document(String.raw`{text => "line\n\t\$x\@y", value => -1.2e3,}, # note` + "\n"));
    expect(result.rows.values[0]).toMatchObject({ entries: { text: "line\n\t$x@y", value: -1200 } });
  });

  it.each([
    "system('touch sentinel')", "`whoami`", "do { 1 }", '"$ENV{HOME}"',
    '"@seq"', "bless({}, 'Object')", "1+2", "1e999", "010",
  ])("rejects executable or ambiguous expression %s", (expression) => {
    expect(() => parseLegacyData(document(expression))).toThrow();
  });

  it.each([
    document("{}", "$seq[0]{missing} = $seq[0];"),
    document("{}", "$seq[9] = $seq[0];"),
    document("{}", "$seq[0] = $unknown[0];"),
    document("{text => 'A'}", "$seq[0] = $seq[0];"),
    document("{}", "$seq[0] = $seq[0];"),
  ])("rejects broken, destructive or self-only reference fixups", (data) => {
    expect(() => parseLegacyData(data)).toThrow(/reference|Reference|overwrite|Cyclic/);
  });

  it("rejects duplicate declarations, keys and incomplete input", () => {
    expect(() => parseLegacyData(document("{a => 1, a => 2}"))).toThrow(/Duplicate/);
    expect(() => parseLegacyData(document("", "@seq = ();"))).toThrow(/Duplicate/);
    expect(() => parseLegacyData(header + "%par = (); @seq = (); ")).toThrow(/Missing categories/);
    expect(() => parseLegacyData(document("{text => 'unfinished}"))).toThrow(/Unterminated/);
    expect(() => parseLegacyData(document("", "print 'x';"))).toThrow();
  });

  it("enforces input, value and nesting limits with locations", () => {
    expect(() => parseLegacyData(fixture, { maxCharacters: 20 })).toThrow(/character limit.*character/);
    expect(() => parseLegacyData(fixture, { maxValues: 3 })).toThrow(/value limit.*character/);
    expect(() => parseLegacyData(document("[[[[1]]]]"), { maxDepth: 3 })).toThrow(/nesting limit/);
    expect(() => parseLegacyData(fixture, { maxDepth: 0 })).toThrow(/Invalid/);
  });
});
