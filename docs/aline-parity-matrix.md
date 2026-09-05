# Matrice de parité ALINE → Atlas Alignement

Cette matrice est la checklist de livraison. Les statuts autorisés sont :
`absent`, `partiel`, `reproduit`, `modernisé`, `remplacé` et `écart accepté`.
Une fonction n'est considérée terminée qu'avec une preuve indiquée dans la
colonne de vérification.

## Cœur historique

| ID | Capacité observable | Source ALINE principale | Atlas | Vérification requise |
|---|---|---|---|---|
| CORE-001 | Nouveau document et nettoyage de l'état | `ClearDocument`, menus File | absent | test d'état initial et parcours UI |
| CORE-002 | Ouvrir/sauvegarder/sauvegarder sous `.aline` | `Open`, `DumpDataFile`, `UndumpDataFile`, `savepackaline`, `loadpackaline` | partiel | fixtures `.aline`, aller-retour `.atlas` sans perte |
| CORE-003 | Détection des changements non sauvegardés | `ShouldaSavedEh`, `_Shutdown` | partiel | tests dirty/saved et fermeture |
| CORE-004 | Historique multi-niveaux | `PDumpData`, `DumpData`, `UndumpData`, `SkipUndoData` | partiel | undo/redo de chaque commande métier |
| CORE-005 | Import FASTA | `ReadFasta` | reproduit | fixtures valides et invalides |
| CORE-006 | Import MSF | `ReadMsf` | partiel | fixtures historiques et export tiers |
| CORE-007 | Import ClustalW ALN | `ReadAln` | partiel | fixtures historiques et export tiers |
| CORE-008 | Import BLC | `ReadBlc` | partiel | fixture historique |
| CORE-009 | Ancien import BLAST | `ReadBlast` | absent | caractérisation ; probablement remplacé |
| CORE-010 | Export FASTA | `ExportFasta`, `_ToFasta` | partiel | gaps, sélection, largeur, commentaires |
| CORE-011 | Export PIR | `ExportPIR`, `_ToPIR` | partiel | fixture comparative |
| CORE-012 | Export MSF | `ExportMSF`, `_ExportMulti` | partiel | fixture comparative |
| CORE-013 | Export ClustalW ALN | `ExportAln`, `_ExportMulti` | partiel | fixture comparative |
| CORE-014 | Export PostScript/EPS | `PrintPS`, transformations PS | absent | remplacé par SVG/PDF fidèle |
| CORE-015 | Export PNG | `PrintPNG` | absent | comparaison visuelle de références |
| CORE-016 | Ajouter/supprimer/déplacer une ligne | `InsertRow`, `DeleteRowByN/Y`, `_SeqDrag` | partiel | commandes testées ; parcours UI et lignes spéciales à compléter |
| CORE-017 | Ajouter une séquence et ses métadonnées | `InsertSequence`, `EditTitle`, propriétés | partiel | gestion UI du nom, commentaire et numérotation ; saisie de résidus à compléter |
| CORE-018 | Attacher des lignes | `AttachRow`, `_AttachmentForX`, `_InsertAttachmentElements` | absent | édition synchronisée de lignes attachées |
| CORE-019 | Numérotation automatique/fixe et offsets | `_FillSeqnum`, `_SeqStart`, `_SetNumberingType`, `SetNumberOffsets` | partiel | gaps, insertions et codes d'insertion |
| CORE-020 | Curseur et navigation clavier | `_CursorMove`, `SequenceEditor` | partiel | flèches/Home/End et maintien de visibilité implémentés ; raccourcis complets à vérifier |
| CORE-021 | Modes insertion/remplacement/agressif | `SequenceEditor`, `_AggroCheck`, `_ApplyEdits` | partiel | tests différentiels d'édition |
| CORE-022 | Sélection cellule/région/ligne/colonne | `SelectBox`, `_RubberBand`, `ShadeRegion` | partiel | rectangle Shift-clic/clavier implémenté ; sélection entière et glisser à compléter |
| CORE-023 | Insertion/suppression de cellules et gaps | `_InsertCells`, `_DeleteCells`, `_DefrayEnds` | partiel | lignes attachées, objets, undo |
| CORE-024 | Édition des propriétés de cellule/région | `_PropertyWindow`, `_PropertySheet` | absent | texte, police, couleurs, plage |
| CORE-025 | Vue quadrillée et découpage en blocs | `PrintSeq`, `Grid`, paramètres d'affichage | partiel | références visuelles et responsive |
| CORE-026 | Espacements, échelle, largeur et polices | `_UpdateParameters`, sliders, `ConfigDialog` | partiel | persistance et références visuelles |
| CORE-027 | Couleurs de contour/remplissage manuelles | `_SetWorkColour`, `RecolourObject/Obs` | absent | cellule, région et objet |
| CORE-028 | Palettes `.alc` et éditeur de palettes | `ReadColour`, `SaveColour`, `CalColours`, `_ApplyCat` | partiel | lecture/écriture des 5 palettes fournies |
| CORE-029 | Interpolation RGB/HSL | `colourInterpolate`, `colourInterpolateHSL`, `rgb2hsl`, `hsl2rgb` | absent | vecteurs numériques comparatifs |
| CORE-030 | Création d'objets graphiques | `CreateObject`, `NewObType`, `_GlyphFactory`, `_LingFactory` | partiel | chaque type, propriété et persistance |
| CORE-031 | Sélection/déplacement/suppression d'objet | `FindObjectAt`, `MoveObject`, `DeleteObjectById/Ptr` | partiel | sélection, positions, couleur et suppression testées ; déplacement direct et objets liés à compléter |
| CORE-032 | Ordre des calques | `RaiseLowerObj`, `_GetZList`, `_ConsolidateZ` | absent | superpositions comparatives |
| CORE-033 | Symboles ponctuels complets | `_GlyphFactory`, définitions `objectdata` | partiel | 14 types historiques créables en un clic, éditables et persistés ; galerie visuelle de référence à valider |
| CORE-034 | Hélices, brins beta, coils et lignes | `_LingFactory`, définitions `objectdata` | partiel | types `Helix`, `Helix2`, `Strand`, `Strand2`, coil, trait plein/pointillé, connecteurs haut/bas et soulignement créables, éditables, persistés et testés ; comparaison visuelle de référence à finaliser |
| CORE-035 | Boîtes, rectangles et textes | `Box`, `Rect`, `DrawText` | partiel | modèle 2D, validation, commandes, remappage et persistance des boîtes/rectangles testés ; rendu, interaction et textes à ajouter |
| CORE-036 | Graphiques génériques | `_CreateGraph`, `InsertGraph`, fonctions `*Graph` | absent | chaque type, seuil, plage et log |
| CORE-037 | Menus, raccourcis et actions configurables | `_BuildMenu`, bindings, `setaction` | partiel | inventaire des commandes UI |
| CORE-038 | Configuration utilisateur/système | `PullInConfigFiles`, `ConfigDialog`, `_WriteGoodConfig` | absent | migrations et persistance multiplateforme |
| CORE-039 | Chargement dynamique des plugins | `_LoadPlugins`, `AlinePlugin.pm` | absent | remplacé par architecture d'extensions décidée |
| CORE-040 | Scripts `.script` et API sandbox | `_ExecScript`, `_sandbox_*`, package script | absent | décision sécurité puis tests API |
| CORE-041 | Téléchargement PDB historique | `_ObtainPDB` | absent | remplacé par API PDB moderne |

