import { InputSequence, parseSequenceInput } from "./unalignedInput.ts";

/** Reject malformed or reordered engine output before publishing it in Atlas. */
export function validateAlignmentResult(source: string, original: InputSequence[]): string {
  const result = parseSequenceInput(source);
  if (result.sequences.length !== original.length) {
    throw new Error("The alignment engine changed the sequence count.");
  }
  const widths = new Set(result.sequences.map((sequence) => sequence.residues.length));
  if (widths.size !== 1) throw new Error("The alignment engine returned unequal row lengths.");
  for (let index = 0; index < original.length; index += 1) {
    const actual = result.sequences[index];
    const expected = original[index];
    if (actual.name !== expected.name || actual.residues.replace(/-/g, "") !== expected.residues.replace(/-/g, "")) {
      throw new Error(`The alignment engine changed or reordered ${expected.name}.`);
    }
  }
  return `${result.sequences.map((sequence, index) => {
    const description = original[index].description;
    return `>${sequence.name}${description ? ` ${description}` : ""}\n${sequence.residues}`;
  }).join("\n")}\n`;
}
