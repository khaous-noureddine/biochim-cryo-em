export const ATLAS_DOCUMENT_FORMAT = "atlas-alignment" as const;
export const ATLAS_DOCUMENT_VERSION = 1 as const;

export type Sequence = {
  id: string;
  name: string;
  description: string;
  residues: string;
  numberingStart: number;
};

export type AlignmentDocument = {
  format: typeof ATLAS_DOCUMENT_FORMAT;
  version: typeof ATLAS_DOCUMENT_VERSION;
  id: string;
  name: string;
  sequences: Sequence[];
};

export type CellPosition = {
  sequenceId: string;
  column: number;
};

export function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `atlas-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createAlignmentDocument(
  name: string,
  sequences: Sequence[],
): AlignmentDocument {
  return {
    format: ATLAS_DOCUMENT_FORMAT,
    version: ATLAS_DOCUMENT_VERSION,
    id: createId(),
    name,
    sequences,
  };
}

