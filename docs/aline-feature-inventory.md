# Inventaire fonctionnel d’ALINE et priorités d’Atlas Alignement

## Objectif du document

Ce document décrit les fonctionnalités présentes dans l’application historique
ALINE, écrite en Perl/Tk, puis propose un ordre de développement pour sa
réécriture moderne, Atlas Alignement.

ALINE n’est pas seulement un visualiseur d’alignements. C’est principalement un
éditeur de figures scientifiques fondées sur des alignements, avec édition des
séquences, annotations graphiques, analyses biologiques et exports.

Le cœur historique se trouve dans `aline_011208/bin/aline`. Les fonctionnalités
complémentaires se trouvent dans `aline_011208/plugins/`.

> Pour voir précisément ce qui appartient au programme principal et ce qui est
> ajouté par chaque plugin, consulter
> [Cœur d’ALINE vs plugins](./aline-core-vs-plugins.md).

## 1. Gestion des projets

ALINE permet de :

- créer un nouveau document ;
- ouvrir un projet `.aline` ;
- sauvegarder et sauvegarder sous un autre nom ;
- conserver les séquences, couleurs, annotations, objets et paramètres visuels ;
- détecter les modifications non sauvegardées ;
- annuler plusieurs opérations ;
- configurer le nombre d’étapes d’annulation ;
- charger automatiquement le projet d’exemple `rada.aline`.

Le format `.aline` est donc un format de projet complet et pas seulement un
format de séquences.

## 2. Import de séquences et d’alignements

Formats reconnus :

- FASTA : `.seq`, `.fasta` ;
- ClustalW : `.aln` ;
- MSF : `.msf` ;
- BLC : `.blc` ;
- PIR : `.pir`, via un plugin ;
- PDB : `.pdb`, `.ent`, via un plugin.

Le code contient également un ancien lecteur BLAST, mais celui-ci est désactivé
dans la liste d’import principale.

## 3. Export des séquences

ALINE peut exporter les séquences sélectionnées ou l’alignement vers :

- FASTA ;
- PIR ;
- MSF ;
- ClustalW ALN.

L’application sait notamment :

- conserver ou supprimer les gaps selon l’export ;
- découper les séquences sur plusieurs lignes ;
- exporter uniquement une sélection de lignes ;
- conserver les noms et commentaires associés aux séquences.

## 4. Export graphique et impression

ALINE peut générer :

- PostScript ;
- PNG ;
- EPS, indirectement par le système PostScript ;
- une sortie imprimable.

Le plugin d’impression propose :

- un aperçu avant impression ;
- les formats A4, Letter et Legal ;
- les orientations portrait et paysage ;
- des marges configurables ;
- la sélection de l’imprimante ;
- l’ajustement du contenu à la page ;
- une commande d’impression personnalisable.

Ghostscript est utilisé pour une partie des conversions. ALINE ne possède pas
d’export SVG ou PDF moderne direct.

## 5. Affichage de l’alignement

L’interface affiche :

- les noms des séquences ;
- les caractères alignés ;
- les gaps ;
- les numéros des résidus ;
- les annotations liées aux séquences ;
- les objets graphiques ;
- les graphiques numériques ;
- une grille ;
- des infobulles ;
- une barre d’état.

L’utilisateur peut régler :

- l’espacement horizontal et vertical ;
- la taille des caractères ;
- le nombre de caractères par ligne ;
- la largeur réservée aux titres ;
- les polices ;
- la couleur du fond ;
- la présence de la grille ;
- la largeur des lignes graphiques.

ALINE peut découper un alignement long sur plusieurs blocs visuels, avec
répétition éventuelle des titres et numéros.

## 6. Édition des séquences

ALINE permet une édition directe au clavier :

- déplacement du curseur avec les flèches ;
- sélection d’une cellule ou d’une région ;
- insertion et remplacement d’un résidu ;
- insertion et suppression d’un gap ;
- suppression d’une cellule ;
- suppression ou nettoyage d’une région ;
- extension des séquences ;
- modes insertion et remplacement ;
- mode d’édition « agressif » autorisant davantage de changements ;
- copie des attributs des cellules lors d’une insertion ;
- annulation des modifications.

## 7. Gestion des lignes et séquences

L’utilisateur peut :

- ajouter une ligne vide ou une nouvelle séquence ;
- supprimer ou déplacer une ligne ;
- éditer le nom et le commentaire d’une séquence ;
- modifier son décalage de numérotation ;
- définir une numérotation automatique ou fixe ;
- attacher une ligne d’annotation à une séquence ;
- attacher ou détacher toutes les séquences ;
- réorganiser la liste ;
- choisir les séquences à exporter ;
- importer des séquences dans un document existant.

Le gestionnaire permet aussi d’insérer des séquences depuis UniProt ou
Entrez/NCBI. Les URL employées sont anciennes et doivent être remplacées.

