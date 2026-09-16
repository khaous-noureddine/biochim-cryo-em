# Feuille de route vers la parité complète avec ALINE

Cette feuille de route est ordonnée pour éviter de construire les fonctions
avancées sur un modèle ou un rendu qui devrait ensuite être remplacé.

## Contrat de la boucle

À chaque itération, l’agent doit :

1. lire `project/STATUS.md` et sélectionner le premier checkpoint incomplet dont
   les prérequis sont satisfaits ;
2. auditer les sources historiques concernées avant de modifier Atlas ;
3. définir le comportement observable et sa preuve ;
4. implémenter le plus petit changement cohérent, y compris persistance et
   undo/redo lorsqu’ils sont concernés ;
5. exécuter les tests pertinents, puis le typage, le lint et le build disponibles ;
6. vérifier le parcours utilisateur dans l’application lorsque cela apporte une
   preuve supplémentaire ;
7. mettre à jour la matrice de parité et la mémoire opérationnelle ;
8. revoir le diff, committer le checkpoint avec un message détaillé et pousser
   la branche courante sans force-push ;
9. passer automatiquement au checkpoint suivant tant qu’aucun blocage décrit
   dans `AGENTS.md` n’exige l’utilisateur.

Une case n’est cochée qu’après obtention et référencement de toutes les preuves
requises. Une implémentation partielle reste une case non cochée et son état est
décrit dans `project/STATUS.md`.

## Règle de progression

Pour chaque capacité ALINE :

1. localiser son implémentation historique et ses données persistées ;
2. définir le comportement observable et les cas limites ;
3. ajouter une fixture ou un test de référence lorsque possible ;
4. implémenter la logique métier hors de React ;
5. intégrer l’interface et l’historique ;
6. vérifier ouverture, sauvegarde et export ;
7. documenter le statut de parité.

## Phase 0 — Spécification exécutable de la parité

- [x] Priority steering (2026-09-16): keep menus above all alignment layers,
  close menus on outside interaction and Escape, and allow only one open menu.
  Verify Colors/Tools/Export, modal backdrop dismissal and independent scrolling
  in the running browser; commit and push before resuming version-2 persistence.

- [x] Priority user steering: implement independent sidebar and alignment
  vertical scroll containers; verify each independently and at boundaries in
  the running browser, update status, commit and push, then resume the ALINE
  characterization checkpoint below.

- [x] convertir l’inventaire existant en matrice cœur/plugin avec un identifiant
  stable par fonctionnalité ;
- [x] associer chaque entrée aux fonctions Perl et fichiers concernés ;
- [x] définir pour chaque entrée un test, une fixture ou une procédure manuelle ;
- [x] Characterize the known `.aline` record families, including objects,
  graphs, colours, attachments and document preferences; retain the historical
  coverage limits recorded in the packed-format audit for import verification.
  - [x] Document the packed wire layout from the historical serializer and loader
    in `docs/aline-packed-format.md`.
  - [x] Exercise the historical serializer/loader with synthetic records, the
    bundled project, and all 17 historical loader error codes.
  - [x] Inventory all 36 registered drawable types and verify styled packed
    records for each type, including all nine graph variants.
  - [x] Verify historical save-copy pointer conversion, runtime handle exclusion,
    sparse region coverage and history-copy isolation.
  - [x] Characterize numbering private fields and consensus text with packed
    fixtures and the historical recalculation-menu prerequisite check.
  - [x] Specify strict reader validation and characterize all document settings,
    derived layout caches, and silently ignored malformed records.
  - [x] Verify PDB-derived fractional insertion numbering through the historical
    parser and packed persistence, documenting unrecoverable insertion identity.
  - [x] Inventory persisted outputs for all 30 bundled plugins, their support
    module and inactive diagnostic, including numbering-cache side effects.
  - [x] Complete the R001 core property inventory and cover title/cell style
    fields and extension fields with packed round-trip fixtures.
  - [x] Establish a saved-project corpus with provenance, two authored R001
    fixtures and historical decoded round-trip verification.
  - [x] Implement an executable data-only contract for the older Data::Dumper
    dialect, symbolic reference fixups and retention of unsupported old objects.
  - [x] Audit characterization evidence against the inventory and consolidate
    remaining compatibility limits before starting the version 2 model.
- [x] Establish the initial representative corpus with original and authored
  specimens, provenance and reproducible checks; extend real-world coverage
  during rich import and final compatibility verification.
- [ ] marquer les intégrations obsolètes et choisir leurs remplacements.
  - [x] Audit local alignment, DSSP and Chainsaw mechanisms against maintained
    provider documentation; record adapter directions and verification gates.
  - [x] Record remote-service, export and automation contracts with provider
    references and explicit scientific acceptance gates.
  - [ ] Resolve the proposed disorder replacement and incomplete structural/
    regional alignment scope before claiming these replacements accepted.
    This scientific decision does not block independent phase-1 model work.

**Sortie :** une matrice de parité qui permet de mesurer objectivement
l’avancement et empêche d’oublier une fonction de plugin.

## Phase 1 — Modèle de document Atlas extensible

