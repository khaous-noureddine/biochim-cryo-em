export type PaletteCategory = {
  threshold: number;
  fill: string;
  line: string;
  lineWidth: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontSlant: string;
  fontWeight: string;
};

export type ColourPalette = {
  name: string;
  categories: PaletteCategory[];
};

export function validateColourPalette(value: unknown): ColourPalette {
  if (!value || typeof value !== "object") throw new Error("Palette de projet invalide.");
  const palette = value as Record<string, unknown>;
  if (typeof palette.name !== "string" || !palette.name.trim() || !Array.isArray(palette.categories)) throw new Error("Palette de projet invalide.");
  const categories = palette.categories.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Catégorie de palette invalide.");
    const category = item as Record<string, unknown>;
    for (const key of ["fill", "line", "text"] as const) if (typeof category[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(category[key])) throw new Error("Couleur de palette invalide.");
    if (typeof category.threshold !== "number" || !Number.isFinite(category.threshold) || category.threshold < 0 || category.threshold > 1 || typeof category.lineWidth !== "number" || !Number.isFinite(category.lineWidth) || category.lineWidth < 0 || typeof category.fontSize !== "number" || !Number.isFinite(category.fontSize) || category.fontSize <= 0) throw new Error("Valeur de palette invalide.");
    for (const key of ["fontFamily", "fontSlant", "fontWeight"] as const) if (typeof category[key] !== "string") throw new Error("Police de palette invalide.");
    return category as PaletteCategory;
  });
  return { name: palette.name, categories: normalizePaletteCategories(categories) };
}

export function normalizePaletteCategories(categories: PaletteCategory[]): PaletteCategory[] {
  if (!categories.length) throw new Error("Une palette doit contenir au moins une catégorie.");
  const sorted = categories.map((category) => ({ ...category, threshold: Math.max(0, Math.min(1, category.threshold)) })).sort((left, right) => left.threshold - right.threshold);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].threshold === sorted[index - 1].threshold) throw new Error("Chaque seuil de palette doit être unique.");
  }
  return sorted;
}

export function appendPaletteCategory(categories: PaletteCategory[]): PaletteCategory[] {
  const sorted = normalizePaletteCategories(categories);
  let threshold = 1;
  for (let index = 0; index < sorted.length; index += 1) {
    const previous = index === 0 ? 0 : sorted[index - 1].threshold;
    if (sorted[index].threshold - previous > 0.001) {
      threshold = Number(((previous + sorted[index].threshold) / 2).toFixed(3));
      break;
    }
  }
  if (sorted.some((category) => category.threshold === threshold)) throw new Error("Aucun seuil supplémentaire ne peut être ajouté.");
  const template = sorted.find((category) => threshold <= category.threshold) ?? sorted.at(-1)!;
  return normalizePaletteCategories([...sorted, { ...template, threshold }]);
}

const CATEGORY_PATTERN = /\[\s*(\d*\.?\d+)\s*,\s*\[\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'?([\d.]+)'?\s*,\s*'([^']*)'\s*,\s*(\d+)\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\]\s*\]/g;

export const DEFAULT_GREYSCALE_PALETTE: ColourPalette = {
  name: "Greyscale",
  categories: Array.from({ length: 10 }, (_, index) => {
    const threshold = (index + 1) / 10;
    const channel = Math.round(255 * (1 - threshold));
    const fill = `#${channel.toString(16).padStart(2, "0").repeat(3)}`;
    return { threshold, fill, line: fill, lineWidth: 0, text: threshold >= 0.6 ? "#ffffff" : "#000000", fontSize: 12, fontFamily: "Helvetica", fontSlant: "R", fontWeight: "Bold" };
  }),
};