## 8. Alignement automatique

ALINE peut appeler un programme externe :

- MUSCLE ;
- ClustalW ;
- MAFFT.

Le plugin sait :

- aligner toutes les séquences ;
- réaligner une ligne ;
- ajouter des contraintes d’alignement depuis un fichier ;
- réinjecter le résultat dans le document.

ALINE ne contient pas lui-même les algorithmes d’alignement : il lance un
exécutable installé sur la machine. Une fonction fondée sur LSQMAN est évoquée,
mais elle est commentée ou incomplète.

## 9. Nettoyage des alignements

ALINE propose :

- la suppression des colonnes contenant uniquement des gaps ;
- la suppression des séquences dupliquées ;
- la suppression des doublons et fragments ;
- le nettoyage des noms provenant des bases de données ;
- la suppression ou le nettoyage d’une région ;
- la réinitialisation des couleurs et annotations ;
- l’attachement ou le détachement groupé des lignes.

## 10. Coloration des résidus

ALINE peut colorer :

- selon le type de résidu ;
- selon la conservation ;
- selon la similarité ;
- selon une palette personnalisée ou prédéfinie ;
- selon le facteur B d’une structure PDB.

Les palettes fournies sont :

- cyan vers rouge ;
- niveaux de gris ;
- saturation bleue ;
- saturation rouge ;
- saturation jaune.

L’utilisateur peut :

- modifier, charger et sauvegarder une palette `.alc` ;
- choisir la couleur du texte et du fond ;
- utiliser des interpolations RGB ou HSL ;
- recolorer une cellule, une région ou un objet ;
- réinitialiser les colorations ;
- sélectionner les séquences utilisées pour calculer les scores ;
- choisir séparément les séquences sur lesquelles appliquer les couleurs.

La distinction entre les séquences utilisées pour le calcul et celles qui sont
colorées est importante à conserver dans Atlas Alignement.

## 11. Conservation et similarité

### Conservation

- calcul colonne par colonne ;
- méthode proche d’ALSCRIPT/Calcons ;
- seuils de conservation ;
- coloration selon le niveau obtenu.

### Similarité

- groupes d’acides aminés similaires ;
- seuil minimal de similarité ;
- groupes personnalisables ;
- application des résultats sous forme de couleurs.

Atlas Alignement possède déjà une conservation simple, mais pas encore la
méthode complète d’ALINE ni le choix indépendant des séquences de calcul et de
coloration.

## 12. Séquence consensus

ALINE peut générer une ligne de consensus avec :

- un seuil d’identité élevé ;
- un seuil d’identité faible ;
- des groupes de résidus similaires ;
- des majuscules pour les fortes identités ;
- des minuscules pour les identités plus faibles ;
- des symboles représentant les groupes similaires ;
- une position d’insertion choisie par l’utilisateur.

## 13. Recherche de motifs

ALINE sait rechercher et marquer :

- du texte exact ;
- une expression régulière ;
- un motif PROSITE.

Plusieurs motifs prédéfinis sont inclus :

- site de N-glycosylation ;
- site de N-myristoylation ;
- séquence de ciblage ER ;
- motif P-loop ;
- région ATP-binding des protéines kinases.

Les résultats peuvent être parcourus et marqués dans l’alignement.

## 14. Propriétés d’une protéine

Pour une séquence complète ou une région sélectionnée, ALINE calcule :

- la masse moléculaire moyenne ;
- la masse avec cystéines réduites ;
- la masse avec cystéines oxydées ;
- le coefficient d’extinction ;
- l’absorbance estimée à `1 mg/ml` ;
- les limites de résidus de la sélection.

## 15. Structures secondaires

ALINE peut importer ou calculer des structures secondaires depuis :

- un fichier DSSP ;
- un fichier PDB ou `.ent` ;
- un exécutable DSSP local.

Les structures peuvent être dessinées avec :

- des hélices ;
- des brins beta ;
- des coils ou boucles ;
- des boîtes colorées ;
- des symboles graphiques ;
- une ligne séparée attachée à la séquence correspondante.

## 16. Annotations graphiques

ALINE propose de nombreux objets.

### Symboles ponctuels

- triangles vers le haut ou le bas ;
- petits triangles ;
- cercle ;
- étoile et étoile vide ;
- carré ;
- diamant ;
- flèches ;
- barres.

### Objets couvrant une région

- hélice et variante d’hélice ;
- brin beta et variante de brin ;
- coil ;
- ligne pointillée ;
- lignes de connexion ;
- soulignement ;
- boîte remplie ;
- rectangle ;
- texte et texte avec contour.

Pour chaque objet, l’utilisateur peut modifier :

