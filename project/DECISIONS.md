# Journal des décisions produit et techniques

## D-001 — ALINE comme référence comportementale

**Décision :** `aline_011208/`, cœur et plugins compris, est la référence pour
la portée fonctionnelle d’Atlas Alignement.

**Conséquence :** aucune parité complète ne peut être annoncée à partir de la
seule interface visible. Les formats, menus, commandes, objets et traitements
des plugins doivent être audités et vérifiés.

## D-002 — Moderniser les mécanismes obsolètes

**Décision :** reproduire le besoin et le résultat utile, mais pas les
dépendances cassées ou les limitations de 2008.

**Exemples :** remplacer les anciennes URL de services, produire directement
SVG/PDF plutôt que dépendre de PostScript et Ghostscript, et utiliser des
mécanismes multiplateformes pour l’impression et les exécutables externes.

## D-003 — Vue Classic par défaut

**Décision :** la vue Classic ALINE est le rendu initial. La vue Modern reste
disponible tant qu’elle partage le même document et les mêmes commandes.

## D-004 — Noms répétés par défaut

**Décision :** afficher les noms des protéines dans chaque ligne de nage par
défaut, avec une option pour ne les afficher que dans le premier bloc.

## D-005 — Organisation des trois lignes supérieures

**Décision :** chaque ligne de nage réserve trois lignes au-dessus des
séquences : numérotation en première ligne, structures secondaires en deuxième
ligne et troisième ligne libre pour de futures annotations.

Les cylindres et ressorts sont créés en sélectionnant l’outil, puis une case de
départ et une case de fin.

## D-006 — Mémoire opérationnelle versionnée dans le dépôt

**Décision :** l’objectif, l’état, le plan et les décisions sont stockés dans
`project/`, séparément de la documentation fonctionnelle et technique conservée
dans `docs/`. La mémoire personnelle ou l’historique de conversation peuvent
aider, mais ne constituent pas la source de vérité technique.

**Raison :** cette séparation rend la boucle de travail immédiatement lisible
par Codex, OpenCode et les humains, sans créer une deuxième série de documents.
Un éventuel vault personnel externe sert au contexte transversal entre projets ;
il ne remplace pas la mémoire vérifiable propre à Atlas et versionnée avec son
code.

## D-007 — Architecture moderne modulaire

**Décision :** ne pas recopier littéralement la séparation cœur/plugins de
Perl/Tk. Les opérations essentielles appartiennent au cœur moderne. Les outils
externes et fonctions spécialisées utilisent des modules avec des contrats
stables, pouvant évoluer vers un système d’extensions contrôlé.

## D-008 — Consensus comme ligne d’annotation riche

**Décision :** ne pas stocker le consensus ALINE comme une protéine ordinaire.
Il peut contenir des minuscules, des symboles de groupes et des points. Il sera
introduit avec le modèle Atlas version 2 comme ligne d’annotation attachable,
afin de préserver sa sémantique et son export sans contaminer les analyses qui
doivent uniquement utiliser les séquences protéiques.

## D-009 — Régions 2D distinctes des annotations linéaires

**Décision :** les boîtes et rectangles sont stockés dans
`AlignmentDocument.regions`, avec leurs séquences cibles, leurs bornes, leurs
couleurs de contour et de remplissage, et leur épaisseur. Les structures,
traits et glyphes des pistes supérieures restent dans `annotations`.

**Compatibilité :** un fichier `.atlas` version 1 sans champ `regions` reste
valide et reçoit une liste vide lors de son ouverture.

## D-010 — Textes attachés aux pistes d’annotation

**Décision :** `Text` et `OutlineText` sont des objets distincts des structures
linéaires. Ils occupent une position d’ancrage sur une piste et conservent leur
contenu, alignement, police, taille, graisse, italique, couleur et contour. Par
défaut, leur outil dessine sur la troisième ligne supérieure réservée aux
annotations libres.

## D-011 — Ordre global des objets graphiques

**Décision :** structures, glyphes, régions et textes partagent un même ordre
de calques numérique. Les objets plus anciens sans `zIndex` restent lisibles ;
la première opération de réordonnancement consolide l’ensemble en rangs
contigus, comme `_ConsolidateZ` dans ALINE.

## D-012 — Couleurs manuelles persistantes par cellule

**Décision :** les couleurs manuelles sont des surcharges clairsemées liées à
`sequenceId + column`, avec texte et fond indépendants. Elles ont priorité sur
le schéma calculé sans le détruire, suivent les résidus lors des insertions ou
suppression et sont enregistrées dans `.atlas`. Cette représentation évite de
dupliquer un style pour chaque cellule non modifiée.

## D-013 — Lire les palettes ALINE sans évaluer leur code Perl

**Décision :** les fichiers `.alc` historiques ressemblent à du code Perl et
ALINE les charge avec `eval`. Atlas n’exécute jamais leur contenu : un parseur
restreint extrait uniquement les catégories attendues, normalise les couleurs
Tk 16 bits et rejette les fichiers sans structure valide. La sauvegarde reste
compatible avec ALINE, tandis que l’ouverture d’une palette provenant d’un
tiers ne peut pas déclencher de code arbitraire.

