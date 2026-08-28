import { describe, expect, it } from "vitest";
import { createDocumentHistory, documentHistoryReducer } from "./history";
import { AlignmentDocument } from "./model";

const document: AlignmentDocument = {
  format: "atlas-alignment",
  version: 1,
  id: "document-1",
  name: "History",
  annotations: [],
  sequences: [
    { id: "seq-a", name: "A", description: "", residues: "AC", numberingStart: 1 },
  ],
};

describe("documentHistoryReducer", () => {
  it("executes, undoes and redoes an edit", () => {
    const initial = createDocumentHistory(document);
    const edited = documentHistoryReducer(initial, {
      type: "execute",
      command: {
        type: "replace-residue",
        position: { sequenceId: "seq-a", column: 1 },
        residue: "G",
      },
    });
    const undone = documentHistoryReducer(edited, { type: "undo" });
    const redone = documentHistoryReducer(undone, { type: "redo" });

    expect(edited.present.sequences[0].residues).toBe("AG");
    expect(edited.dirty).toBe(true);
    expect(undone.present.sequences[0].residues).toBe("AC");
    expect(undone.dirty).toBe(false);
    expect(redone.present.sequences[0].residues).toBe("AG");
  });

  it("clears redo history after a new edit", () => {
    const edited = documentHistoryReducer(createDocumentHistory(document), {
      type: "execute",
      command: {
        type: "replace-residue",
        position: { sequenceId: "seq-a", column: 0 },
        residue: "G",
      },
    });
    const undone = documentHistoryReducer(edited, { type: "undo" });
    const branched = documentHistoryReducer(undone, {
      type: "execute",
      command: {
        type: "replace-residue",
        position: { sequenceId: "seq-a", column: 1 },
        residue: "T",
      },
    });

    expect(branched.future).toHaveLength(0);
    expect(branched.present.sequences[0].residues).toBe("AT");
  });

  it("tracks the saved snapshot when navigating through history", () => {
    const edited = documentHistoryReducer(createDocumentHistory(document), {
      type: "execute",
      command: {
        type: "replace-residue",
        position: { sequenceId: "seq-a", column: 0 },
        residue: "G",
      },
    });
    const saved = documentHistoryReducer(edited, { type: "mark-saved" });
    const beforeSave = documentHistoryReducer(saved, { type: "undo" });
    const backToSave = documentHistoryReducer(beforeSave, { type: "redo" });

    expect(saved.dirty).toBe(false);
    expect(beforeSave.dirty).toBe(true);
    expect(backToSave.dirty).toBe(false);
  });
});
