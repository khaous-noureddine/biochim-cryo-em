# ALINE packed state R001

## Characterization audit — 2026-09-13

The phase-0 format characterization and initial corpus are established. This
means the known record families and their verification contracts are defined;
it does not mean Atlas can import and edit every historical project yet.

| Requirement | Evidence | Remaining implementation or coverage |
| --- | --- | --- |
| Cells, titles, fonts and numbering | Full-field historical round trips, four numbering states, PDB-derived fractions | Rich model, validated conversion, editing and export |
| Objects and graphs | All 36 registered types; sparse linked regions; transformed graph samples | Faithful rendering, interaction and undo/redo |
| Attachments and links | Save-copy index conversion and isolation; older-dialect symbolic references including aliases used by fixups | Stable document identifiers and editing propagation |
| Palettes and layout | Compression/inheritance and all thirteen settings/caches | Rich project mapping and layout validation |
| Bundled plugins | All 30 persisted-output entries, including private numbering fields | Individual scientific producer and UI verification |
| Packed syntax and malformed data | Seventeen historical error codes, high-byte/extended keys, line endings, explicit silent-loss observations | Strict byte reader and atomic application import |
| Older syntax | 23 data-only reader tests, original loader source review | Unsupported Perl constructs receive errors; unknown old objects remain retained; original pre-R001 corpus breadth remains unproven |
| Saved specimens | Original rada plus authored minimal, sparse-region/graph and older-dialect inputs with provenance | Expand with real-world projects during rich import and final compatibility verification |

The audit found and corrected alias resolution for fixup parents and targets:
the regression failed before the fix and passes afterward. Reference-only cycles
and invalid paths remain rejected. The initial corpus intentionally combines
original and authored specimens; it must not be described as exhaustive
historical-version coverage. Track those limits through phase 1 import and
phase 9 release verification rather than claiming parity from parser tests.

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

### Core property inventory and fixture coverage

The packed writer serializes the following core record families. The inventory
comes from `InsertRow`, `InsertSequence`, `_InsertCells`, `_DefrayEnds`,
`CreateObject`, `_CreateGraph`, `_PropertyWindow`, `_ApplyEdits`, `PrintSeq`,
`_CopySeq`, and the packed writer/reader. Dynamic extension fields are preserved
as scalar key/value data; this is not a closed allowlist for imported files.

| Record | Core properties | Existing oracle coverage |
| --- | --- | --- |
| Document | `csh csv lin all ofx ofy nch fsi num agr`, derived `_dpl _fnx _inx` | All thirteen numeric settings; scalar/array extension parameters |
| Row | `p n t e o`; runtime `ntk` | Differing display/index order, numeric/undefined start, rows with cells and objects, handle exclusion, extra scalar field |
| Title | `text comment attach titlefill titlefoundry titleslant titlewidth titlesize titleweight anchor`; runtime `tk` | Fully styled title, detached/attached rows, derived names, private numbering metadata, handle exclusion |
| Cell | `text seqnumber fontfill fontfoundry fontslant fontwidth fontsize fontweight fontbg anchor xpos`; runtime `tk` | Fully styled cell, numbering states, mixed text, high-byte dictionary variants, handle exclusion |
| Object container | `multi z rev fwd e`; graph `h cut` | Linked sparse regions, all graph types, transformed samples, extra scalar field, copy isolation |
| Object item | `type xpos lc fc lw fontfill fontfoundry fontslant fontwidth fontsize fontweight fontbg anchor`, `text` or `otext`; runtime `tk` | All 36 types with every style field, text/graph payload distinctions, handle exclusion |
| Palette | Threshold plus eight category fields | Equal-field and prior-category compression, terminal category, full bundled-project round trip |

Core display coordinates mainly live inside `tk`/`ntk` arrays and are removed
by `_CopySeq`. Cell `xpos` is initialized by core creation and retained by the
serializer; it is not the cell's authoritative alignment column, which is its
array index. Object-item `xpos`, in contrast, is authoritative coverage data.
The synthetic `ypos` in the copy fixture tests arbitrary scalar preservation;
it is not a documented core-created property.

The property editor synthesizes `FONT_title` and `FONT_font` controls that expand
into the component font fields. Those UI control identifiers are not additional
saved properties. `%cfg` includes fonts, canvas/grid colours, tool settings and
external paths, but only values copied into the record families above enter
packed state. `_RefreshAfterLoad` clears history and resets the cursor; neither
history nor cursor is a packed document section.

