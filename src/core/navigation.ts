import { AlignmentDocument, CellPosition, CellRange } from "./model";

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

export function normalizeCellRange(
  document: AlignmentDocument,
  anchor: CellPosition,
  focus: CellPosition,
): CellRange | null {
  const anchorRow = document.sequences.findIndex((sequence) => sequence.id === anchor.sequenceId);
  const focusRow = document.sequences.findIndex((sequence) => sequence.id === focus.sequenceId);
  if (anchorRow < 0 || focusRow < 0) return null;
  const firstRow = Math.min(anchorRow, focusRow);
  const lastRow = Math.max(anchorRow, focusRow);
  return {
    sequenceIds: document.sequences.slice(firstRow, lastRow + 1).map((sequence) => sequence.id),
    start: Math.min(anchor.column, focus.column),
    end: Math.max(anchor.column, focus.column),
  };
}
