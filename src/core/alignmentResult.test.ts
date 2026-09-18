import { describe, expect, it } from "vitest";
import { validateAlignmentResult } from "./alignmentResult";
import { parseSequenceInput } from "./unalignedInput";
import rawGlobins from "../../examples/real-globins-unaligned.fasta?raw";
import alignedGlobins from "../../examples/real-globins-mafft-auto.fasta?raw";

const original = parseSequenceInput(">one first protein\nMKTAA\n>two second protein\nMKTA").sequences;

describe("alignment result validation", () => {
  it("validates the real MAFFT before/after globin pair", () => {
    const input = parseSequenceInput(rawGlobins);
    expect(validateAlignmentResult(alignedGlobins, input.sequences)).toBe(alignedGlobins);
    expect(new Set(parseSequenceInput(alignedGlobins).sequences.map((sequence) => sequence.residues.length)).size).toBe(1);
  });

  it("accepts a true gapped alignment and restores descriptions", () => {
    expect(validateAlignmentResult(">one\nMKTAA\n>two\nMKTA-\n", original)).toBe(
      ">one first protein\nMKTAA\n>two second protein\nMKTA-\n",
    );
  });

  it("rejects changes to residues, identity, order and width", () => {
    expect(() => validateAlignmentResult(">one\nMKTAA\n>two\nMKTAA\n", original)).toThrow("changed");
    expect(() => validateAlignmentResult(">two\nMKTA-\n>one\nMKTAA\n", original)).toThrow("reordered");
    expect(() => validateAlignmentResult(">one\nMKTAA\n>two\nMKTA\n", original)).toThrow("unequal");
  });
});
