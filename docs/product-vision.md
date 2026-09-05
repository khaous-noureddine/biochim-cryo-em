# Vision produit d’Atlas Alignement

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

## Définition de la parité ALINE

La parité signifie que chaque fonctionnalité répertoriée dans
`aline-feature-inventory.md` et `aline-core-vs-plugins.md` possède l’un des
statuts suivants :

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
5. décisions produit consignées dans `decisions.md`.

En cas d’ambiguïté biologique, la décision doit être signalée pour validation
par le spécialiste du domaine au lieu d’être silencieusement inventée.
