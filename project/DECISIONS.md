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

## D-016 — Run a bounded historical serialization oracle

Use the unchanged repository's `savepackaline`, `n2a64`, and `loadpackaline`
routines, plus `_CopySeq` and `_ObjPtrToId2`, as test references without
initializing the Tk application. The numbering plugin context-menu routine
is also a bounded reference for persisted recalculation prerequisites. Evaluate
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

## Open decisions

- conteneur desktop final : Tauri, Electron ou autre solution ;
- moteur de rendu des grands alignements : DOM virtualisé, Canvas, SVG hybride
  ou combinaison ;
- limites exactes de compatibilité visuelle et aller-retour avec `.aline` ;
- services modernes retenus pour BLAST, SignalP et prédiction de désordre ;
- stratégie de distribution et de mise à jour sur les trois systèmes.
