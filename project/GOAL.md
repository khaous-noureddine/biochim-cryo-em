# Objectif durable d’Atlas Alignement

## Expanded end-to-end mission (2026-09-18)

Atlas must also turn **unaligned protein sequences into a publication-ready
figure** within one user workflow: import raw sequences, run and inspect a
multiple sequence alignment, edit and annotate that alignment, then save the
project and export the figure. Accept supported sequence content regardless of
filename extension (including `.txt` and FASTA); do not claim that arbitrary
text or every biological file format can be parsed. Never silently pad unequal
raw sequences and present the result as a computed alignment. Show the method,
version, parameters and input provenance for computed alignments. Prefer a
local, maintained alignment engine and preserve the ability to work offline on
macOS, Windows and Linux. Scientific quality and reproducibility matter more
than hiding the alignment step.

## Mission

Atlas Alignement est la réécriture moderne, rapide et multiplateforme d’ALINE.
Le dossier `aline_011208/` contient le programme historique de référence. Le
produit final doit permettre de réaliser tous les parcours utiles disponibles
dans le cœur d’ALINE et dans ses plugins, avec une interface contemporaine et
un code maintenable.

La cible n’est pas une imitation visuelle superficielle. Atlas doit préserver
les comportements scientifiques et éditoriaux d’ALINE : ouvrir et modifier un
alignement, le mettre en forme, ajouter des annotations scientifiques, analyser
les séquences, sauvegarder le projet et produire une figure publiable.

## Résultat attendu

Un utilisateur doit pouvoir installer Atlas sur macOS, Windows ou Linux, puis :

1. ouvrir les formats d’alignement et de structure pris en charge par ALINE ;
2. ouvrir un ancien projet `.aline` avec ses données et objets utiles ;
3. éditer les séquences, les gaps, les lignes, les régions et la numérotation ;
4. appliquer les colorations et analyses disponibles dans ALINE ;
5. créer, sélectionner, déplacer, redimensionner et configurer les objets
   graphiques d’ALINE ;
6. appeler des outils bioinformatiques externes maintenus lorsque nécessaire ;
7. sauvegarder sans perte dans un projet `.atlas` versionné ;
8. exporter des alignements et des figures scientifiques de haute qualité ;
9. annuler et rétablir les opérations importantes ;
10. travailler de façon fluide sur des alignements sensiblement plus grands que
    ceux supportés confortablement par l’application Perl/Tk.

## Périmètre obligatoire

Le travail couvre exhaustivement :

- le cœur historique dans `aline_011208/bin/` et les modules associés ;
- tous les plugins livrés dans `aline_011208/plugins/`, y compris ceux qui ne
  sont pas visibles dans l’interface par défaut ;
- les formats historiques, préférences, palettes, scripts et fichiers
  d’exemple utiles à la compréhension du comportement ;
- les parcours de création, édition, analyse, annotation, mise en page,
  sauvegarde, réouverture, impression et export ;
- la livraison d’une application installable sur macOS, Windows et Linux.

Le code historique doit rester inchangé : il constitue une fixture de référence
et non la base technique de la nouvelle application.

## Résultats qui ne suffisent pas

Ne constituent pas une livraison complète :

- une reproduction limitée aux éléments visibles sur les captures d’écran ;
- une fonctionnalité présente dans l’interface mais sans logique, persistance
  ou vérification ;
- une analyse du cœur qui ignore les plugins ;
- une intégration historique cassée recopiée sans remplacement maintenu ;
- un prototype web qui ne possède pas de stratégie desktop multiplateforme ;
- une affirmation de parité fondée uniquement sur le nombre de tests réussis.

## Définition de la parité ALINE

La parité signifie que chaque fonctionnalité répertoriée dans
`docs/aline-feature-inventory.md` et `docs/aline-core-vs-plugins.md` possède
l’un des statuts suivants :

- **Reproduite** : même capacité et résultat compatible dans Atlas ;
- **Modernisée** : même besoin utilisateur, réalisé avec un mécanisme actuel ;
- **Remplacée** : service historique disparu, remplacé par un équivalent
  maintenu et documenté ;
- **Écart accepté** : différence explicitement documentée et validée par le
  propriétaire du produit.

Une entrée cassée, commentée ou purement expérimentale dans ALINE n’impose pas
de reproduire le défaut historique. Elle doit être analysée, puis réparée,
remplacée ou classée comme écart accepté.

## Principes du produit

- Fidélité scientifique avant fidélité aux limitations techniques de 2008.
- Vue Classic proche d’ALINE par défaut, avec possibilité de vues alternatives.
- Même modèle de document pour toutes les vues.
- Fonctionnement local et multiplateforme en priorité.
- Projet `.atlas` sans perte, versionné et migrable.
- Import `.aline` aussi fidèle que les données historiques le permettent.
- Calculs métier séparés de React et couverts par des tests déterministes.
- Interface utilisable sans connaître l’architecture interne ni les plugins.
- Les extensions futures restent modulaires, sans fragiliser le cœur.

## Sources de vérité

Par ordre de priorité :

1. comportements observables et formats produits par `aline_011208/` ;
2. code du cœur historique et code de chaque plugin ;
3. fichiers d’exemple historiques ;
4. inventaires fonctionnels dans `docs/` ;
5. matrice de livraison `docs/aline-parity-matrix.md` ;
6. décisions produit consignées dans `project/DECISIONS.md`.

En cas d’ambiguïté biologique, la décision doit être signalée pour validation
par le spécialiste du domaine au lieu d’être silencieusement inventée.

## Condition d’arrêt vérifiable

L’objectif global est atteint uniquement lorsque :

1. chaque capacité du cœur et de chaque plugin historique possède un identifiant
   dans la matrice de parité ;
2. chaque identifiant est classé Reproduit, Modernisé, Remplacé ou Écart accepté ;
3. chaque classement renvoie vers une preuve reproductible : test, fixture,
   procédure de vérification ou décision acceptée ;
4. les projets historiques représentatifs s’ouvrent sans perte silencieuse des
   données prises en charge et les projets `.atlas` passent les tests
   d’aller-retour ;
5. les parcours critiques ont été vérifiés sur macOS, Windows et Linux ;
6. les suites de tests, le typage, le lint et le build de production passent ;
7. la documentation utilisateur, développeur et de compatibilité correspond à
   l’application livrée ;
8. `project/PLAN.md` ne contient plus de checkpoint obligatoire inachevé et
   `project/STATUS.md` contient les preuves du dernier audit de livraison.

Tout écart nécessitant une décision produit ou biologique doit être validé par
le propriétaire du produit avant de pouvoir satisfaire cette condition.
