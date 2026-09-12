# ALINE packed state R001

This is a source-derived wire-format contract, not a claim of complete import
support. Reference: `aline_011208/bin/aline`, `DumpDataFile` (4648),
`savepackaline` (4678), `n2a64` (4761), `loadpackaline` (4774), and
`UndumpDataFile` (4856). The legacy tree remains unchanged.

## Envelope and dictionaries

The first line is `Aline 1.0 packed state R001`; the second is producer metadata.
The historical reader splits subsequent content on runs of CR or LF. `S` below
means byte 3 and `E` means byte 5. Neither is an escaped printable string.
Values containing these delimiters or newlines have no general escaping scheme.
Hash iteration order is not stable; compare decoded values, not serialized order.

1. Document parameters: alternating `key S value`, with arrays joined by `E`.
   The reader treats values containing `E` as arrays and coerces others to numbers.
2. Cell dictionary: each line is `key S property S value ...`, terminated by
   a line containing only `E`.
3. Object dictionary: the same record shape and terminator.
4. Row records, including their declared object records, terminated by `E`.
5. Palette category records through end of file.

Cell keys start with the first character of `text`, or `~` for empty text.
The first variant has a space suffix; subsequent variants use character codes
33 through 255, then `E` plus a decimal counter plus `E`. Byte values above 127
occur in the bundled `example/rada.aline`; decoding arbitrary input as UTF-8
can corrupt dictionary identities. Encoding must be verified in the importer.
Object dictionary keys come from `n2a64`; treat them as opaque identifiers.

## Rows and cells

Each row begins with `p S n S object-count S title-key S title-value ...`.
`p` is the displayed row position; it is not the array index. `n=u` denotes
undefined row numbering. A second line begins with `>` and stores all remaining
row keys except `n`, `e`, `o`, `p`, and `t`. The third line concatenates cell
dictionary keys and any explicit numbering payloads.

Title properties include `text`, `comment`, `attach`, `titlefill`,
`titlefoundry`, `titleslant`, `titlewidth`, `titlesize`, `titleweight`, and
`anchor` (`InsertRow`, 4250). `attach=-1` is detached; other values address the
sequence array, not displayed positions (`AttachRow`, 1713). Blank/derived rows
can have `%%%` names and must not simply disappear from a rich document import.

The dictionary's `seqnumber` is an encoding instruction:

| Value | Decoded state |
| --- | --- |
| -1 | Property absent |
| 0 | Property present but undefined |
| 1 | Increment previous explicit number, initially zero for each row |
| 2 | Consume a number followed by `S` after the key; set previous number |

Cells retain all dictionary fields, including multi-character or empty text,
font properties, background, anchor, and cached coordinates. Do not normalize
annotation text to uppercase protein residues. Numbering absence, undefined
numbering, and explicit zero are distinct states.

## Objects, graphs, and links

Each object occupies three lines:

1. `multi S z S rev-row S rev-object S fwd-row S fwd-object`.
2. `>` followed by remaining object properties, excluding `rev`, `fwd`, `e`,
   `z`, and `multi`.
3. Alternating dictionary key and position/payload fields separated by `S`.

Undefined links use `u S u`. Before writing, `_CopySeq` converts live object
references to array-index pairs. After loading, `UndumpDataFile` reconnects
these references, validates fonts, copies the document and consolidates z order.
Resolve links only after all rows and objects exist; diagnose invalid indices.

Each object's previous x position starts at zero. `+` advances it by one;
otherwise the position is literal. An optional `E` suffix carries `text` for
types ending in `Graph`, and `otext` for other types. These payloads and `xpos`
are removed from the cached property map. Graph containers can include `h`
(height) and `cut`; graph samples carry their numeric value in `text`
(`_CreateGraph`, 2813). Preserve graph samples separately from residue text.

## Palettes and document preferences

Palette lines contain threshold and category fields separated by `S`. A field
equal to `E` inherits that field from the preceding category. `=` in the second
category field copies the first category field. The terminal category is not
written: the reader appends threshold 100 and eight empty fields.

`%defaultpar` (790) defines `csh`/`csv` character spacing, `lin` title indent,
`all` repeated titles, `ofx`/`ofy` canvas offsets, `nch` wrap width, `fsi`,
`num` numbering-column width, and `agr` aggressive editing. The serializer
writes all current `%par` keys, including runtime-added keys. Global `%cfg`
is not serialized as a separate configuration section.

## Registered drawable types and persisted properties

The core `%objectdata` registry (lines 610–743) contains 36 types. The oracle
checks its complete name set and round-trips a styled record for every type.
These are serialization assertions; they do not verify Atlas drawing fidelity.

| Class | Historical type names |
| --- | --- |
| Point (0) | UpTriangle, DownTriangle, UpTriangleS, DownTriangleS, Circle, Star, Starm, Square, Diamond, UpArrowC, DownArrowC, UpArrowR, DownArrowR, BarR |
| Linear (1) | Helix, Helix2, Strand, Strand2, Coil, DashedLine, ConnectUp, ConnectDown, Underline |
| Region (2) | Box, Rect |
| Graph (3) | BarGraph, BarCGraph, LineGraph, LineCGraph, GradGraph, GradCGraph, HSLGradGraph, HSLGradCGraph, OnebitGraph |
| Text (4) | Text, OutlineText |

