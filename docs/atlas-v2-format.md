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

## Verification and remaining design

`richRows.test.ts` has 11 tests covering mixed annotation text, immutable
renumbering, all fixed-number states, structure/style retention, invalid numeric
range, cycles, self-links, invalid identifiers and a 20,000-row chain. The
unchanged legacy `_FillSeqnum` and `_AttachmentForX` run in the historical oracle
with matching vectors (assertions 166–171). A JSON round trip demonstrates the
number-state encoding only; it is not a complete version-2 persistence test.

The next design/implementation checkpoint must cover all 36 legacy drawable
types and modern equivalents, sparse linked coverage, independent object/item
styles, all graph variants and transformed/raw sample provenance, palettes,
document layout, plugin metadata and inert compatibility extensions. Then add
strict validation, version-1 migration and lossless serialization before
integrating the new document into commands, rendering and file opening. Keep
the legacy wire representation separate from the editable document (D-015).