- [ ] concevoir la version 2 du format `.atlas` ;
  - [x] Establish the rich-row contract and executable numbering/attachment
    semantics, preserving annotation text and historical number states.
  - [ ] Complete object, graph, style, layout and provenance contracts, then
    validate migration and lossless serialization before application adoption.
    - [x] Implement the rich object data contract for all historical types,
      sparse coverage, per-item styles, stable links and drawing-space samples;
      verify round trips and malformed input before document integration.
    - [ ] Add the document envelope, layout/palette/provenance records and
      full row/object validation; verify lossless version-2 serialization.
- [ ] représenter cellules, régions, lignes d’annotation et attachements ;
- [ ] représenter tous les objets ponctuels et régionaux d’ALINE ;
- [ ] représenter styles, polices, palettes, graphiques et mise en page ;
- [ ] définir les migrations entre versions ;
- [ ] garantir que les commandes qui changent les colonnes mettent à jour les
  annotations ;
- [ ] compléter l’import `.aline` sans perte silencieuse.

**Sortie :** ouverture et sauvegarde de documents riches avec validation,
migrations et tests aller-retour.

## Phase 2 — Éditeur d’alignement complet

- [ ] navigation clavier ;
- [ ] sélection cellule, plage, ligne, colonne et plusieurs lignes ;
- [ ] modes insertion et remplacement compatibles avec ALINE ;
- [ ] gaps, suppression et nettoyage de régions ;
- [ ] copier, couper et coller ;
- [ ] ajout, suppression, renommage et réorganisation de séquences ;
- [ ] commentaires, numérotation et offsets ;
- [ ] attachement et détachement des lignes ;
- [ ] raccourcis, menus contextuels et infobulles ;
- [ ] historique robuste pour toutes les opérations.

## Phase 3 — Rendu et édition graphique

- [ ] choisir et mesurer l’architecture de rendu performante ;
- [ ] conserver le découpage Classic en lignes de nage ;
- [ ] sélection, déplacement, redimensionnement et suppression des objets ;
- [ ] propriétés de contour, remplissage, épaisseur, police et texte ;
- [ ] hélices, brins beta, coils et variantes ;
- [ ] symboles, flèches, barres, boîtes, rectangles, lignes et textes ;
- [ ] ordre des calques et attachement aux séquences ;
- [ ] grille, espacements, largeur, zoom et mise en page ;
- [ ] performances validées sur de grands alignements.

## Phase 4 — Formats et production de figures

- [ ] imports FASTA, ALN, MSF, BLC et PIR ;
- [ ] imports PDB et mmCIF avec chaînes et numérotation ;
- [ ] exports FASTA, PIR, MSF et ALN ;
- [ ] exports SVG, PNG et PDF fidèles ;
- [ ] impression multiplateforme avec aperçu, papier, orientation et marges ;
- [ ] tests sur caractères, gaps, commentaires et numérotation.

## Phase 5 — Colorations, palettes et analyses internes

- [ ] coloration manuelle de cellule, région, ligne et objet ;
- [x] édition, chargement et sauvegarde des palettes `.alc` ;
- [ ] parité résidu, similarité et ALSCRIPT/Calcons ;
- [ ] séparation des séquences de calcul et des séquences colorées ;
- [ ] consensus configurable ;
- [ ] recherche exacte, expressions régulières et motifs PROSITE ;
- [ ] propriétés physicochimiques ;
- [ ] suppression des colonnes de gaps, doublons et fragments ;
- [ ] nettoyage des noms ;
- [ ] mutations corrélées.

## Phase 6 — Graphiques et structures

- [ ] courbes, histogrammes, seuils, gradients et données binaires ;
- [ ] import de `.dat` et `.rms` ;
- [ ] facteurs B ;
- [ ] import ou calcul DSSP ;
- [ ] conversion des structures secondaires en objets éditables ;
- [ ] export des couleurs vers PyMOL.

## Phase 7 — Outils bioinformatiques modernes

- [ ] exécution locale contrôlée de MAFFT et MUSCLE ;
- [ ] alignement, réalignement et contraintes ;
- [ ] récupération UniProt et NCBI ;
- [ ] remplacement moderne du workflow BLAST EBI ;
- [ ] remplacement moderne de SignalP 3.0 et DisEMBL ;
- [ ] évaluer Chainsaw et retenir un remplacement maintenu ;
- [ ] gestion claire des versions, erreurs, annulations et résultats externes.

## Phase 8 — Extensibilité et automatisation

- [ ] définir une API interne stable ;
- [ ] décider quelles fonctions spécialisées deviennent des extensions ;
- [ ] système d’extensions sécurisé et versionné si nécessaire ;
- [ ] automatisation en ligne de commande ;
- [ ] remplacement documenté des scripts `.script` historiques.

## Phase 9 — Application desktop et livraison

- [ ] choisir le conteneur desktop à partir de prototypes mesurés ;
- [ ] intégration fichiers, menus, presse-papiers et impression ;
- [ ] paquets signés macOS, Windows et Linux ;
- [ ] installateurs et mises à jour ;
- [ ] tests unitaires, intégration, compatibilité et parcours utilisateurs ;
- [ ] documentation utilisateur et développeur ;
- [ ] audit final de la matrice de parité.

## Critère de livraison finale

Atlas Alignement est terminé lorsque la matrice de parité ne contient plus
d’entrée non traitée, que les remplacements modernes sont documentés, que les
projets de référence produisent des résultats validés et que les applications
macOS, Windows et Linux passent les parcours critiques.
