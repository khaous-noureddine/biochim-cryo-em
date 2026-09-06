import { describe, expect, it } from "vitest";
import { appendPaletteCategory, interpolateHsl, interpolateRgb, normalizeAlineColor, normalizePaletteCategories, paletteStyle, parseAlinePalette, serializeAlinePalette } from "./palette";
import cyanToRed from "../../aline_011208/colourschemes/Cyan to Red (50 levels).alc?raw";
import greyscale from "../../aline_011208/colourschemes/Greyscale (10 levels).alc?raw";
import saturationBlue from "../../aline_011208/colourschemes/Saturation (Blue, 50 levels).alc?raw";
import saturationRed from "../../aline_011208/colourschemes/Saturation (Red, 50 levels).alc?raw";
import saturationYellow from "../../aline_011208/colourschemes/Saturation (Yellow, 50 levels).alc?raw";

describe("ALINE colour palettes", () => {
  it("reads the distributed greyscale palette safely", () => {
    const palette = parseAlinePalette(greyscale, "Greyscale (10 levels).alc");
    expect(palette.categories).toHaveLength(10);
    expect(palette.categories[0]).toMatchObject({ threshold: 0.1, fill: "#e6e6e6", text: "#000000" });
    expect(paletteStyle(palette, 0.75)).toEqual({ backgroundColor: "#333333", color: "#ffffff" });
  });

  it("reads every historical palette fixture", () => {
    for (const [filename, source] of [["Cyan to Red (50 levels).alc", cyanToRed], ["Saturation (Blue, 50 levels).alc", saturationBlue], ["Saturation (Red, 50 levels).alc", saturationRed], ["Saturation (Yellow, 50 levels).alc", saturationYellow]]) {
      expect(parseAlinePalette(source, filename).categories).toHaveLength(50);
    }
  });

  it("round-trips palettes through Atlas serialization", () => {
    const palette = parseAlinePalette("@categories=(\n[0.5,['grey50','grey50',0,'black',12,'Helvetica','R','Bold']],\n[1.0,['black','black',1,'white',14,'Arial','I','Normal']],\n);");
    expect(parseAlinePalette(serializeAlinePalette(palette)).categories).toEqual(palette.categories);
  });

  it("converts Tk colours and interpolates RGB channels", () => {
    expect(normalizeAlineColor("#FFFF00008080")).toBe("#ff0080");
    expect(interpolateRgb("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(interpolateHsl("#ff0000", "#00ff00", 0.5)).toBe("#ffff00");
  });

  it("rejects executable text without a palette", () => {
    expect(() => parseAlinePalette("system('danger')")).toThrow(/palette ALINE valide/);
  });

  it("sorts edited thresholds, rejects duplicates and inserts a category in a free interval", () => {
    const categories = parseAlinePalette("@categories=(\n[1.0,['black','black',0,'white',12,'Arial','R','Bold']],\n[0.5,['white','white',0,'black',12,'Arial','R','Bold']],\n);").categories;
    expect(normalizePaletteCategories(categories).map(({ threshold }) => threshold)).toEqual([0.5, 1]);
    expect(appendPaletteCategory(categories).map(({ threshold }) => threshold)).toEqual([0.25, 0.5, 1]);
    expect(() => normalizePaletteCategories([{ ...categories[0], threshold: 0.5 }, { ...categories[1], threshold: 0.5 }])).toThrow(/unique/);
  });
});