- sa position et sa longueur ;
- son type et son texte ;
- l’alignement du texte ;
- les couleurs de contour et de remplissage ;
- l’épaisseur du trait ;
- la police.

Les objets peuvent être déplacés, supprimés, recolorés et placés au-dessus ou
au-dessous d’autres objets.

## 17. Graphiques scientifiques

ALINE peut importer un fichier numérique `.dat` ou `.rms` et afficher :

- un histogramme ;
- un histogramme avec seuil ;
- une courbe ;
- une courbe avec seuil ;
- un gradient RGB ou HSL ;
- un gradient RGB ou HSL avec seuil ;
- un graphique binaire.

Options disponibles :

- séquence de référence ;
- position d’insertion ;
- hauteur et décalage ;
- seuil ;
- échelle logarithmique ;
- couleurs principale et secondaire.

## 18. Fonctions liées aux structures PDB

ALINE peut :

- importer une séquence depuis un fichier PDB ;
- utiliser la chaîne d’une structure ;
- télécharger une structure depuis la PDB ;
- extraire la numérotation des résidus ;
- créer un graphique de facteurs B ;
- filtrer les types d’atomes utilisés ;
- associer les positions de l’alignement aux positions structurales ;
- exporter les couleurs de l’alignement dans un script PyMOL.

Le script PyMOL définit les couleurs, sélectionne le modèle et la chaîne,
colore chaque résidu et applique une couleur de fond.

## 19. Analyses et programmes externes

ALINE contient des intégrations pour :

- BLAST via EBI ;
- SignalP 3.0 ;
- DisEMBL ;
- DSSP ;
- Chainsaw ;
- PyMOL ;
- MUSCLE ;
- ClustalW ;
- MAFFT.

Il peut notamment :

- exécuter BLAST et ajouter des résultats comme nouvelles séquences ;
- ajouter une prédiction de peptide signal ;
- ajouter une prédiction de désordre ;
- créer un modèle de remplacement moléculaire avec Chainsaw ;
- générer un script de coloration PyMOL.

La plupart des URL et versions datent de 2008. Ces intégrations doivent être
remplacées et non recopiées telles quelles.

## 20. Mutations corrélées

ALINE peut rechercher des groupes de positions présentant des mutations
corrélées selon :

- l’identité des résidus ;
- la charge ;
- l’hydrophobicité ;
- un seuil de regroupement ;
- une limite de similarité ;
- le traitement des gaps ;
- le traitement des résidus inconnus.

Les groupes détectés sont indiqués par une coloration de fond ou un contour.

## 21. Système de plugins

Un plugin peut ajouter :

- des raccourcis clavier ;
- des options de coloration ;
- des outils et menus ;
- des actions d’édition ;
- des types d’objets graphiques ;
- des formats d’import et d’export ;
- des paramètres de configuration ;
- des commandes de script.

## 22. Scripts et automatisation

ALINE peut charger et exécuter des fichiers `.script`. Son API de script permet
notamment de :

- ouvrir des séquences ;
- lire et modifier des données ;
- sélectionner des lignes ;
- créer un point d’annulation ;
- rafraîchir l’affichage ;
- quitter l’application.

Cette fonction est puissante, mais elle n’est pas prioritaire pour la première
version d’Atlas Alignement.

## 23. Configuration

L’utilisateur peut configurer :

- les chemins des plugins, palettes, exemples et scripts ;
- le nombre d’annulations ;
- le caractère de gap ;
- les polices, couleurs et grille ;
- l’historique des couleurs ;
- la numérotation et les espacements ;
- le comportement de l’édition ;
- les infobulles et la barre d’état ;
- les logiciels externes ;
- les commandes d’impression ;
- les paramètres des plugins.

Les réglages peuvent être sauvegardés comme préférences personnelles ou
système.

## 24. Fonctions incomplètes ou dépassées

Toutes les entrées du code ne sont plus fonctionnelles aujourd’hui :

- la commande de documentation est un simple message temporaire ;
- l’import BLAST direct est désactivé ;
- l’alignement structural LSQMAN est incomplet ;
- SignalP 3.0 est obsolète ;
- les anciennes URL UniProt, PDB, Entrez, EBI et DisEMBL doivent être remplacées ;
- `wget`, Ghostscript, DSSP, MUSCLE, MAFFT, ClustalW et Chainsaw doivent être
  installés séparément ;
- l’impression dépend de commandes Unix ;
- certains comportements sont fortement liés à Tk et X11.

# Priorités de développement d’Atlas Alignement

Il ne faut pas reconstruire immédiatement tous les plugins avancés. Le premier
objectif doit être un éditeur d’alignement fiable, performant et sauvegardable.

## Priorité 1 — socle indispensable

### Modèle de document

- séquences ;
- noms et descriptions ;
- gaps ;
- numérotation biologique ;
- annotations ;
- couleurs ;
- métadonnées ;
- version du format.