`CreateObject` (2730) and `_CreateGraph` (2813) populate these common item
fields: `type`, `xpos`, `lc`, `fc`, `lw`, `fontfill`, `fontfoundry`, `fontwidth`,
`fontslant`, `fontsize`, `fontweight`, `fontbg`, and `anchor`. Font settings
are persisted even on non-text objects. Point/text creation also writes
`otext`; graph creation writes `text`. Containers hold `multi`, `z`, `rev`,
`fwd`, and `e`; graph containers additionally hold `h` and `cut`.

Linear objects store one item per covered column. Regions store per-row
containers linked through `rev`/`fwd`, with one item per covered cell. A region
can therefore represent sparse selected cells, not only a bounding rectangle.
`MultiRect` and `MultiBox` are creation commands, not additional persisted types:
`CreateObject` strips the prefix and creates linked `Rect` or `Box` records.

`InsertGraph` (2843) clips to optional bounds, applies optional logarithms,
normalizes samples, maps residue numbers to columns, then calls `_CreateGraph`.
Gradient and binary types scale to one; other graphs scale to their height.
The saved `text` samples and `cut` are already transformed drawing values.
The original dynamic range may appear in a derived row comment; the original
measurement array and transformation options are not separate saved fields.
Do not relabel saved graph values as original scientific measurements.

The bundled plugins have no `NewObType` or `objectdata` references. Graph-producing
plugins reuse core types: `tAddGraph` selects class 3 through `_ObTypeList`,
`cColBfac` defaults to `GradGraph`, and `tAddDisEmbl` and `tAddSecStruct` call
`InsertGraph` with `LineGraph`. `tAddSignalP` creates `BarR`, `Box`, `DownArrowR`,
and `Coil` through `CreateObject`. This establishes the bundled drawable type
set; it does not complete the audit of other plugin-owned row/cell fields.

The actual save path calls `_CopySeq` (4497) before `savepackaline`. It removes
cell/title/object-item `tk` handles and row `ntk` handles, then converts object
pointers to index pairs. Those Tk handles are runtime resources, not document
properties. Cached scalar coordinates may remain in copied records. The oracle now exercises `_CopySeq` and `_ObjPtrToId2` directly with linked
sparse regions, handle-bearing cells and titles, and differing display/array
positions. It verifies packed save-copy round trips, link conversion, runtime
handle exclusion, and history-copy isolation for title, cell and object edits.

## Private numbering fields and derived text

`AlinePlugin.pm` binding type 11 registers private sequence fields by location:
0 is the row, 1 the title, 2 a cell, and 3 an object item. `_LoadPlugins`
checks name conflicts; registration is not a serializer allowlist. The packed
writer saves arbitrary scalar properties in those maps.

`tAddNumbers.plugin` registers three title fields and writes them in `Number`:
`pv_numspc` (spacing), `pv_numsta` (offset), and `pv_numdo1` (include the first
number). `cmbind` offers Recalculate Numbers only for a `%%%Numbers` row with
a nonnegative attachment and all three fields defined. The oracle round-trips
these fields and invokes the unchanged context-menu routine to verify the
recalculation action remains available. Removing the offset field suppresses
that action. Actual recalculation and its UI remain separate parity work.

`tAddConsensus.plugin::Consensus` writes `%%%Consensus` and a comment containing
its group definition and cutoffs. It stores uppercase residues, lowercase
residues, group symbols, or dots in cell `text`. The oracle preserves this
mixed text without protein normalization. Consensus dialog settings are local
variables; the plugin does not persist a structured recalculation configuration.
Do not confuse numbering metadata with a general derived-analysis recipe.

## Older files and remaining verification

`UndumpDataFile` also recognizes `### Aline 1.0, ` Data::Dumper files and
historically evaluates their Perl content. Atlas must use a restricted data
reader, never evaluate imported code. The historical reader warns that old
top-level `@obj` data cannot be interpreted; that warning is not evidence that
Atlas may silently discard it.

Run `npm run test:aline-oracle` with Perl and its core `Test::More` module.
The harness extracts the three serialization functions and two copy/link helpers from the trusted
repository source, plus the numbering plugin context-menu routine, and never
evaluates a project file. It creates synthetic
records in memory and reads the bundled `rada.aline` as raw bytes. Its 134
assertions cover numbering states (including explicit zero, negative and
fractional values), extended/high-byte keys, styles, row attachments, object
links, graph samples, palette compression, LF/CRLF/CR input, a complete decoded
round trip of the bundled project, and every historical error code (1–17).
It requires no Tk, network, external packages or generated fixture files.

The oracle exposes a historical defect: Perl's default `split` discards trailing
empty fields, so an empty final `text` dictionary value becomes an absent key.
This loss is asserted explicitly, not treated as successful preservation. Atlas
must preserve empty values in its own project format. The historical reader is
not a strict validator: its error codes do not establish protection against all
malformed values, invalid links or resource exhaustion.

The characterization checkpoint remains open pending an exhaustive
property/type inventory including plugins, additional representative projects,
and strict modern malformed-input contracts. Atlas currently skips parameters, object dictionaries, object
records and palettes, and drops derived rows (`src/core/project.ts`). Full
compatibility requires these gaps to be resolved and tested.
