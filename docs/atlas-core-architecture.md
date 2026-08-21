# Architecture du cœur d’Atlas Alignement

## État initial du prototype

Le premier prototype savait importer et afficher un FASTA, calculer une
conservation simple, appliquer des couleurs et réexporter en FASTA.

Ses principales limites étaient :

- un modèle limité à un nom et une liste de séquences ;
- aucune version de format Atlas ;
- état du document stocké directement dans le composant React ;
- aucune commande métier réutilisable hors de l’interface ;
- aucun undo/redo ;
- aucune édition interactive ;
- aucun test du cœur ;
- un élément HTML créé pour chaque résidu, ce qui limitera les performances sur
  les grands alignements.

## Premier incrément du cœur

### `src/core/model.ts`

Définit le format interne versionné :

- `AlignmentDocument` ;
- `Sequence` ;
- `CellPosition` ;
- identifiant et version du format ;
- point de départ de la numérotation biologique.

Le format actuel porte l’identifiant `atlas-alignment` et la version `1`.

### `src/core/commands.ts`

Contient des opérations métier pures et indépendantes de React :

- remplacer un résidu ;
- insérer un gap ;
- supprimer une cellule ;
- renommer une séquence ;
- déplacer une séquence.

Les commandes ne modifient jamais directement le document reçu. Elles
retournent un nouveau document, ce qui simplifie l’historique et les tests.

### `src/core/history.ts`

Gère :

- l’exécution d’une commande ;
- undo ;
- redo ;
- le remplacement du document lors d’un import ;
- l’état modifié ou sauvegardé du document.

L’historique reste indépendant de l’interface graphique.

### Interface actuelle

L’interface permet désormais de :

- cliquer sur une cellule pour la sélectionner ;
- saisir une lettre pour remplacer le résidu sélectionné ;
- utiliser Delete ou Backspace pour remplacer le résidu par un gap ;
- insérer un gap avant la cellule ;
- supprimer la cellule ;
- annuler et rétablir les changements ;
- voir un indicateur sur le titre quand le document est modifié.

### Deux modes de visualisation

L’interface propose deux rendus partageant exactement le même document et le
même moteur d’édition :

- **Modern** : tableau continu sombre, proche du premier prototype ;
- **Classic ALINE** : feuille claire quadrillée, alignement découpé en blocs,
  titres répétés, règle tous les 10 résidus et numéros en fin de ligne.

La vue Classic permet de choisir une largeur de 40, 50, 60, 70 ou 80 caractères
par bloc. Une cellule sélectionnée dans une vue reste la même cellule métier :
les modifications et l’historique ne dépendent donc pas du rendu choisi.

## Tests

Vitest vérifie actuellement :

- la création d’un document Atlas depuis FASTA ;
- la normalisation des longueurs ;
- le calcul simple de conservation ;
- le remplacement et la validation des résidus ;
- l’insertion d’un gap ;
- la suppression d’une cellule ;
- undo et redo ;
- la suppression de l’historique redo après une nouvelle branche d’édition.

Commandes de validation :

```bash
npm test
npm run build
```

## Limites connues

- la sélection porte encore sur une seule cellule ;
- le curseur ne se déplace pas encore avec les flèches ;
- l’insertion ou la suppression ne possède pas encore toutes les règles
  biologiques d’ALINE ;
- le modèle ne contient pas encore les annotations, palettes ou graphiques ;
- il n’existe pas encore de sauvegarde `.atlas` ;
- le rendu repose toujours sur le DOM et n’est pas virtualisé ;
- les commandes de renommage et déplacement existent dans le cœur, mais ne
  sont pas encore exposées dans l’interface.

## Prochaine tranche recommandée

La prochaine étape doit compléter le cycle du document :

1. sérialiser et valider un fichier de projet `.atlas` ;
2. ouvrir et sauvegarder ce projet ;
3. marquer correctement le point de sauvegarde dans l’historique ;
4. avertir avant de remplacer un document modifié ;
5. ajouter la navigation du curseur au clavier ;
6. ajouter la sélection de régions.

La virtualisation Canvas devra suivre avant l’ajout de nombreuses annotations,
car elle déterminera l’architecture du rendu et les performances finales.
