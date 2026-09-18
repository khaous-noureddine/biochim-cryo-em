export type InputSequence = {
  name: string;
  description: string;
  residues: string;
};

export type SequenceInput = {
  format: "fasta" | "plain";
  sequences: InputSequence[];
  alreadyAligned: boolean;
};

const PROTEIN_RESIDUES = /^[ACDEFGHIKLMNPQRSTVWYBXZJUO*]+$/;

function validateSequences(sequences: InputSequence[]): InputSequence[] {
  if (sequences.length < 2) {
    throw new Error("At least two protein sequences are required for multiple alignment.");
  }
  const names = new Set<string>();
  for (const sequence of sequences) {
    if (!sequence.name || names.has(sequence.name)) {
      throw new Error(`Missing or duplicate sequence name: ${sequence.name || "(empty)"}.`);
    }
    names.add(sequence.name);
    if (!sequence.residues || !PROTEIN_RESIDUES.test(sequence.residues.replace(/-/g, ""))) {
      throw new Error(`Invalid protein residues in ${sequence.name}.`);
    }
  }
  return sequences;
}

/** Parse sequence content, irrespective of filename extension; never pad raw sequences. */
export function parseSequenceInput(source: string): SequenceInput {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim());
  const content = lines.filter((line) => line && !line.startsWith(";"));
  if (!content.length) throw new Error("The sequence file is empty.");

  let format: SequenceInput["format"];
  let sequences: InputSequence[];
  if (content[0].startsWith(">")) {
    format = "fasta";
    sequences = [];
    for (const line of content) {
      if (line.startsWith(">")) {
        const header = line.slice(1).trim();
        const [name, ...description] = header.split(/\s+/);
        if (!name) throw new Error("A FASTA header has no sequence name.");
        sequences.push({ name, description: description.join(" "), residues: "" });
      } else {
        if (!/^[A-Za-z*-]+$/.test(line)) throw new Error("Invalid FASTA sequence line.");
        sequences[sequences.length - 1].residues += line.toUpperCase();
      }
    }
  } else {
    format = "plain";
    if (content.some((line) => !/^[A-Za-z*-]+$/.test(line))) {
      throw new Error("Unrecognized sequence content. Use FASTA headers or one protein sequence per line.");
    }
    sequences = content.map((line, index) => ({
      name: `sequence-${index + 1}`,
      description: "",
      residues: line.toUpperCase(),
    }));
  }

  validateSequences(sequences);
  const widths = new Set(sequences.map((sequence) => sequence.residues.length));
  const hasGaps = sequences.some((sequence) => sequence.residues.includes("-"));
  if (hasGaps && widths.size !== 1) {
    throw new Error("Gapped sequences must have the same length; remove gaps before a new alignment.");
  }
  return { format, sequences, alreadyAligned: hasGaps && widths.size === 1 };
}

export function toUnalignedFasta(input: SequenceInput): string {
  return `${input.sequences.map(({ name, residues }) => `>${name}\n${residues.replace(/-/g, "")}`).join("\n")}\n`;
}