## D-014 — Un contrat de vérification par capacité de parité

**Décision :** chaque identifiant de `aline-parity-matrix.md` possède dans
`parity-verification-plan.md` un contrat indiquant au moins un type de preuve,
une procédure reproductible et un résultat observable. Les preuves admises
sont les tests automatisés, les fixtures versionnées, les rapports de
vérification manuelle et les décisions documentées de remplacement ou d’écart.

**Conséquence :** un test documentaire compare les identifiants des deux
fichiers et rejette les contrats manquants, dupliqués ou insuffisamment précis.
Ajouter une capacité à la matrice impose donc de définir sa vérification dans le
même changement.

## D-015 — Separate historical wire data from the Atlas document model

Characterize `.aline` records before extending the rich document importer.
Preserve the distinctions between cell text, graph payloads, row attachments,
object links, and absent/undefined/explicit numbering in compatibility tests.
The wire-format reference is `docs/aline-packed-format.md`; it does not confer
implemented parity. Imported Perl-style data must never be executed.

Preserve plugin-produced explicit styles and objects even when the historical
file contains no calculation recipe. Do not infer an analysis mode from its
appearance. Preserve undefined row numbering starts for explicit numbering
arrays, since a defined start enables sequential regeneration in ALINE.

Treat cell array indices as alignment columns and object-item `xpos` as object
coverage. Retain a historical cell `xpos` as compatibility metadata rather than
using it to reposition residues. Runtime canvas handles are excluded.

## D-016 — Run a bounded historical serialization oracle

Use the unchanged repository's `savepackaline`, `n2a64`, and `loadpackaline`
routines, plus `_CopySeq` and `_ObjPtrToId2`, as test references without
initializing the Tk application. The numbering plugin context-menu routine
is also a bounded reference for persisted recalculation prerequisites. The PDB
plugin parser and its residue lookup strings provide a bounded reference for
fractional numbering persistence. Evaluate
only those trusted source routines; read project bytes as data. Keep synthetic
fixtures in the test harness and compare decoded structures because historical
hash serialization order varies. Record legacy data-loss defects explicitly
instead of making them Atlas persistence requirements.

## D-017 — Preserve historical graph drawing values without inventing raw data

Packed graph samples are the output of `InsertGraph` normalization and optional
logarithmic scaling. Preserve those drawing values and any original-range row
comment during import. Do not infer recoverable raw measurements or processing
options that the historical file did not store. Core region containers can
cover sparse cells and span linked rows; their importer must preserve that
coverage rather than silently filling a bounding rectangle.

## D-018 — Independent vertical scrolling for tools and alignment

The tools sidebar and alignment workspace each own a vertical scroll container.
Scrolling either area must not move the other area or the application layout,
including when reaching a scroll boundary. Keep the application within the
viewport and verify both areas independently in the running browser. This is
a durable product requirement from user steering, applicable to both views.

## D-019 — Validate historical input before changing the active document

The rich `.aline` reader must follow the strict contract in
`docs/aline-packed-format.md`, rather than treating historical loader success as
proof of valid input. Preserve unknown scalar data inertly, report unsupported
semantics, and reject malformed structure without changing document or history.
Recompute derived layout caches from validated settings. Historical silent
truncation is a defect to diagnose, not behavior to reproduce.

## D-020 — Record corpus provenance and coverage limits

Historical corpus provenance must distinguish original saves from authored
compatibility fixtures. A synthetic Data::Dumper specimen does not establish
complete old-version coverage. Never execute a specimen to infer its data.

## D-021 — Preserve old-file references symbolically

The data-only legacy reader returns tagged containers and symbolic reference
paths, preserving cyclic links without constructing cyclic JavaScript objects.
Keep unknown old top-level objects with a warning. Syntax parsing is separate
from scientific record validation and conversion into an Atlas document; parser
success alone does not imply a fully supported project.

Resolve aliases when locating reference-fixup parents and targets, with the
same cycle and indirection limits used for validation. Keep the resulting links
symbolic so the intermediate representation remains serializable.

## D-022 — Modernize local tool invocation while retaining scientific identity

Use version-aware MAFFT/MUSCLE and PDB-REDO DSSP adapters. Retain supported CCP4
Chainsaw and all three pruning modes rather than replacing its scientific
operation unnecessarily. Execute through an isolated, cancellable local-job
boundary with explicit arguments and validated results. The source audit and
remaining verification gates are in `docs/aline-integration-modernization.md`.
These choices do not confer implemented parity or identical algorithm outputs
across versions; constraints and historical alternatives remain in scope.

## D-023 — Preserve provider identity and scientific meaning in modern workflows

Use UniProt REST, NCBI EFetch, RCSB coordinate downloads and EBI Job Dispatcher
BLAST+ for the corresponding retrieval/search workflows. Use current SignalP
result import and a user-installed local package, retaining model provenance and
the historical annotation choices without claiming identical version-3 results.
Keep PyMOL colour scripts; replace print and automation mechanisms through the
shared rendering and command layers. Exact contracts and provider references
are in `docs/aline-integration-modernization.md`.

