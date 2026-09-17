# État actuel d’Atlas Alignement

## Current checkpoint — 2026-09-17

The version-2 document envelope and data validator are implemented, including
layout, palettes, row/cell compatibility metadata and analysis provenance.
Raw measurements reference retained input snapshots independently of current
alignment geometry; historical drawing samples stay explicitly transformed.
Strict JSON parsing rejects duplicate names and numeric overflow/underflow;
serialization rejects silent coercion and preserves signed zero. Thirty-one
document tests and seventeen JSON tests cover complete round trips and invalid
references/data. Full validation: 177 Vitest tests, 171 historical assertions
and production build pass. No UI changed; the application still uses version 1.
The next checkpoint is explicit version-1 migration, followed by application
adoption and rich legacy conversion. Rendering style support, command/history
integration and full ALINE parity remain incomplete.

## Previous checkpoint — 2026-09-16

Compact sidebar styling is verified: tool buttons are approximately 42–43px high,
icons are 32px wide, and section/panel padding is reduced. Demo sidebar content
height decreased from 1311px to 1051px at the default width. Browser checks at
1280 by 800 covered 258px and 198px sidebar widths, readable wrapping without
button overflow, Cylinder selection and separate sidebar/alignment scrolling
(alignment remained at zero during sidebar scrolling; sidebar remained at 306
during alignment scrolling; window stayed at zero). No document, persistence or
undo/redo behavior changes. All 145 current-worktree tests and production build
pass. Resume the separate unfinished version-2 model checkpoint after this fix.

Priority menu correction is verified. The header's stacking context now sits
above an isolated workspace, preventing classic grid/annotation layers from
painting white stripes across dropdowns. Colors, Tools and Export dismiss on
outside pointer/focus interaction, action selection or Escape; opening another
menu closes the previous one. Embedded controls remain usable, and tall menus
scroll within the viewport. This changes transient UI only, with no persistence
or undo/redo state changes.

Browser verification on localhost:5173 at 1280 by 800 passed: classic and modern
menu layering, all three menu switches, outside click, Escape with summary focus,
inside interaction, action dismissal and Manage sequences backdrop dismissal.
At 150% zoom, sidebar scrolling changed only its offset (0 to 579); alignment
scrolling then changed only its offset (0 to 565.5). Window and header stayed at
zero, including scrolling to the pane boundaries. Full current-worktree tests
pass (145 tests, including 16 in-progress version-2 JSON tests); production build
passes. The version-2 files remain a separate unfinished change. Resume the
document envelope/layout/palette/provenance checkpoint next; full parity remains
incomplete.

## Previous checkpoint — 2026-09-13

The rich-object component contract is implemented in `src/core/richObjects.ts`:
all 36 historical kinds plus Atlas Line, sparse ordered coverage, independent
item styles, stable reciprocal links and drawing-space graph samples. Twenty-one
tests verify exact registry coverage, data round trips and rejection/retention
boundaries. Full verification: 129 Vitest tests, 171 historical assertions and
production build pass. No UI changed; the application still uses version 1.
Next: document envelope, layout/palette/provenance and full row/object validation,
then migrations and application adoption. The overall version-2 checkpoint
and full parity remain incomplete; the disorder question remains pending.

Version-2 row primitives are implemented in `src/core/richRows.ts`, with the
contract in `docs/atlas-v2-format.md`. Eleven new tests cover immutable numbering,
all saved number states, styles/coordinate identity and attachment traversal,
including cycles and a 20,000-row chain. Six matching historical assertions
exercise unchanged `_FillSeqnum` and `_AttachmentForX` source. Full verification:
108 Vitest tests, 171 historical assertions and production build pass.
This is a model foundation: the application still uses version 1, so browser
verification and command/history integration are not claimed. Next: complete
the object/graph/style/layout/provenance contract and validated version-2 model.
The disorder replacement question remains pending independently.

Remote retrieval/search, SignalP, PyMOL, print and automation contracts are now
recorded in `docs/aline-integration-modernization.md`, with legacy source review
and official provider documentation. A question about the proposed IUPred3
replacement is pending user biological direction; no acceptance is inferred.
Incomplete structure-guided/regional alignment also remains unresolved, with
no accepted omission. These choices block their own parity claims, not phase-1
model work. The next independent checkpoint is the version-2 document design.
Documentation validation: 97 Vitest tests and production build pass; no running
application behavior changed and no external scientific job was submitted.

The alias-fixup checkpoint was committed and pushed as `3f3b914`. The next
integration audit has established local adapter directions for MAFFT/MUSCLE,
PDB-REDO DSSP and supported CCP4 Chainsaw, with source anchors, current provider
references and reproducible execution gates in
`docs/aline-integration-modernization.md`. No executable integration is claimed.
Remote services, export and automation remain the next eligible audit step.
Validation for the local-adapter documentation: 97 Vitest tests and production
build pass; no UI or persistence behavior changed.

