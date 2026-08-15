# ALINE Next

Réécriture moderne et multiplateforme d’ALINE, l’éditeur d’alignements de
séquences biologiques fourni dans `aline_011208/`.

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

- import de fichiers FASTA ;
- validation et normalisation des séquences ;
- affichage d’un alignement avec noms et positions ;
- coloration par type de résidu ou conservation ;
- zoom et défilement ;
- statistiques simples ;
- export FASTA.

## Architecture

- `src/core/` : modèle et traitements indépendants de l’interface ;
- `src/data/` : données de démonstration ;
- `src/App.tsx` : interface de l’éditeur ;
- `aline_011208/` : application Perl historique conservée comme référence.

## Prochaines étapes

1. Ajouter l’édition des gaps et l’historique annuler/rétablir.
2. Importer les formats ALN, PIR, MSF et l’ancien format `.aline`.
3. Ajouter les annotations et l’export PNG/SVG/PDF.
4. Virtualiser les très grands alignements.
5. Emballer l’interface avec Tauri pour macOS, Windows et Linux.
