# Journal des décisions produit et techniques

## D-001 — ALINE comme référence comportementale

**Décision :** `aline_011208/`, cœur et plugins compris, est la référence pour
la portée fonctionnelle d’Atlas Alignement.

**Conséquence :** aucune parité complète ne peut être annoncée à partir de la
seule interface visible. Les formats, menus, commandes, objets et traitements
des plugins doivent être audités et vérifiés.

## D-002 — Moderniser les mécanismes obsolètes

**Décision :** reproduire le besoin et le résultat utile, mais pas les
dépendances cassées ou les limitations de 2008.

**Exemples :** remplacer les anciennes URL de services, produire directement
SVG/PDF plutôt que dépendre de PostScript et Ghostscript, et utiliser des
mécanismes multiplateformes pour l’impression et les exécutables externes.

## D-003 — Vue Classic par défaut

**Décision :** la vue Classic ALINE est le rendu initial. La vue Modern reste
disponible tant qu’elle partage le même document et les mêmes commandes.

## D-004 — Noms répétés par défaut

**Décision :** afficher les noms des protéines dans chaque ligne de nage par
défaut, avec une option pour ne les afficher que dans le premier bloc.

## D-005 — Organisation des trois lignes supérieures

**Décision :** chaque ligne de nage réserve trois lignes au-dessus des
séquences : numérotation en première ligne, structures secondaires en deuxième
ligne et troisième ligne libre pour de futures annotations.

Les cylindres et ressorts sont créés en sélectionnant l’outil, puis une case de
départ et une case de fin.

## D-006 — Mémoire versionnée dans le dépôt

**Décision :** la vision, l’état, la feuille de route et les décisions sont
stockés dans `docs/`. La mémoire personnelle ou l’historique de conversation
peuvent aider, mais ne constituent pas la source de vérité technique.

## D-007 — Architecture moderne modulaire

**Décision :** ne pas recopier littéralement la séparation cœur/plugins de
Perl/Tk. Les opérations essentielles appartiennent au cœur moderne. Les outils
externes et fonctions spécialisées utilisent des modules avec des contrats
stables, pouvant évoluer vers un système d’extensions contrôlé.

## Décisions encore ouvertes

- conteneur desktop final : Tauri, Electron ou autre solution ;
- moteur de rendu des grands alignements : DOM virtualisé, Canvas, SVG hybride
  ou combinaison ;
- limites exactes de compatibilité visuelle et aller-retour avec `.aline` ;
- services modernes retenus pour BLAST, SignalP et prédiction de désordre ;
- stratégie de distribution et de mise à jour sur les trois systèmes.