This completes the R001 core field inventory. Representative saved-file corpus
coverage and the older Data::Dumper dialect still need their own characterization;
neither is implied by the synthetic packed fixtures.

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

See `tests/fixtures/aline/README.md` for saved specimens, provenance and exact
coverage. Two small authored R001 files pass the historical reader and decoded
round trips; the original bundled project has 11 rows and 88 objects. The
illustrative older-dialect fixture is tested by `src/core/legacyData.test.ts`.

The older loader requires assignments to `%par`, `@seq` and `@categories`,
renames those variables, and evaluates the entire input. Consequently its
accepted language is Perl, not a bounded serialization grammar. A modern
reader must recognize data declarations, nested arrays/hashes, numeric/string
literals, `undef` and safe reference fixups as data. Calls, interpolation and
arbitrary statements are not part of that reader. Unknown old `@obj` records
must remain retained with an unsupported-object diagnostic until their shapes
are characterized. No original old-dialect specimen is available locally, so
full historical syntax coverage remains unproven.

`parseLegacyData` now implements an executable data-only contract. It returns
tagged maps/lists, strings, finite decimal numbers, null for `undef`, and symbolic
reference paths. Maps have null prototypes. It accepts the required `%par`,
`@seq`, `@categories` declarations and optional `@obj`, comments, trailing
commas, single/double quoted literals, common escaped controls, octal/hex/Unicode
escapes, inline references and Data::Dumper-style reference fixups. It rejects
interpolation, calls, arbitrary statements, duplicate keys/declarations,
ambiguous leading-zero numbers, invalid paths and fixups that overwrite data.

Reference fixups replace only null or empty-container placeholders. Cyclic
object relationships stay symbolic and JSON-serializable; reference-only cycles
are rejected. A fixture based on output observed from local Perl Data::Dumper
with `Purity(1)` covers linked objects and subsequent alias assignments. No
fixture is executed. Nonempty old `@obj` data is retained with a warning.

Default parser limits are 16 million UTF-16 code units, one million parsed
values/statements, and nesting/path depth 128. Callers can lower limits; depth
has an absolute ceiling of 256 to bound recursion. These are parser guardrails,
not measured alignment capacity promises. Limit and syntax errors include a
character location. The function is pure and does not receive an active
document or history. Integration, scientific record validation, byte decoding,
font validation and document conversion remain in the rich importer checkpoint.
This tested subset is not a claim that every Perl construct ever emitted by
every historical Data::Dumper version is supported.

`UndumpDataFile` also recognizes `### Aline 1.0, ` Data::Dumper files and
historically evaluates their Perl content. Atlas must use a restricted data
reader, never evaluate imported code. The historical reader warns that old
top-level `@obj` data cannot be interpreted; that warning is not evidence that
Atlas may silently discard it.

Run `npm run test:aline-oracle` with Perl and its core `Test::More` module.
The harness extracts the three serialization functions and two copy/link helpers from the trusted
repository source, plus the numbering plugin context-menu routine, and never
evaluates a project file. It creates synthetic
records in memory and reads the bundled `rada.aline` as raw bytes. Its 165
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
and review of the strict input contract against that inventory. Atlas currently
skips parameters, object dictionaries, object
records and palettes, and drops derived rows (`src/core/project.ts`). Full
compatibility requires these gaps to be resolved and tested.

## Bundled plugin persistence inventory

The following inventory covers all 30 `.plugin` files shipped in `plugins/`.
Names in the first column identify those files; function names identify the
write path to inspect. This classifies persisted output, not implemented Atlas
parity or verified scientific results for each plugin.

