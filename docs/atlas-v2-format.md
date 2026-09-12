# Atlas version 2 document design

This is an evolving format contract. `src/core/richRows.ts` implements the first
row primitives; the running application still reads and writes version 1.
Do not emit a version-2 project until the full validator, migrations, rich object
representation and application adoption are verified.

## Rows and cells

Rows use stable string identifiers. Array order is document order; `position`
retains the separate vertical layout coordinate. A row is a `sequence` or an
`annotation`, with editable name/description and an optional annotation `role`.
Consensus, numbering and graph rows do not become proteins merely because they
contain letters. Roles survive renaming and must not be inferred again from a
name prefix after conversion.

`cells` is an ordered array of explicit cell records. Each record retains its
complete `text`, including lower case, symbols, whitespace, empty strings and
multi-character annotation text. Array index is alignment column. Do not pad,
uppercase or split rich cells during project loading. Analysis adapters validate
their supported sequence alphabet separately. Future performance work may use
compact runtime storage, provided it preserves these wire distinctions.

Each cell optionally carries `number` and text style. Missing `number` means
the historical field was absent; `null` means explicitly unnumbered; a finite
number preserves zero, negative and fractional values. `residueIdentity`, when
known from a coordinate file, retains model, author/label chain, author residue
number and insertion code independently of display numbering. Never fabricate
an original insertion code from a legacy fractional value.

Text styles retain foreground/background, font family, size, weight, slant,
width and anchor. The full document validator must validate renderable values
and preserve unsupported historical values as diagnosed compatibility data;
the current TypeScript types are not an input-validation boundary.

## Numbering and attachments

Row numbering is either `automatic` with a finite start or `fixed`. Cell numbers
are the saved snapshot in both modes. Recalculation is an explicit immutable
operation, not an import side effect. The automatic operation matches ALINE
`_FillSeqnum`: only whole-cell empty text, hyphen, dot, underscore and a single
space are unnumbered gaps; every other cell receives the next number. Preserve
styles and coordinate identity. Fixed rows preserve all saved number states.
Reject numeric overflow or increments that cannot be represented instead of
creating duplicate numbers. The eventual command layer must add one undo point.

`attachedTo` is a row identifier or `null`. Stable identifiers replace legacy
array-index pointers. Editing propagates over the undirected connected group,
as `_AttachmentForX` follows both parent and child links. Historical cycles
and self-links are representable and terminate under visited-set traversal;
they must not cause silent loss on import. Duplicate identifiers and dangling
links are invalid. Return affected rows in stable document order, rather than
historical hash iteration order. Row reordering must not retarget attachments.

## Objects and graph samples

`src/core/richObjects.ts` supplies the row-local object segment contract. Each
segment has a stable ID, row ID, independent numeric layer, historical `multi`
flag, reciprocal previous/next segment IDs and an ordered item array. This
represents linked multi-row regions without forcing their styles or layers to
be identical. Links are distinct from row attachments. Empty containers and
reciprocal cycles remain representable; dangling/nonreciprocal links are errors.

Each item stores its own kind, column, typography, line/fill colour, line width
and optional text. All 36 historical kinds and Atlas's explicit solid `Line`
are enumerated. Preserve item order, duplicate positions and sparse coverage;
do not replace them with a filled bounding rectangle. Complete document
validation will bound coverage against document geometry. Unknown object kinds
are rejected by this known-object reader; the legacy converter must report and
retain unsupported records in compatibility storage rather than omit them.

Graph items require a finite `sample`; containers retain height and cutoff.
`sampleSpace: "drawing"` is mandatory. Values may be negative, zero or greater
than one, because saved ALINE samples have already been transformed. No implicit
normalization or inference of original measurements occurs. Original samples,
when actually available from a new analysis/import, need separate provenance
in the full document design. Empty text and missing text remain distinct.

`compatibility` is a bounded inert JSON object on containers and items. It can
retain unknown historical/plugin values without pretending they are supported
rendering fields. Prototype-shaped keys remain own data in null-prototype maps.
Unknown fields outside this explicit storage are rejected, preventing a parser
from silently dropping a new field. Style strings retain historical spellings
and colour precision as data; renderers still need validated colour/font mapping
and diagnostics for unsupported values before consuming them.

The component parser accepts at most 16 million UTF-16 code units and one
million items; compatibility nesting is capped at 64. Full-document validation
and aggregate budgets remain necessary. This is a component contract, not a
version-2 project opener or a duplicate-JSON-member validator.

## Verification and remaining design

`richRows.test.ts` has 11 tests covering mixed annotation text, immutable
renumbering, all fixed-number states, structure/style retention, invalid numeric
range, cycles, self-links, invalid identifiers and a 20,000-row chain. The
unchanged legacy `_FillSeqnum` and `_AttachmentForX` run in the historical oracle
with matching vectors (assertions 166–171). A JSON round trip demonstrates the
number-state encoding only; it is not a complete version-2 persistence test.

`richObjects.test.ts` adds 21 tests: registry equality against unchanged ALINE
source; full-style round trips across all kinds; sparse linked regions; signed
graph values; inert extension retention; cycles; and malformed types, links,
numeric values, styles and depth. Tests require the local historical reference,
as do the existing palette tests and historical oracle. These are data-contract
tests, not browser rendering or `.aline` conversion evidence.

The next design/implementation checkpoint must complete transformed/raw sample
provenance, palettes, document layout and row/cell/plugin compatibility metadata.
Then add strict validation, version-1 migration and lossless serialization before
integrating the new document into commands, rendering and file opening. Keep
the legacy wire representation separate from the editable document (D-015).
