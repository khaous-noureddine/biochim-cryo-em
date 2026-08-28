import { describe, expect, it } from "vitest";
import { applyAlignmentCommand } from "./commands";
import { AlignmentDocument } from "./model";

function document(): AlignmentDocument {
  return {
    format: "atlas-alignment",
    version: 1,
    id: "document-1",
    name: "Test alignment",
    annotations: [],
    sequences: [
      { id: "seq-a", name: "A", description: "", residues: "AC-D", numberingStart: 1 },
      { id: "seq-b", name: "B", description: "", residues: "ACED", numberingStart: 1 },
    ],
  };
}

describe("applyAlignmentCommand", () => {
  it("replaces a residue without mutating the original document", () => {
    const original = document();
    const result = applyAlignmentCommand(original, {
      type: "replace-residue",
      position: { sequenceId: "seq-a", column: 1 },
      residue: "g",
    });

    expect(result.sequences[0].residues).toBe("AG-D");
    expect(original.sequences[0].residues).toBe("AC-D");
  });

  it("inserts a gap and keeps all rows at the same width", () => {
    const result = applyAlignmentCommand(document(), {
      type: "insert-gap",
      position: { sequenceId: "seq-a", column: 2 },
    });

    expect(result.sequences[0].residues).toBe("AC--D");
    expect(result.sequences[1].residues).toBe("ACED-");
  });

  it("deletes a cell and pads the edited row back to alignment width", () => {
    const result = applyAlignmentCommand(document(), {
      type: "delete-cell",
      position: { sequenceId: "seq-b", column: 1 },
    });

    expect(result.sequences[1].residues).toBe("AED-");
    expect(result.sequences.every((sequence) => sequence.residues.length === 4)).toBe(true);
  });

  it("rejects an invalid residue", () => {
    const original = document();
    const result = applyAlignmentCommand(original, {
      type: "replace-residue",
      position: { sequenceId: "seq-a", column: 0 },
      residue: "1",
    });

    expect(result).toBe(original);
  });

  it("adds and deletes a graphical annotation without mutating the document", () => {
    const original = document();
    const annotation = { id: "helix-1", kind: "helix" as const, start: 1, end: 3, lane: 0 as const, color: "#ef4444" };
    const added = applyAlignmentCommand(original, { type: "add-annotation", annotation });
    const deleted = applyAlignmentCommand(added, { type: "delete-annotation", annotationId: annotation.id });

    expect(original.annotations).toEqual([]);
    expect(added.annotations).toEqual([annotation]);
    expect(deleted.annotations).toEqual([]);
  });

  it("rejects annotations outside the alignment", () => {
    const original = document();
    const result = applyAlignmentCommand(original, {
      type: "add-annotation",
      annotation: { id: "bad", kind: "coil", start: 2, end: 9, lane: 1, color: "#3b82f6" },
    });

    expect(result).toBe(original);
  });
});
