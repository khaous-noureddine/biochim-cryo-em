import { describe, expect, it } from "vitest";
import { DEFAULT_RICH_LAYOUT, parseRichProject, serializeRichProject, type RichDocument } from "./richProject";
import { stringifyJsonData } from "./jsonData";

function specimen(): RichDocument {
  return {
    format: "atlas-alignment", version: 2, id: "document", name: "Mixed annotations", columnCount: 4,
    layout: { ...DEFAULT_RICH_LAYOUT, offsetX: -3.5, repeatNames: false, grid: true },
    rows: [
      { id: "sequence", kind: "sequence", name: "α", description: "", position: 0,
        numbering: { mode: "automatic", start: -1 }, attachedTo: "annotation",
        titleStyle: { fontFamily: "Helvetica", fontSize: 12, foreground: "#123456" },
        cells: [{ text: "a", number: -1, residueIdentity: { model: "1", authorChain: "A", labelChain: "AA", authorNumber: "-1", insertionCode: "B" } },
          { text: "-", number: null }, { text: "", number: -0 }, { text: "β", style: { fontSlant: "italic" } }],
        compatibility: { legacy: { value: "", flags: [null, true] } } },
      { id: "annotation", kind: "annotation", name: "Renamed track", description: "Measurement",
        role: "analysis", position: 1.5, numbering: { mode: "fixed" }, attachedTo: "sequence", analysisId: "analysis",
        cells: [{ text: "  two words  ", number: 3.25, compatibility: { original: "" } }] },
    ],
    objects: [{ id: "graph", rowId: "annotation", multi: false, zIndex: -2, previousId: "graph", nextId: "graph",
      items: [{ kind: "LineGraph", column: 3, sample: -0.25 }, { kind: "LineGraph", column: 0, sample: 1.5 }],
      graph: { height: 20, cutoff: 0.4, sampleSpace: "drawing" }, analysisId: "analysis" }],
    palettes: [{ id: "palette", name: "Historical", categories: [
      { threshold: -1, style: { foreground: "grey25", background: "#123456789abc" } },
      { threshold: 100, style: { foreground: "black" }, compatibility: { sentinel: true } },
    ] }], activePaletteId: "palette",
    analyses: [{ id: "analysis", provider: "Local", method: "fixture", version: null,
      inputs: [{ id: "snapshot", rowId: "sequence", cells: ["A", "C", "D"] }], parameters: { window: 3 },
      series: [{ id: "raw", inputId: "snapshot", label: "Before drawing transform", valueSpace: "raw", values: [-10, null, 25] }] }],
    compatibility: { source: "synthetic", unknown: [false, "", null] },
  };
}

