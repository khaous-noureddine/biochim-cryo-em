import { normalizeAlignment } from "./alignment";
import { AlignmentAnnotation, AlignmentDocument, CellPosition, Sequence } from "./model";

export type AlignmentCommand =
  | { type: "replace-residue"; position: CellPosition; residue: string }
  | { type: "insert-gap"; position: CellPosition }
  | { type: "delete-cell"; position: CellPosition }
  | { type: "rename-sequence"; sequenceId: string; name: string }
  | { type: "move-sequence"; sequenceId: string; toIndex: number }
  | { type: "add-annotation"; annotation: AlignmentAnnotation }
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

    case "rename-sequence": {
      const name = command.name.trim();
      if (!name) return document;
      return updateSequence(document, command.sequenceId, (sequence) =>
        sequence.name === name ? sequence : { ...sequence, name },
      );
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

    case "add-annotation": {
      const annotation = command.annotation;
      const width = document.sequences[0]?.residues.length ?? 0;
      const valid =
        !document.annotations.some((item) => item.id === annotation.id) &&
        (annotation.kind === "helix" || annotation.kind === "coil") &&
        Number.isInteger(annotation.start) &&
        Number.isInteger(annotation.end) &&
        annotation.start >= 0 &&
        annotation.end >= annotation.start &&
        annotation.end < width &&
        (annotation.lane === 0 || annotation.lane === 1) &&
        /^#[0-9a-f]{6}$/i.test(annotation.color);
      if (!valid) return document;
      return { ...document, annotations: [...document.annotations, annotation] };
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
