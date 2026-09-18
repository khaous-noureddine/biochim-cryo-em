import { describe, expect, it } from "vitest";
import { parseSequenceInput, toUnalignedFasta } from "./unalignedInput";

describe("unaligned protein input", () => {
  it("keeps unequal FASTA lengths instead of padding them", () => {
    const input = parseSequenceInput(">alpha long protein\nMKTAA\n>beta\nMKTA\n");
    expect(input.format).toBe("fasta");
    expect(input.alreadyAligned).toBe(false);
    expect(input.sequences.map((sequence) => sequence.residues)).toEqual(["MKTAA", "MKTA"]);
    expect(input.sequences[0].description).toBe("long protein");
  });

  it("accepts plain text with one sequence per line", () => {
    const input = parseSequenceInput("MKTAA\nMKTA\n");
    expect(input.format).toBe("plain");
    expect(input.sequences.map((sequence) => sequence.name)).toEqual(["sequence-1", "sequence-2"]);
    expect(toUnalignedFasta(input)).toBe(">sequence-1\nMKTAA\n>sequence-2\nMKTA\n");
  });

  it("recognizes an explicitly gapped alignment and strips gaps for realignment", () => {
    const input = parseSequenceInput(">a\nMK-TA\n>b\nMKKTA\n");
    expect(input.alreadyAligned).toBe(true);
    expect(toUnalignedFasta(input)).toBe(">a\nMKTA\n>b\nMKKTA\n");
  });

  it("rejects ambiguous or invalid input", () => {
    expect(() => parseSequenceInput("MKTAA")).toThrow("At least two");
    expect(() => parseSequenceInput(">a\nMKT\n>a\nMKT")).toThrow("duplicate");
    expect(() => parseSequenceInput(">a\nMKT\n>b\nMK1")).toThrow("Invalid FASTA");
    expect(() => parseSequenceInput(">a\nMK-TA\n>b\nMKT")).toThrow("same length");
    expect(() => parseSequenceInput("Protein A: MKT\nProtein B: MKT")).toThrow("Unrecognized");
  });
});
