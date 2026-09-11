# Mémoire opérationnelle du projet

Ce dossier contient le carnet de bord versionné d’Atlas Alignement :

- `GOAL.md` décrit le résultat final et la condition d’arrêt ;
- `PLAN.md` ordonne les checkpoints vérifiables ;
- `STATUS.md` indique l’état factuel, le checkpoint actif et les blocages ;
- `DECISIONS.md` conserve les décisions durables et leur justification.

Ces fichiers constituent une seule mémoire, lisible par les humains, Codex et
OpenCode. Ils ne remplacent pas les documents fonctionnels et techniques de
`docs/`, et `docs/` ne doit pas contenir une seconde version du plan ou de
l’état du projet.

## Relation avec une mémoire personnelle externe

Un vault personnel comme celui décrit dans l’article *Codex-maxxing* répond à
un autre besoin : conserver du contexte transversal entre plusieurs projets,
personnes et conversations. Le présent dossier reste dans le dépôt parce que
son contenu doit évoluer avec le code, être revu dans les diffs et rester
disponible pour toute personne ou tout agent qui clone Atlas Alignement.

## Boucle de mise à jour

`AGENTS.md` définit la boucle obligatoire. En résumé : lire l’objectif et
l’état, prendre le prochain checkpoint, auditer ALINE, implémenter, vérifier,
mettre à jour la mémoire, puis committer et pousser le checkpoint. Un statut ou
une case ne doit jamais être mis à jour avant que sa preuve soit disponible.
