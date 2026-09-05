import { describe, expect, it } from "vitest";
import { AlignmentDocument } from "./model";
import { moveCellSelection } from "./navigation";

const document: AlignmentDocument = {
  format: "atlas-alignment",
  version: 1,
  id: "navigation",
  name: "Navigation",
  annotations: [],
  sequences: [
    { id: "a", name: "A", description: "", residues: "ACD", numberingStart: 1 },
    { id: "b", name: "B", description: "", residues: "A--", numberingStart: 1 },
  ],
};

describe("moveCellSelection", () => {
  it("moves horizontally and clamps at row boundaries", () => {
    expect(moveCellSelection(document, { sequenceId: "a", column: 1 }, "left")).toEqual({ sequenceId: "a", column: 0 });
    expect(moveCellSelection(document, { sequenceId: "a", column: 2 }, "right")).toEqual({ sequenceId: "a", column: 2 });
    expect(moveCellSelection(document, { sequenceId: "a", column: 1 }, "row-start")).toEqual({ sequenceId: "a", column: 0 });
    expect(moveCellSelection(document, { sequenceId: "a", column: 1 }, "row-end")).toEqual({ sequenceId: "a", column: 2 });
  });

  it("moves vertically while keeping the alignment column", () => {
    expect(moveCellSelection(document, { sequenceId: "a", column: 2 }, "down")).toEqual({ sequenceId: "b", column: 2 });
    expect(moveCellSelection(document, { sequenceId: "b", column: 1 }, "up")).toEqual({ sequenceId: "a", column: 1 });
    expect(moveCellSelection(document, { sequenceId: "a", column: 1 }, "up")).toEqual({ sequenceId: "a", column: 1 });
  });

  it("leaves stale selections unchanged", () => {
    const stale = { sequenceId: "missing", column: 1 };
    expect(moveCellSelection(document, stale, "down")).toBe(stale);
  });
});