### Format de projet Atlas

Créer un format propre à Atlas Alignement, par exemple `.atlas`, permettant :

- la sauvegarde et la réouverture ;
- les migrations entre versions ;
- éventuellement l’import de l’ancien format `.aline`.

### Historique

- annuler ;
- rétablir ;
- suivre les modifications non sauvegardées ;
- demander confirmation avant fermeture.

## Priorité 2 — véritable éditeur d’alignement

- curseur dans les cellules ;
- sélection d’une cellule, d’une région, de lignes ou de colonnes ;
- insertion et suppression de gaps ;
- remplacement d’un résidu ;
- insertion et suppression d’une séquence ;
- renommage et réorganisation des lignes ;
- numérotation et offsets ;
- raccourcis clavier ;
- copier-coller.

C’est la fonctionnalité centrale qui manque actuellement à Atlas Alignement.

## Priorité 3 — import et export essentiels

### Imports

- FASTA ;
- ClustalW ALN ;
- PIR ;
- MSF.

### Exports biologiques

- FASTA ;
- ALN ;
- PIR ;
- MSF.

### Exports graphiques

- PNG ;
- SVG ;
- PDF.

Le SVG est particulièrement important pour les publications scientifiques.

## Priorité 4 — affichage performant

- virtualisation des lignes et colonnes ;
- affichage fluide des grands alignements ;
- noms de séquences figés pendant le défilement ;
- règle de positions ;
- zoom et adaptation à la fenêtre ;
- découpage en blocs pour les exports ;
- thèmes clair et sombre.

La version actuelle affiche toutes les cellules dans le DOM. Cela fonctionne
pour de petits alignements, mais ne sera pas suffisant pour de très grands
fichiers.

## Priorité 5 — colorations scientifiques

Ordre recommandé :

1. type de résidu ;
2. identité par colonne ;
3. conservation ;
4. similarité ;
5. palettes personnalisées ;
6. choix des séquences utilisées pour le calcul ;
7. choix séparé des séquences à colorer ;
8. légende exportable.

Atlas possède déjà une première coloration par résidu et une conservation
simple. Elles devront être généralisées et testées.

## Priorité 6 — consensus et nettoyage

- création d’une séquence consensus ;
- suppression des colonnes entièrement composées de gaps ;
- suppression des doublons ;
- détection des fragments ;
- nettoyage des noms ;
- recherche de texte, expressions régulières et motifs PROSITE.

## Priorité 7 — annotations graphiques

Commencer avec :

- texte ;
- boîte ;
- rectangle ;
- soulignement ;
- hélice ;
- brin beta ;
- marqueur ponctuel.

Ajouter ensuite :

- déplacement et redimensionnement ;
- couleurs et épaisseur ;
- ordre des calques ;
- attachement à une séquence ;
- export fidèle en SVG et PDF.

## Priorité 8 — intégrations bioinformatiques modernes

Après stabilisation de l’éditeur :

- alignement avec MAFFT ou MUSCLE ;
- import PDB/mmCIF ;
- structures secondaires DSSP ;
- export PyMOL ;
- propriétés physicochimiques ;
- récupération UniProt/NCBI ;
- graphiques de scores ;
- facteurs B.

BLAST, SignalP, la prédiction de désordre et les autres services distants
devront utiliser leurs API actuelles, avec une gestion claire des erreurs et des
versions.

## Priorité 9 — fonctions avancées

- mutations corrélées ;
- Chainsaw ou équivalent moderne ;
- scripts ;
- système de plugins ;
- impression native ;
- automatisation en ligne de commande.

# MVP recommandé

La première version réellement utilisable d’Atlas Alignement devrait couvrir
le parcours suivant :

```text
Ouvrir FASTA/ALN
→ visualiser rapidement
→ sélectionner et éditer les gaps
→ réorganiser et renommer les séquences
→ annuler/rétablir
→ colorer par résidu ou conservation
→ ajouter un consensus
→ sauvegarder un projet Atlas
→ exporter FASTA, SVG et PNG
```

## État actuel d’Atlas Alignement

Atlas possède déjà :

- l’import FASTA ;
- l’affichage de l’alignement ;
- le zoom et le défilement ;
- la coloration par type de résidu ;
- une conservation simple ;
- des statistiques simples ;
- l’export FASTA.

## Prochain ordre de travail recommandé

1. concevoir le format de document Atlas ;
2. ajouter annuler/rétablir ;
3. rendre l’alignement éditable ;
4. ajouter la sauvegarde et la réouverture d’un projet ;
5. ajouter ALN, PIR et MSF ;
6. ajouter les exports SVG, PNG et PDF ;
7. optimiser le rendu des grands alignements.

Cette base permettra ensuite de reconstruire proprement les annotations et les
analyses avancées d’ALINE.
