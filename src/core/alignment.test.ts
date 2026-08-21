import { describe, expect, it } from "vitest";
import { calculateConservation, parseFasta } from "./alignment";

describe("parseFasta", () => {
  it("creates a versioned Atlas document and pads shorter sequences", () => {
    const document = parseFasta(">alpha first\nACD\n>beta\nAC", "Example");

    expect(document.format).toBe("atlas-alignment");
    expect(document.version).toBe(1);
    expect(document.name).toBe("Example");
    expect(document.sequences[0].numberingStart).toBe(1);
    expect(document.sequences[1].residues).toBe("AC-");
  });

  it("calculates column conservation while ignoring gaps", () => {
    const document = parseFasta(">a\nAC-\n>b\nATG");
    expect(calculateConservation(document)).toEqual([1, 0.5, 1]);
  });
});

