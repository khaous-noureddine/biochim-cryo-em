import { describe, expect, it } from "vitest";
import { openAlignmentFile, parseAtlasProject, serializeAtlasProject } from "./project";
import { parseFasta } from "./alignment";
import proteinAlignment from "../../examples/7kd-dna-binding-alignment.fasta?raw";

describe("Atlas project files", () => {
  it("round-trips an Atlas document", () => {
    const document = parseFasta(">alpha\nACD\n>beta\nAC-", "Example");
    document.annotations.push({ id: "helix-1", kind: "helix", start: 0, end: 2, lane: 0, color: "#ef4444" });
    expect(parseAtlasProject(serializeAtlasProject(document))).toEqual(document);
  });

  it("opens older Atlas documents without an annotations field", () => {
    const document = parseFasta(">alpha\nACD", "Example");
    const legacy = JSON.parse(serializeAtlasProject(document));
    delete legacy.annotations;
    expect(parseAtlasProject(JSON.stringify(legacy)).annotations).toEqual([]);
  });

  it("rejects an unsupported Atlas version", () => {
    expect(() => parseAtlasProject('{"format":"atlas-alignment","version":99,"sequences":[]}'))
      .toThrow("Version .atlas non prise en charge");
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