| Plugin | Write path and packed result |
| --- | --- |
| aColourPicker | `run` reads title/cell/object colours into `_SetWorkColour`; changes working configuration, no new document fields. |
| aDeleteResidues | `run` calls `_DeleteCells`; changes existing cells and associated core objects/numbering through core editing. |
| aProtTool | `run_private` displays calculations; `_FillSeqnum` may populate existing cell numbering, but results are not saved as a new analysis record. |
| cCalCons | `run` calls `_ApplyCat`; calculated conservation becomes cell style fields, not saved score arrays or a recalculation recipe. |
| cCalSim | `run` calls `_ApplyCat`; similarity groups, history and cutoff are plugin-local settings; resulting cell styles persist. |
| cClearSeq | `run` overwrites cell `fontfill`, `fontfoundry`, `fontweight`, `fontbg`; it does not delete graphical objects despite the menu's broad reset wording. |
| cColBfac | `PDB` creates an optional attached B-factor row and core graph; input atom records and averaging choices remain local. |
| cColRes | `run` calls `_ApplyEdits`; the six cell style fields below persist, without a residue-colouring mode identifier. |
| eAddBlast | result insertion calls `InsertSequence`; returned names, sequences, numbering and comments become ordinary rows. Remote request state is not a packed section. |
| eSeqList | `run` and insertion callbacks change row `p`, title `text`/`comment`, insert/delete core rows and copy core state. No private metadata map is registered. |
| fInputPDB | `pdbload` returns names, sequence text and numeric numbering arrays; see the insertion-numbering fixture below. |
| fInputPIR | `pirload` returns names, sequence text, optional numbering start from the name suffix and description; core insertion stores these. |
| mDefaultCM | context-menu callbacks delegate row/object deletion, insertion and property edits to core commands; no menu state is serialized. |
| mDefaultTooltips | `dc`/`dn` read title and numbering data; `_FillSeqnum` may materialize cell numbering. Tooltip strings are not saved. |
| sPrint | `run` builds local page state and external PostScript/print output, temporarily changes canvas display; no private document fields. |
| tAddConsensus | `Consensus` creates a derived row with title/comment and mixed cell text; no structured computation recipe. |
| tAddDisEmbl | `DisEmbl` creates an optional attached row and `LineGraph` objects; predictions survive as transformed graph samples and descriptive text. |
| tAddGraph | `RMSWin` passes local samples/options to `InsertGraph`; graph records and optional generated row persist. |
| tAddNumbers | `Number` writes a derived row and title `pv_numspc`, `pv_numsta`, `pv_numdo1`; these are the only registered private fields in the bundled plugins. |
| tAddSecStruct | `DSSP` creates an optional attached row, core structure objects and optional `LineGraph`; source DSSP/PDB records remain local. |
| tAddSignalP | `SignalPWin` creates `BarR`/`Box`, or an attached row with `DownArrowR`/`Coil`; organism and request state are not a saved recipe. |
| tAlignment | `dropalignment` temporarily rewrites attachments and calls `_DeleteCells`, `_InsertCells`, `_DefrayEnds`; final core cells/objects/attachments persist. External alignment options/results have no separate section. |
| tClearGapCols | `run` calls `_DeleteCells` for gap-only columns; resulting core state persists. |
| tCorrMutations | cluster marking calls `CreateObject('Multi' + selected type)`; sparse linked region objects persist, not the cluster calculation arrays. |
| tFixDbnames | `run` rewrites title `text` and `comment`, preserving identifiers in descriptive text rather than a structured database field. |
| tMatchPattern | search state remains local; marking calls `CreateObject('MultiBox')`, persisting sparse region objects. |
| tPymolColors | `run` exports colours and identifiers to a script; `_FillSeqnum` may materialize numbering, but no PyMOL model/chain settings are packed. |
| tRunChainsaw | `Chainsaw` writes external PDB/PIR files and invokes an executable; no generated model is inserted into document state. |
| tUnattachAll | menu callback and `attachall` write title `attach`; their temporary cluster maps are not persisted. |
| tUndupe | `run` deletes duplicate/fragment rows through `DeleteRowByY`; comparison strings are temporary. |

`AlinePlugin.pm` is the binding infrastructure, `mKeycodeTest.inactive` logs
keyboard events and is not auto-loaded, and `test.dat` is graph input data.
None supplies an additional packed section. Binding type 7 can register object
types, but no bundled plugin uses it; type 11 is used only by `tAddNumbers`.
This conclusion concerns the bundled set, not arbitrary third-party extensions.

`_ApplyCat` (3059) maps palette values into `_ApplyEdits` (3790). For cells,
the latter writes `fontfill`, `fontsize`, `fontfoundry`, `fontslant`,
`fontweight`, `fontbg`. For object items it writes `fc`, `lc`, `lw`,
`fontfill`, `fontsize`, `fontfoundry`, `fontslant`, `fontweight`. Thus rich
import must preserve explicit styles even when the original calculation or
colouring mode is unknown. The existing styled cell and all-type object oracle
fixtures cover serialization of these fields; they do not test each producer.

