import { describe, expect, it } from "vitest";
import { openAlignmentFile, parseAtlasProject, serializeAtlasProject } from "./project";
import { parseFasta } from "./alignment";
import proteinAlignment from "../../examples/7kd-dna-binding-alignment.fasta?raw";

describe("Atlas project files", () => {
  it("round-trips an Atlas document", () => {
    const document = parseFasta(">alpha\nACD\n>beta\nAC-", "Example");
    document.annotations.push({ id: "helix-1", kind: "helix", start: 0, end: 2, lane: 0, color: "#ef4444" });
    document.annotations.push({ id: "helix-alt-1", kind: "helix-alt", start: 0, end: 2, lane: 1, color: "#ef4444" });
    document.annotations.push({ id: "strand-1", kind: "strand", start: 0, end: 1, lane: 0, color: "#2563eb" });
    document.annotations.push({ id: "strand-alt-1", kind: "strand-alt", start: 1, end: 2, lane: 0, color: "#2563eb" });
    document.annotations.push({ id: "line-1", kind: "line", start: 0, end: 2, lane: 1, color: "#111111" });
    document.annotations.push({ id: "dashed-1", kind: "dashed-line", start: 1, end: 2, lane: 1, color: "#64748b" });
    document.annotations.push({ id: "connect-up-1", kind: "connector-up", start: 0, end: 1, lane: 0, color: "#111111" });
    document.annotations.push({ id: "connect-down-1", kind: "connector-down", start: 1, end: 2, lane: 1, color: "#111111" });
    document.annotations.push({ id: "underline-1", kind: "underline", start: 0, end: 2, lane: 1, color: "#ef4444" });
    document.annotations.push({ id: "star-1", kind: "star", start: 1, end: 1, lane: 1, color: "#facc15", zIndex: 1 });
    document.regions.push({ id: "box-1", kind: "box", sequenceIds: document.sequences.map((sequence) => sequence.id), start: 0, end: 1, lineColor: "#111111", fillColor: "#facc15", lineWidth: 2, zIndex: 2 });
    document.textAnnotations.push({ id: "text-1", kind: "outline-text", column: 1, lane: 0, text: "active site", color: "#ffffff", outlineColor: "#111111", outlineWidth: 2, fontFamily: "Arial", fontSize: 14, fontWeight: "bold", italic: false, align: "center", zIndex: 3 });
    expect(parseAtlasProject(serializeAtlasProject(document))).toEqual(document);
  });

  it("opens older Atlas documents without an annotations field", () => {
    const document = parseFasta(">alpha\nACD", "Example");
    const legacy = JSON.parse(serializeAtlasProject(document));
    delete legacy.annotations;
    delete legacy.regions;
    delete legacy.textAnnotations;
    expect(parseAtlasProject(JSON.stringify(legacy))).toMatchObject({ annotations: [], regions: [], textAnnotations: [] });
  });

  it("rejects an unsupported Atlas version", () => {
    expect(() => parseAtlasProject('{"format":"atlas-alignment","version":99,"sequences":[]}'))
      .toThrow("Version .atlas non prise en charge");
  });

  it("rejects point symbols spanning several columns", () => {
    const document = parseFasta(">alpha\nACD", "Example");
    const invalid = JSON.parse(serializeAtlasProject(document));
    invalid.annotations = [{ id: "star", kind: "star", start: 0, end: 1, lane: 0, color: "#facc15" }];
    expect(() => parseAtlasProject(JSON.stringify(invalid))).toThrow("doit occuper une seule position");
  });
});

describe("sequence files", () => {
  it("opens the real 7 kDa DNA-binding protein alignment example", () => {
    const result = openAlignmentFile(proteinAlignment, "7kd-dna-binding-alignment.fasta");
    expect(result.kind).toBe("fasta");
    expect(result.document.sequences).toHaveLength(3);
    expect(result.document.sequences.map((sequence) => sequence.residues.length)).toEqual([59, 59, 59]);
    expect(result.document.sequences[0].residues).toContain("-");
  });

  it("opens a plain sequence file without a FASTA header", () => {
    const result = openAlignmentFile("ACDE FGHI\nK", "protein.seq");
    expect(result.document.sequences[0]).toMatchObject({ name: "protein", residues: "ACDEFGHIK" });
  });

  it.each([
    ["alignment.aln", "CLUSTAL W\n\na AC-D\nb ACED\n", "clustal"],
    ["alignment.msf", "MSF: 4\n Name: a Len: 4\n Name: b Len: 4\n//\na AC-D\nb ACED\n", "msf"],
    ["alignment.blc", ">a\n>b\nAA\nCC\n-E\nDD\n", "blc"],
    ["alignment.pir", ">P1;a\nA protein\nAC-D*\n>P1;b\nB protein\nACED*\n", "pir"],
  ])("detects and opens %s", (filename, source, kind) => {
    const result = openAlignmentFile(source, filename);
    expect(result.kind).toBe(kind);
    expect(result.document.sequences).toHaveLength(2);
    expect(result.document.sequences.map((sequence) => sequence.residues)).toEqual(["AC-D", "ACED"]);
  });
});

describe("legacy ALINE projects", () => {
  it("imports protein rows and their original numbering", () => {
    const sep = "\x03";
    const end = "\x05";
    const cache = ["A", "C", "D", "-"]
      .map((residue) => `${residue} ${sep}seqnumber${sep}1${sep}text${sep}${residue}`);
    const source = [
      "Aline 1.0 packed state R001",
      "Aline 1.0 test",
      `nch${sep}60`,
      ...cache,
      end,
      end,
      `3${sep}52${sep}0${sep}text${sep}LegacyProtein`,
      ">",
      "A C D - ",
      end,
    ].join("\n");
    const result = openAlignmentFile(source, "legacy.aline");

    expect(result.kind).toBe("aline");
    expect(result.document.sequences).toHaveLength(1);
    expect(result.document.sequences[0].name).toBe("LegacyProtein");
    expect(result.document.sequences[0].numberingStart).toBe(52);
    expect(result.document.sequences[0].residues).toBe("ACD-");
  });
});