Phase-0 format characterization and the initial saved-project corpus have been
audited against core fields, all 36 objects and all 30 plugins. The audit in
`docs/aline-packed-format.md` separates established evidence from remaining
rich-import, rendering and scientific workflow work. Historical-version corpus
breadth remains limited and must expand during compatibility verification.

The audit found a valid older-dialect fixup through aliases that the reader
rejected. A failing regression now passes after dereferencing fixup parents and
targets with cycle checks. Verification: 97 Vitest tests (23 older-reader tests),
165 historical assertions and production build pass. No application UI changed.

Next eligible checkpoint: classify obsolete integrations and choose maintained
replacements, then proceed to the version 2 document model. Earlier evidence
below is historical; this section defines the current continuation point.

## Active user steering — independent scrolling

D-018 and the priority checkpoint in `project/PLAN.md` were recorded before
coding. `src/styles.css` now constrains the application to the viewport, lets
the sidebar and alignment shrink within their layout tracks, uses independent
vertical overflow, and contains scroll chaining at their boundaries. The editor
toolbar retains its natural height, including wrapping at narrow widths.

Validation: all 74 Vitest tests and the TypeScript/Vite production build pass.
Browser verification passed in the connected in-app browser at 1280 × 720,
using a synthetic FASTA with 40 rows and 200 positions. Classic: sidebar moved
from 0 to 631.5 while alignment stayed at 0; alignment then moved to 1440 and
6505 while sidebar stayed at 631.5. Additional downward boundary scrolling
changed neither pane. Modern: sidebar returned to 0 while alignment stayed at
629; alignment returned to 0 while sidebar stayed at 0. Additional upward
boundary scrolling changed neither pane. Throughout, page scrollY stayed 0,
topbar top stayed 0, and editor top stayed 92. Visual inspection confirmed
separate scrollbars and a fixed header. This layout-only change does not alter
document persistence or undo/redo. The synthetic input was temporary.

The independent-scroll checkpoint is verified. Resume the remaining ALINE
core/plugin property inventory and strict input contracts. Unrelated changes
remain excluded from this checkpoint.

## Resume evidence — 2026-09-12

The first unfinished phase-0 checkpoint remains `.aline` characterization.
The executable historical oracle (`npm run test:aline-oracle`) now passes 165
assertions, including a complete decoded round trip of bundled `rada.aline`,
synthetic rich records, alternate line endings, and all 17 loader error codes.
All 36 registered drawable types now have styled serialization fixtures;
`docs/aline-packed-format.md` records their properties, sparse region layout,
graph scaling, plugin producers, and the save-path handle exclusions.
Save-copy fixtures now verify index-based links, sparse regions, all four
handle exclusions and history-copy isolation without modifying live data.
Numbering and consensus fixtures now preserve private recalculation fields and
non-protein text; the historical context menu enables recalculation after reload
and suppresses it when required metadata is missing.
It exposes the historical loss of trailing empty dictionary values. Next work
is the exhaustive core/plugin property inventory and strict modern input
contracts; rich Atlas import is still incomplete.

Latest validation-contract checkpoint: all thirteen default/derived layout
settings have numeric round-trip assertions. Two malformed records demonstrate
historical silent loss. The packed-format reference now specifies strict
structural, numeric, reference, palette, resource and atomic-import validation.
These are requirements for the rich reader, not claims of implemented import
validation. All 152 oracle assertions, 74 Vitest tests and the production build
pass. No UI behavior changed. The remaining property/plugin inventory and
representative corpus remain open.

PDB persistence checkpoint: the unchanged plugin parser produces fractional
insertion numbering, resolves duplicate insertions by incrementing the fraction,
inserts unnumbered gaps, excludes alternate B locations and stops at ENDMDL.
The resulting synthetic row survives packed persistence. Original insertion
codes cannot be uniquely reconstructed from those fractions. The broader PDB
workflow remains unimplemented in Atlas. Verification: 155 oracle assertions,
74 Vitest tests and the TypeScript/Vite production build pass; no UI changed.

Plugin persistence inventory now covers all 30 bundled plugins, the API module,
inactive key diagnostic and graph input data in `docs/aline-packed-format.md`.
Outputs use core styles, rows, numbering, attachments and objects; only the
numbering plugin registers private fields. Scientific producer workflows remain
separate parity work. Source review identified font-reset indexing and alignment
attachment restoration behavior requiring regression cases in later phases.
The PDB fixture now correctly uses undefined row `n`, matching `InsertSequence`
for explicit numbering arrays and preventing later sequential renumbering.
Verification: 155 oracle assertions, 74 Vitest tests and production build pass.
Next: finish the core property inventory and representative corpus coverage.

