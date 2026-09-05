import { ChangeEvent, KeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  calculateConservation,
  exportClustal,
  exportFasta,
  exportMsf,
  exportPir,
} from "./core/alignment";
import { documentHistoryReducer, createDocumentHistory } from "./core/history";
import { AnnotationKind, CellPosition, createId } from "./core/model";
import { openAlignmentFile, serializeAtlasProject } from "./core/project";
import {
  calculateAlscriptConservation,
  calculateSimilarityColors,
  DEFAULT_SIMILARITY_GROUPS,
  SimilarityOptions,
} from "./core/coloring";
import { demoAlignment } from "./data/demo";

const residueGroups: Record<string, string> = {
  A: "hydrophobic", V: "hydrophobic", I: "hydrophobic", L: "hydrophobic", M: "hydrophobic", F: "hydrophobic", W: "hydrophobic", Y: "hydrophobic",
  D: "acidic", E: "acidic",
  K: "basic", R: "basic", H: "basic",
  S: "polar", T: "polar", N: "polar", Q: "polar", C: "polar",
  G: "special", P: "special",
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
  preview = false,
}: {
  kind: AnnotationKind;
  left: number;
  length: number;
  total: number;
  color: string;
  preview?: boolean;
}) {
  const style = {
    "--annotation-color": color,
    left: `${(left / total) * 100}%`,
    width: `${(length / total) * 100}%`,
  } as React.CSSProperties;
  if (kind === "helix") {
    return <span className={`annotation-shape helix-shape ${preview ? "preview" : ""}`} style={style} />;
  }
  const cycles = Math.max(1, Math.round(length / 2));
  const points = Array.from({ length: 61 }, (_, index) => {
    const progress = index / 60;
    return `${progress * 100},${10 + Math.sin(progress * cycles * Math.PI * 2) * 7}`;
  }).join(" ");
  return (
    <svg className={`annotation-shape coil-shape ${preview ? "preview" : ""}`} style={style} viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
    </svg>
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
  const [colorExclusions, setColorExclusions] = useState<Set<string>>(() => new Set());
  const [viewMode, setViewMode] = useState<"modern" | "classic">("classic");
  const [repeatNames, setRepeatNames] = useState(true);
  const [classicWidths, setClassicWidths] = useState({ first: 60, continuation: 70 });
  const [sidebarWidth, setSidebarWidth] = useState(258);
  const [annotationTool, setAnnotationTool] = useState<AnnotationKind | null>(null);
  const [annotationColor, setAnnotationColor] = useState("#ef4444");
  const [annotationStart, setAnnotationStart] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selection, setSelection] = useState<CellPosition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
  const width = alignment.sequences[0]?.residues.length ?? 0;
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

  async function openFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const opened = openAlignmentFile(await readAlignmentFile(file), file.name);
      dispatch({ type: "open", document: opened.document });
      setSelection(null);
      setAnnotationStart(null);
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

  function handleEditorKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!selection) return;
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

  function saveAtlasProject() {
    const safeName = alignment.name.replace(/[^a-z0-9._-]+/gi, "-") || "alignment";
    downloadFile(`${safeName}.atlas`, serializeAtlasProject(alignment), "application/json");
    dispatch({ type: "mark-saved" });
    setNotice("Projet .atlas enregistré");
  }

  function applyColorScheme(nextScheme: "residue" | "similarity" | "calcons" | "none") {
    setScheme(nextScheme);
    setColorExclusions(new Set());
    colorsMenuRef.current?.removeAttribute("open");
  }

  function resetSelectedColor() {
    if (!selection) return;
    setColorExclusions((current) => {
      const next = new Set(current);
      for (let column = 0; column < width; column += 1) next.add(`${selection.sequenceId}:${column}`);
      return next;
    });
    colorsMenuRef.current?.removeAttribute("open");
  }

  function openSimilarityDialog() {
    colorsMenuRef.current?.removeAttribute("open");
    setSimilarityDialogOpen(true);
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
  }

  function chooseAnnotationBoundary(event: ReactMouseEvent<HTMLDivElement>, blockStart: number, blockWidth: number) {
    if (!annotationTool || width === 0) return;
    event.preventDefault();
    const column = annotationColumn(event, blockStart, blockWidth);
    if (annotationStart === null) {
      setAnnotationStart(column);
      return;
    }
    const start = Math.min(annotationStart, column);
    const end = Math.max(annotationStart, column);
    dispatch({
      type: "execute",
      command: {
        type: "add-annotation",
        annotation: { id: createId(), kind: annotationTool, start, end, lane: 0, color: annotationColor },
      },
    });
    setAnnotationStart(null);
  }

  function cellColor(
    sequenceId: string,
    row: number,
    column: number,
    residue: string,
  ): { className: string; style?: React.CSSProperties } {
    if (scheme === "none" || colorExclusions.has(`${sequenceId}:${column}`)) return { className: "none" };
    if (scheme === "residue") return { className: `residue ${residueGroups[residue] ?? "unknown"} aa-${residue}` };
    const strength = scheme === "similarity" ? similarityColors[row]?.[column] : alscriptConservation[column];
    if (strength === null || strength === undefined) return { className: "none" };
    const displayStrength = strength >= 0.999 ? 1 : Math.floor(strength * 10) / 10;
    return {
      className: scheme,
      style: {
        "--strength": displayStrength,
        "--foreground": displayStrength >= 0.6 ? "#fff" : "#111",
      } as React.CSSProperties,
    };
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
              <button role="menuitem" disabled={!selection || scheme === "none"} onClick={resetSelectedColor}>
                <span>Reset…</span><small>Remove markup from selected sequence</small>
              </button>
              <button role="menuitem" onClick={() => applyColorScheme("none")}>
                <span>Reset all</span><small>Return to monochrome</small>
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
              <button className={annotationTool === "coil" ? "active" : ""} onClick={() => selectAnnotationTool("coil")}>
                <svg className="tool-icon spring-icon" viewBox="0 0 44 16" aria-hidden="true">
                  <path d="M1 8 C4 1 7 1 10 8 S16 15 19 8 S25 1 28 8 S34 15 37 8 S41 1 43 8" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Spring</span>
              </button>
            </div>
            <label className="annotation-color">
              <span>Shape color</span>
              <input type="color" value={annotationColor} onChange={(event) => setAnnotationColor(event.target.value)} />
            </label>
            <p>{annotationTool
              ? annotationStart === null
                ? "Click the start cell on the second line."
                : `Start: ${annotationStart + 1}. Click the end cell.`
              : "Choose a shape, then select its start and end above the alignment."}</p>
          </div>
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
              {selection ? `Selected · ${selection.column + 1}` : "Ready"}
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
                      return (
                        <button
                          key={column}
                          className={`residue ${color.className} ${selected ? "selected" : ""}`}
                          style={color.style}
                          title={`${sequence.name} · ${column + 1} · ${residue}`}
                          onClick={() => {
                            setSelection({ sequenceId: sequence.id, column });
                            editorRef.current?.focus();
                          }}
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
                    </>
                  );
                  const topLane = (lane: 0 | 1, interactive = false) => (
                    <div className={`classic-row classic-annotation-lane top${continuationClass}`} key={`${start}-top-${lane}`} aria-label={`Annotation lane ${lane + 1}`}>
                      <span className="classic-name-spacer" />
                      <div
                        className={`classic-cells annotation-cells ${interactive && annotationTool ? "drawing" : ""}`}
                        onClick={interactive ? (event) => chooseAnnotationBoundary(event, start, blockWidth) : undefined}
                      >
                        {Array.from({ length: blockWidth }, (_, offset) => (
                          <span className="classic-empty" key={start + offset} />
                        ))}
                        {shapesForLane(lane)}
                      </div>
                      <span className="classic-end-spacer" />
                    </div>
                  );
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
                      {topLane(0, true)}
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
                                return residue ? (
                                  <button
                                    key={column}
                                    className={`residue ${color.className} ${selected ? "selected" : ""}`}
                                    style={color.style}
                                    title={`${sequence.name} · ${column + 1} · ${residue}`}
                                    onClick={() => {
                                      setSelection({ sequenceId: sequence.id, column });
                                      editorRef.current?.focus();
                                    }}
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
    </main>
  );
}
