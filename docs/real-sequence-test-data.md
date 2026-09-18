# Real unaligned protein test data

`examples/real-globins-unaligned.fasta` contains five **unaligned, complete,
canonical protein sequences** retrieved from the UniProtKB REST FASTA endpoint
on 2026-09-18. Only the FASTA headers were shortened for a readable Atlas
display; residue strings are unchanged. UniProtKB applies CC BY 4.0 to the
copyrightable parts of its databases; retain the attribution below.

`examples/real-globins-mafft-auto.fasta` is the matching **computed output**
from Atlas's local MAFFT development adapter on macOS using MAFFT 7.526,
`--auto --quiet --inputorder`, on 2026-09-18. This is a reproducible
before/after example, **not** an independent curated reference or a claim of
biological correctness for every position.

## Try the before/after pair in Atlas

Install MAFFT (`brew install mafft` on macOS), run `npm run dev`, then open
`examples/real-globins-unaligned.fasta` in Atlas. The preview shows five
sequences of 142 or 147 residues. Choose **Align with MAFFT**. The resulting
alignment has five rows, 149 columns and 15 gap characters; compare it with
`examples/real-globins-mafft-auto.fasta`. The local adapter is available only
in the development server for now, not the static production build.

| Header | Protein | Organism | Raw residues | UniProtKB |
| --- | --- | --- | ---: | --- |
| `P69905_HBA_HUMAN` | Hemoglobin alpha | Human | 142 | [P69905](https://www.uniprot.org/uniprotkb/P69905) |
| `P68871_HBB_HUMAN` | Hemoglobin beta | Human | 147 | [P68871](https://www.uniprot.org/uniprotkb/P68871) |
| `P02042_HBD_HUMAN` | Hemoglobin delta | Human | 147 | [P02042](https://www.uniprot.org/uniprotkb/P02042) |
| `P02088_HBB1_MOUSE` | Hemoglobin beta-1 | Mouse | 147 | [P02088](https://www.uniprot.org/uniprotkb/P02088) |
| `P02091_HBB1_RAT` | Hemoglobin beta-1 | Rat | 147 | [P02091](https://www.uniprot.org/uniprotkb/P02091) |

Source format: `https://rest.uniprot.org/uniprotkb/{accession}.fasta`.
UniProt [license and API documentation](https://www.uniprot.org/api-documentation/support-data).

## What this fixture should exercise

1. Import the FASTA irrespective of whether the file is named `.fasta` or
   `.txt`; the content, not its extension, identifies the format.
2. Preview five raw sequences, preserve the names and descriptions, and show
   the original lengths (142/147). **No gaps are present in the input.**
3. Run an actual multiple-sequence aligner and validate equal-width output,
   retained sequence identities, and unchanged ungapped residues. The alpha
   and beta/delta globins are related but not identical; this is a useful
   mixed-similarity example, not a benchmark proving one method is best.
4. Save/reopen the alignment with method/version/input provenance, then edit,
   annotate and export a figure.

Current Atlas limitation: its existing alignment-file opener pads unequal
FASTA lengths for display. That is **not** a computed alignment. Raw FASTA
now opens a preview and can be aligned through the local MAFFT development
adapter when MAFFT is installed. This endpoint is available under `npm run
dev`, not in the static production build. Bundled/offline cross-platform
execution and `.atlas` provenance persistence are still pending.

For an **independent reference alignment** rather than an aligner's own
output, use the [BAliBASE benchmark's paired unaligned and curated alignment
files](https://publish.illinois.edu/msaevaluation/balibase-benchmark-alignment-files/).