R001 core field inventory is now complete in the packed-format reference,
including property-editor font expansion, runtime exclusions and the distinction
between cell index and object `xpos`. Rich fixtures now explicitly cover every
core title/cell style field and an extra object-container scalar. All 155 oracle
assertions, 74 Vitest tests and the production build pass. The remaining format
checkpoint is representative saved-project coverage and the older Data::Dumper
dialect; full import and scientific workflows remain implementation work.

Saved-project corpus now lives in `tests/fixtures/aline/`, with two hand-authored
R001 specimens verified by the historical reader and full decoded round trips.
The provenance record identifies the original bundled sample by SHA-256 and
records its 11 rows, 4,048 cells and 88 objects. An illustrative old-dialect
fixture is present but deliberately not evaluated; no original pre-R001 sample
was found locally. The remaining characterization work is an executable safe
data grammar, reference fixups and retained unsupported old-object records.
Verification: 165 oracle assertions, 74 Vitest tests and production build pass.

The older-dialect data reader is implemented in `src/core/legacyData.ts`, with
22 tests covering the authored fixture, symbolic cyclic links, inline aliases,
escapes, unsupported old-object retention, inert prototype-shaped keys, malformed
input and resource limits. It does not execute Perl and is not yet connected to
the application file-opening workflow. Record semantics and conversion remain
part of rich import. Validation: 96 Vitest tests, 165 historical oracle assertions
and the production build pass. Next: consolidate the characterization evidence
and remaining compatibility limits, then advance toward the version 2 model.

Earlier evidence:
`docs/aline-packed-format.md` now records the source-derived envelope, cache
keys, numbering states, row and object records, links, graph payloads, palettes,
document preferences, and the older Data::Dumper entry point. This is a first
bounded documentation step, not completion of that checkpoint. Next: implement
a historical serializer/loader oracle and fixtures, then audit all persisted
core/plugin property types and malformed-input behavior.

Verification for this documentation step: `npm test` passed all 74 tests in
eight files; `npm run build` passed TypeScript and Vite. No lint script is
configured. No UI behavior changed, so browser verification was not applicable.

The existing untracked verification plan and documentation test were present
on resumption and are preserved, as are README, examples, and `toto.py` changes.

Dernière mise à jour : 11 septembre 2026.

## Checkpoint actif

La spécification exécutable de parité (phase 0) est en cours. Le prochain travail
prioritaire consiste à caractériser complètement le format `.aline`, constituer
le corpus historique et terminer la classification des intégrations obsolètes.

## Reprise rapide

À la reprise d’une session :

1. lire `project/GOAL.md` et `project/PLAN.md` ;
2. vérifier l’état réel avec `git status` et les commandes du projet ;
3. préserver les changements locaux signalés plus bas ;
4. reprendre le premier checkpoint incomplet de la phase 0 ;
5. inscrire ici les preuves obtenues et le prochain checkpoint seulement après
   vérification.

## Blocages nécessitant une intervention humaine

- aucun blocage actif sur le checkpoint courant ;
- les ambiguïtés biologiques et les écarts de compatibilité proposés devront
  être soumis au spécialiste ou au propriétaire du produit.

## Socle disponible

- application React et TypeScript construite avec Vite ;
- modèle de document `.atlas` version 1 ;
- imports FASTA, ClustalW ALN, MSF, BLC et PIR, ainsi qu’un import partiel des
  projets historiques `.aline` ;
- sauvegarde et réouverture `.atlas` ;
- exports FASTA, PIR, MSF et ClustalW ALN ;
- commandes métier séparées de l’interface ;
- historique undo/redo ;
- remplacement d’un résidu, insertion d’un gap et suppression d’une cellule ;
- navigation de cellule avec les flèches, Home et End ;
- sélection rectangulaire par Shift-clic ou Shift + flèches ;
- effacement d’une région en gaps et suppression d’une région avec décalage des
  lignes sélectionnées, le tout compatible undo/redo ;
- commandes internes de renommage et déplacement des séquences ;
- gestionnaire de séquences pour ajouter une ligne vide, renommer, modifier la
  description et la numérotation, réordonner ou supprimer une protéine ;
- vue Modern et vue Classic ALINE, cette dernière étant la vue par défaut ;
- alignements longs découpés en lignes de nage sans défilement horizontal ;
- choix de répéter les noms dans chaque bloc, activé par défaut ;
- colonne des noms adaptée au nom le plus long ;
- sidebar redimensionnable ;
- taille des cellules réglable ;
- colorations monochrome, par type de résidu, par similarité et
  ALSCRIPT/Calcons ;
- couleurs manuelles de texte et de fond, appliquées séparément ou ensemble à
  une sélection rectangulaire, persistées dans `.atlas` et remappées avec les
  résidus ;
