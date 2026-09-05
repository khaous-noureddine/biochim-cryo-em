import { AlignmentDocument, CellPosition } from "./model";

export type NavigationDirection = "left" | "right" | "up" | "down" | "row-start" | "row-end";

export function moveCellSelection(
  document: AlignmentDocument,
  selection: CellPosition,
  direction: NavigationDirection,
): CellPosition {
  const row = document.sequences.findIndex((sequence) => sequence.id === selection.sequenceId);
  if (row < 0) return selection;
  const width = document.sequences[row].residues.length;
  if (!width) return selection;

  if (direction === "left") return { ...selection, column: Math.max(0, selection.column - 1) };
  if (direction === "right") return { ...selection, column: Math.min(width - 1, selection.column + 1) };
  if (direction === "row-start") return { ...selection, column: 0 };
  if (direction === "row-end") return { ...selection, column: width - 1 };

  const targetRow = Math.min(
    document.sequences.length - 1,
    Math.max(0, row + (direction === "up" ? -1 : 1)),
  );
  return {
    sequenceId: document.sequences[targetRow].id,
    column: Math.min(selection.column, document.sequences[targetRow].residues.length - 1),
  };
}
