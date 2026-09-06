import { ChangeEvent, KeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  calculateConservation,
  exportClustal,
  exportFasta,
  exportMsf,
  exportPir,
} from "./core/alignment";
import { documentHistoryReducer, createDocumentHistory } from "./core/history";
import { AnnotationKind, CellPosition, createId, isPointAnnotationKind, nextGraphicZIndex, POINT_ANNOTATION_KINDS, PointAnnotationKind, RegionKind, TextAnnotation } from "./core/model";
import { moveCellSelection, NavigationDirection, normalizeCellRange } from "./core/navigation";
import { openAlignmentFile, serializeAtlasProject } from "./core/project";
import {
  calculateAlscriptConservation,
  calculateSimilarityColors,
  DEFAULT_SIMILARITY_GROUPS,
  SimilarityOptions,
} from "./core/coloring";
import { demoAlignment } from "./data/demo";
import { appendPaletteCategory, ColourPalette, DEFAULT_GREYSCALE_PALETTE, normalizePaletteCategories, paletteStyle, parseAlinePalette, serializeAlinePalette } from "./core/palette";

const residueGroups: Record<string, string> = {
  A: "hydrophobic", V: "hydrophobic", I: "hydrophobic", L: "hydrophobic", M: "hydrophobic", F: "hydrophobic", W: "hydrophobic", Y: "hydrophobic",
  D: "acidic", E: "acidic",
  K: "basic", R: "basic", H: "basic",
  S: "polar", T: "polar", N: "polar", Q: "polar", C: "polar",
  G: "special", P: "special",
};

const POINT_SYMBOLS: Record<PointAnnotationKind, { label: string; glyph: string }> = {
  "triangle-up": { label: "Triangle up", glyph: "▲" },
  "triangle-down": { label: "Triangle down", glyph: "▼" },
  "triangle-up-small": { label: "Small triangle up", glyph: "▲" },
  "triangle-down-small": { label: "Small triangle down", glyph: "▼" },
  circle: { label: "Circle", glyph: "●" },
  star: { label: "Star", glyph: "★" },
  "hollow-star": { label: "Hollow star", glyph: "☆" },
  square: { label: "Square", glyph: "■" },
  diamond: { label: "Diamond", glyph: "◆" },
  "arrow-up": { label: "Arrow up", glyph: "↑" },
  "arrow-down": { label: "Arrow down", glyph: "↓" },
  "arrow-up-right": { label: "Right arrow up", glyph: "↑" },
  "arrow-down-right": { label: "Right arrow down", glyph: "↓" },
  "right-bar": { label: "Right bar", glyph: "▌" },
};

const MIN_SIDEBAR_WIDTH = 150;
const MAX_SIDEBAR_WIDTH = 420;

