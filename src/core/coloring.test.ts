import { describe, expect, it } from "vitest";
import { parseFasta } from "./alignment";
import {
  calculateAlscriptConservation,
  calculateSimilarityColors,
  parseSimilarityGroups,
} from "./coloring";

describe("ALINE-style similarity colouring", () => {
  it("colours only residues in the winning group above the strict cutoff", () => {
    const alignment = parseFasta(">a\nDAG\n>b\nEAG\n>c\nKVG");
    const colors = calculateSimilarityColors(alignment, { cutoff: 0.5, groups: "DE" });

    expect(colors.map((row) => row[0])).toEqual([2 / 3, 2 / 3, null]);
    expect(colors.map((row) => row[1])).toEqual([2 / 3, 2 / 3, null]);
    expect(colors.map((row) => row[2])).toEqual([1, 1, 1]);
  });

  it("supports None and normalized custom groups", () => {
    expect(parseSimilarityGroups("None")).toEqual([]);
    expect(parseSimilarityGroups("ed, ilmv  ST")).toEqual(["DE", "ILMV", "ST"]);
  });
});

describe("ALSCRIPT Calcons", () => {
  it("scores identical columns at 1", () => {
    const alignment = parseFasta(">a\nACD\n>b\nACD\n>c\nACD");
    expect(calculateAlscriptConservation(alignment)).toEqual([1, 1, 1]);
  });

  it("uses biochemical properties rather than identity frequency", () => {
    const alignment = parseFasta(">a\nD\n>b\nE\n>c\nD");
    expect(calculateAlscriptConservation(alignment)[0]).toBeCloseTo(0.8);
  });
});
