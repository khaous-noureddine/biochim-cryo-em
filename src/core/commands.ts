import { normalizeAlignment } from "./alignment";
import { AlignmentAnnotation, AlignmentDocument, CellPosition, CellRange, isAnnotationKind, Sequence } from "./model";

export type AlignmentCommand =
  | { type: "replace-residue"; position: CellPosition; residue: string }
  | { type: "insert-gap"; position: CellPosition }
  | { type: "delete-cell"; position: CellPosition }
  | { type: "clear-region"; range: CellRange }
  | { type: "delete-region"; range: CellRange }
  | { type: "rename-sequence"; sequenceId: string; name: string }
  | { type: "update-sequence-properties"; sequenceId: string; name: string; description: string; numberingStart: number }
  | { type: "add-sequence"; sequence: Sequence; atIndex?: number }
  | { type: "delete-sequence"; sequenceId: string }
  | { type: "move-sequence"; sequenceId: string; toIndex: number }
  | { type: "clear-all-gap-columns" }
  | { type: "remove-duplicate-sequences"; includeFragments: boolean }
  | { type: "add-annotation"; annotation: AlignmentAnnotation }
  | { type: "update-annotation"; annotation: AlignmentAnnotation }
  | { type: "delete-annotation"; annotationId: string };

const EDITABLE_RESIDUE = /^[A-Z*?.-]$/;

function updateSequence(
  document: AlignmentDocument,
  sequenceId: string,
  update: (sequence: Sequence) => Sequence,
): AlignmentDocument {
  if (!document.sequences.some((sequence) => sequence.id === sequenceId)) {
    return document;
  }

  return {
    ...document,
    sequences: document.sequences.map((sequence) =>
      sequence.id === sequenceId ? update(sequence) : sequence,
    ),
  };
}

function validColumn(sequence: Sequence, column: number): boolean {
  return Number.isInteger(column) && column >= 0 && column < sequence.residues.length;
}

function validRange(document: AlignmentDocument, range: CellRange): boolean {
  const ids = new Set(document.sequences.map((sequence) => sequence.id));
  return range.sequenceIds.length > 0 && new Set(range.sequenceIds).size === range.sequenceIds.length &&
    range.sequenceIds.every((id) => ids.has(id)) && Number.isInteger(range.start) && Number.isInteger(range.end) &&
    range.start >= 0 && range.end >= range.start && range.end < (document.sequences[0]?.residues.length ?? 0);
}

function remapAnnotations(
  annotations: AlignmentAnnotation[],
  keptColumns: number[],
): AlignmentAnnotation[] {
  const newIndex = new Map(keptColumns.map((column, index) => [column, index]));
  return annotations.flatMap((annotation) => {
    const covered = keptColumns.filter((column) => column >= annotation.start && column <= annotation.end);
    if (!covered.length) return [];
    return [{ ...annotation, start: newIndex.get(covered[0])!, end: newIndex.get(covered.at(-1)!)! }];
  });
}

function validAnnotation(document: AlignmentDocument, annotation: AlignmentAnnotation): boolean {
  const width = document.sequences[0]?.residues.length ?? 0;
  return isAnnotationKind(annotation.kind) &&
    Number.isInteger(annotation.start) && Number.isInteger(annotation.end) &&
    annotation.start >= 0 && annotation.end >= annotation.start && annotation.end < width &&
    (annotation.lane === 0 || annotation.lane === 1) && /^#[0-9a-f]{6}$/i.test(annotation.color);
}

