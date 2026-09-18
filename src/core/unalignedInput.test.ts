import { describe, expect, it } from "vitest";
import { parseSequenceInput, toUnalignedFasta } from "./unalignedInput";
import globins from "../../examples/real-globins-unaligned.fasta?raw";

describe("unaligned protein input", () => {
  it("parses the real UniProt globin fixture without fabricating an alignment", () => {
    const input = parseSequenceInput(globins);
    expect(input.sequences.map((sequence) => sequence.residues.length)).toEqual([142, 147, 147, 147, 147]);
    expect(input.sequences.map((sequence) => sequence.name)).toEqual([
      "P69905_HBA_HUMAN", "P68871_HBB_HUMAN", "P02042_HBD_HUMAN",
      "P02088_HBB1_MOUSE", "P02091_HBB1_RAT",
    ]);
    expect(input.alreadyAligned).toBe(false);
  });

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
    expect(input.gapCount).toBe(1);
    expect(toUnalignedFasta(input)).toBe(">a\nMKTA\n>b\nMKKTA\n");
  });

  it("accepts partial gaps in unequal raw sequences and removes them only for alignment", () => {
    const input = parseSequenceInput(">a\nMK-TA*\n>b\nMKT\n");
    expect(input.alreadyAligned).toBe(false);
    expect(input.gapCount).toBe(1);
    expect(input.stopCount).toBe(1);
    expect(input.sequences.map((sequence) => sequence.residues)).toEqual(["MK-TA*", "MKT"]);
    expect(toUnalignedFasta(input)).toBe(">a\nMKTA\n>b\nMKT\n");
  });

  it("rejects ambiguous or invalid input", () => {
    expect(() => parseSequenceInput("MKTAA")).toThrow("At least two");
    expect(() => parseSequenceInput(">a\nMKT\n>a\nMKT")).toThrow("duplicate");
    expect(() => parseSequenceInput(">a\nMKT\n>b\nMK1")).toThrow("Invalid FASTA");
    expect(() => parseSequenceInput("Protein A: MKT\nProtein B: MKT")).toThrow("Unrecognized");
  });
});
