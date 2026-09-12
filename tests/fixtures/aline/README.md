# ALINE saved-project corpus

These fixtures are hand-authored input files, not generated build output.
R001 files contain literal control bytes 3 and 5. Spaces in cell dictionary
keys and at the ends of cell streams are significant; do not trim them.

| Specimen | Provenance | Verification and purpose |
| --- | --- | --- |
| `minimal-r001.aline` | Authored from the R001 writer/reader contract | Historical reader and decoded round trip; one `A-C` row numbered 1, undefined, 10 |
| `linked-graph-r001.aline` | Authored from the R001 writer/reader contract | Historical reader and decoded round trip; two attached rows, linked sparse boxes at columns 0 and 2, graph samples -0.25, 0, 1.5 |
| `legacy-data-dumper.aline` | Illustrative data-only syntax matching the older loader's named assignments; not an original historical save | Pending restricted-parser tests; undefined values, nested hashes/arrays, quoted apostrophe, empty strings and empty old object array |
| `aline_011208/example/rada.aline` (repository root) | Original bundled ALINE demonstration | Historical reader and complete decoded round trip; 11 rows, 4,048 cells, 88 objects, four palette categories; Coil, Helix2, Star, Strand2 and Text |

The original `rada.aline` SHA-256 is
`4edb686a6ad2edeb0daaf6cf7dde8c7b804dce057dc4f6b7e7c76f5dcbd334a9`.
The legacy distribution is excluded by the repository's existing `.gitignore`;
the oracle requires it to be available locally at `aline_011208/`. It is neither
downloaded automatically nor copied into this fixture directory.

Run `npm run test:aline-oracle`. The harness also constructs all 36 object types,
full styles, numbering metadata, palette compression, high-byte/extended keys,
alternate line endings and malformed records in memory. These saved files give
the future Atlas reader stable inputs independent of Perl hash output order.

No genuine pre-R001 saved project was found in the local distribution. The
illustrative Data::Dumper file must never be evaluated. It does not establish
coverage of every historical Data::Dumper option, reference alias or old `@obj`
shape. Those remain explicit compatibility work. The user-edited
`examples/toto.aline` is not part of this reproducible corpus.