export function applyAlignmentCommand(
  document: AlignmentDocument,
  command: AlignmentCommand,
): AlignmentDocument {
  switch (command.type) {
    case "replace-residue": {
      const residue = command.residue.toUpperCase();
      if (!EDITABLE_RESIDUE.test(residue)) return document;
      return updateSequence(document, command.position.sequenceId, (sequence) => {
        if (!validColumn(sequence, command.position.column)) return sequence;
        if (sequence.residues[command.position.column] === residue) return sequence;
        return {
          ...sequence,
          residues:
            sequence.residues.slice(0, command.position.column) +
            residue +
            sequence.residues.slice(command.position.column + 1),
        };
      });
    }

    case "insert-gap": {
      const updated = updateSequence(document, command.position.sequenceId, (sequence) => {
        const column = Math.min(Math.max(0, command.position.column), sequence.residues.length);
        return {
          ...sequence,
          residues:
            sequence.residues.slice(0, column) +
            "-" +
            sequence.residues.slice(column),
        };
      });
      if (updated === document) return document;
      return { ...updated, sequences: normalizeAlignment(updated.sequences) };
    }

    case "delete-cell": {
      const updated = updateSequence(document, command.position.sequenceId, (sequence) => {
        if (!validColumn(sequence, command.position.column)) return sequence;
        return {
          ...sequence,
          residues:
            sequence.residues.slice(0, command.position.column) +
            sequence.residues.slice(command.position.column + 1),
        };
      });
      if (updated === document) return document;
      return { ...updated, sequences: normalizeAlignment(updated.sequences) };
    }

    case "clear-region": {
      if (!validRange(document, command.range)) return document;
      const selected = new Set(command.range.sequenceIds);
      let changed = false;
      const fill = "-".repeat(command.range.end - command.range.start + 1);
      const sequences = document.sequences.map((sequence) => {
        if (!selected.has(sequence.id)) return sequence;
        const residues = sequence.residues.slice(0, command.range.start) + fill + sequence.residues.slice(command.range.end + 1);
        if (residues === sequence.residues) return sequence;
        changed = true;
        return { ...sequence, residues };
      });
      return changed ? { ...document, sequences } : document;
    }

    case "delete-region": {
      if (!validRange(document, command.range)) return document;
      const selected = new Set(command.range.sequenceIds);
      const deletingAllRows = selected.size === document.sequences.length;
      let sequences = normalizeAlignment(document.sequences.map((sequence) => selected.has(sequence.id) ? {
        ...sequence,
        residues: sequence.residues.slice(0, command.range.start) + sequence.residues.slice(command.range.end + 1),
      } : sequence));
      if (!deletingAllRows) return { ...document, sequences };
      const oldWidth = document.sequences[0].residues.length;
      const keptColumns = Array.from({ length: oldWidth }, (_, column) => column)
        .filter((column) => column < command.range.start || column > command.range.end);
      if (!keptColumns.length) sequences = sequences.map((sequence) => ({ ...sequence, residues: "-" }));
      return { ...document, sequences, annotations: remapAnnotations(document.annotations, keptColumns) };
    }

    case "rename-sequence": {
      const name = command.name.trim();
      if (!name) return document;
      return updateSequence(document, command.sequenceId, (sequence) =>
        sequence.name === name ? sequence : { ...sequence, name },
      );
    }

    case "update-sequence-properties": {
      const name = command.name.trim();
      if (!name || !Number.isInteger(command.numberingStart) || command.numberingStart < 0) return document;
      return updateSequence(document, command.sequenceId, (sequence) => {
        if (sequence.name === name && sequence.description === command.description && sequence.numberingStart === command.numberingStart) return sequence;
        return { ...sequence, name, description: command.description, numberingStart: command.numberingStart };
      });
    }

    case "add-sequence": {
      const sequence = command.sequence;
      const width = document.sequences[0]?.residues.length ?? sequence.residues.length;
      if (
        !sequence.id || document.sequences.some((item) => item.id === sequence.id) ||
        !sequence.name.trim() || !/^[A-Z*?.-]*$/.test(sequence.residues) ||
        !Number.isInteger(sequence.numberingStart) || sequence.numberingStart < 0
      ) return document;
      const atIndex = Math.min(Math.max(0, command.atIndex ?? document.sequences.length), document.sequences.length);
      const sequences = [...document.sequences];
      sequences.splice(atIndex, 0, { ...sequence, name: sequence.name.trim(), residues: sequence.residues.padEnd(width, "-") });
      return { ...document, sequences: normalizeAlignment(sequences) };
    }

    case "delete-sequence": {
      if (document.sequences.length <= 1 || !document.sequences.some((sequence) => sequence.id === command.sequenceId)) return document;
      return { ...document, sequences: document.sequences.filter((sequence) => sequence.id !== command.sequenceId) };
    }

    case "move-sequence": {
      const fromIndex = document.sequences.findIndex(
        (sequence) => sequence.id === command.sequenceId,
      );
      if (fromIndex < 0) return document;
      const toIndex = Math.min(
        Math.max(0, command.toIndex),
        document.sequences.length - 1,
      );
      if (fromIndex === toIndex) return document;
      const sequences = [...document.sequences];
      const [sequence] = sequences.splice(fromIndex, 1);
      sequences.splice(toIndex, 0, sequence);
      return { ...document, sequences };
    }

    case "clear-all-gap-columns": {
      const width = document.sequences[0]?.residues.length ?? 0;
      const keptColumns = Array.from({ length: width }, (_, column) => column)
        .filter((column) => document.sequences.some((sequence) => sequence.residues[column] !== "-"));
      if (keptColumns.length === width) return document;
      return {
        ...document,
        sequences: document.sequences.map((sequence) => ({
          ...sequence,
          residues: keptColumns.map((column) => sequence.residues[column]).join(""),
        })),
        annotations: remapAnnotations(document.annotations, keptColumns),
      };
    }

    case "remove-duplicate-sequences": {
      const rawSequences = document.sequences.map((sequence) => sequence.residues.replace(/-/g, ""));
      const firstOccurrence = new Map<string, number>();
      rawSequences.forEach((raw, index) => { if (raw && !firstOccurrence.has(raw)) firstOccurrence.set(raw, index); });
      const survivors = document.sequences.filter((_, index) => {
        const raw = rawSequences[index];
        if (!raw) return true;
        if (firstOccurrence.get(raw) !== index) return false;
        return !command.includeFragments || !rawSequences.some(
          (candidate, candidateIndex) => candidateIndex !== index && candidate.length > raw.length && candidate.includes(raw),
        );
      });
      if (survivors.length === document.sequences.length) return document;
      return { ...document, sequences: survivors };
    }

    case "add-annotation": {
      const annotation = command.annotation;
      const valid = !document.annotations.some((item) => item.id === annotation.id) && validAnnotation(document, annotation);
      if (!valid) return document;
      return { ...document, annotations: [...document.annotations, annotation] };
    }

    case "update-annotation": {
      const annotation = command.annotation;
      const index = document.annotations.findIndex((item) => item.id === annotation.id);
      if (index < 0 || !validAnnotation(document, annotation)) return document;
      const current = document.annotations[index];
      if (JSON.stringify(current) === JSON.stringify(annotation)) return document;
      const annotations = [...document.annotations];
      annotations[index] = annotation;
      return { ...document, annotations };
    }

    case "delete-annotation": {
      if (!document.annotations.some((annotation) => annotation.id === command.annotationId)) return document;
      return {
        ...document,
        annotations: document.annotations.filter((annotation) => annotation.id !== command.annotationId),
      };
    }
  }
}
