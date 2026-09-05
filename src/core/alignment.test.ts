import { describe, expect, it } from "vitest";
import {
  calculateConservation,
  exportClustal,
  exportMsf,
  exportPir,
  parseBlc,
  parseClustal,
  parseFasta,
  parseMsf,
  parsePir,
} from "./alignment";

describe("parseFasta", () => {
  it("creates a versioned Atlas document and pads shorter sequences", () => {
    const document = parseFasta(">alpha first\nACD\n>beta\nAC", "Example");

    expect(document.format).toBe("atlas-alignment");
    expect(document.version).toBe(1);
    expect(document.name).toBe("Example");
    expect(document.sequences[0].numberingStart).toBe(1);
    expect(document.sequences[1].residues).toBe("AC-");
  });

  it("calculates column conservation while ignoring gaps", () => {
    const document = parseFasta(">a\nAC-\n>b\nATG");
    expect(calculateConservation(document)).toEqual([1, 0.5, 1]);
  });
});

describe("historical alignment formats", () => {
  it("parses interleaved ClustalW blocks and ignores consensus lines", () => {
    const document = parseClustal([
      "CLUSTAL W (1.83) multiple sequence alignment",
      "",
      "alpha/5-10  AC.D 4",
      "beta        ACED 4",
      "            ** :",
      "",
      "alpha/5-10  EF 6",
      "beta        E- 5",
    ].join("\n"));
    expect(document.sequences.map(({ name, residues, numberingStart }) => ({ name, residues, numberingStart })))
      .toEqual([
        { name: "alpha/5-10", residues: "AC-DEF", numberingStart: 5 },
        { name: "beta", residues: "ACEDE-", numberingStart: 1 },
      ]);
  });

  it("parses MSF declarations in their declared order", () => {
    const document = parseMsf([
      "PileUp",
      " MSF: 6 Type: P Check: 0 ..",
      " Name: beta Len: 6 Check: 0 Weight: 1.00",
      " Name: alpha/3-8 Len: 6 Check: 0 Weight: 1.00",
      "//",
      "beta       AC.D 4",
      "alpha/3-8  ACDD 4",
      "",
      "beta       EF 6",
      "alpha/3-8  E- 5",
    ].join("\n"));
    expect(document.sequences.map(({ name, residues, numberingStart }) => ({ name, residues, numberingStart })))
      .toEqual([
        { name: "beta", residues: "AC-DEF", numberingStart: 1 },
        { name: "alpha/3-8", residues: "ACDDE-", numberingStart: 3 },
      ]);
  });

  it("parses vertical BLC columns", () => {
    const document = parseBlc(">alpha\n>beta/7-9\nAA\nC.\n-D\n*");
    expect(document.sequences.map(({ residues, numberingStart }) => ({ residues, numberingStart })))
      .toEqual([{ residues: "AC-", numberingStart: 1 }, { residues: "A-D", numberingStart: 7 }]);
  });

  it("parses PIR descriptions and terminators", () => {
    const document = parsePir(">P1;alpha/12-15\nAlpha description\nAC.D*\n>P1;beta\nBeta description\nACED*");
    expect(document.sequences[0]).toMatchObject({
      name: "alpha/12-15",
      description: "Alpha description",
      residues: "AC-D",
      numberingStart: 12,
    });
    expect(document.sequences[1]).toMatchObject({ name: "beta", residues: "ACED" });
  });

  it("rejects malformed blocks instead of silently importing damaged data", () => {
    expect(() => parseBlc(">a\n>b\nA")).toThrow("Ligne BLC invalide");
    expect(() => parsePir(">P1;a\ndescription\nACD")).toThrow("sans marqueur de fin");
    expect(() => parseMsf("MSF: 3\n//\na ACD")).toThrow("ne déclare aucune séquence");
  });
});

describe("alignment exports", () => {
  const source = ">alpha/5-8 Alpha protein\nAC-D\n>beta Beta protein\nACED";

  it("round-trips PIR sequences, descriptions, gaps, and numbering", () => {
    const original = parseFasta(source);
    const reopened = parsePir(exportPir(original));
    expect(reopened.sequences.map(({ name, description, residues, numberingStart }) => ({ name, description, residues, numberingStart })))
      .toEqual(original.sequences.map(({ name, description, residues, numberingStart }) => ({ name, description, residues, numberingStart })));
  });

  it("round-trips ClustalW alignment columns", () => {
    const original = parseFasta(source);
    expect(parseClustal(exportClustal(original)).sequences.map((sequence) => sequence.residues))
      .toEqual(original.sequences.map((sequence) => sequence.residues));
  });

  it("round-trips MSF sequence order and alignment columns", () => {
    const original = parseFasta(source);
    const reopened = parseMsf(exportMsf(original));
    expect(reopened.sequences.map(({ name, residues }) => ({ name, residues })))
      .toEqual(original.sequences.map(({ name, residues }) => ({ name, residues })));
  });
});
