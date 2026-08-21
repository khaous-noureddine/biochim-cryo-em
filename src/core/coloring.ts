import { AlignmentDocument } from "./model";

export const DEFAULT_SIMILARITY_GROUPS = "None";

export type SimilarityOptions = {
  cutoff: number;
  groups: string;
};

const AMINO_ACIDS = "ACDEFGHIKLMNPQRSTVWY";

export function parseSimilarityGroups(source: string): string[] {
  if (source.trim().toUpperCase() === "NONE") return [];
  return source
    .toUpperCase()
    .split(/[\s,]+/)
    .map((group) => [...new Set(group.replace(/[^A-Z]/g, ""))].sort().join(""))
    .filter(Boolean);
}

export function calculateSimilarityColors(
  alignment: AlignmentDocument,
  options: SimilarityOptions,
): Array<Array<number | null>> {
  const sequenceCount = alignment.sequences.length;
  const width = alignment.sequences[0]?.residues.length ?? 0;
  const groups = parseSimilarityGroups(options.groups);
  const result = alignment.sequences.map(() => Array<number | null>(width).fill(null));
  if (!sequenceCount) return result;

  for (let column = 0; column < width; column += 1) {
    const residues = alignment.sequences.map((sequence) => sequence.residues[column]?.toUpperCase() ?? "-");
    const candidates = [
      ...AMINO_ACIDS.split("").map((residue) => ({ members: residue, rows: residues.flatMap((value, row) => value === residue ? [row] : []) })),
      ...groups.map((members) => ({ members, rows: residues.flatMap((value, row) => members.includes(value) ? [row] : []) })),
    ];
    const winner = candidates.reduce((best, candidate) => candidate.rows.length > best.rows.length ? candidate : best, candidates[0]);
    const score = winner.rows.length / sequenceCount;
    if (!winner.rows.length || score <= options.cutoff) continue;
    for (const row of winner.rows) result[row][column] = score;
  }
  return result;
}

// Zvelebil et al. properties used by ALINE's ALSCRIPT Calcons plugin:
// hydrophobic, positive, negative, polar, charged, small, tiny,
// aliphatic, aromatic and proline.
const ZVELEBIL_PROPERTIES: Record<string, number> = {
  A: 0b1000011000, C: 0b1000010000, D: 0b0011110000, E: 0b0011100000,
  F: 0b1000000010, G: 0b1000011000, H: 0b1101100010, I: 0b1000000100,
  K: 0b1101100000, L: 0b1000000100, M: 0b1000000000, N: 0b0001010000,
  P: 0b0000010001, Q: 0b0001000000, R: 0b0101100000, S: 0b0001011000,
  T: 0b1001010000, V: 0b1000010100, W: 0b1001000010, Y: 0b1001000010,
};
const UNKNOWN_PROPERTIES = 0b1111111111;

function bitCount(value: number): number {
  let count = 0;
  for (let current = value; current; current >>>= 1) count += current & 1;
  return count;
}

export function calculateAlscriptConservation(alignment: AlignmentDocument): number[] {
  const width = alignment.sequences[0]?.residues.length ?? 0;
  if (!alignment.sequences.length) return [];

  return Array.from({ length: width }, (_, column) => {
    const reference = alignment.sequences[0].residues[column]?.toUpperCase() ?? "-";
    const referenceProperties = ZVELEBIL_PROPERTIES[reference] ?? UNKNOWN_PROPERTIES;
    let differences = 0;
    let identical = 0;
    for (const sequence of alignment.sequences.slice(1)) {
      const residue = sequence.residues[column]?.toUpperCase() ?? "-";
      differences |= referenceProperties ^ (ZVELEBIL_PROPERTIES[residue] ?? UNKNOWN_PROPERTIES);
      if (residue === reference) identical += 1;
    }
    const propertyDifferences = bitCount(differences);
    let score = 0.9 - propertyDifferences * 0.1;
    if (identical === alignment.sequences.length - 1 || propertyDifferences === 10) score += 0.1;
    return Math.max(0, Math.min(1, score));
  });
}