export function normalizeAlineColor(value: string): string {
  const color = value.trim().toLowerCase();
  if (/^#[0-9a-f]{12}$/.test(color)) {
    return `#${color.slice(1, 3)}${color.slice(5, 7)}${color.slice(9, 11)}`;
  }
  if (/^#[0-9a-f]{6}$/.test(color)) return color;
  if (color === "black" || color === "white") return color === "black" ? "#000000" : "#ffffff";
  const grey = color.match(/^gr(?:e|a)y(\d{1,3})$/);
  if (grey) {
    const channel = Math.round(255 * Math.max(0, Math.min(100, Number(grey[1]))) / 100);
    return `#${channel.toString(16).padStart(2, "0").repeat(3)}`;
  }
  throw new Error(`Couleur ALINE non prise en charge : ${value}`);
}

export function parseAlinePalette(source: string, filename = "palette.alc"): ColourPalette {
  if (!/@categories\s*=\s*\(/.test(source)) throw new Error("Ce fichier ne contient pas de palette ALINE valide.");
  const categories: PaletteCategory[] = [];
  for (const match of source.matchAll(CATEGORY_PATTERN)) {
    const threshold = Number(match[1]);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error("Seuil de palette ALINE invalide.");
    categories.push({
      threshold,
      fill: normalizeAlineColor(match[2]),
      line: normalizeAlineColor(match[3]),
      lineWidth: Number(match[4]),
      text: normalizeAlineColor(match[5]),
      fontSize: Number(match[6]),
      fontFamily: match[7],
      fontSlant: match[8],
      fontWeight: match[9],
    });
  }
  if (!categories.length) throw new Error("La palette ALINE ne contient aucune catégorie lisible.");
  return { name: filename.replace(/\.alc$/i, ""), categories: normalizePaletteCategories(categories) };
}

function toAlineColor(color: string): string {
  const normalized = normalizeAlineColor(color).slice(1);
  return `#${normalized.slice(0, 2).repeat(2)}${normalized.slice(2, 4).repeat(2)}${normalized.slice(4, 6).repeat(2)}`.toUpperCase();
}

export function serializeAlinePalette(palette: ColourPalette): string {
  const rows = [...palette.categories].sort((a, b) => a.threshold - b.threshold).map((category) =>
    `    [${category.threshold.toFixed(3)},['${toAlineColor(category.fill)}','${toAlineColor(category.line)}',${category.lineWidth},'${toAlineColor(category.text)}',${category.fontSize},'${category.fontFamily.replaceAll("'", "\\'")}','${category.fontSlant.replaceAll("'", "\\'")}','${category.fontWeight.replaceAll("'", "\\'")}']],`,
  );
  return `### Atlas Alignement\n### Colour scheme for alignments\n@categories=(\n${rows.join("\n")}\n);\n`;
}

export function paletteStyle(palette: ColourPalette, score: number): { backgroundColor: string; color: string } {
  const category = palette.categories.find((candidate) => score <= candidate.threshold) ?? palette.categories.at(-1);
  if (!category) return { backgroundColor: "#ffffff", color: "#000000" };
  return { backgroundColor: category.fill, color: category.text };
}

export function interpolateRgb(start: string, end: string, amount: number): string {
  const colors = [normalizeAlineColor(start), normalizeAlineColor(end)].map((color) => [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16)));
  return `#${colors[0].map((channel, index) => Math.round(channel + (colors[1][index] - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(color: string): [number, number, number] {
  const [red, green, blue] = [1, 3, 5].map((offset) => parseInt(normalizeAlineColor(color).slice(offset, offset + 2), 16) / 255);
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const lightness = (maximum + minimum) / 2;
  if (maximum === minimum) return [0, 0, lightness];
  const delta = maximum - minimum;
  const saturation = lightness < 0.5 ? delta / (maximum + minimum) : delta / (2 - maximum - minimum);
  const hueBase = maximum === red ? (green - blue) / delta : maximum === green ? 2 + (blue - red) / delta : 4 + (red - green) / delta;
  return [(hueBase / 6 + 1) % 1, saturation, lightness];
}

function hslToRgb([hue, saturation, lightness]: [number, number, number]): [number, number, number] {
  if (saturation === 0) return [lightness, lightness, lightness];
  const second = lightness < 0.5 ? lightness * (1 + saturation) : saturation + lightness * (1 - saturation);
  const first = 2 * lightness - second;
  const channel = (position: number) => {
    const value = (position + 1) % 1;
    if (value * 6 < 1) return first + (second - first) * value * 6;
    if (value * 2 < 1) return second;
    if (value * 3 < 2) return first + (second - first) * (2 / 3 - value) * 6;
    return first;
  };
  return [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)];
}

export function interpolateHsl(start: string, end: string, amount: number): string {
  const from = rgbToHsl(start);
  const to = rgbToHsl(end);
  const channels = hslToRgb(from.map((channel, index) => channel + (to[index] - channel) * amount) as [number, number, number]);
  return `#${channels.map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0")).join("")}`;
}

export type PaletteGradientOptions = {
  start: number;
  end: number;
  steps: number;
  startFill: string;
  endFill: string;
  startText: string;
  endText: string;
  mode: "rgb" | "hsl";
};

export function createPaletteGradient(options: PaletteGradientOptions): PaletteCategory[] {
  if (!Number.isFinite(options.start) || !Number.isFinite(options.end) || options.start < 0 || options.end > 1 || options.start >= options.end) throw new Error("Les bornes du gradient sont invalides.");
  if (!Number.isInteger(options.steps) || options.steps < 2 || options.steps > 100) throw new Error("Un gradient doit contenir entre 2 et 100 niveaux.");
  const interpolate = options.mode === "hsl" ? interpolateHsl : interpolateRgb;
  return Array.from({ length: options.steps }, (_, index) => {
    const amount = index / (options.steps - 1);
    const threshold = Number((options.start + (options.end - options.start) * amount).toFixed(6));
    const fill = interpolate(options.startFill, options.endFill, amount);
    return {
      threshold,
      fill,
      line: fill,
      lineWidth: 0,
      text: interpolate(options.startText, options.endText, amount),
      fontSize: 12,
      fontFamily: "Helvetica",
      fontSlant: "R",
      fontWeight: "Bold",
    };
  });
}
