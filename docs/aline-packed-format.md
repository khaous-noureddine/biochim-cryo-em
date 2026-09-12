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

## Older files and remaining verification

`UndumpDataFile` also recognizes `### Aline 1.0, ` Data::Dumper files and
historically evaluates their Perl content. Atlas must use a restricted data
reader, never evaluate imported code. The historical reader warns that old
top-level `@obj` data cannot be interpreted; that warning is not evidence that
Atlas may silently discard it.

The characterization checkpoint remains open pending an executable historical
oracle, representative fixtures covering all wire branches, an exhaustive
property/type inventory including plugins, and explicit malformed-input
contracts. Atlas currently skips parameters, object dictionaries, object
records and palettes, and drops derived rows (`src/core/project.ts`). Full
compatibility requires these gaps to be resolved and tested.
