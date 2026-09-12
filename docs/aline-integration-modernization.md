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

## Remaining audit

The phase-0 integration checkpoint remains open for UniProt/NCBI and PDB
retrieval, WU-BLAST web replacement, SignalP, DisEMBL, PyMOL export, printing,
scripts and incomplete LSQMAN/region workflows. Provider availability alone
does not establish scientific equivalence or permission to redistribute tools.
SignalP 6 is a candidate successor, with changed prediction semantics and
distribution conditions described by [DTU](https://services.healthtech.dtu.dk/services/SignalP-6.0/).
Its final workflow and biological verification contract remain to be audited.