## Plugins distribués

| ID | Plugin | Capacité observable | Atlas | Vérification requise |
|---|---|---|---|---|
| PLUG-001 | `aColourPicker` | Pipette contour/remplissage sur titre, cellule et objet | absent | prélèvement exact des styles |
| PLUG-002 | `aDeleteResidues` | Delete Region et Clear Region | partiel | sélection 2D et undo testés ; lignes attachées à compléter |
| PLUG-003 | `aProtTool` | Masse, états cystéines, extinction et absorbance | absent | valeurs de référence scientifiques |
| PLUG-004 | `cCalCons` | Conservation ALSCRIPT/Calcons avec séquences calculées/colorées distinctes | partiel | vecteurs comparés au Perl |
| PLUG-005 | `cCalSim` | Similarité, seuil et groupes configurables | partiel | vecteurs comparés au Perl |
| PLUG-006 | `cClearSeq` | Reset d'une sélection de séquences et Reset all | partiel | styles complets et undo |
| PLUG-007 | `cColBfac` | Graphe de facteurs B depuis PDB, choix d'atomes et seuils | absent | fixture PDB et graphe attendu |
| PLUG-008 | `cColRes` | Coloration par type de résidu | partiel | palette exacte et choix des lignes |
| PLUG-009 | `eAddBlast` | BLAST puis insertion/réalignement de résultats | absent | remplacement API moderne et fixture |
| PLUG-010 | `eSeqList` | Gestionnaire de lignes, import et récupération DB | partiel | parcours complet de gestion |
| PLUG-011 | `fInputPDB` | Import PDB/ENT par chaîne avec gaps et numéros d'insertion | absent | corpus PDB comparatif |
| PLUG-012 | `fInputPIR` | Import PIR | partiel | corpus PIR comparatif |
| PLUG-013 | `mDefaultCM` | Menus contextuels adaptés au type ciblé | absent | matrice cible × commandes |
| PLUG-014 | `mDefaultTooltips` | Infobulles titres, commentaires et numéros biologiques | partiel | contenu et modificateur Shift |
| PLUG-015 | `sPrint` | Aperçu, papier, orientation, marges et impression | absent | PDF/impression sur trois OS |
| PLUG-016 | `tAddConsensus` | Consensus avec deux seuils et groupes symboliques | absent | vecteurs comparés au Perl |
| PLUG-017 | `tAddDisEmbl` | Prédiction de désordre et ligne attachée | absent | remplacement maintenu à choisir |
| PLUG-018 | `tAddGraph` | Import `.dat/.rms` et paramètres de graphe | absent | fixtures pour tous les graphes |
| PLUG-019 | `tAddNumbers` | Ligne de numérotation configurable et recalculable | partiel | offsets, espacement et attachement |
| PLUG-020 | `tAddSecStruct` | DSSP/PDB vers hélices, brins, coils ou boîtes | absent | fixtures DSSP/PDB et objets attendus |
| PLUG-021 | `tAddSignalP` | SignalP, ligne/symboles et marquage de séquence | absent | remplacement SignalP actuel |
| PLUG-022 | `tAlignment` | Alignement global MAFFT/MUSCLE/ClustalW | absent | outils disponibles et fixtures |
| PLUG-023 | `tAlignment` | Contraintes d'alignement depuis fichier | absent | fixture de contraintes |
| PLUG-024 | `tAlignment` | Réalignement d'une ligne | absent | conservation de la relation aux autres lignes |
| PLUG-025 | `tAlignment` | Alignement régional et structurel LSQMAN | absent | code historique incomplet : décision requise |
| PLUG-026 | `tClearGapCols` | Suppression des colonnes entièrement vides | reproduit | tests gaps multiples, annotations et undo |
| PLUG-027 | `tCorrMutations` | Mutations corrélées par identité/charge/hydrophobicité | absent | jeux de données et clusters attendus |
| PLUG-028 | `tFixDbnames` | Nettoyage des noms UniProt/GenBank | absent | table de noms historiques/modernes |
| PLUG-029 | `tMatchPattern` | Recherche texte, regex, PROSITE et motifs prédéfinis | absent | positions, gaps, navigation et marquage |
| PLUG-030 | `tPymolColors` | Export de script PyMOL depuis les couleurs | absent | script exécuté sur fixture PDB |
| PLUG-031 | `tRunChainsaw` | Modèle MR depuis alignement et PDB | absent | remplacement maintenu à décider |
| PLUG-032 | `tUnattachAll` | Attacher/détacher toutes les lignes | absent | clusters sans cycles |
| PLUG-033 | `tUndupe` | Supprimer doublons et fragments | reproduit | tests doublons espacés par gaps et fragments |
| PLUG-034 | `mKeycodeTest.inactive` | Diagnostic de codes clavier, désactivé | absent | écart accepté probable |

## Totaux initiaux

- 41 capacités du cœur suivies ;
- 34 capacités de plugins suivies ;
- 75 capacités au total ;
- aucune fonction `partiel` ne compte comme terminée.

Ces totaux peuvent augmenter pendant la caractérisation détaillée : une entrée
doit être scindée dès qu'elle contient plusieurs comportements qui nécessitent
des preuves indépendantes.
