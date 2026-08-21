# Atlas Alignement

Éditeur moderne et multiplateforme d’alignements de séquences biologiques,
inspiré de l’application historique ALINE fournie dans `aline_011208/`.

## Démarrage

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Vite affiche ensuite l’adresse locale de l’application, généralement
`http://localhost:5173`.

Pour vérifier la version de production :

```bash
npm run build
npm run preview
```

## Fonctionnalités actuelles

- ouverture de projets `.atlas`, de projets historiques `.aline`, de fichiers FASTA et de séquences texte simples ;
- sauvegarde du projet courant au format `.atlas` ;
- validation et normalisation des séquences ;
- affichage d’un alignement avec noms et positions ;
- vues interchangeables Modern et Classic ALINE ;
- coloration par type de résidu ou conservation ;
- découpage automatique des longues séquences selon la largeur disponible, sans défilement horizontal dans la vue Classic ALINE ;
- statistiques simples ;
- export FASTA ;
- sélection et première édition des cellules ;
- insertion de gaps et suppression de cellules ;
- historique undo/redo ;
- modèle de document Atlas versionné ;
- tests automatisés du cœur.

## Architecture

- `src/core/` : modèle et traitements indépendants de l’interface ;
- `src/data/` : données de démonstration ;
- `src/App.tsx` : interface de l’éditeur ;
- `aline_011208/` : application Perl historique conservée comme référence.

## Prochaines étapes

1. Ajouter la navigation clavier et la sélection de régions.
2. Importer les formats ALN, PIR et MSF.
3. Étendre l’import `.aline` aux annotations et objets graphiques historiques.
4. Ajouter les annotations et l’export PNG/SVG/PDF.
5. Virtualiser les très grands alignements.
6. Emballer l’interface avec Tauri pour macOS, Windows et Linux.


## Launch Aline

```bash
open -a XQuartz
perl /Users/noureddine/biochim-project/aline_011208/bin/aline
```
