# ALINE : cœur de l’application et plugins

## Comment ALINE est organisé

ALINE est constitué de deux parties :

1. le programme principal `aline_011208/bin/aline` ;
2. les extensions situées dans `aline_011208/plugins/`.

Au démarrage, le programme charge automatiquement les fichiers dont le nom se
termine par `.plugin`. Leurs commandes apparaissent alors dans les menus comme
si elles étaient natives.

# 1. Fonctionnalités présentes dans le cœur d’ALINE

Ces fonctionnalités sont implémentées directement dans `bin/aline`.

## Projet et historique

- créer un nouveau document ;
- ouvrir et sauvegarder un projet `.aline` ;
- sauvegarder sous un autre nom ;
- détecter les changements non sauvegardés ;
- annuler plusieurs opérations ;
- charger le document de démonstration.

## Import et export

- importer FASTA, ClustalW ALN, MSF et BLC ;
- exporter FASTA, PIR, MSF et ClustalW ALN ;
- exporter en PostScript et PNG.

L’import PIR existe comme plugin, mais l’export PIR est déjà présent dans le
cœur.

## Édition

- naviguer avec un curseur dans l’alignement ;
- sélectionner cellules, régions, lignes et colonnes ;
- insérer, remplacer et supprimer des résidus ou gaps ;
- utiliser les modes insertion et remplacement ;
- activer l’édition agressive ;
- ajouter une ligne vide ou une séquence ;
- supprimer et déplacer des lignes ;
- éditer titres, commentaires et offsets de numérotation ;
- attacher une ligne d’annotation à une séquence.

## Mise en forme

- modifier couleurs de texte et de fond ;
- modifier polices et épaisseurs de trait ;
- afficher ou masquer la grille ;
- régler les espacements et l’échelle ;
- régler la largeur des titres et des blocs ;
- charger, éditer et sauvegarder les palettes `.alc`.

## Objets graphiques

- dessiner, déplacer, recolorer et supprimer des objets ;
- ajouter triangles, cercles, étoiles, carrés, diamants et flèches ;
- ajouter hélices, brins beta, coils et lignes ;
- ajouter boîtes, rectangles, textes et graphiques ;
- modifier les propriétés et l’ordre visuel des objets.

## Infrastructure

- configuration personnelle et système ;
- exécution de scripts `.script` ;
- système de menus et raccourcis ;
- API et chargement dynamique des plugins.

# 2. Fonctionnalités ajoutées par les plugins

## Édition et actions

| Plugin | Fonctionnalités ajoutées |
|---|---|
| `aColourPicker.plugin` | Pipette permettant de récupérer la couleur d’une cellule ou d’un objet. |
| `aDeleteResidues.plugin` | Actions **Delete Region** et **Clear Region** sur une sélection. |
| `aProtTool.plugin` | Masse moléculaire, cystéines réduites/oxydées, coefficient d’extinction et absorbance. |

## Coloration

| Plugin | Fonctionnalités ajoutées |
|---|---|
| `cCalCons.plugin` | Calcul et coloration de la conservation avec la méthode ALSCRIPT/Calcons. |
| `cCalSim.plugin` | Calcul et coloration par similarité avec groupes d’acides aminés configurables. |
| `cClearSeq.plugin` | Suppression des couleurs et marquages sur une sélection ou tout le document. |
| `cColBfac.plugin` | Lecture des facteurs B d’un PDB et ajout d’un graphique associé. |
| `cColRes.plugin` | Coloration selon le type de résidu. |

## Gestion des séquences et formats

| Plugin | Fonctionnalités ajoutées |
|---|---|
| `eAddBlast.plugin` | Exécution de l’ancien BLAST EBI et insertion des séquences trouvées. |
| `eSeqList.plugin` | Édition avancée de la liste, réorganisation, import fichier et téléchargement UniProt/NCBI. |
| `fInputPDB.plugin` | Import des fichiers PDB et ENT avec chaînes et numérotation. |
| `fInputPIR.plugin` | Import des fichiers PIR. |

## Interface

