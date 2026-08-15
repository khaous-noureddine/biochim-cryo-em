export type Sequence = {
  id: string;
  name: string;
  description: string;
  residues: string;
};

export type Alignment = {
  name: string;
  sequences: Sequence[];
};

const VALID_RESIDUES = /^[A-Z*?.-]+$/;

export function parseFasta(source: string, name = "Untitled alignment"): Alignment {
  const sequences: Sequence[] = [];
  let current: Sequence | null = null;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) continue;

    if (line.startsWith(">")) {
      const header = line.slice(1).trim();
      const [sequenceName = `sequence-${sequences.length + 1}`, ...rest] = header.split(/\s+/);
      current = {
        id: crypto.randomUUID(),
        name: sequenceName,
        description: rest.join(" "),
        residues: "",
      };
      sequences.push(current);
      continue;
    }

    if (!current) throw new Error("Le fichier FASTA doit commencer par une ligne ‘>nom’. ");
    const residues = line.replace(/\s+/g, "").toUpperCase();
    if (!VALID_RESIDUES.test(residues)) {
      throw new Error(`Caractère invalide dans la séquence ${current.name}.`);
    }
    current.residues += residues;
  }

  if (!sequences.length) throw new Error("Aucune séquence FASTA trouvée.");
  return { name, sequences: normalizeAlignment(sequences) };
}

export function normalizeAlignment(sequences: Sequence[]): Sequence[] {
  const width = Math.max(...sequences.map((sequence) => sequence.residues.length));
  return sequences.map((sequence) => ({
    ...sequence,
    residues: sequence.residues.padEnd(width, "-"),
  }));
}

export function calculateConservation(alignment: Alignment): number[] {
  const width = alignment.sequences[0]?.residues.length ?? 0;
  return Array.from({ length: width }, (_, column) => {
    const counts = new Map<string, number>();
    let residues = 0;
    for (const sequence of alignment.sequences) {
      const residue = sequence.residues[column];
      if (!residue || residue === "-") continue;
      counts.set(residue, (counts.get(residue) ?? 0) + 1);
      residues += 1;
    }
    if (!residues) return 0;
    return Math.max(...counts.values()) / residues;
  });
}

export function exportFasta(alignment: Alignment): string {
  return alignment.sequences
    .map(({ name, description, residues }) =>
      `>${name}${description ? ` ${description}` : ""}\n${residues.match(/.{1,80}/g)?.join("\n") ?? ""}`,
    )
    .join("\n");
}

