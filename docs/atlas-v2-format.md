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
width and anchor. The document validator checks field types and finite,
nonnegative sizes. Strings remain data: rendering adoption must validate their
supported colour/font mappings and diagnose unsupported historical values.
Parsing a style does not authorize inserting arbitrary strings into markup.

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

The component and document parsers share a strict JSON boundary. Inputs and
outputs are capped at 16 million UTF-16 code units, two million JSON values and
128 nesting levels. Cells and object items each have an additional one-million
limit; compatibility nesting is capped at 64. Duplicate decoded member names,
numeric overflow and underflow to zero are rejected. Numbers use JavaScript's
IEEE-754 representation; this is not arbitrary-precision decimal storage.
Writers preserve signed zero and reject undefined, nonfinite numbers, sparse
arrays, accessors, hidden fields, serialization hooks and cyclic containers
instead of silently dropping or coercing them. Symbolic row/object links may
still describe cycles. Unknown metadata remains inert in compatibility maps.

## Document envelope, layout and provenance

`richProject.ts` reads/writes `format: "atlas-alignment", version: 2` with a
stable document ID, name, column count, rows, objects, layout, palettes, active
palette ID and analyses. All are required; absent data is not silently defaulted.
Short rows remain short, but no row cell or object column may exceed document
width. Empty documents are valid. IDs are unique within each entity collection;
all attachment, object, palette and analysis references must resolve.

Layout retains cell width, row height, title/wrap/number columns, repeat-name
mode, offsets, font scale, aggressive-edit mode, grid, block gap and background.
These correspond to the settings audited in `aline-packed-format.md`; derived
layout caches are omitted. Spacing/scale must be positive, columns nonnegative
safe integers, and wrapped width must leave room for the title. Renderer resource
limits and supported style mappings remain adoption requirements.

Palettes keep ordered, nonempty categories with strictly increasing finite
thresholds, original style strings and optional compatibility metadata. Do not
clamp legacy sentinel thresholds to a presumed zero-to-one measurement range.
The active palette ID may be null.

Analyses retain provider, method, nullable version, parameters, immutable input
cell snapshots and explicitly raw measurement series. Each series references
one input snapshot and has exactly its cell count; null represents a missing
measurement. Snapshot length is independent of the current alignment length.
The optional live source-row link becomes null when the row is removed, while
the snapshot remains available. Rows and objects may reference an analysis.
Drawing samples retain their own transformed values; no inverse transform or
raw result is invented for historical saves. Recalculation, deletion and stale
result indication must be implemented by later document commands.

## Verification and remaining design

`richCommands.ts` supplies a global column-splice operation and immutable
snapshot history. A splice removes the specified range and inserts gap cells
(`-` for sequence rows, empty text for annotation rows) with null numbering.
Existing cell metadata and saved numbers move intact; renumbering is explicit.
Edits beyond a short row do not materialize unrelated trailing cells. Object
items in deleted columns disappear and later items shift, preserving order,
duplicates, styles, samples and segment links. Empty segments remain data so
links are not broken. Analysis snapshots and raw results do not shift.

The source reference is ALINE `_DeleteCells`/`_InsertCells`, where cell editing
also remaps object `xpos`; flag-dependent row-local behavior is not yet claimed.
The modern global operation retains empty linked containers rather than silently
discarding their metadata. History adds one snapshot per successful command,
clears redo on branching, tracks saved identity, and leaves state unchanged on
no-op or rejected input. `richCommands.test.ts` verifies these data operations;
UI integration and row-local/attachment editing remain required.

Row-local `splice-row` now applies the same sparse transformation to the target
row's complete attachment component (including reverse edges and cycles), once
per row. Unrelated rows and objects are untouched. Document width grows when
needed and is not cropped by local deletion. Tests cover propagation, metadata,
snapshot persistence and one-step undo. This primitive does not yet duplicate
contiguous object items on insertion: ALINE `_InsertCells` uses object registry
flag bit 1 for that behavior and optional previous-cell style inheritance.
Those insertion policies remain a separate required checkpoint before UI adoption.

`migrateV1Project` converts validated version-1 data with deterministic IDs,
two explicit drawing lanes, every annotation kind, text styles and linked region
segments. Manual styles are applied after version-1 padding/normalization.
Number snapshots retain the old UI's hyphen-only gap counting; an explicit later
recalculation uses the rich numbering rule. Full decoded source is retained in
`compatibility.atlasV1Source`, including unknown fields, original spellings and
absent optional values. This archive is provenance, not the editable source of
truth. Layout defaults and retained source data are reported as migration
warnings. Palette defaults match the version-1 reader. Expansion is limited to
one million cells and one million object items, plus the common JSON limits.
The migration is pure and does not change the active document or history.
`migrateV1.test.ts` verifies all 24 annotation mappings, text, styled padded cells,
linked regions, source retention, ID collisions and invalid inputs. Rendering
equivalence still needs browser verification when the new model is adopted.

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

`richProject.test.ts` verifies complete document round trips, absence/null/zero
number states, sparse geometry, cyclic links, palette sentinels, source changes,
snapshot retention and rejection of invalid references, dimensions, fields and
provenance. `jsonData.test.ts` exercises the strict data boundary separately.
The running application still uses version 1. Next: version-1 migration, rich
legacy conversion and document commands/rendering/file opening adoption. These
tests do not claim complete workflow or ALINE parity. Keep the legacy wire
representation separate from the editable document (D-015).