- lecture sûre, sauvegarde et édition visuelle des palettes historiques `.alc`
  (ajout, suppression et modification des seuils et couleurs, génération de
  gradients RGB/HSL), application à Similarity/Calcons et persistance dans les
  projets `.atlas` ;
- outils Cylinder, Helix ribbon, Beta strand, Strand ribbon, Spring, Line,
  Dashed line, Connect up, Connect down et Underline avec choix de couleur ;
- placement des structures par une case de départ et une case de fin sur la
  deuxième ligne située au-dessus des séquences ;
- sélecteur des 14 symboles ponctuels historiques (triangles, cercle, étoiles,
  carré, losange, flèches et barre), placés en un clic ;
- persistance des cylindres, flèches de brin beta, ressorts et traits dans
  `.atlas` ;
- sélection de toute structure existante, modification précise de ses positions
  et de sa couleur, et suppression avec undo/redo ;
- création d’une boîte remplie ou d’un rectangle de contour depuis la sélection
  rectangulaire de résidus, rendu dans les vues Classic et Modern, puis édition
  des bornes, couleurs et épaisseur ou suppression avec undo/redo ;
- annotations `Text` et `OutlineText` placées en un clic sur la troisième piste,
  avec contenu, position, alignement, police, taille, graisse, italique, couleur
  et contour persistés et éditables ;
- ordre de calques global partagé par structures, glyphes, régions et textes,
  avec déplacement d’un cran ou directement au premier/dernier plan ;
- nettoyage undo/redo des colonnes entièrement composées de gaps ;
- suppression des séquences dupliquées et, en option, des fragments contenus
  dans une séquence précédente.

## Vérification actuelle

- 74 tests Vitest couvrent le modèle, les commandes, l’historique, les
  colorations et le format de projet ;
- un registre de vérification associe désormais chacune des 75 capacités de la
  matrice de parité à des tests, fixtures, procédures manuelles ou décisions,
  avec un test documentaire qui interdit les entrées manquantes ou vagues ;
- le build TypeScript/Vite passe ;
- les principaux changements d’interface ont été contrôlés dans le navigateur.

## Limitations importantes

- l’import `.aline` récupère les séquences et la numérotation, mais ignore
  encore les objets graphiques historiques ;
- les objets linéaires `helix`, `helix-alt`, `strand`, `strand-alt`, `coil`,
  `line`, `dashed-line`, `connector-up`, `connector-down` et `underline`
  existent dans le modèle Atlas ; les 14 glyphes ponctuels existent également,
  tandis que les régions `box` et `rectangle` et les textes simples/contourés
  disposent du modèle, des commandes, de la persistance et de l’outil visuel ;
- les annotations existantes ne peuvent pas encore être déplacées ou
  redimensionnées directement par glisser-déposer, ni changer de calque ;
- la sélection rectangulaire de cellules existe, mais les sélections complètes
  de ligne et de colonne restent absentes ;
- sélection complète de lignes/colonnes, glisser-sélectionner, copier-coller et
  modes insertion/remplacement encore incomplets ;
- le gestionnaire de séquences ne permet pas encore de coller directement une
  nouvelle séquence ni d’attacher des lignes d’annotation ;
- les nouveaux imports ALN, MSF, BLC et PIR sont testés sur des fixtures
  minimales, mais doivent encore être confrontés à un corpus historique ;
- formats PDB/mmCIF absents ; les exports ALN, MSF et PIR doivent encore être
  comparés à un corpus d’outils tiers et de fichiers historiques ;
- consensus, motifs, propriétés protéiques, graphiques et structures
  secondaires automatiques absents ;
- intégrations MAFFT/MUSCLE, DSSP, PyMOL, UniProt/NCBI et services distants
  absentes ;
- exports SVG, PNG et PDF absents ;
- rendu basé sur de nombreux éléments DOM, sans virtualisation pour les très
  grands alignements ;
- absence de paquet desktop installable pour macOS, Windows et Linux ;
- documentation d’architecture existante partiellement obsolète et à réviser
  au fil de l’implémentation.

## Risques à traiter tôt

- le modèle d’annotations version 1 est trop limité pour représenter tous les
  objets ALINE ;
- modifier la longueur d’une séquence doit aussi décaler proprement les objets,
  régions et numérotations associés ;
- l’architecture de rendu doit être stabilisée avant de multiplier les outils
  graphiques ;
- la compatibilité `.aline` exige des fixtures et des tests issus des projets
  historiques, pas uniquement une lecture visuelle du code Perl.

## Changements locaux appartenant à l’utilisateur

Des modifications non liées existent actuellement dans `README.md` et dans des
fichiers du dossier `examples/`, ainsi que plusieurs exemples PROMALS3D non
suivis. Elles ne doivent pas être incluses dans les commits sans demande
explicite.
