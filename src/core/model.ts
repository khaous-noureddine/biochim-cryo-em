export const ATLAS_DOCUMENT_FORMAT = "atlas-alignment" as const;
export const ATLAS_DOCUMENT_VERSION = 1 as const;

export type Sequence = {
  id: string;
  name: string;
  description: string;
  residues: string;
  numberingStart: number;
};

export const POINT_ANNOTATION_KINDS = [
  "triangle-up",
  "triangle-down",
  "triangle-up-small",
  "triangle-down-small",
  "circle",
  "star",
  "hollow-star",
  "square",
  "diamond",
  "arrow-up",
  "arrow-down",
  "arrow-up-right",
  "arrow-down-right",
  "right-bar",
] as const;

export const ANNOTATION_KINDS = [
  "helix",
  "helix-alt",
  "strand",
  "strand-alt",
  "coil",
  "line",
  "dashed-line",
  "connector-up",
  "connector-down",
  "underline",
  ...POINT_ANNOTATION_KINDS,
] as const;
export type AnnotationKind = typeof ANNOTATION_KINDS[number];

export function isAnnotationKind(value: unknown): value is AnnotationKind {
  return typeof value === "string" && (ANNOTATION_KINDS as readonly string[]).includes(value);
}

export type PointAnnotationKind = typeof POINT_ANNOTATION_KINDS[number];

export function isPointAnnotationKind(value: unknown): value is PointAnnotationKind {
  return typeof value === "string" && (POINT_ANNOTATION_KINDS as readonly string[]).includes(value);
}

export type AlignmentAnnotation = {
  id: string;
  kind: AnnotationKind;
  start: number;
  end: number;
  lane: 0 | 1;
  color: string;
};

export type AlignmentDocument = {
  format: typeof ATLAS_DOCUMENT_FORMAT;
  version: typeof ATLAS_DOCUMENT_VERSION;
  id: string;
  name: string;
  sequences: Sequence[];
  annotations: AlignmentAnnotation[];
};

export type CellPosition = {
  sequenceId: string;
  column: number;
};

export type CellRange = {
  sequenceIds: string[];
  start: number;
  end: number;
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
    annotations: [],
  };
}
