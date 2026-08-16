import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  Alignment,
  calculateConservation,
  exportFasta,
  parseFasta,
} from "./core/alignment";
import { demoAlignment } from "./data/demo";

const residueGroups: Record<string, string> = {
  A: "hydrophobic", V: "hydrophobic", I: "hydrophobic", L: "hydrophobic", M: "hydrophobic", F: "hydrophobic", W: "hydrophobic", Y: "hydrophobic",
  D: "acidic", E: "acidic",
  K: "basic", R: "basic", H: "basic",
  S: "polar", T: "polar", N: "polar", Q: "polar", C: "polar",
  G: "special", P: "special",
};

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [alignment, setAlignment] = useState<Alignment>(demoAlignment);
  const [scheme, setScheme] = useState<"residue" | "conservation" | "none">("residue");
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const conservation = useMemo(() => calculateConservation(alignment), [alignment]);
  const width = alignment.sequences[0]?.residues.length ?? 0;

  async function openFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAlignment(parseFasta(await file.text(), file.name.replace(/\.[^.]+$/, "")));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d’ouvrir ce fichier.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div><strong>ATLAS</strong><small>Alignement</small></div>
        </div>
        <nav className="file-actions">
          <button className="primary" onClick={() => inputRef.current?.click()}>Open FASTA</button>
          <input ref={inputRef} type="file" accept=".fa,.fasta,.fas,.faa,.txt" hidden onChange={openFile} />
          <button onClick={() => downloadFile(`${alignment.name}.fasta`, exportFasta(alignment), "text/plain")}>Export</button>
        </nav>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="document-heading">
            <span className="eyebrow">Alignment</span>
            <h1>{alignment.name}</h1>
            <p>{alignment.sequences.length} sequences · {width} positions</p>
          </div>

          <div className="panel-section">
            <label>Color scheme</label>
            {(["residue", "conservation", "none"] as const).map((value) => (
              <button key={value} className={`scheme ${scheme === value ? "active" : ""}`} onClick={() => setScheme(value)}>
                <span className={`scheme-dot ${value}`} />
                {value === "residue" ? "Residue type" : value === "conservation" ? "Conservation" : "Monochrome"}
              </button>
            ))}
          </div>

          <div className="panel-section stats">
            <label>Overview</label>
            <div><span>Mean conservation</span><strong>{Math.round((conservation.reduce((a, b) => a + b, 0) / Math.max(1, conservation.length)) * 100)}%</strong></div>
            <div><span>Gaps</span><strong>{alignment.sequences.reduce((sum, s) => sum + (s.residues.match(/-/g)?.length ?? 0), 0)}</strong></div>
          </div>
        </aside>

        <section className="editor-card">
          <div className="editor-toolbar">
            <div>
              <span className="status-dot" /> Ready
              {error && <span className="error">{error}</span>}
            </div>
            <div className="zoom-control">
              <span>Zoom</span>
              <input type="range" min="0.65" max="1.5" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              <b>{Math.round(zoom * 100)}%</b>
            </div>
          </div>

          <div className="alignment-scroll">
            <div className="alignment-grid" style={{ "--cell-size": `${28 * zoom}px` } as React.CSSProperties}>
              <div className="corner" />
              <div className="ruler">
                {Array.from({ length: width }, (_, index) => <span key={index}>{(index + 1) % 10 === 0 ? index + 1 : "·"}</span>)}
              </div>
              {alignment.sequences.map((sequence) => (
                <div className="sequence-row" key={sequence.id}>
                  <div className="sequence-name" title={sequence.description}>
                    <strong>{sequence.name}</strong><small>{sequence.description}</small>
                  </div>
                  <div className="residues">
                    {[...sequence.residues].map((residue, column) => {
                      const className = scheme === "residue" ? residueGroups[residue] ?? "unknown" : "";
                      const style = scheme === "conservation" ? { "--strength": conservation[column] } as React.CSSProperties : undefined;
                      return <span key={column} className={`residue ${scheme} ${className}`} style={style} title={`${sequence.name} · ${column + 1} · ${residue}`}>{residue}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
