# Feuille de route vers la parité complète avec ALINE

Cette feuille de route est ordonnée pour éviter de construire les fonctions
avancées sur un modèle ou un rendu qui devrait ensuite être remplacé.

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

- [x] convertir l’inventaire existant en matrice cœur/plugin avec un identifiant
  stable par fonctionnalité ;
- [x] associer chaque entrée aux fonctions Perl et fichiers concernés ;
- [ ] définir pour chaque entrée un test, une fixture ou une procédure manuelle ;
- [ ] caractériser complètement le format `.aline`, y compris objets,
  graphiques, couleurs, attachements et préférences de document ;
- [ ] constituer un corpus de projets historiques représentatifs ;
- [ ] marquer les intégrations obsolètes et choisir leurs remplacements.

**Sortie :** une matrice de parité qui permet de mesurer objectivement
l’avancement et empêche d’oublier une fonction de plugin.

## Phase 1 — Modèle de document Atlas extensible

- [ ] concevoir la version 2 du format `.atlas` ;
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