IUPred3 is proposed for disorder prediction but has not been accepted as a
replacement for the three DisEMBL definitions. Preserve original tracks and
label new methods honestly. This decision and incomplete structural alignment
remain open; neither is a prerequisite for designing the rich document model.

## D-024 — Rich rows preserve cell text, number states and attachment identity

Version-2 rows distinguish sequences from annotations, with stable identifiers,
explicit cell text and absent/null/finite number states. Recalculate automatic
numbering explicitly; fixed rows retain their snapshots. Keep coordinate residue
identity separate from displayed numbering. Attachments use stable row IDs and
propagate edits through connected groups, including historical cycles/self-links
that `_AttachmentForX` handles. Reject dangling or duplicate identities.

`docs/atlas-v2-format.md` and `src/core/richRows.ts` define the initial contract.
The historical oracle now also evaluates the bounded `_FillSeqnum` and
`_AttachmentForX` routines from unchanged trusted source. Application adoption
requires full validation, migration, command/history and rendering integration.

## D-025 — Rich object segments preserve sparse item-level data

Represent row-local object segments with stable reciprocal segment IDs, keeping
their own layer, multi flag and ordered item coverage. Items preserve individual
type, style and optional text/sample; do not collapse sparse coverage into a
bounding rectangle. Store saved graph values explicitly in drawing space, with
height/cutoff and no invented raw measurements. Keep unknown metadata inertly
in bounded compatibility data and reject unknown fields outside that storage.
`docs/atlas-v2-format.md` defines component-parser limits and remaining full
document validation, migration and rendering obligations.

## D-026 — Menus remain above alignment content and dismiss naturally

Header menus must render above the alignment grid and all graphic layers.
Opening another header menu closes the previous one; interacting outside,
choosing an action or pressing Escape dismisses the open menu. Interacting with
embedded controls inside a menu keeps it open. Preserve independent pane
scrolling and existing modal backdrop dismissal. This is user steering from
2026-09-16, prioritized ahead of the in-progress version-2 persistence work.

## D-027 — Compact sidebar controls

Use compact tool buttons and section spacing to expose more tools in limited
vertical space. Keep visible labels, selection feedback and independent sidebar
scrolling. This is a presentation preference, not a document or history change.

## D-028 — Preserve analysis provenance independently of drawing samples

Version-2 documents retain input cell snapshots, provider/method/version,
parameters and raw measurement series separately from transformed graph values.
Source edits must not rewrite historical measurements; deleting a source row
clears its live reference while retaining its snapshot. The JSON boundary rejects
duplicate members and values that would be silently dropped or coerced. Preserve
unknown data explicitly; parsing does not imply supported rendering or complete
legacy import. See `docs/atlas-v2-format.md` for limits and adoption requirements.

## D-029 — Preserve version-1 source during explicit migration

Convert the validated version-1 visible document to rich rows and linked object
segments with deterministic collision-safe IDs. Retain its complete decoded
source in compatibility.atlasV1Source, including unknown fields and pre-normalized
text. Report layout defaults because version 1 did not persist view settings.
Keep its numbering snapshot; later explicit recalculation uses rich-row rules.
Application adoption must surface migration diagnostics before saving version 2.

## D-030 — Atomic rich column edits retain metadata and provenance

Global column edits move complete cells and sparse object coverage together.
Keep empty linked segments to preserve their metadata and valid references.
Saved numbering and raw analysis snapshots are unchanged by column remapping;
recalculation is explicit. Validate the candidate before adding a history entry.

Row-local splices propagate once through the complete attachment component.
They may grow document width but do not crop unrelated content on deletion.
Contiguous-object insertion growth remains distinct from sparse remapping.

Insertion growth follows historical registry bit 1 and also applies to Atlas's
solid Line. Duplicate the right boundary item's properties only where the prior
item is adjacent. New cells may inherit left text style or an explicit default;
they never inherit residue identity, number or compatibility metadata, and their
anchor resets to center. Graph measurements are never interpolated by insertion.

Row deletion repairs surviving object links, detaches dependent rows and keeps
analysis snapshots with null source-row references. Property updates do not
implicitly recalculate saved numbering; renumbering is an explicit command.

Row insertion uses explicit array and layout positions. Reordering moves stable
IDs between existing layout slots without retargeting references or normalizing
fractional positions. Wider inserted rows expand the document without padding
unrelated rows.

## Open decisions

- conteneur desktop final : Tauri, Electron ou autre solution ;
- moteur de rendu des grands alignements : DOM virtualisé, Canvas, SVG hybride
  ou combinaison ;
- limites exactes de compatibilité visuelle et aller-retour avec `.aline` ;
- services modernes retenus pour BLAST, SignalP et prédiction de désordre ;
- stratégie de distribution et de mise à jour sur les trois systèmes.