Source review also exposes behaviors to revisit in their implementation phases:
`cClearSeq` assigns font weight from configuration index 5, although core row
creation uses index 2; `dropalignment` restores attachments with `pop` while
iterating rows forward. These observations require dedicated regression cases
before adopting a corrected modern behavior; they are not accepted parity gaps.

## PDB-derived numbering

`fInputPDB.plugin::pdbload` returns names, sequence strings and numbering arrays;
it adds no private row or cell properties. Chain identity is included in the
name (`Chain A`, or the HEADER identifier followed by `:A`). Residue insertion
codes become fractions: the residue number plus 0.0001 times the insertion
index. Duplicate number/index pairs increment the index until unused. Thus a
stored value such as 1.0002 does not prove that the original insertion code was
B: it can also result from duplicate A records. Preserve the stored numbering
without inventing the original structure identifiers.

`InsertSequence` sets row `n` to undefined when given an explicit numbering
array. This is essential: `_FillSeqnum` rewrites all cell numbers sequentially
whenever row `n` is defined. The PDB fixture therefore uses undefined `n`, matching
core insertion, so later display/export cannot erase its insertion fractions.

The oracle executes the unchanged parser with a synthetic single-chain input.
It verifies duplicate insertions, unnumbered gaps, exclusion of alternate B
locations, stopping at ENDMDL, and a packed round trip of the resulting row.
This is a persistence fixture, not full PDB import parity: multi-chain batching,
all residue mappings, malformed inputs and the Atlas UI remain to be verified.
The parser routine and its two residue lookup strings are extracted from trusted
repository source; input PDB records are never evaluated.

## Strict Atlas reader contract (implementation pending)

Historical acceptance is insufficient validation. The oracle demonstrates that
an unmatched title key and one leftover cell byte are silently ignored. The
modern reader must reject both with a section and row location. These rules
apply to the forthcoming rich reader; the current partial importer does not
satisfy them yet.

- Parse bytes without replacing high-byte dictionary identifiers. Accept the
  documented CR, LF and CRLF separators; require a supported revision and all
  section terminators. Consume every record and every cell-stream byte.
- Require complete key/value pairs, unique dictionary identifiers and unique
  keys within maps. Preserve trailing empty values instead of dropping them.
  Require every referenced dictionary entry to exist.
- Require finite numbers for numeric fields; object counts and link indices
  must be nonnegative integers. Validate declared counts against remaining
  input before allocating or iterating. Numbering instructions must be one of
  -1, 0, 1, 2, with a complete finite explicit payload for instruction 2.
- Resolve row attachments and object links after parsing. Require detached
  attachment -1 or an existing row index, and either two undefined link markers
  or two valid row/object indices. Diagnose broken or inconsistent chains;
  traversal must detect cycles rather than recurse indefinitely.
- Validate palette field counts and inheritance sources. A first category
  cannot inherit from a nonexistent preceding category. Preserve the terminal
  category convention and distinguish empty fields from inheritance markers.
- Keep unknown scalar fields as inert compatibility metadata with an explicit
  unsupported-property diagnostic; never interpret them as code or merge them
  into application prototypes. Unsupported object types require an explicit
  diagnostic and retained source data, not silent deletion.
- Apply explicit input-size and expanded-record limits before constructing the
  document. A limit failure must explain the resource limit, leave the current
  document and history unchanged, and offer no partially imported success.
  Exact limits require measurement during importer implementation.
- Parse into an isolated intermediate representation, validate it, then replace
  the active document atomically. Test each rejection with current-document and
  undo/redo preservation when the reader is integrated.

`_UpdateParameters` (1900–1902) computes `_dpl=(1-all)*lin`,
`_fnx=nch-all*lin`, and `_inx=1/_fnx`. These three caches are serialized alongside
all ten default settings; the oracle now verifies all thirteen numeric values.
Atlas should retain their source values as compatibility metadata but recompute
layout from validated settings. Require positive effective wrap width before
calculating its reciprocal. `fsi` is a font scale (the UI displays 100 times its
value), not an absolute font size. Global `%cfg`, selection and undo stacks are
not standalone packed sections.
