import { normalizeAlignment } from "./alignment";
import { AlignmentDocument, CellPosition, Sequence } from "./model";

export type AlignmentCommand =
  | { type: "replace-residue"; position: CellPosition; residue: string }
  | { type: "insert-gap"; position: CellPosition }
  | { type: "delete-cell"; position: CellPosition }
  | { type: "rename-sequence"; sequenceId: string; name: string }
  | { type: "move-sequence"; sequenceId: string; toIndex: number };

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
  }
}