function clampSidebarWidth(width: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function readAlignmentFile(file: File): Promise<string> {
  if (!file.name.toLowerCase().endsWith(".aline")) return file.text();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let source = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    source += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return source;
}

function measureClassicNameWidth(names: string[], cellSize: number): number {
  const fallback = Math.max(1, ...names.map((name) => name.length)) * cellSize * 0.32;
  if (typeof document === "undefined") return fallback + cellSize * 0.5;
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return fallback + cellSize * 0.5;
  context.font = `italic 600 ${cellSize * 0.52}px "DM Mono", monospace`;
  const textWidth = Math.max(0, ...names.map((name) => context.measureText(name).width));
  return Math.ceil(textWidth + cellSize * 0.5 + 2);
}

function AnnotationShape({
  kind,
  left,
  length,
  total,
  color,
  zIndex,
  preview = false,
  selected = false,
  onSelect,
}: {
  kind: AnnotationKind;
  left: number;
  length: number;
  total: number;
  color: string;
  zIndex?: number;
  preview?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const style = {
    "--annotation-color": color,
    left: `${(left / total) * 100}%`,
    width: `${(length / total) * 100}%`,
    zIndex,
  } as React.CSSProperties;
  const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onSelect?.();
  };
  if (kind === "helix") {
    return <button type="button" aria-label="Select cylinder annotation" className={`annotation-shape helix-shape ${preview ? "preview" : ""} ${selected ? "selected" : ""}`} style={style} onClick={handleClick} />;
  }
  if (kind === "helix-alt") {
    const cycles = Math.max(1, Math.round(length / 2));
    const points = Array.from({ length: 81 }, (_, index) => {
      const progress = index / 80;
      return `${progress * 100},${10 + Math.sin(progress * cycles * Math.PI * 2) * 6}`;
    }).join(" ");
    return (
      <button type="button" aria-label="Select alternate helix annotation" className={`annotation-shape helix-alt-shape ${preview ? "preview" : ""} ${selected ? "selected" : ""}`} style={style} onClick={handleClick}>
        <svg className="helix-alt-art" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="7" vectorEffect="non-scaling-stroke" />
          <polyline points={points} fill="none" stroke="rgba(255,255,255,.38)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
      </button>
    );
  }
  if (kind === "strand") {
    return <button type="button" aria-label="Select beta strand annotation" className={`annotation-shape strand-shape ${preview ? "preview" : ""} ${selected ? "selected" : ""}`} style={style} onClick={handleClick} />;
  }
  if (kind === "strand-alt") {
    return <button type="button" aria-label="Select alternate beta strand annotation" className={`annotation-shape strand-alt-shape ${preview ? "preview" : ""} ${selected ? "selected" : ""}`} style={style} onClick={handleClick} />;
  }
  if (["line", "dashed-line", "connector-up", "connector-down", "underline"].includes(kind)) {
    return <button type="button" aria-label={`Select ${kind} annotation`} className={`annotation-shape ${kind}-shape ${preview ? "preview" : ""} ${selected ? "selected" : ""}`} style={style} onClick={handleClick} />;
  }
  if (isPointAnnotationKind(kind)) {
    return (
      <button type="button" aria-label={`Select ${POINT_SYMBOLS[kind].label} annotation`} className={`annotation-shape point-shape ${kind}-shape ${preview ? "preview" : ""} ${selected ? "selected" : ""}`} style={style} onClick={handleClick}>
        {POINT_SYMBOLS[kind].glyph}
      </button>
    );
  }
  const cycles = Math.max(1, Math.round(length / 2));
  const points = Array.from({ length: 61 }, (_, index) => {
    const progress = index / 60;
    return `${progress * 100},${10 + Math.sin(progress * cycles * Math.PI * 2) * 7}`;
  }).join(" ");
  return (
    <button type="button" aria-label="Select spring annotation" className={`annotation-shape coil-shape ${preview ? "preview" : ""} ${selected ? "selected" : ""}`} style={style} onClick={handleClick}>
      <svg className="coil-art" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
      </svg>
    </button>
  );
}

function TextAnnotationShape({ annotation, blockStart, blockWidth, selected, onSelect }: { annotation: TextAnnotation; blockStart: number; blockWidth: number; selected: boolean; onSelect: () => void }) {
  const alignTransform = annotation.align === "center" ? "translateX(-50%)" : annotation.align === "right" ? "translateX(-100%)" : "none";
  return (
    <button
      type="button"
      aria-label={`Select text annotation ${annotation.text}`}
      className={`text-annotation-shape ${annotation.kind} ${selected ? "selected" : ""}`}
      style={{
        "--text-outline-color": annotation.outlineColor,
        "--text-outline-width": `${annotation.kind === "outline-text" ? annotation.outlineWidth : 0}px`,
        left: `calc(${annotation.column - blockStart + 0.5} * var(--cell-size))`,
        color: annotation.color,
        fontFamily: annotation.fontFamily,
        fontSize: `${annotation.fontSize}px`,
        fontWeight: annotation.fontWeight,
        fontStyle: annotation.italic ? "italic" : "normal",
        transform: alignTransform,
        maxWidth: `calc(${blockWidth} * var(--cell-size))`,
        zIndex: annotation.zIndex,
      } as React.CSSProperties}
      onClick={(event) => { event.stopPropagation(); onSelect(); }}
    >
      {annotation.text}
    </button>
  );
}

function LayerControls({ objectId, onChange }: { objectId: string; onChange: (objectId: string, direction: "front" | "forward" | "backward" | "back") => void }) {
  return (
    <div className="layer-controls" aria-label="Layer order">
      <button type="button" title="Send to back" onClick={() => onChange(objectId, "back")}>⇤</button>
      <button type="button" title="Move backward" onClick={() => onChange(objectId, "backward")}>←</button>
      <button type="button" title="Move forward" onClick={() => onChange(objectId, "forward")}>→</button>
      <button type="button" title="Bring to front" onClick={() => onChange(objectId, "front")}>⇥</button>
    </div>
  );
}

export function App() {
  const [history, dispatch] = useReducer(
    documentHistoryReducer,
    demoAlignment,
    createDocumentHistory,
  );
  const alignment = history.present;
  const [scheme, setScheme] = useState<"residue" | "similarity" | "calcons" | "none">("none");
  const [similarityOptions, setSimilarityOptions] = useState<SimilarityOptions>({ cutoff: 0.5, groups: DEFAULT_SIMILARITY_GROUPS });
  const [similarityDialogOpen, setSimilarityDialogOpen] = useState(false);
  const [sequenceManagerOpen, setSequenceManagerOpen] = useState(false);
  const [colorExclusions, setColorExclusions] = useState<Set<string>>(() => new Set());
  const [manualForeground, setManualForeground] = useState("#111111");
  const [manualBackground, setManualBackground] = useState("#facc15");
  const [paletteEditorOpen, setPaletteEditorOpen] = useState(false);
  const [paletteDraft, setPaletteDraft] = useState<ColourPalette>(DEFAULT_GREYSCALE_PALETTE);
  const [viewMode, setViewMode] = useState<"modern" | "classic">("classic");
  const [repeatNames, setRepeatNames] = useState(true);
  const [classicWidths, setClassicWidths] = useState({ first: 60, continuation: 70 });
  const [sidebarWidth, setSidebarWidth] = useState(258);
  const [annotationTool, setAnnotationTool] = useState<AnnotationKind | null>(null);
  const [textTool, setTextTool] = useState<"text" | "outline-text" | null>(null);
  const [textDraft, setTextDraft] = useState("Annotation");
  const [textColor, setTextColor] = useState("#111111");
  const [textOutlineColor, setTextOutlineColor] = useState("#ffffff");
  const [annotationColor, setAnnotationColor] = useState("#ef4444");
  const [annotationStart, setAnnotationStart] = useState<number | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [regionLineColor, setRegionLineColor] = useState("#111111");
  const [regionFillColor, setRegionFillColor] = useState("#facc15");
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selection, setSelection] = useState<CellPosition | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<CellPosition | null>(null);
  const colourPalette = alignment.colourPalette ?? DEFAULT_GREYSCALE_PALETTE;
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const classicViewRef = useRef<HTMLDivElement>(null);
  const colorsMenuRef = useRef<HTMLDetailsElement>(null);
  const sidebarResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const conservation = useMemo(() => calculateConservation(alignment), [alignment]);
  const similarityColors = useMemo(
    () => calculateSimilarityColors(alignment, similarityOptions),
    [alignment, similarityOptions],
  );
  const alscriptConservation = useMemo(() => calculateAlscriptConservation(alignment), [alignment]);
  const cellStyleMap = useMemo(() => new Map(alignment.cellStyles.map((style) => [`${style.sequenceId}:${style.column}`, style])), [alignment.cellStyles]);
  const width = alignment.sequences[0]?.residues.length ?? 0;
  const selectedRange = useMemo(
    () => selection && selectionAnchor ? normalizeCellRange(alignment, selectionAnchor, selection) : null,
    [alignment, selection, selectionAnchor],
  );
  const selectedAnnotation = alignment.annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null;
  const selectedGraphicRegion = alignment.regions.find((region) => region.id === selectedRegionId) ?? null;
  const selectedTextAnnotation = alignment.textAnnotations.find((annotation) => annotation.id === selectedTextId) ?? null;
  const classicCellSize = 22 * zoom;
  const classicNameWidth = useMemo(
    () => measureClassicNameWidth(alignment.sequences.map((sequence) => sequence.name), classicCellSize),
    [alignment.sequences, classicCellSize],
  );
  const classicBlocks = useMemo(() => {
    const blocks: Array<{ start: number; length: number }> = [];
    let start = 0;
    while (start < width || blocks.length === 0) {
      const length = blocks.length === 0 || repeatNames
        ? classicWidths.first
        : classicWidths.continuation;
      blocks.push({ start, length });
      start += length;
    }
    return blocks;
  }, [width, repeatNames, classicWidths]);

  useEffect(() => {
    const view = classicViewRef.current;
    if (!view || viewMode !== "classic") return;

    const updateWidth = () => {
      const cellSize = classicCellSize;
      const sheetPaddingAndEndNumber = cellSize * 4.8 + 24;
      const usableCells = Math.floor((view.clientWidth - sheetPaddingAndEndNumber) / cellSize);
      setClassicWidths({
        first: Math.max(10, Math.floor(usableCells - classicNameWidth / cellSize)),
        continuation: Math.max(10, usableCells),
      });
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(view);
    return () => observer.disconnect();
  }, [viewMode, classicCellSize, classicNameWidth]);

  useEffect(() => {
    if (!selection) return;
    const frame = requestAnimationFrame(() => {
      const cell = [...(editorRef.current?.querySelectorAll<HTMLElement>("[data-sequence-id][data-column]") ?? [])]
        .find((candidate) => candidate.dataset.sequenceId === selection.sequenceId && Number(candidate.dataset.column) === selection.column);
      cell?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selection, viewMode]);

  async function openFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const opened = openAlignmentFile(await readAlignmentFile(file), file.name);
      dispatch({ type: "open", document: opened.document });
      setSelection(null);
      setSelectionAnchor(null);
      setAnnotationStart(null);
      setSelectedAnnotationId(null);
      setSelectedRegionId(null);
      setSelectedTextId(null);
      setColorExclusions(new Set());
      setScheme("none");
      setError("");
      const sourceLabel = opened.kind === "aline" ? "Projet ALINE importé" : opened.kind === "atlas" ? "Projet Atlas ouvert" : "Séquences importées";
      setNotice([sourceLabel, ...opened.warnings].join(" · "));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d’ouvrir ce fichier.");
      setNotice("");
    } finally {
      event.target.value = "";
    }
  }

  function editSelection(residue: string) {
    if (!selection) return;
    dispatch({ type: "execute", command: { type: "replace-residue", position: selection, residue } });
  }

  function selectCell(event: ReactMouseEvent<HTMLButtonElement>, position: CellPosition) {
    if (!event.shiftKey || !selectionAnchor) setSelectionAnchor(position);
    setSelection(position);
    const region = [...alignment.regions].sort((left, right) => (right.zIndex ?? 0) - (left.zIndex ?? 0)).find((candidate) => candidate.sequenceIds.includes(position.sequenceId) && position.column >= candidate.start && position.column <= candidate.end);
    setSelectedRegionId(region?.id ?? null);
    if (region) setSelectedAnnotationId(null);
    editorRef.current?.focus();
  }

  function regionCellAppearance(sequenceId: string, column: number): { className: string; style?: React.CSSProperties } {
    const region = [...alignment.regions].sort((left, right) => (right.zIndex ?? 0) - (left.zIndex ?? 0)).find((candidate) => candidate.sequenceIds.includes(sequenceId) && column >= candidate.start && column <= candidate.end);
    if (!region) return { className: "" };
    const orderedIds = alignment.sequences.map((sequence) => sequence.id).filter((id) => region.sequenceIds.includes(id));
    const edges = [
      column === region.start ? "region-left" : "",
      column === region.end ? "region-right" : "",
      sequenceId === orderedIds[0] ? "region-top" : "",
      sequenceId === orderedIds.at(-1) ? "region-bottom" : "",
    ].filter(Boolean).join(" ");
    return {
      className: `graphic-region ${region.kind}-region ${edges} ${region.id === selectedRegionId ? "selected-region" : ""}`,
      style: {
        "--region-line": region.lineColor,
        "--region-fill": region.fillColor,
        "--region-width": `${region.lineWidth}px`,
        zIndex: region.zIndex,
      } as React.CSSProperties,
    };
  }

  function cellIsInSelectedRange(sequenceId: string, column: number): boolean {
    return Boolean(selectedRange && selectedRange.sequenceIds.includes(sequenceId) && column >= selectedRange.start && column <= selectedRange.end);
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!selection) return;
    const navigationKeys: Partial<Record<string, NavigationDirection>> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      Home: "row-start",
      End: "row-end",
    };
    const direction = navigationKeys[event.key];
    if (direction) {
      event.preventDefault();
      const next = moveCellSelection(alignment, selection, direction);
      if (!event.shiftKey) setSelectionAnchor(next);
      setSelection(next);
      return;
    }
    if (/^[a-zA-Z*?.-]$/.test(event.key)) {
      event.preventDefault();
      editSelection(event.key);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      editSelection("-");
    }
  }

  function insertGap() {
    if (!selection) return;
    dispatch({ type: "execute", command: { type: "insert-gap", position: selection } });
  }

  function deleteCell() {
    if (!selection) return;
    dispatch({ type: "execute", command: { type: "delete-cell", position: selection } });
  }

  function applyRegionCommand(type: "clear-region" | "delete-region") {
    if (!selectedRange) return;
    dispatch({ type: "execute", command: { type, range: selectedRange } });
    const removedWidth = type === "delete-region" ? selectedRange.end - selectedRange.start + 1 : 0;
    const nextSelection = {
      sequenceId: selectedRange.sequenceIds[0],
      column: Math.min(selectedRange.start, Math.max(0, width - removedWidth - 1)),
    };
    setSelection(nextSelection);
    setSelectionAnchor(nextSelection);
  }

  function createGraphicRegion(kind: RegionKind) {
    if (!selectedRange) return;
    const id = createId();
    dispatch({
      type: "execute",
      command: {
        type: "add-region",
        region: {
          id,
          kind,
          sequenceIds: selectedRange.sequenceIds,
          start: selectedRange.start,
          end: selectedRange.end,
          lineColor: regionLineColor,
          fillColor: regionFillColor,
          lineWidth: 2,
          zIndex: nextGraphicZIndex(alignment),
        },
      },
    });
    setSelectedRegionId(id);
    setSelectedAnnotationId(null);
  }

  function changeObjectLayer(objectId: string, direction: "front" | "forward" | "backward" | "back") {
    dispatch({ type: "execute", command: { type: "change-object-layer", objectId, direction } });
  }

  function saveAtlasProject() {
    const safeName = alignment.name.replace(/[^a-z0-9._-]+/gi, "-") || "alignment";
    downloadFile(`${safeName}.atlas`, serializeAtlasProject(alignment), "application/json");
    dispatch({ type: "mark-saved" });
    setNotice("Projet .atlas enregistré");
  }

  function addBlankSequence() {
    const usedNames = new Set(alignment.sequences.map((sequence) => sequence.name));
    let suffix = alignment.sequences.length + 1;
    while (usedNames.has(`sequence-${suffix}`)) suffix += 1;
    dispatch({
      type: "execute",
      command: {
        type: "add-sequence",
        sequence: {
          id: createId(),
          name: `sequence-${suffix}`,
          description: "",
          residues: "-".repeat(width),
          numberingStart: 1,
        },
      },
    });
  }

  function deleteSequence(sequenceId: string) {
    dispatch({ type: "execute", command: { type: "delete-sequence", sequenceId } });
    if (selection?.sequenceId === sequenceId) setSelection(null);
    if (selectionAnchor?.sequenceId === sequenceId) setSelectionAnchor(null);
  }

  function applyColorScheme(nextScheme: "residue" | "similarity" | "calcons" | "none") {
    setScheme(nextScheme);
    setColorExclusions(new Set());
    colorsMenuRef.current?.removeAttribute("open");
  }

  function resetSelectedColor() {
    if (!selectedRange) return;
    dispatch({ type: "execute", command: { type: "clear-cell-style", range: selectedRange } });
    setColorExclusions((current) => {
      const next = new Set(current);
      for (const sequenceId of selectedRange.sequenceIds) for (let column = selectedRange.start; column <= selectedRange.end; column += 1) next.add(`${sequenceId}:${column}`);
      return next;
    });
    colorsMenuRef.current?.removeAttribute("open");
  }

  function resetAllColors() {
    if (width > 0) dispatch({ type: "execute", command: { type: "clear-cell-style", range: { sequenceIds: alignment.sequences.map((sequence) => sequence.id), start: 0, end: width - 1 } } });
    applyColorScheme("none");
  }

  function applyManualColors(mode: "foreground" | "background" | "both") {
    if (!selectedRange) return;
    dispatch({ type: "execute", command: { type: "set-cell-style", range: selectedRange, ...(mode === "background" ? {} : { foreground: manualForeground }), ...(mode === "foreground" ? {} : { background: manualBackground }) } });
    colorsMenuRef.current?.removeAttribute("open");
  }

  function openSimilarityDialog() {
    colorsMenuRef.current?.removeAttribute("open");
    setSimilarityDialogOpen(true);
  }

  async function openPalette(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const palette = parseAlinePalette(await file.text(), file.name);
      dispatch({ type: "execute", command: { type: "set-colour-palette", palette } });
      setNotice(`Palette ${palette.name} chargée (${palette.categories.length} niveaux)`);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d’ouvrir cette palette.");
    } finally {
      event.target.value = "";
      colorsMenuRef.current?.removeAttribute("open");
    }
  }

  function savePalette() {
    const safeName = colourPalette.name.replace(/[^a-z0-9._-]+/gi, "-") || "atlas-colours";
    downloadFile(`${safeName}.alc`, serializeAlinePalette(colourPalette), "text/plain");
    colorsMenuRef.current?.removeAttribute("open");
  }

  function openPaletteEditor() {
    setPaletteDraft({ ...colourPalette, categories: colourPalette.categories.map((category) => ({ ...category })) });
    setPaletteEditorOpen(true);
    colorsMenuRef.current?.removeAttribute("open");
  }

  function updatePaletteCategory(index: number, updates: Partial<ColourPalette["categories"][number]>) {
    setPaletteDraft((current) => ({ ...current, categories: current.categories.map((category, categoryIndex) => categoryIndex === index ? { ...category, ...updates } : category) }));
  }

  function applyPaletteDraft() {
    try {
      const categories = normalizePaletteCategories(paletteDraft.categories);
      dispatch({ type: "execute", command: { type: "set-colour-palette", palette: { name: paletteDraft.name.trim() || "Atlas colours", categories } } });
      setPaletteEditorOpen(false);
      setError("");
      setNotice(`Palette mise à jour (${categories.length} niveaux)`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Palette invalide.");
    }
  }

  function startSidebarResize(event: ReactPointerEvent<HTMLButtonElement>) {
    sidebarResizeRef.current = { startX: event.clientX, startWidth: sidebarWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resizeSidebar(event: ReactPointerEvent<HTMLButtonElement>) {
    const resize = sidebarResizeRef.current;
    if (!resize) return;
    setSidebarWidth(clampSidebarWidth(resize.startWidth + event.clientX - resize.startX));
  }

  function stopSidebarResize(event: ReactPointerEvent<HTMLButtonElement>) {
    sidebarResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resizeSidebarWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setSidebarWidth((current) => clampSidebarWidth(current + (event.key === "ArrowLeft" ? -12 : 12)));
  }

  function annotationColumn(event: ReactMouseEvent<HTMLDivElement>, blockStart: number, blockWidth: number): number {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = Math.floor((event.clientX - bounds.left) / classicCellSize);
    return Math.min(width - 1, blockStart + Math.max(0, Math.min(blockWidth - 1, offset)));
  }

  function selectAnnotationTool(tool: AnnotationKind) {
    setAnnotationTool((current) => current === tool ? null : tool);
    setAnnotationStart(null);
    setSelectedAnnotationId(null);
    setTextTool(null);
    setSelectedTextId(null);
  }

  function selectTextTool(tool: "text" | "outline-text") {
    setTextTool((current) => current === tool ? null : tool);
    setAnnotationTool(null);
    setAnnotationStart(null);
    setSelectedAnnotationId(null);
    setSelectedTextId(null);
  }

  function chooseAnnotationBoundary(event: ReactMouseEvent<HTMLDivElement>, blockStart: number, blockWidth: number, lane: 0 | 1) {
    if ((!annotationTool && !textTool) || width === 0) return;
    event.preventDefault();
    const column = annotationColumn(event, blockStart, blockWidth);
    if (textTool) {
      if (!textDraft.trim()) return;
      const id = createId();
      dispatch({ type: "execute", command: { type: "add-text-annotation", annotation: { id, kind: textTool, column, lane, text: textDraft.trim(), color: textColor, outlineColor: textOutlineColor, outlineWidth: textTool === "outline-text" ? 2 : 0, fontFamily: "Arial", fontSize: 14, fontWeight: "normal", italic: false, align: "center", zIndex: nextGraphicZIndex(alignment) } } });
      setSelectedTextId(id);
      setSelectedRegionId(null);
      return;
    }
    if (!annotationTool) return;
    if (isPointAnnotationKind(annotationTool)) {
      const id = createId();
      dispatch({
        type: "execute",
        command: {
          type: "add-annotation",
          annotation: { id, kind: annotationTool, start: column, end: column, lane: 0, color: annotationColor, zIndex: nextGraphicZIndex(alignment) },
        },
      });
      setSelectedAnnotationId(id);
      return;
    }
    if (annotationStart === null) {
      setAnnotationStart(column);
      return;
    }
    const start = Math.min(annotationStart, column);
    const end = Math.max(annotationStart, column);
    const id = createId();
    dispatch({
      type: "execute",
      command: {
        type: "add-annotation",
        annotation: { id, kind: annotationTool, start, end, lane: 0, color: annotationColor, zIndex: nextGraphicZIndex(alignment) },
      },
    });
    setAnnotationStart(null);
    setSelectedAnnotationId(id);
  }

  function cellColor(
    sequenceId: string,
    row: number,
    column: number,
    residue: string,
  ): { className: string; style?: React.CSSProperties } {
    let result: { className: string; style?: React.CSSProperties };
    if (scheme === "none" || colorExclusions.has(`${sequenceId}:${column}`)) result = { className: "none" };
    else if (scheme === "residue") result = { className: `residue ${residueGroups[residue] ?? "unknown"} aa-${residue}` };
    else {
      const strength = scheme === "similarity" ? similarityColors[row]?.[column] : alscriptConservation[column];
      if (strength === null || strength === undefined) result = { className: "none" };
      else {
        const displayStrength = strength >= 0.999 ? 1 : Math.floor(strength * 10) / 10;
        result = { className: scheme, style: { "--strength": displayStrength, "--foreground": paletteStyle(colourPalette, displayStrength).color, ...paletteStyle(colourPalette, displayStrength) } as React.CSSProperties };
      }
    }
    const manual = cellStyleMap.get(`${sequenceId}:${column}`);
    if (!manual) return result;
    return { className: `${result.className} manual-color`, style: { ...result.style, ...(manual.foreground ? { color: manual.foreground } : {}), ...(manual.background ? { backgroundColor: manual.background } : {}) } };
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div><strong>ATLAS</strong><small>Alignement</small></div>
        </div>
        <nav className="file-actions">
          <details className="top-menu" ref={colorsMenuRef}>
            <summary>Colors</summary>
            <div className="top-menu-popover" role="menu" aria-label="Color scheme">
              <button role="menuitemradio" aria-checked={scheme === "similarity"} onClick={openSimilarityDialog}>
                <span>By Similarity…</span><small>Threshold and amino-acid groups</small>
              </button>
              <button role="menuitemradio" aria-checked={scheme === "calcons"} onClick={() => applyColorScheme("calcons")}>
                <span>ALSCRIPT Calcons…</span><small>Biochemical-property conservation</small>
              </button>
              <button role="menuitemradio" aria-checked={scheme === "residue"} onClick={() => applyColorScheme("residue")}>
                <span>By Residue Type…</span><small>Colour amino-acid families</small>
              </button>
              <div className="menu-separator" />
              <div className="manual-color-controls">
                <label><span>Text</span><input type="color" value={manualForeground} onChange={(event) => setManualForeground(event.target.value)} /></label>
                <label><span>Background</span><input type="color" value={manualBackground} onChange={(event) => setManualBackground(event.target.value)} /></label>
                <div><button type="button" disabled={!selectedRange} onClick={() => applyManualColors("foreground")}>Text</button><button type="button" disabled={!selectedRange} onClick={() => applyManualColors("background")}>Background</button><button type="button" disabled={!selectedRange} onClick={() => applyManualColors("both")}>Both</button></div>
                <small>Apply custom colours to the selected cells</small>
              </div>
              <div className="menu-separator" />
              <button role="menuitem" disabled={!selectedRange} onClick={resetSelectedColor}>
                <span>Reset…</span><small>Remove colouring from selected cells</small>
              </button>
              <button role="menuitem" onClick={resetAllColors}>
                <span>Reset all</span><small>Return to monochrome</small>
              </button>
              <div className="menu-separator" />
              <button role="menuitem" onClick={openPaletteEditor}>
                <span>Edit Colour Scheme…</span><small>Thresholds, backgrounds and text colours</small>
              </button>
              <button role="menuitem" onClick={() => paletteInputRef.current?.click()}>
                <span>Load Colour Scheme…</span><small>{colourPalette.name} · {colourPalette.categories.length} levels</small>
              </button>
              <button role="menuitem" onClick={savePalette}>
                <span>Save Colour Scheme…</span><small>Export an ALINE-compatible .alc file</small>
              </button>
              <input ref={paletteInputRef} type="file" accept=".alc" hidden onChange={openPalette} />
            </div>
          </details>
          <details className="top-menu">
            <summary>Tools</summary>
            <div className="top-menu-popover" role="menu" aria-label="Alignment tools">
              <button role="menuitem" onClick={() => dispatch({ type: "execute", command: { type: "clear-all-gap-columns" } })}>
                <span>Clear all-gap columns</span><small>Remove columns containing only gaps</small>
              </button>
              <button role="menuitem" onClick={() => dispatch({ type: "execute", command: { type: "remove-duplicate-sequences", includeFragments: false } })}>
                <span>Remove duplicate sequences</span><small>Keep the first identical ungapped sequence</small>
              </button>
              <button role="menuitem" onClick={() => dispatch({ type: "execute", command: { type: "remove-duplicate-sequences", includeFragments: true } })}>
                <span>Remove dupes and fragments</span><small>Also remove sequences contained in earlier rows</small>
              </button>
            </div>
          </details>
          <button className="primary" onClick={() => inputRef.current?.click()}>Open file</button>
          <input ref={inputRef} type="file" accept=".atlas,.aline,.fa,.fasta,.fas,.faa,.seq,.txt,.aln,.msf,.blc,.pir" hidden onChange={openFile} />
          <button onClick={saveAtlasProject}>Save .atlas</button>
          <details className="top-menu">
            <summary>Export</summary>
            <div className="top-menu-popover" role="menu" aria-label="Export alignment">
              <button role="menuitem" onClick={() => downloadFile(`${alignment.name}.fasta`, exportFasta(alignment), "text/plain")}><span>FASTA</span><small>Aligned protein sequences</small></button>
              <button role="menuitem" onClick={() => downloadFile(`${alignment.name}.pir`, exportPir(alignment), "text/plain")}><span>PIR</span><small>NBRF/PIR sequence format</small></button>
              <button role="menuitem" onClick={() => downloadFile(`${alignment.name}.msf`, exportMsf(alignment), "text/plain")}><span>MSF</span><small>GCG multiple sequence format</small></button>
              <button role="menuitem" onClick={() => downloadFile(`${alignment.name}.aln`, exportClustal(alignment), "text/plain")}><span>ClustalW ALN</span><small>Interleaved alignment format</small></button>
            </div>
          </details>
        </nav>
      </header>

      <section
        className="workspace"
        style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}
      >
        <aside className="sidebar">
          <div className="document-heading">
            <span className="eyebrow">Alignment</span>
            <h1>{alignment.name}{history.dirty ? " •" : ""}</h1>
            <p>{alignment.sequences.length} sequences · {width} positions</p>
            <button className="manage-sequences" onClick={() => setSequenceManagerOpen(true)}>Manage sequences</button>
          </div>

          <div className="panel-section stats">
            <label>Overview</label>
            <div><span>Mean conservation</span><strong>{Math.round((conservation.reduce((a, b) => a + b, 0) / Math.max(1, conservation.length)) * 100)}%</strong></div>
            <div><span>Gaps</span><strong>{alignment.sequences.reduce((sum, s) => sum + (s.residues.match(/-/g)?.length ?? 0), 0)}</strong></div>
          </div>

          <div className="panel-section annotation-tools">
            <label>Draw</label>
            <div className="shape-tools">
              <button className={annotationTool === "helix" ? "active" : ""} onClick={() => selectAnnotationTool("helix")}>
                <span className="tool-icon cylinder-icon" />
                <span>Cylinder</span>
              </button>
              <button className={annotationTool === "helix-alt" ? "active" : ""} onClick={() => selectAnnotationTool("helix-alt")}>
                <span className="tool-icon helix-alt-icon" />
                <span>Helix ribbon</span>
              </button>
              <button className={annotationTool === "strand" ? "active" : ""} onClick={() => selectAnnotationTool("strand")}>
                <span className="tool-icon strand-icon" />
                <span>Beta strand</span>
              </button>
              <button className={annotationTool === "strand-alt" ? "active" : ""} onClick={() => selectAnnotationTool("strand-alt")}>
                <span className="tool-icon strand-alt-icon" />
                <span>Strand ribbon</span>
              </button>
              <button className={annotationTool === "coil" ? "active" : ""} onClick={() => selectAnnotationTool("coil")}>
                <svg className="tool-icon spring-icon" viewBox="0 0 44 16" aria-hidden="true">
                  <path d="M1 8 C4 1 7 1 10 8 S16 15 19 8 S25 1 28 8 S34 15 37 8 S41 1 43 8" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Spring</span>
              </button>
              <button className={annotationTool === "line" ? "active" : ""} onClick={() => selectAnnotationTool("line")}>
                <span className="tool-icon line-icon" />
                <span>Line</span>
              </button>
              <button className={annotationTool === "dashed-line" ? "active" : ""} onClick={() => selectAnnotationTool("dashed-line")}>
                <span className="tool-icon dashed-line-icon" />
                <span>Dashed</span>
              </button>
              <button className={annotationTool === "connector-up" ? "active" : ""} onClick={() => selectAnnotationTool("connector-up")}>
                <span className="tool-icon connector-up-icon" />
                <span>Connect up</span>
              </button>
              <button className={annotationTool === "connector-down" ? "active" : ""} onClick={() => selectAnnotationTool("connector-down")}>
                <span className="tool-icon connector-down-icon" />
                <span>Connect down</span>
              </button>
              <button className={annotationTool === "underline" ? "active" : ""} onClick={() => selectAnnotationTool("underline")}>
                <span className="tool-icon underline-icon" />
                <span>Underline</span>
              </button>
            </div>
            <label className="symbol-picker">
              <span>Point symbol</span>
              <select value={isPointAnnotationKind(annotationTool) ? annotationTool : ""} onChange={(event) => {
                if (isPointAnnotationKind(event.target.value)) selectAnnotationTool(event.target.value);
              }}>
                <option value="">Choose…</option>
                {POINT_ANNOTATION_KINDS.map((kind) => <option value={kind} key={kind}>{POINT_SYMBOLS[kind].glyph} {POINT_SYMBOLS[kind].label}</option>)}
              </select>
            </label>
            <div className="text-tool-editor">
              <label><span>Annotation text</span><input className="text-field" value={textDraft} maxLength={500} onChange={(event) => setTextDraft(event.target.value)} /></label>
              <div className="shape-tools">
                <button type="button" className={textTool === "text" ? "active" : ""} disabled={!textDraft.trim()} onClick={() => selectTextTool("text")}><span className="text-tool-icon">T</span><span>Text</span></button>
                <button type="button" className={textTool === "outline-text" ? "active" : ""} disabled={!textDraft.trim()} onClick={() => selectTextTool("outline-text")}><span className="text-tool-icon outline">T</span><span>Outline text</span></button>
              </div>
              <label className="annotation-color"><span>Text color</span><input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} /></label>
              <label className="annotation-color"><span>Text outline</span><input type="color" value={textOutlineColor} onChange={(event) => setTextOutlineColor(event.target.value)} /></label>
            </div>
            <label className="annotation-color">
              <span>Shape color</span>
              <input type="color" value={annotationColor} onChange={(event) => setAnnotationColor(event.target.value)} />
            </label>
            <p>{annotationTool
              ? annotationStart === null
                ? isPointAnnotationKind(annotationTool) ? "Click one cell on the second line." : "Click the start cell on the second line."
                : `Start: ${annotationStart + 1}. Click the end cell.`
              : "Choose a shape, then select its start and end above the alignment."}</p>
          </div>
          {selectedAnnotation && (
            <div className="panel-section annotation-properties">
              <label>Selected shape</label>
              <div className="annotation-position-fields">
                <label><span>Start</span><input type="number" min="1" max={selectedAnnotation.end + 1} value={selectedAnnotation.start + 1} onChange={(event) => dispatch({ type: "execute", command: { type: "update-annotation", annotation: { ...selectedAnnotation, start: Math.max(0, Math.min(selectedAnnotation.end, Number(event.target.value) - 1)) } } })} /></label>
                <label><span>End</span><input type="number" min={selectedAnnotation.start + 1} max={width} value={selectedAnnotation.end + 1} onChange={(event) => dispatch({ type: "execute", command: { type: "update-annotation", annotation: { ...selectedAnnotation, end: Math.max(selectedAnnotation.start, Math.min(width - 1, Number(event.target.value) - 1)) } } })} /></label>
              </div>
              <label className="annotation-color"><span>Shape color</span><input type="color" value={selectedAnnotation.color} onChange={(event) => dispatch({ type: "execute", command: { type: "update-annotation", annotation: { ...selectedAnnotation, color: event.target.value } } })} /></label>
              <LayerControls objectId={selectedAnnotation.id} onChange={changeObjectLayer} />
              <button className="danger-button annotation-delete" type="button" onClick={() => {
                dispatch({ type: "execute", command: { type: "delete-annotation", annotationId: selectedAnnotation.id } });
                setSelectedAnnotationId(null);
              }}>Delete shape</button>
            </div>
          )}
          <div className="panel-section region-tools">
            <label>Regions</label>
            <div className="shape-tools">
              <button type="button" disabled={!selectedRange} onClick={() => createGraphicRegion("box")}><span className="tool-icon box-icon" /><span>Filled box</span></button>
              <button type="button" disabled={!selectedRange} onClick={() => createGraphicRegion("rectangle")}><span className="tool-icon rectangle-icon" /><span>Rectangle</span></button>
            </div>
            <label className="annotation-color"><span>Outline</span><input type="color" value={regionLineColor} onChange={(event) => setRegionLineColor(event.target.value)} /></label>
            <label className="annotation-color"><span>Fill</span><input type="color" value={regionFillColor} onChange={(event) => setRegionFillColor(event.target.value)} /></label>
            <p>Select a rectangle of residues with Shift, then create a region.</p>
          </div>
          {selectedGraphicRegion && (
            <div className="panel-section annotation-properties">
              <label>Selected region</label>
              <div className="annotation-position-fields">
                <label><span>Start</span><input type="number" min="1" max={selectedGraphicRegion.end + 1} value={selectedGraphicRegion.start + 1} onChange={(event) => dispatch({ type: "execute", command: { type: "update-region", region: { ...selectedGraphicRegion, start: Math.max(0, Math.min(selectedGraphicRegion.end, Number(event.target.value) - 1)) } } })} /></label>
                <label><span>End</span><input type="number" min={selectedGraphicRegion.start + 1} max={width} value={selectedGraphicRegion.end + 1} onChange={(event) => dispatch({ type: "execute", command: { type: "update-region", region: { ...selectedGraphicRegion, end: Math.max(selectedGraphicRegion.start, Math.min(width - 1, Number(event.target.value) - 1)) } } })} /></label>
              </div>
              <label className="annotation-color"><span>Outline</span><input type="color" value={selectedGraphicRegion.lineColor} onChange={(event) => dispatch({ type: "execute", command: { type: "update-region", region: { ...selectedGraphicRegion, lineColor: event.target.value } } })} /></label>
              <label className="annotation-color"><span>Fill</span><input type="color" value={selectedGraphicRegion.fillColor} onChange={(event) => dispatch({ type: "execute", command: { type: "update-region", region: { ...selectedGraphicRegion, fillColor: event.target.value } } })} /></label>
              <label className="region-width"><span>Line width</span><input type="number" min="0" max="12" value={selectedGraphicRegion.lineWidth} onChange={(event) => dispatch({ type: "execute", command: { type: "update-region", region: { ...selectedGraphicRegion, lineWidth: Math.max(0, Math.min(12, Number(event.target.value))) } } })} /></label>
              <LayerControls objectId={selectedGraphicRegion.id} onChange={changeObjectLayer} />
              <button className="danger-button annotation-delete" type="button" onClick={() => {
                dispatch({ type: "execute", command: { type: "delete-graphic-region", regionId: selectedGraphicRegion.id } });
                setSelectedRegionId(null);
              }}>Delete region</button>
            </div>
          )}
          {selectedTextAnnotation && (
            <div className="panel-section annotation-properties">
              <label>Selected text</label>
              <input className="text-field" value={selectedTextAnnotation.text} maxLength={500} onChange={(event) => dispatch({ type: "execute", command: { type: "update-text-annotation", annotation: { ...selectedTextAnnotation, text: event.target.value } } })} />
              <div className="annotation-position-fields">
                <label><span>Position</span><input type="number" min="1" max={width} value={selectedTextAnnotation.column + 1} onChange={(event) => dispatch({ type: "execute", command: { type: "update-text-annotation", annotation: { ...selectedTextAnnotation, column: Math.max(0, Math.min(width - 1, Number(event.target.value) - 1)) } } })} /></label>
                <label><span>Size</span><input type="number" min="6" max="96" value={selectedTextAnnotation.fontSize} onChange={(event) => dispatch({ type: "execute", command: { type: "update-text-annotation", annotation: { ...selectedTextAnnotation, fontSize: Math.max(6, Math.min(96, Number(event.target.value))) } } })} /></label>
              </div>
              <label className="annotation-color"><span>Color</span><input type="color" value={selectedTextAnnotation.color} onChange={(event) => dispatch({ type: "execute", command: { type: "update-text-annotation", annotation: { ...selectedTextAnnotation, color: event.target.value } } })} /></label>
              <label className="annotation-color"><span>Outline</span><input type="color" value={selectedTextAnnotation.outlineColor} onChange={(event) => dispatch({ type: "execute", command: { type: "update-text-annotation", annotation: { ...selectedTextAnnotation, outlineColor: event.target.value } } })} /></label>
              <div className="text-style-row">
                <select aria-label="Text alignment" value={selectedTextAnnotation.align} onChange={(event) => dispatch({ type: "execute", command: { type: "update-text-annotation", annotation: { ...selectedTextAnnotation, align: event.target.value as TextAnnotation["align"] } } })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
                <button type="button" className={selectedTextAnnotation.fontWeight === "bold" ? "active" : ""} onClick={() => dispatch({ type: "execute", command: { type: "update-text-annotation", annotation: { ...selectedTextAnnotation, fontWeight: selectedTextAnnotation.fontWeight === "bold" ? "normal" : "bold" } } })}>Bold</button>
                <button type="button" className={selectedTextAnnotation.italic ? "active" : ""} onClick={() => dispatch({ type: "execute", command: { type: "update-text-annotation", annotation: { ...selectedTextAnnotation, italic: !selectedTextAnnotation.italic } } })}>Italic</button>
              </div>
              <LayerControls objectId={selectedTextAnnotation.id} onChange={changeObjectLayer} />
              <button className="danger-button annotation-delete" type="button" onClick={() => { dispatch({ type: "execute", command: { type: "delete-text-annotation", annotationId: selectedTextAnnotation.id } }); setSelectedTextId(null); }}>Delete text</button>
            </div>
          )}
        </aside>

        <button
          type="button"
          className="sidebar-resizer"
          role="separator"
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          aria-valuemin={MIN_SIDEBAR_WIDTH}
          aria-valuemax={MAX_SIDEBAR_WIDTH}
          aria-valuenow={sidebarWidth}
          title="Drag to resize the sidebar"
          onPointerDown={startSidebarResize}
          onPointerMove={resizeSidebar}
          onPointerUp={stopSidebarResize}
          onPointerCancel={stopSidebarResize}
          onKeyDown={resizeSidebarWithKeyboard}
        />

        <section
          className="editor-card"
          ref={editorRef}
          tabIndex={0}
          onKeyDown={handleEditorKeyDown}
        >
          <div className="editor-toolbar">
            <div>
              <span className="status-dot" />
              {selectedRange && (selectedRange.sequenceIds.length > 1 || selectedRange.start !== selectedRange.end)
                ? `Region · ${selectedRange.sequenceIds.length} rows × ${selectedRange.end - selectedRange.start + 1} columns`
                : selection ? `Selected · ${selection.column + 1}` : "Ready"}
              {notice && <span className="notice">{notice}</span>}
              {error && <span className="error">{error}</span>}
            </div>
            <div className="view-switch" aria-label="Alignment view">
              <button
                className={viewMode === "modern" ? "active" : ""}
                onClick={() => setViewMode("modern")}
              >
                Modern
              </button>
              <button
                className={viewMode === "classic" ? "active" : ""}
                onClick={() => setViewMode("classic")}
              >
                Classic ALINE
              </button>
            </div>
            <div className="edit-actions">
              <button disabled={!history.past.length} onClick={() => dispatch({ type: "undo" })}>Undo</button>
              <button disabled={!history.future.length} onClick={() => dispatch({ type: "redo" })}>Redo</button>
              <span className="toolbar-separator" />
              <button disabled={!selection} onClick={insertGap}>Insert gap</button>
              <button disabled={!selection} onClick={deleteCell}>Delete cell</button>
              <button disabled={!selectedRange} onClick={() => applyRegionCommand("clear-region")}>Clear region</button>
              <button disabled={!selectedRange} onClick={() => applyRegionCommand("delete-region")}>Delete region</button>
            </div>
            <div className="zoom-control">
              {viewMode === "classic" && (
                <label className="name-display">
                  Names
                  <select value={repeatNames ? "all" : "first"} onChange={(event) => setRepeatNames(event.target.value === "all")}>
                    <option value="all">Every block</option>
                    <option value="first">First block only</option>
                  </select>
                </label>
              )}
              {viewMode === "classic" && (
                <span className="block-width">
                  Auto · {repeatNames ? classicWidths.first : `${classicWidths.first}/${classicWidths.continuation}`} positions
                </span>
              )}
              <span>{viewMode === "classic" ? "Cell size" : "Zoom"}</span>
              <input type="range" min="0.55" max="1.5" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              <b>{Math.round(zoom * 100)}%</b>
            </div>
          </div>

          {viewMode === "modern" ? (
            <div className="alignment-scroll modern-view">
              <div className="alignment-grid" style={{ "--cell-size": `${28 * zoom}px` } as React.CSSProperties}>
              <div className="corner" />
              <div className="ruler">
                {Array.from({ length: width }, (_, index) => <span key={index}>{(index + 1) % 10 === 0 ? index + 1 : "·"}</span>)}
              </div>
              {alignment.sequences.map((sequence, row) => (
                <div className="sequence-row" key={sequence.id}>
                  <div className="sequence-name" title={sequence.description}>
                    <strong>{sequence.name}</strong><small>{sequence.description}</small>
                  </div>
                  <div className="residues">
                    {[...sequence.residues].map((residue, column) => {
                      const color = cellColor(sequence.id, row, column, residue);
                      const selected = selection?.sequenceId === sequence.id && selection.column === column;
                      const inSelectedRange = cellIsInSelectedRange(sequence.id, column);
                      const region = regionCellAppearance(sequence.id, column);
                      return (
                        <button
                          key={column}
                          data-sequence-id={sequence.id}
                          data-column={column}
                          className={`residue ${color.className} ${region.className} ${inSelectedRange ? "range-selected" : ""} ${selected ? "selected" : ""}`}
                          style={{ ...color.style, ...region.style }}
                          title={`${sequence.name} · ${column + 1} · ${residue}`}
                          onClick={(event) => selectCell(event, { sequenceId: sequence.id, column })}
                        >
                          {residue}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              </div>
            </div>
          ) : (
            <div className="alignment-scroll classic-view" ref={classicViewRef}>
              <div
                className="classic-sheet"
                style={{
                  "--cell-size": `${classicCellSize}px`,
                  "--name-width": `${classicNameWidth}px`,
                } as React.CSSProperties}
              >
                {classicBlocks.map(({ start, length: blockWidth }, blockIndex) => {
                  const end = Math.min(width, start + blockWidth);
                  const showNames = repeatNames || blockIndex === 0;
                  const continuationClass = showNames ? "" : " continuation";
                  const blockEnd = Math.min(width - 1, start + blockWidth - 1);
                  const shapesForLane = (lane: 0 | 1) => (
                    <>
                      {alignment.annotations
                        .filter((annotation) => annotation.lane === lane && annotation.start <= blockEnd && annotation.end >= start)
                        .map((annotation) => {
                          const segmentStart = Math.max(annotation.start, start);
                          const segmentEnd = Math.min(annotation.end, blockEnd);
                          return (
                            <AnnotationShape
                              key={`${annotation.id}-${start}`}
                              kind={annotation.kind}
                              left={segmentStart - start}
                              length={segmentEnd - segmentStart + 1}
                              total={blockWidth}
                              color={annotation.color}
                              zIndex={annotation.zIndex}
                              selected={annotation.id === selectedAnnotationId}
                              onSelect={() => {
                                setAnnotationTool(null);
                                setAnnotationStart(null);
                                setSelectedAnnotationId(annotation.id);
                              }}
                            />
                          );
                        })}
                      {lane === 0 && annotationStart !== null && annotationStart >= start && annotationStart <= blockEnd && (
                        <span
                          className="annotation-start-marker"
                          style={{ left: `calc(${annotationStart - start} * var(--cell-size))` }}
                          aria-hidden="true"
                        />
                      )}
                      {alignment.textAnnotations.filter((annotation) => annotation.lane === lane && annotation.column >= start && annotation.column <= blockEnd).map((annotation) => (
                        <TextAnnotationShape key={`${annotation.id}-${start}`} annotation={annotation} blockStart={start} blockWidth={blockWidth} selected={annotation.id === selectedTextId} onSelect={() => { setTextTool(null); setAnnotationTool(null); setAnnotationStart(null); setSelectedAnnotationId(null); setSelectedRegionId(null); setSelectedTextId(annotation.id); }} />
                      ))}
                    </>
                  );
                  const topLane = (lane: 0 | 1) => {
                    const interactive = lane === 0 ? Boolean(annotationTool) : Boolean(textTool);
                    return (
                    <div className={`classic-row classic-annotation-lane top${continuationClass}`} key={`${start}-top-${lane}`} aria-label={`Annotation lane ${lane + 1}`}>
                      <span className="classic-name-spacer" />
                      <div
                        className={`classic-cells annotation-cells ${interactive ? "drawing" : ""}`}
                        onClick={interactive ? (event) => chooseAnnotationBoundary(event, start, blockWidth, lane) : undefined}
                      >
                        {Array.from({ length: blockWidth }, (_, offset) => (
                          <span className="classic-empty" key={start + offset} />
                        ))}
                        {shapesForLane(lane)}
                      </div>
                      <span className="classic-end-spacer" />
                    </div>
                    );
                  };
                  const emptyLane = (lane: string, position: "top" | "bottom") => (
                    <div className={`classic-row classic-annotation-lane ${position}${continuationClass}`} key={`${start}-${lane}`} aria-label={`Annotation lane ${lane}`}>
                      <span className="classic-name-spacer" />
                      <div className="classic-cells">
                        {Array.from({ length: blockWidth }, (_, offset) => (
                          <span className="classic-empty" key={start + offset} />
                        ))}
                      </div>
                      <span className="classic-end-spacer" />
                    </div>
                  );
                  return (
                    <section className={`classic-block${continuationClass}`} key={start}>
                      <div className={`classic-ruler classic-row${continuationClass}`}>
                        <span className="classic-name-spacer" />
                        <div className="classic-cells">
                          {Array.from({ length: blockWidth }, (_, offset) => {
                            const column = start + offset;
                            return (
                              <span key={column}>
                                {column < width && (column + 1) % 10 === 0 ? column + 1 : ""}
                              </span>
                            );
                          })}
                        </div>
                        <span className="classic-end-spacer" />
                      </div>
                      {topLane(0)}
                      {topLane(1)}

                      {alignment.sequences.map((sequence, row) => {
                        const endNumber = [...sequence.residues.slice(0, end)]
                          .filter((residue) => residue !== "-").length + sequence.numberingStart - 1;
                        return (
                          <div className={`classic-row${continuationClass}`} key={`${sequence.id}-${start}`}>
                            <div className="classic-name" title={showNames ? sequence.description : undefined}>
                              {showNames ? sequence.name : ""}
                            </div>
                            <div className="classic-cells">
                              {Array.from({ length: blockWidth }, (_, offset) => {
                                const column = start + offset;
                                const residue = sequence.residues[column] ?? "";
                                const color = cellColor(sequence.id, row, column, residue);
                                const selected = selection?.sequenceId === sequence.id && selection.column === column;
                                const inSelectedRange = cellIsInSelectedRange(sequence.id, column);
                                const region = regionCellAppearance(sequence.id, column);
                                return residue ? (
                                  <button
                                    key={column}
                                    data-sequence-id={sequence.id}
                                    data-column={column}
                                    className={`residue ${color.className} ${region.className} ${inSelectedRange ? "range-selected" : ""} ${selected ? "selected" : ""}`}
                                    style={{ ...color.style, ...region.style }}
                                    title={`${sequence.name} · ${column + 1} · ${residue}`}
                                    onClick={(event) => selectCell(event, { sequenceId: sequence.id, column })}
                                  >
                                    {residue}
                                  </button>
                                ) : <span className="classic-empty" key={column} />;
                              })}
                            </div>
                            <div className="classic-end-number">{endNumber}</div>
                          </div>
                        );
                      })}
                      {emptyLane("bottom-1", "bottom")}
                      {emptyLane("bottom-2", "bottom")}
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </section>
      {similarityDialogOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setSimilarityDialogOpen(false)}>
          <form
            className="settings-dialog"
            aria-labelledby="similarity-title"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              applyColorScheme("similarity");
              setSimilarityDialogOpen(false);
            }}
          >
            <span className="eyebrow">ALINE colouring</span>
            <h2 id="similarity-title">By Similarity</h2>
            <label>
              <span>Low similarity cutoff</span>
              <div className="range-field">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={similarityOptions.cutoff}
                  onChange={(event) => setSimilarityOptions((current) => ({ ...current, cutoff: Number(event.target.value) }))}
                />
                <strong>{Math.round(similarityOptions.cutoff * 100)}%</strong>
              </div>
            </label>
            <label>
              <span>Similarity groups</span>
              <input
                className="text-field"
                value={similarityOptions.groups}
                onChange={(event) => setSimilarityOptions((current) => ({ ...current, groups: event.target.value }))}
                placeholder="None or DE FWY HKR ILMV NQ ST"
              />
              <small>Separate groups with spaces. Use “None” for exact identity only.</small>
            </label>
            <div className="dialog-actions">
              <button type="button" onClick={() => setSimilarityDialogOpen(false)}>Cancel</button>
              <button className="primary" type="submit">Apply</button>
            </div>
          </form>
        </div>
      )}
      {paletteEditorOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setPaletteEditorOpen(false)}>
          <section className="settings-dialog palette-editor" aria-labelledby="palette-editor-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">ALINE colouring</span>
            <div className="palette-editor-heading">
              <div><h2 id="palette-editor-title">Edit Colour Scheme</h2><p>Each score uses the first category whose threshold is greater or equal.</p></div>
              <button type="button" onClick={() => {
                try { setPaletteDraft((current) => ({ ...current, categories: appendPaletteCategory(current.categories) })); setError(""); }
                catch (reason) { setError(reason instanceof Error ? reason.message : "Impossible d’ajouter un niveau."); }
              }}>Add level</button>
            </div>
            <label><span>Palette name</span><input className="text-field" value={paletteDraft.name} onChange={(event) => setPaletteDraft((current) => ({ ...current, name: event.target.value }))} /></label>
            <div className="palette-preview" aria-label="Palette preview">
              {paletteDraft.categories.map((category, index) => <span key={`${category.threshold}-${index}`} style={{ background: category.fill, color: category.text }}>{Math.round(category.threshold * 100)}</span>)}
            </div>
            <div className="palette-category-list">
              {paletteDraft.categories.map((category, index) => (
                <div className="palette-category-row" key={index}>
                  <label><span>Threshold</span><input type="number" min="0" max="1" step="0.001" value={category.threshold} onChange={(event) => updatePaletteCategory(index, { threshold: Number(event.target.value) })} /></label>
                  <label><span>Background</span><input type="color" value={category.fill} onChange={(event) => updatePaletteCategory(index, { fill: event.target.value, line: event.target.value })} /></label>
                  <label><span>Text</span><input type="color" value={category.text} onChange={(event) => updatePaletteCategory(index, { text: event.target.value })} /></label>
                  <button className="danger-button" type="button" disabled={paletteDraft.categories.length === 1} aria-label={`Delete level ${index + 1}`} onClick={() => setPaletteDraft((current) => ({ ...current, categories: current.categories.filter((_, categoryIndex) => categoryIndex !== index) }))}>Delete</button>
                </div>
              ))}
            </div>
            <div className="dialog-actions"><button type="button" onClick={() => setPaletteEditorOpen(false)}>Cancel</button><button className="primary" type="button" onClick={applyPaletteDraft}>Apply palette</button></div>
          </section>
        </div>
      )}
      {sequenceManagerOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setSequenceManagerOpen(false)}>
          <section className="settings-dialog sequence-manager" aria-labelledby="sequence-manager-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow">Alignment rows</span>
            <div className="sequence-manager-heading">
              <h2 id="sequence-manager-title">Manage sequences</h2>
              <button className="primary" type="button" onClick={addBlankSequence}>Add sequence</button>
            </div>
            <div className="sequence-list">
              {alignment.sequences.map((sequence, index) => (
                <article className="sequence-list-row" key={sequence.id}>
                  <div className="sequence-order-actions">
                    <button type="button" disabled={index === 0} aria-label={`Move ${sequence.name} up`} onClick={() => dispatch({ type: "execute", command: { type: "move-sequence", sequenceId: sequence.id, toIndex: index - 1 } })}>↑</button>
                    <button type="button" disabled={index === alignment.sequences.length - 1} aria-label={`Move ${sequence.name} down`} onClick={() => dispatch({ type: "execute", command: { type: "move-sequence", sequenceId: sequence.id, toIndex: index + 1 } })}>↓</button>
                  </div>
                  <label><span>Name</span><input className="text-field" defaultValue={sequence.name} onBlur={(event) => dispatch({ type: "execute", command: { type: "update-sequence-properties", sequenceId: sequence.id, name: event.target.value, description: sequence.description, numberingStart: sequence.numberingStart } })} /></label>
                  <label><span>Description</span><input className="text-field" defaultValue={sequence.description} onBlur={(event) => dispatch({ type: "execute", command: { type: "update-sequence-properties", sequenceId: sequence.id, name: sequence.name, description: event.target.value, numberingStart: sequence.numberingStart } })} /></label>
                  <label className="numbering-field"><span>Starts at</span><input className="text-field" type="number" min="0" step="1" defaultValue={sequence.numberingStart} onBlur={(event) => dispatch({ type: "execute", command: { type: "update-sequence-properties", sequenceId: sequence.id, name: sequence.name, description: sequence.description, numberingStart: Number(event.target.value) } })} /></label>
                  <button className="danger-button" type="button" disabled={alignment.sequences.length <= 1} onClick={() => deleteSequence(sequence.id)}>Delete</button>
                </article>
              ))}
            </div>
            <div className="dialog-actions"><button className="primary" type="button" onClick={() => setSequenceManagerOpen(false)}>Done</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
