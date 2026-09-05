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

  it("updates a graphical annotation and rejects invalid geometry", () => {
    const original = document();
    const annotation = { id: "helix-1", kind: "helix" as const, start: 0, end: 2, lane: 0 as const, color: "#ef4444" };
    const added = applyAlignmentCommand(original, { type: "add-annotation", annotation });
    const updatedAnnotation = { ...annotation, start: 1, end: 3, color: "#22c55e" };
    const updated = applyAlignmentCommand(added, { type: "update-annotation", annotation: updatedAnnotation });
    const invalid = applyAlignmentCommand(updated, { type: "update-annotation", annotation: { ...updatedAnnotation, end: 99 } });
    expect(updated.annotations).toEqual([updatedAnnotation]);
    expect(added.annotations).toEqual([annotation]);
    expect(invalid).toBe(updated);
  });

  it("accepts beta-strand annotations", () => {
    const original = document();
    const annotation = { id: "strand-1", kind: "strand" as const, start: 0, end: 3, lane: 0 as const, color: "#2563eb" };
    expect(applyAlignmentCommand(original, { type: "add-annotation", annotation }).annotations).toEqual([annotation]);
  });

  it.each(["helix-alt", "strand-alt", "line", "dashed-line", "connector-up", "connector-down", "underline"] as const)("accepts %s annotations", (kind) => {
    const original = document();
    const annotation = { id: `${kind}-1`, kind, start: 0, end: 3, lane: 0 as const, color: "#111111" };
    expect(applyAlignmentCommand(original, { type: "add-annotation", annotation }).annotations).toEqual([annotation]);
  });

  it("rejects annotations outside the alignment", () => {
    const original = document();
    const result = applyAlignmentCommand(original, {
      type: "add-annotation",
      annotation: { id: "bad", kind: "coil", start: 2, end: 9, lane: 1, color: "#3b82f6" },
    });

    expect(result).toBe(original);
  });

  it("clears a rectangular region without shifting alignment columns", () => {
    const original = document();
    const result = applyAlignmentCommand(original, {
      type: "clear-region",
      range: { sequenceIds: ["seq-a", "seq-b"], start: 1, end: 2 },
    });
    expect(result.sequences.map((sequence) => sequence.residues)).toEqual(["A--D", "A--D"]);
    expect(original.sequences[1].residues).toBe("ACED");
  });

  it("deletes a region from selected rows and preserves the global annotation axis", () => {
    const original = document();
    original.annotations = [{ id: "helix", kind: "helix", start: 1, end: 3, lane: 0, color: "#ef4444" }];
    const result = applyAlignmentCommand(original, {
      type: "delete-region",
      range: { sequenceIds: ["seq-a"], start: 1, end: 2 },
    });
    expect(result.sequences.map((sequence) => sequence.residues)).toEqual(["AD--", "ACED"]);
    expect(result.annotations).toEqual(original.annotations);
  });

  it("remaps annotations when deleting columns from every row", () => {
    const original = document();
    original.annotations = [
      { id: "helix", kind: "helix", start: 1, end: 3, lane: 0, color: "#ef4444" },
      { id: "removed", kind: "coil", start: 1, end: 1, lane: 0, color: "#3b82f6" },
    ];
    const result = applyAlignmentCommand(original, {
      type: "delete-region",
      range: { sequenceIds: ["seq-a", "seq-b"], start: 1, end: 1 },
    });
    expect(result.sequences.map((sequence) => sequence.residues)).toEqual(["A-D", "AED"]);
    expect(result.annotations).toEqual([{ id: "helix", kind: "helix", start: 1, end: 2, lane: 0, color: "#ef4444" }]);
  });

  it("keeps a valid placeholder column when deleting the whole alignment", () => {
    const original = document();
    const result = applyAlignmentCommand(original, {
      type: "delete-region",
      range: { sequenceIds: ["seq-a", "seq-b"], start: 0, end: 3 },
    });
    expect(result.sequences.map((sequence) => sequence.residues)).toEqual(["-", "-"]);
  });

  it("adds, edits, moves, and deletes a sequence without mutating the input", () => {
    const original = document();
    const sequence = { id: "seq-c", name: " C ", description: "new", residues: "AC", numberingStart: 8 };
    const added = applyAlignmentCommand(original, { type: "add-sequence", sequence, atIndex: 1 });
    const edited = applyAlignmentCommand(added, {
      type: "update-sequence-properties",
      sequenceId: "seq-c",
      name: "Gamma",
      description: "edited",
      numberingStart: 12,
    });
    const moved = applyAlignmentCommand(edited, { type: "move-sequence", sequenceId: "seq-c", toIndex: 2 });
    const deleted = applyAlignmentCommand(moved, { type: "delete-sequence", sequenceId: "seq-c" });

    expect(original.sequences).toHaveLength(2);
    expect(added.sequences[1]).toMatchObject({ name: "C", residues: "AC--", numberingStart: 8 });
    expect(edited.sequences[1]).toMatchObject({ name: "Gamma", description: "edited", numberingStart: 12 });
    expect(moved.sequences[2].id).toBe("seq-c");
    expect(deleted.sequences.map((item) => item.id)).toEqual(["seq-a", "seq-b"]);
  });

  it("protects the final sequence and rejects invalid additions", () => {
    const single = { ...document(), sequences: [document().sequences[0]] };
    expect(applyAlignmentCommand(single, { type: "delete-sequence", sequenceId: "seq-a" })).toBe(single);
    expect(applyAlignmentCommand(single, {
      type: "add-sequence",
      sequence: { id: "bad", name: "", description: "", residues: "AC1", numberingStart: -1 },
    })).toBe(single);
  });

  it("removes all-gap columns and remaps graphical annotations", () => {
    const original = document();
    original.sequences[1].residues = "AC-D";
    original.annotations = [
      { id: "helix", kind: "helix", start: 1, end: 3, lane: 0, color: "#ef4444" },
      { id: "removed", kind: "coil", start: 2, end: 2, lane: 0, color: "#3b82f6" },
    ];
    const result = applyAlignmentCommand(original, { type: "clear-all-gap-columns" });

    expect(result.sequences.map((sequence) => sequence.residues)).toEqual(["ACD", "ACD"]);
    expect(result.annotations).toEqual([
      { id: "helix", kind: "helix", start: 1, end: 2, lane: 0, color: "#ef4444" },
    ]);
    expect(original.sequences[0].residues).toBe("AC-D");
  });

  it("removes duplicate ungapped sequences while keeping the first row", () => {
    const original = document();
    original.sequences.push({ id: "seq-c", name: "C", description: "", residues: "A-C-D", numberingStart: 1 });
    original.sequences = [
      { ...original.sequences[0], residues: "AC-D-" },
      { ...original.sequences[1], residues: "A-CD-" },
      original.sequences[2],
    ];
    const result = applyAlignmentCommand(original, { type: "remove-duplicate-sequences", includeFragments: false });
    expect(result.sequences.map((sequence) => sequence.id)).toEqual(["seq-a"]);
  });

  it("optionally removes sequences contained inside an earlier sequence", () => {
    const original = document();
    original.sequences = [
      { ...original.sequences[0], residues: "ACDEFG" },
      { ...original.sequences[1], residues: "--CDE-" },
    ];
    const duplicatesOnly = applyAlignmentCommand(original, { type: "remove-duplicate-sequences", includeFragments: false });
    const withFragments = applyAlignmentCommand(original, { type: "remove-duplicate-sequences", includeFragments: true });
    expect(duplicatesOnly.sequences).toHaveLength(2);
    expect(withFragments.sequences.map((sequence) => sequence.id)).toEqual(["seq-a"]);
  });

  it("removes a fragment even when it precedes the complete sequence", () => {
    const original = document();
    original.sequences = [
      { ...original.sequences[0], residues: "--CDE-" },
      { ...original.sequences[1], residues: "ACDEFG" },
    ];
    const result = applyAlignmentCommand(original, { type: "remove-duplicate-sequences", includeFragments: true });
    expect(result.sequences.map((sequence) => sequence.id)).toEqual(["seq-b"]);
  });
});
