# État actuel d’Atlas Alignement

Dernière mise à jour : 6 septembre 2026.

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

- 72 tests Vitest couvrent le modèle, les commandes, l’historique, les
  colorations et le format de projet ;
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
