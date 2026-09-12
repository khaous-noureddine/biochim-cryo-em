# ALINE integration modernization

Source and provider documentation audit: 2026-09-13. These are implementation
contracts, not verified application integrations. Legacy source remains unchanged.

## Local scientific tools

| Capability | Historical mechanism | Selected direction | Required verification |
| --- | --- | --- | --- |
| PLUG-022, PLUG-024 alignment | `tAlignment.plugin:76–90` chooses a runner by executable name, uses shell commands and working-directory temporary files; MUSCLE uses `-stable -in -out` | Version-aware MAFFT and MUSCLE adapters with explicit arguments and isolated job directories. MUSCLE 5 uses `-align` and `-output`. Retain ClustalW capability in the inventory until its adapter or an accepted replacement is verified. | Recover rows by stable input identifiers, never output order; preserve ungapped residues, attachments and remapped objects; undo one accepted result; cancellation/failure leaves the document unchanged. Verify actual executable versions on all three platforms. |
| PLUG-020 secondary structure | `tAddSecStruct.plugin:107` pipes `dssp -na` output into a fixed-column parser | Maintained PDB-REDO `mkdssp`, with explicit output-format negotiation and support for annotated mmCIF. Preserve input-file import independently of executable availability. | Chain and insertion identity, missing residues, all assignment codes and conversion to editable objects. Modern DSSP includes poly-proline helices: preserve that assignment and explicitly document its rendering instead of silently treating it as an old code. |
| PLUG-031 molecular replacement model | `tRunChainsaw.plugin:26–40` writes fixed filenames, filters only chain A, invokes a shell heredoc and overwrites `Chainsaw.pdb` | Retain CCP4 Chainsaw, which is still documented as a supported program; replace its invocation mechanism. Keep MIXS, MIXA and MAXI, allow explicit chain selection and a chosen output destination. | Known target/template alignment in correct order; each pruning mode; output residue numbering, atom names and chain identity; failure/cancel without partial published output. Check installation/licensing and actual execution per platform before release. |

Use a shared local-job boundary with argument arrays, separate stdout/stderr,
bounded output, timeout/cancellation, unique temporary directories and cleanup.
Capture executable version, input identity, options and diagnostics with results.
Only validated results enter document history. Alignment algorithms can change
between versions; a new version is not a claim of identical historical output.
Do not silently discard constraints when an adapter lacks that capability.

Provider references checked for this audit:

- [MAFFT manual](https://mafft.cbrc.jp/alignment/software/manual/manual.html)
  documents its command-line options and FASTA output.
- [MUSCLE 5 align command](https://drive5.com/muscle5/manual/cmd_align.html)
  documents the modern arguments, aligned FASTA output and algorithm options.
- [PDB-REDO DSSP](https://github.com/PDB-REDO/dssp) documents annotated mmCIF
  output by default and poly-proline assignment support.
- [CCP4 Chainsaw](https://www.ccp4.ac.uk/html/chainsaw.html) documents the
  supported program, its three modes and target-consistent output numbering.

## Remote retrieval and analysis

| Capability | Historical mechanism | Modern contract | Required verification |
| --- | --- | --- | --- |
| PLUG-010 database retrieval | `eSeqList.plugin` configures ExPASy `.fas` and HTTP Entrez URLs and runs wget | UniProt REST entry FASTA and NCBI EFetch protein FASTA over HTTPS; retain accession/version and retrieval provenance. Encode identifiers as data, validate response contents before insertion. | Single and multiple identifiers, isoforms/versioned accessions, missing/deleted entries, HTTP errors, partial batches, rate limiting, cancellation and one undoable insertion. |
| CORE-041, PLUG-011 structure retrieval | `_ObtainPDB` uses obsolete RCSB servlet and ExPDB chain CGI; extracts one-character chains from fixed columns | RCSB file download service with mmCIF preferred, explicit author/label chain identity and local chain selection. Preserve PDB input support. | Multiple chains, blank/multi-character identifiers, missing structure, models, insertion codes and coordinate-to-sequence mapping. No silent truncation to four-character entry IDs or one-character chains. |
| PLUG-009 BLAST search and insertion | `eAddBlast.plugin` submits WU-BLAST CGI, polls HTML refreshes and parses result-table markup; retrieves UniProt/PDB hits with optional realignment | EBI Job Dispatcher NCBI BLAST+ REST job lifecycle, provider-advertised database/result formats and explicit valid contact email. Keep protein search, both database workflows, hit limit, descriptions and optional alignment. Persist program/database/version/parameters and hit metrics. | Recorded request/result fixtures and live provider smoke test: pending/completed/error/expired states, no hits, duplicate hits, database/chain identity, hit count, download errors, cancel, stale document and optional realignment. WU-BLAST scores are not interchangeable with BLAST+ scores. |
| PLUG-021 signal peptide prediction | `tAddSignalP.plugin` truncates input to 70 residues, posts SignalP 3 NN/HMM parameters and scrapes fixed-width output; creates BarR/Box or an attached arrow/coil | SignalP 6 local user-installed package and result-file import, preserving full submitted sequence, model mode, signal type, probabilities and cleavage boundary. Retain all four historical annotation choices. Do not relabel SignalP 6 output as SignalP 3. No undocumented web scraping or automatic package redistribution. | Known positive/negative provider examples; gapped input and non-one numbering; cleavage boundary mapped by submitted residue index; malformed/truncated result; all annotation choices, persistence and undo. Biological comparison must document changed model semantics before claiming replaced parity. |
| PLUG-017 disorder | `tAddDisEmbl.plugin` scrapes REM465, LOOPS and HOTLOOPS intervals and draws three coloured graphs on an optional attached row | Proposed IUPred3 long/short disorder output with its own labels, parameters, scores and provenance. Preserve imported DisEMBL tracks and their original definitions. **User biological direction pending; this replacement is not accepted.** | Approved scientific scope, provider reference examples, residue-to-column mapping, thresholds, attached row, graph rendering, persistence and undo. Never rename one modern score into all three historical definitions. |

Remote jobs run only after the user chooses to submit the sequence. Show the
provider and submitted scope in that workflow. Store result provenance without
credentials; distinguish service errors from valid negative predictions. Observe
provider rate limits and retry guidance, cap polling and response size, and stop
local polling on cancel without claiming the remote computation was deleted.
File import remains usable independently of network/provider access. Every
result applies to the input snapshot that produced it, with explicit handling
when the current sequence has changed.

Provider references checked for this audit:

- [UniProt entry retrieval](https://www.uniprot.org/help/api_retrieve_entries)
  documents `https://rest.uniprot.org/uniprotkb/P12345.fasta` and missing/deleted
  entry status codes.
- [NCBI EFetch](https://www.ncbi.nlm.nih.gov/books/NBK25499/) documents sequence
  retrieval; [NCBI usage guidance](https://eutilities.github.io/site/API_Key/usageandkey/)
  specifies three requests per second without an API key and tool/email identity.
- [RCSB downloads](https://www.rcsb.org/docs/programmatic-access/file-download-services)
  documents HTTPS coordinate files and formats.
- [EBI Job Dispatcher API](https://www.ebi.ac.uk/jdispatcher/docs/webservices/)
  documents programmatic jobs, contact email and fair-use limits;
  [tool catalog](https://www.ebi.ac.uk/jdispatcher/docs/) lists NCBI BLAST+.
- [DTU SignalP 6](https://services.healthtech.dtu.dk/services/SignalP-6.0/)
  documents the local package, distribution conditions, model modes and expanded
  signal types. The newer model does not use the old organism-group selector.
- [IUPred3](https://iupred3.elte.hu/) describes its disorder modes and ANCHOR2;
  these are different quantities from DisEMBL's three definitions. The old
  DisEMBL HTTPS site could not be retrieved during this audit; that observation
  alone does not prove permanent service retirement.

## Export and automation

| Capability | Historical mechanism | Modern contract and verification |
| --- | --- | --- |
| PLUG-030 PyMOL colour export | `tPymolColors.plugin` writes `set_color`, `bg_color` and residue selections; skips colon-formatted numbering | Retain `.pml` export using supported PyMOL commands, explicit model/chain/residue identity and safely encoded selections. Verify foreground colour source, canvas background, gaps, insertion codes, empty/model/chain names and actual script execution against known atoms. Fractional ALINE numbering cannot reconstruct lost insertion codes: diagnose unresolved residues rather than silently omitting them. |
| CORE-014, CORE-015, PLUG-015 figure export/print | Tk PostScript, Ghostscript PNG conversion, `/etc/printcap` and configurable `lpr` command | Shared figure layout to SVG/PDF and PNG; native desktop print dialog with preview, page size, orientation, scaling, margins and pagination, per D-002. Compare glyphs/fonts, clipping, page breaks and colours; verify three OS print-to-file workflows and restore editor state after cancel. No selected desktop implementation or verified renderer is implied yet. |
| CORE-039, CORE-040 plugins/scripts | `_LoadPlugins` requires arbitrary Perl; `_ExecScript` passes file contents to `Aline::Sandbox::_run`, which calls unrestricted `eval` | Versioned typed command API shared by UI, CLI and explicit automation jobs. Port useful script operations (load, config get/set, row selectors, sequence metadata/cells, undo points, updates, parameter dialogs and quit) and plugin commands. Arbitrary Perl is not a document format: diagnose unsupported scripts and provide a migration guide. Verify equivalent command sequences, errors, atomic history, CLI exit status and GUI parameter workflows. Extension runtime selection remains phase 8 work; it must not silently remove useful scripting capabilities. |
| PLUG-025 incomplete regional/structural alignment | `tAlignment.plugin` comments out LSQMAN/region bindings and declares TODOs | Keep these workflows explicitly unresolved; do not declare an accepted omission or pretend their commented stubs provide an oracle. Define desired structure-guided and regional behavior before implementing a maintained backend. Existing global/row alignment and constraints remain independently required. |

[PyMOL's command reference](https://pymol.org/pymol-command-ref.html) documents
the retained colour commands. Export and script modernization choices implement
D-002/D-007; they do not establish completed parity. Unresolved disorder and
incomplete structural-alignment choices do not prevent the rich document model,
which must preserve imported objects, graphs and provenance for any provider.