describe("version-2 document persistence", () => {
  it("preserves the complete document without normalizing text, numbering or samples", () => {
    const original = specimen();
    const before = stringifyJsonData(original);
    const saved = serializeRichProject(original);
    const loaded = parseRichProject(saved);
    expect(loaded).toEqual(original);
    expect(stringifyJsonData(original)).toBe(before);
    expect(serializeRichProject(loaded)).toBe(saved);
    expect(Object.is(loaded.rows[0].cells[2].number, -0)).toBe(true);
    expect(Object.hasOwn(loaded.rows[0].cells[3], "number")).toBe(false);
    expect(loaded.rows[1].cells).toHaveLength(1);
    expect(loaded.objects[0].items.map(item => item.column)).toEqual([3, 0]);
  });

  it("keeps analysis snapshots after the source row changes or is removed", () => {
    const document = specimen();
    document.rows[0].cells = [{ text: "changed" }];
    const loaded = parseRichProject(serializeRichProject(document));
    expect(loaded.analyses[0].inputs[0].cells).toEqual(["A", "C", "D"]);
    document.analyses[0].inputs[0].rowId = null;
    document.rows = [document.rows[1]];
    document.rows[0].attachedTo = null;
    expect(parseRichProject(serializeRichProject(document)).analyses).toEqual(document.analyses);
  });

  it("represents an empty document without inventing rows, palettes or analyses", () => {
    const document = specimen();
    Object.assign(document, { columnCount: 0, rows: [], objects: [], palettes: [], activePaletteId: null, analyses: [] });
    expect(parseRichProject(serializeRichProject(document))).toEqual(document);
  });

  const invalid: [string, (document: RichDocument) => void, RegExp][] = [
    ["version", d => { d.version = 1 as 2; }, /version/],
    ["duplicate rows", d => { d.rows.push(d.rows[0]); }, /duplicate/],
    ["dangling attachment", d => { d.rows[0].attachedTo = "missing"; }, /attachment/],
    ["row width", d => { d.columnCount = 3; }, /cells exceed/],
    ["object width", d => { d.objects[0].items[0].column = 4; }, /coverage/],
    ["object row", d => { d.objects[0].rowId = "missing"; }, /row identifier/],
    ["cell style", d => { Object.assign(d.rows[0].cells[0], { style: { fillColor: "red" } }); }, /unrecognized field/],
    ["number state", d => { d.rows[0].cells[0].number = "1" as unknown as number; }, /finite number/],
    ["fixed start", d => { Object.assign(d.rows[1].numbering, { start: 0 }); }, /unrecognized field/],
    ["zero cell size", d => { d.layout.cellWidth = 0; }, /positive/],
    ["wrap width", d => { d.layout.wrapColumns = d.layout.titleColumns; }, /wrapped width/],
    ["fractional column count", d => { d.columnCount = 4.5; }, /safe integer/],
    ["missing palette", d => { d.activePaletteId = "missing"; }, /unknown palette/],
    ["duplicate palette", d => { d.palettes.push(d.palettes[0]); }, /duplicate/],
    ["unordered thresholds", d => { d.palettes[0].categories.reverse(); }, /strictly increasing/],
    ["empty palette", d => { d.palettes[0].categories = []; }, /nonempty/],
    ["duplicate analysis", d => { d.analyses.push(d.analyses[0]); }, /duplicate/],
    ["missing analysis", d => { d.rows[1].analysisId = "missing"; }, /unknown analysis/],
    ["missing object analysis", d => { d.objects[0].analysisId = "missing"; }, /unknown analysis/],
    ["missing input row", d => { d.analyses[0].inputs[0].rowId = "missing"; }, /unknown input row/],
    ["duplicate input", d => { d.analyses[0].inputs.push(d.analyses[0].inputs[0]); }, /duplicate/],
    ["duplicate series", d => { d.analyses[0].series.push(d.analyses[0].series[0]); }, /duplicate/],
    ["missing snapshot", d => { d.analyses[0].series[0].inputId = "missing"; }, /unknown input snapshot/],
    ["snapshot length", d => { d.analyses[0].series[0].values.pop(); }, /measurement count/],
    ["sample space", d => { d.analyses[0].series[0].valueSpace = "drawing" as "raw"; }, /raw space/],
    ["unknown field", d => { Object.assign(d, { unexpected: true }); }, /unrecognized field/],
  ];
  it.each(invalid)("rejects invalid %s on both read and write", (_name, mutate, message) => {
    const document = specimen();
    mutate(document);
    expect(() => parseRichProject(stringifyJsonData(document))).toThrow(message);
    expect(() => serializeRichProject(document)).toThrow(message);
  });

  it("rejects missing required fields instead of inventing defaults", () => {
    const document = specimen();
    for (const field of Object.keys(document).filter(key => key !== "compatibility")) {
      const input = { ...document } as Record<string, unknown>;
      delete input[field];
      expect(() => parseRichProject(stringifyJsonData(input)), field).toThrow();
    }
  });

  it("rejects ambiguous duplicate members and lossy runtime values", () => {
    const document = specimen();
    expect(() => parseRichProject(serializeRichProject(document).replace('"version":2', '"version":1,"version":2'))).toThrow(/duplicate/);
    document.rows[0].cells[0].number = Infinity;
    expect(() => serializeRichProject(document)).toThrow(/finite/);
    document.rows[0].cells[0].number = undefined;
    expect(() => serializeRichProject(document)).toThrow(/preserved/);
  });
});
