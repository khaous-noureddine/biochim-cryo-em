import {
  AlignmentDocument,
  createAlignmentDocument,
  createId,
  Sequence,
} from "./model";

export type Alignment = AlignmentDocument;

const VALID_RESIDUES = /^[A-Z*?.-]+$/;

type ParsedSequence = {
  name: string;
  residues: string;
  description?: string;
};

function numberingStartFromName(name: string): number {
  const match = name.match(/\/(\d+)(?:-\d+)?$/);
  return match ? Number(match[1]) : 1;
}

function cleanImportedResidues(value: string, sequenceName: string): string {
  const residues = value.replace(/\s+/g, "").replace(/[._]/g, "-").toUpperCase();
  if (!residues || !VALID_RESIDUES.test(residues)) {
    throw new Error(`Caractère invalide dans la séquence ${sequenceName}.`);
  }
  return residues;
}

function documentFromParsedSequences(entries: ParsedSequence[], name: string, format: string): Alignment {
  if (!entries.length) throw new Error(`Aucune séquence ${format} trouvée.`);
  const names = new Set<string>();
  const sequences = entries.map((entry) => {
    if (!entry.name.trim()) throw new Error(`Nom de séquence manquant dans le fichier ${format}.`);
    if (names.has(entry.name)) throw new Error(`Nom de séquence dupliqué dans le fichier ${format} : ${entry.name}.`);
    names.add(entry.name);
    return {
      id: createId(),
      name: entry.name,
      description: entry.description ?? "",
      residues: cleanImportedResidues(entry.residues, entry.name),
      numberingStart: numberingStartFromName(entry.name),
    };
  });
  return createAlignmentDocument(name, normalizeAlignment(sequences));
}

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
        id: createId(),
        name: sequenceName,
        description: rest.join(" "),
        residues: "",
        numberingStart: 1,
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
  return createAlignmentDocument(name, normalizeAlignment(sequences));
}

export function parseClustal(source: string, name = "Untitled alignment"): Alignment {
  const sequences = new Map<string, string>();
  const lines = source.split(/\r?\n/);
  if (!/^\s*CLUSTAL(?:\s|$)/i.test(lines.find((line) => line.trim()) ?? "")) {
    throw new Error("En-tête ClustalW absent ou invalide.");
  }
  for (const rawLine of lines.slice(1)) {
    if (!rawLine.trim() || /^\s/.test(rawLine) && /^[\s*:.]+$/.test(rawLine)) continue;
    const match = rawLine.match(/^\s*(\S+)\s+([A-Za-z*?._-]+)(?:\s+\d+)?\s*$/);
    if (!match) continue;
    sequences.set(match[1], (sequences.get(match[1]) ?? "") + match[2]);
  }
  return documentFromParsedSequences(
    [...sequences].map(([sequenceName, residues]) => ({ name: sequenceName, residues })),
    name,
    "ClustalW",
  );
}

export function parseMsf(source: string, name = "Untitled alignment"): Alignment {
  const [header, body] = source.split(/^\/\/\s*$/m, 2);
  if (body === undefined || !/\bMSF\s*:/i.test(header)) throw new Error("En-tête MSF absent ou invalide.");
  const declaredNames = [...header.matchAll(/\bName:\s*(\S+)/gi)].map((match) => match[1]);
  if (!declaredNames.length) throw new Error("Le fichier MSF ne déclare aucune séquence.");
  if (new Set(declaredNames).size !== declaredNames.length) throw new Error("Le fichier MSF contient des noms de séquence dupliqués.");
  const chunks = new Map(declaredNames.map((sequenceName) => [sequenceName, ""]));
  for (const rawLine of body.split(/\r?\n/)) {
    const match = rawLine.match(/^\s*(\S+)\s+(.+?)\s*$/);
    if (!match || !chunks.has(match[1])) continue;
    const residues = match[2].replace(/[\s\d]+/g, "");
    if (residues) chunks.set(match[1], chunks.get(match[1])! + residues);
  }
  return documentFromParsedSequences(
    declaredNames.map((sequenceName) => ({ name: sequenceName, residues: chunks.get(sequenceName)! })),
    name,
    "MSF",
  );
}

export function parseBlc(source: string, name = "Untitled alignment"): Alignment {
  const lines = source.split(/\r?\n/);
  const entries: ParsedSequence[] = [];
  let index = 0;
  while (index < lines.length && lines[index].startsWith(">")) {
    entries.push({ name: lines[index].slice(1).trim(), residues: "" });
    index += 1;
  }
  if (!entries.length) throw new Error("Le fichier BLC doit commencer par les noms précédés de ‘>’. ");
  for (; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line || line.startsWith("*")) continue;
    const columns = line.replace(/\s+/g, "");
    if (columns.length !== entries.length) {
      throw new Error(`Ligne BLC invalide : ${columns.length} caractère(s) pour ${entries.length} séquence(s).`);
    }
    entries.forEach((entry, sequenceIndex) => { entry.residues += columns[sequenceIndex]; });
  }
  return documentFromParsedSequences(entries, name, "BLC");
}

export function parsePir(source: string, name = "Untitled alignment"): Alignment {
  const entries: ParsedSequence[] = [];
  const lines = source.split(/\r?\n/);
  let index = 0;
  while (index < lines.length) {
    if (!lines[index].trim()) { index += 1; continue; }
    const header = lines[index].match(/^>..;\s*(\S+)\s*$/);
    if (!header) throw new Error(`En-tête PIR invalide à la ligne ${index + 1}.`);
    index += 1;
    const description = lines[index]?.trim() ?? "";
    index += 1;
    let residues = "";
    let terminated = false;
    while (index < lines.length) {
      const line = lines[index].replace(/\s+/g, "");
      index += 1;
      const terminator = line.indexOf("*");
      residues += terminator >= 0 ? line.slice(0, terminator) : line;
      if (terminator >= 0) { terminated = true; break; }
    }
    if (!terminated) throw new Error(`Séquence PIR ${header[1]} sans marqueur de fin ‘*’.`);
    entries.push({ name: header[1], description, residues });
  }
  return documentFromParsedSequences(entries, name, "PIR");
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
