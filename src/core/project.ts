import { normalizeAlignment, parseBlc, parseClustal, parseFasta, parseMsf, parsePir } from "./alignment";
import {
  AlignmentAnnotation,
  AlignmentDocument,
  AlignmentRegion,
  ATLAS_DOCUMENT_FORMAT,
  ATLAS_DOCUMENT_VERSION,
  createAlignmentDocument,
  createId,
  isAnnotationKind,
  isPointAnnotationKind,
  Sequence,
  TextAnnotation,
} from "./model";

export type OpenedAlignment = {
  document: AlignmentDocument;
  kind: "atlas" | "aline" | "fasta" | "clustal" | "msf" | "blc" | "pir";
  warnings: string[];
};

const VALID_RESIDUES = /^[A-Z*?.-]+$/;

function fileStem(filename: string): string {
  return filename.replace(/\.(atlas|aline|fasta|faa|fas|fa|seq|txt|aln|msf|blc|pir)$/i, "") || "Untitled alignment";
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} est absent ou invalide.`);
  return value;
}

function optionalZIndex(value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > Number.MAX_SAFE_INTEGER) throw new Error(`${label} invalide.`);
  return value as number;
}

export function serializeAtlasProject(document: AlignmentDocument): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function parseAtlasProject(source: string): AlignmentDocument {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error("Ce fichier .atlas n’est pas un JSON valide.");
  }

  if (!value || typeof value !== "object") throw new Error("Projet .atlas invalide.");
  const project = value as Record<string, unknown>;
  if (project.format !== ATLAS_DOCUMENT_FORMAT) throw new Error("Ce fichier n’est pas un projet Atlas Alignement.");
  if (project.version !== ATLAS_DOCUMENT_VERSION) throw new Error(`Version .atlas non prise en charge : ${String(project.version)}.`);
  if (!Array.isArray(project.sequences) || !project.sequences.length) throw new Error("Le projet .atlas ne contient aucune séquence.");

  const ids = new Set<string>();
  const sequences: Sequence[] = project.sequences.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Séquence ${index + 1} invalide.`);
    const sequence = item as Record<string, unknown>;
    const residues = requireString(sequence.residues, `Résidus de la séquence ${index + 1}`).toUpperCase();
    if (!VALID_RESIDUES.test(residues)) throw new Error(`Caractère invalide dans la séquence ${index + 1}.`);
    const id = requireString(sequence.id, `Identifiant de la séquence ${index + 1}`);
    if (ids.has(id)) throw new Error(`Identifiant de séquence dupliqué : ${id}.`);
    ids.add(id);
    const numberingStart = sequence.numberingStart;
    if (!Number.isInteger(numberingStart) || (numberingStart as number) < 0) {
      throw new Error(`Numérotation invalide pour la séquence ${index + 1}.`);
    }
    return {
      id,
      name: requireString(sequence.name, `Nom de la séquence ${index + 1}`),
      description: typeof sequence.description === "string" ? sequence.description : "",
      residues,
      numberingStart: numberingStart as number,
    };
  });
  const alignmentWidth = Math.max(...sequences.map((sequence) => sequence.residues.length));
  const rawAnnotations = project.annotations ?? [];
  if (!Array.isArray(rawAnnotations)) throw new Error("La liste d’annotations du projet .atlas est invalide.");
  const annotationIds = new Set<string>();
  const annotations: AlignmentAnnotation[] = rawAnnotations.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Annotation ${index + 1} invalide.`);
    const annotation = item as Record<string, unknown>;
    const id = requireString(annotation.id, `Identifiant de l’annotation ${index + 1}`);
    if (annotationIds.has(id)) throw new Error(`Identifiant d’annotation dupliqué : ${id}.`);
    annotationIds.add(id);
    if (!isAnnotationKind(annotation.kind)) throw new Error(`Type d’annotation ${index + 1} invalide.`);
    if (!Number.isInteger(annotation.start) || !Number.isInteger(annotation.end)) throw new Error(`Position de l’annotation ${index + 1} invalide.`);
    const start = annotation.start as number;
    const end = annotation.end as number;
    if (start < 0 || end < start || end >= alignmentWidth) throw new Error(`Étendue de l’annotation ${index + 1} invalide.`);
    if (isPointAnnotationKind(annotation.kind) && start !== end) throw new Error(`Le symbole ${index + 1} doit occuper une seule position.`);
    if (annotation.lane !== 0 && annotation.lane !== 1) throw new Error(`Piste de l’annotation ${index + 1} invalide.`);
    const color = requireString(annotation.color, `Couleur de l’annotation ${index + 1}`);
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`Couleur de l’annotation ${index + 1} invalide.`);
    const zIndex = optionalZIndex(annotation.zIndex, `Calque de l’annotation ${index + 1}`);
    return { id, kind: annotation.kind, start, end, lane: annotation.lane, color, ...(zIndex === undefined ? {} : { zIndex }) };
  });
  const rawRegions = project.regions ?? [];
  if (!Array.isArray(rawRegions)) throw new Error("La liste des régions du projet .atlas est invalide.");
  const regionIds = new Set<string>();
  const regions: AlignmentRegion[] = rawRegions.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Région ${index + 1} invalide.`);
    const region = item as Record<string, unknown>;
    const id = requireString(region.id, `Identifiant de la région ${index + 1}`);
    if (regionIds.has(id)) throw new Error(`Identifiant de région dupliqué : ${id}.`);
    regionIds.add(id);
    if (region.kind !== "box" && region.kind !== "rectangle") throw new Error(`Type de région ${index + 1} invalide.`);
    if (!Array.isArray(region.sequenceIds) || !region.sequenceIds.length || region.sequenceIds.some((entry) => typeof entry !== "string" || !ids.has(entry))) throw new Error(`Séquences de la région ${index + 1} invalides.`);
    const sequenceIds = region.sequenceIds as string[];
    if (new Set(sequenceIds).size !== sequenceIds.length) throw new Error(`Séquences dupliquées dans la région ${index + 1}.`);
    if (!Number.isInteger(region.start) || !Number.isInteger(region.end)) throw new Error(`Position de la région ${index + 1} invalide.`);
    const start = region.start as number;
    const end = region.end as number;
    if (start < 0 || end < start || end >= alignmentWidth) throw new Error(`Étendue de la région ${index + 1} invalide.`);
    const lineColor = requireString(region.lineColor, `Couleur de contour de la région ${index + 1}`);
    const fillColor = requireString(region.fillColor, `Couleur de remplissage de la région ${index + 1}`);
    if (!/^#[0-9a-f]{6}$/i.test(lineColor) || !/^#[0-9a-f]{6}$/i.test(fillColor)) throw new Error(`Couleur de la région ${index + 1} invalide.`);
    if (!Number.isInteger(region.lineWidth) || (region.lineWidth as number) < 0 || (region.lineWidth as number) > 12) throw new Error(`Épaisseur de la région ${index + 1} invalide.`);
    const zIndex = optionalZIndex(region.zIndex, `Calque de la région ${index + 1}`);
    return { id, kind: region.kind, sequenceIds, start, end, lineColor, fillColor, lineWidth: region.lineWidth as number, ...(zIndex === undefined ? {} : { zIndex }) };
  });
  const rawTextAnnotations = project.textAnnotations ?? [];
  if (!Array.isArray(rawTextAnnotations)) throw new Error("La liste des textes du projet .atlas est invalide.");
  const textIds = new Set<string>();
  const textAnnotations: TextAnnotation[] = rawTextAnnotations.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Texte ${index + 1} invalide.`);
    const annotation = item as Record<string, unknown>;
    const id = requireString(annotation.id, `Identifiant du texte ${index + 1}`);
    if (textIds.has(id)) throw new Error(`Identifiant de texte dupliqué : ${id}.`);
    textIds.add(id);
    if (annotation.kind !== "text" && annotation.kind !== "outline-text") throw new Error(`Type du texte ${index + 1} invalide.`);
    if (!Number.isInteger(annotation.column) || (annotation.column as number) < 0 || (annotation.column as number) >= alignmentWidth) throw new Error(`Position du texte ${index + 1} invalide.`);
    if (annotation.lane !== 0 && annotation.lane !== 1) throw new Error(`Piste du texte ${index + 1} invalide.`);
    const text = requireString(annotation.text, `Contenu du texte ${index + 1}`);
    if (text.length > 500) throw new Error(`Contenu du texte ${index + 1} trop long.`);
    const color = requireString(annotation.color, `Couleur du texte ${index + 1}`);
    const outlineColor = requireString(annotation.outlineColor, `Couleur de contour du texte ${index + 1}`);
    if (!/^#[0-9a-f]{6}$/i.test(color) || !/^#[0-9a-f]{6}$/i.test(outlineColor)) throw new Error(`Couleur du texte ${index + 1} invalide.`);
    if (!Number.isInteger(annotation.outlineWidth) || (annotation.outlineWidth as number) < 0 || (annotation.outlineWidth as number) > 8) throw new Error(`Contour du texte ${index + 1} invalide.`);
    const fontFamily = requireString(annotation.fontFamily, `Police du texte ${index + 1}`);
    if (!Number.isInteger(annotation.fontSize) || (annotation.fontSize as number) < 6 || (annotation.fontSize as number) > 96) throw new Error(`Taille du texte ${index + 1} invalide.`);
    if (annotation.fontWeight !== "normal" && annotation.fontWeight !== "bold") throw new Error(`Graisse du texte ${index + 1} invalide.`);
    if (typeof annotation.italic !== "boolean") throw new Error(`Style du texte ${index + 1} invalide.`);
    if (annotation.align !== "left" && annotation.align !== "center" && annotation.align !== "right") throw new Error(`Alignement du texte ${index + 1} invalide.`);
    const zIndex = optionalZIndex(annotation.zIndex, `Calque du texte ${index + 1}`);
    return { id, kind: annotation.kind, column: annotation.column as number, lane: annotation.lane, text, color, outlineColor, outlineWidth: annotation.outlineWidth as number, fontFamily, fontSize: annotation.fontSize as number, fontWeight: annotation.fontWeight, italic: annotation.italic, align: annotation.align, ...(zIndex === undefined ? {} : { zIndex }) };
  });

  return {
    format: ATLAS_DOCUMENT_FORMAT,
    version: ATLAS_DOCUMENT_VERSION,
    id: requireString(project.id, "Identifiant du projet"),
    name: requireString(project.name, "Nom du projet"),
    sequences: normalizeAlignment(sequences),
    annotations,
    regions,
    textAnnotations,
  };
}

export function parseLegacyAline(source: string, name = "Imported ALINE project"): OpenedAlignment {
  const separator = "\x03";
  const extension = "\x05";
  const header = /^Aline 1\.0 packed state R(\d+)[\r\n]+[^\r\n]*[\r\n]+/;
  const match = source.match(header);
  if (!match) throw new Error("Ce fichier ne correspond pas au format historique ALINE.");
  if (Number(match[1]) > 1) throw new Error(`Révision ALINE R${match[1]} non prise en charge.`);

  const lines = source.slice(match[0].length).split(/[\r\n]+/);
  lines.shift(); // paramètres globaux de l'ancien programme
  const textCache = new Map<string, Record<string, string>>();

  let line: string | undefined;
  while ((line = lines.shift()) !== extension) {
    if (line === undefined) throw new Error("Projet ALINE incomplet (dictionnaire de résidus).");
    const fields = line.split(separator);
    const key = fields.shift() ?? "";
    const attributes: Record<string, string> = {};
    while (fields.length > 1) attributes[fields.shift()!] = fields.shift()!;
    textCache.set(key, attributes);
  }
  while ((line = lines.shift()) !== extension) {
    if (line === undefined) throw new Error("Projet ALINE incomplet (dictionnaire d’objets).");
  }

  const sequences: Sequence[] = [];
  let graphicObjectCount = 0;
  while (lines.length && lines[0] !== extension) {
    const fields = (lines.shift() ?? "").split(separator);
    if (fields.length < 3) throw new Error("Enregistrement de séquence ALINE invalide.");
    const position = Number(fields.shift());
    const rawNumbering = fields.shift() ?? "u";
    const objectCount = Number(fields.shift());
    if (!Number.isInteger(objectCount) || objectCount < 0) throw new Error("Nombre d’objets ALINE invalide.");
    const title: Record<string, string> = {};
    while (fields.length > 1) title[fields.shift()!] = fields.shift()!;

    const properties = lines.shift();
    if (properties === undefined || !properties.startsWith(">")) throw new Error("Propriétés de séquence ALINE invalides.");
    let encoded = lines.shift();
    if (encoded === undefined) throw new Error("Séquence ALINE incomplète.");
    let residues = "";
    while (encoded.length > 1) {
      let key = encoded.slice(0, 2);
      encoded = encoded.slice(2);
      if (key[1] === extension) {
        const end = encoded.indexOf(extension);
        if (end < 0) throw new Error("Clé ALINE étendue invalide.");
        key += encoded.slice(0, end + 1);
        encoded = encoded.slice(end + 1);
      }
      const attributes = textCache.get(key);
      if (!attributes) throw new Error("Le projet ALINE référence un résidu inconnu.");
      residues += attributes.text ?? "";
      if (attributes.seqnumber === "2") {
        const end = encoded.indexOf(separator);
        if (end < 0) throw new Error("Numérotation ALINE invalide.");
        encoded = encoded.slice(end + 1);
      }
    }

    graphicObjectCount += objectCount;
    if (lines.length < objectCount * 3) throw new Error("Objets graphiques ALINE incomplets.");
    lines.splice(0, objectCount * 3);

    const sequenceName = title.text?.trim() ?? "";
    if (!sequenceName || sequenceName.startsWith("%%%")) continue;
    const normalizedResidues = residues.replace(/\s/g, "-").toUpperCase();
    if (!VALID_RESIDUES.test(normalizedResidues)) throw new Error(`Résidus non pris en charge dans ${sequenceName}.`);
    sequences.push({
      id: createId(),
      name: sequenceName,
      description: Number.isFinite(position) ? `Importé depuis ALINE (ligne ${position})` : "Importé depuis ALINE",
      residues: normalizedResidues,
      numberingStart: rawNumbering === "u" ? 1 : Number(rawNumbering),
    });
  }

  if (!sequences.length) throw new Error("Aucune séquence protéique trouvée dans ce projet ALINE.");
  const warnings = graphicObjectCount > 0
    ? [`${graphicObjectCount} objet(s) graphique(s) ALINE ne sont pas encore importés.`]
    : [];
  return { document: createAlignmentDocument(name, normalizeAlignment(sequences)), kind: "aline", warnings };
}

export function openAlignmentFile(source: string, filename: string): OpenedAlignment {
  const lowerName = filename.toLowerCase();
  const name = fileStem(filename);
  if (lowerName.endsWith(".atlas") || source.trimStart().startsWith("{")) {
    return { document: parseAtlasProject(source), kind: "atlas", warnings: [] };
  }
  if (lowerName.endsWith(".aline") || source.startsWith("Aline 1.0 packed state")) {
    return parseLegacyAline(source, name);
  }
  if (lowerName.endsWith(".aln") || /^\s*CLUSTAL(?:\s|$)/i.test(source)) {
    return { document: parseClustal(source, name), kind: "clustal", warnings: [] };
  }
  if (lowerName.endsWith(".msf") || /\bMSF\s*:/i.test(source.slice(0, 2000))) {
    return { document: parseMsf(source, name), kind: "msf", warnings: [] };
  }
  if (lowerName.endsWith(".pir") || /^>..;/m.test(source)) {
    return { document: parsePir(source, name), kind: "pir", warnings: [] };
  }
  if (lowerName.endsWith(".blc")) {
    return { document: parseBlc(source, name), kind: "blc", warnings: [] };
  }
  const trimmed = source.trim();
  const fastaSource = trimmed.startsWith(">") ? source : `>${name}\n${trimmed}`;
  return { document: parseFasta(fastaSource, name), kind: "fasta", warnings: [] };
}
