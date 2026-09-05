# État actuel d’Atlas Alignement

Dernière mise à jour : 5 septembre 2026.

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
- outils Cylinder et Spring avec choix de couleur ;
- placement des structures par une case de départ et une case de fin sur la
  deuxième ligne située au-dessus des séquences ;
- persistance des cylindres et ressorts dans `.atlas` ;
- nettoyage undo/redo des colonnes entièrement composées de gaps ;
- suppression des séquences dupliquées et, en option, des fragments contenus
  dans une séquence précédente.

## Vérification actuelle

- 21 tests Vitest couvrent le modèle, les commandes, l’historique, les
  colorations et le format de projet ;
- le build TypeScript/Vite passe ;
- les principaux changements d’interface ont été contrôlés dans le navigateur.

## Limitations importantes

- l’import `.aline` récupère les séquences et la numérotation, mais ignore
  encore les objets graphiques historiques ;
- seuls les objets `helix` et `coil` existent dans le modèle Atlas ;
- les annotations existantes ne peuvent pas encore être sélectionnées,
  déplacées, redimensionnées, modifiées ou supprimées directement ;
- la sélection ne couvre qu’une cellule, sans région, ligne ou colonne ;
- sélection de régions, copier-coller et modes insertion/remplacement encore
  incomplets ;
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
