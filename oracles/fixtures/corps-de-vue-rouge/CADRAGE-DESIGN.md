<!-- source: EXIGENCES.json -->
<!-- source-sha256: 0b4d70263d9d6a06c39ff64e890edbdb16df6cee73472abf0ce24aecae6ea355 -->
<!-- corps-sha256: 9e5008ec666780a3ca139961ca192fae124e9c9ea6fae1f3c4fc140976a5d8e8 -->

# Fiche de cadrage design — Catalogue de formations internes

Vue dérivée. **Ne pas éditer à la main** : toute modification se fait dans `EXIGENCES.json`,
puis la vue est régénérée. Une vue éditée est détectée par `oracle-tracabilite` T3.

| Champ | Valeur | Origine |
|---|---|---|
| Secteur d'activité | Formation professionnelle interne | dérivé de `projet` |
| Cible | Collaborateur · Gestionnaire du catalogue | dérivé de `surface[].type = role` |
| Job principal | Trouver une formation ouverte aux inscriptions sans passer par le service formation | dérivé de `besoins[B-01]` |
| Ton attendu | *(à demander)* | **non dérivable** — 3 mots concrets, arbitrage humain |
| Contraintes reprises | *(à demander)* | **non dérivable** — ce qui doit survivre à la refonte |
| Hypothèses | Retour visuel après chaque geste, à confirmer en revue de maquette | dérivé des exigences `statut_epistemique.nature = hypothèse` |

## Objets et parcours à couvrir

| Élément | Type | Exigences rattachées |
|---|---|---|
| Fiche de formation | objet | E-001, E-003 |
| Inscription à une session | objet | E-002 |
| Collaborateur | rôle | E-001 |
| Gestionnaire du catalogue | rôle | E-003 |
| Inscription à une session ouverte | parcours | E-002, E-004 |
| Recherche du catalogue | point d'entrée | E-001 |

## Ce que cette vue ne dit pas

Le champ `ton` et les contraintes reprises ne se déduisent d'aucune exigence. Ils sont
**demandés**, jamais remplis par défaut — c'est le point où la Conception rend la main,
conformément à `ameliore-le-design/references/ingestion.md` l.44-46.

La **pertinence** d'un motif d'écart n'est pas jugée : E10 exige qu'il soit écrit, daté et
signé, pas qu'il soit vrai. Le design qui lit cette vue hérite donc d'une décision opposable,
pas d'une décision validée.