| Plugin | Fonctionnalités ajoutées |
|---|---|
| `mDefaultCM.plugin` | Menus contextuels adaptés aux titres, séquences, cellules, numéros et objets. |
| `mDefaultTooltips.plugin` | Infobulles affichant résidu, position et numérotation biologique. |
| `sPrint.plugin` | Aperçu et impression A4/Letter/Legal, marges, orientation et imprimante. |

## Outils scientifiques et annotations

| Plugin | Fonctionnalités ajoutées |
|---|---|
| `tAddConsensus.plugin` | Création d’une séquence consensus avec seuils et groupes de similarité. |
| `tAddDisEmbl.plugin` | Prédiction de désordre avec l’ancien service DisEMBL. |
| `tAddGraph.plugin` | Import `.dat`/`.rms` et création de courbes, histogrammes, gradients et graphiques binaires. |
| `tAddNumbers.plugin` | Ajout d’une ligne graphique de numérotation des résidus. |
| `tAddSecStruct.plugin` | Import DSSP/PDB et ajout d’hélices, brins beta et coils. |
| `tAddSignalP.plugin` | Prédiction de peptide signal avec l’ancien SignalP 3.0. |
| `tAlignment.plugin` | Alignement et réalignement avec MUSCLE, ClustalW ou MAFFT. |
| `tClearGapCols.plugin` | Suppression des colonnes composées uniquement de gaps. |
| `tCorrMutations.plugin` | Recherche et marquage de mutations corrélées. |
| `tFixDbnames.plugin` | Nettoyage des noms provenant de bases de données. |
| `tMatchPattern.plugin` | Recherche exacte, expressions régulières, motifs PROSITE et motifs prédéfinis. |
| `tPymolColors.plugin` | Export des couleurs vers un script PyMOL `.pml`. |
| `tRunChainsaw.plugin` | Création d’un modèle de remplacement moléculaire avec Chainsaw. |
| `tUnattachAll.plugin` | Attachement ou détachement de toutes les lignes. |
| `tUndupe.plugin` | Suppression des doublons et, en option, des fragments. |

## Plugin désactivé

| Fichier | Rôle |
|---|---|
| `mKeycodeTest.inactive` | Test des codes clavier. Il n’est pas chargé car son extension n’est pas `.plugin`. |

# 3. Résumé rapide

| Domaine | Cœur d’ALINE | Plugins |
|---|---|---|
| Projet | Nouveau, ouvrir, sauvegarder `.aline`, undo | — |
| Formats | FASTA, ALN, MSF, BLC et exports principaux | Import PIR et PDB |
| Édition | Cellules, gaps, lignes, propriétés et objets | Régions et gestion avancée des séquences |
| Affichage | Canvas, grille, blocs, titres et numéros | Infobulles et menus contextuels |
| Couleurs | Palettes et recoloration manuelle | Résidus, conservation, similarité, facteurs B et reset |
| Analyse | Infrastructure générique | Consensus, motifs, propriétés et mutations corrélées |
| Alignement | Stockage et édition d’un alignement | MUSCLE, ClustalW et MAFFT |
| Annotations | Moteur d’objets et de graphiques | DSSP, SignalP, DisEMBL, numéros et données externes |
| Structure | Objets et numérotation | PDB, PyMOL et Chainsaw |
| Sortie | FASTA/PIR/MSF/ALN, PostScript et PNG | Impression avancée |

# 4. Conséquence pour Atlas Alignement

Dans la nouvelle application, la séparation technique ne devra pas forcément
reproduire celle de 2008. Les fonctions indispensables doivent appartenir au
cœur moderne :

- édition des séquences et gaps ;
- sauvegarde du projet ;
- undo/redo ;
- imports et exports principaux ;
- coloration par résidu et conservation ;
- consensus ;
- export SVG, PNG et PDF.

Les fonctions dépendant de services ou programmes externes pourront rester des
modules optionnels : BLAST, SignalP, DSSP, PyMOL, MAFFT/MUSCLE, PDB et analyses
avancées.
