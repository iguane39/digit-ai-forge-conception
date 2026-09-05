<!-- source: EXIGENCES.json -->
<!-- source-sha256: 0b4d70263d9d6a06c39ff64e890edbdb16df6cee73472abf0ce24aecae6ea355 -->

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

## Exigences socle écartées

Ce que le référentiel **ne demande pas**, et pourquoi — dérivé du champ racine
`ecarts_exigences_socle`, lui-même transcrit de la section 7 « Ce que le référentiel ne dit
pas » d'`EXIGENCES.md`. Une candidate absente de ce tableau **et** des exigences est un oubli,
jamais un arbitrage : `oracle-exigences` E10 le refuse.

| Candidate écartée | Motif | Décidé par | Date |
|---|---|---|---|
| `donnees-demonstration` | le produit n'embarque aucun jeu de démonstration : la recette se fait sur un extrait anonymisé du catalogue réel, déposé hors du binaire livré | le commanditaire du produit | 2026-09-05 |

Les deux autres candidates sont **retenues** : la donnée volatile par E-003, qui date et source
le tarif servi, et l'effet observable par E-004. Le design hérite donc des deux, et n'a aucun
écran de démonstration à prévoir.

## Ce que cette vue ne dit pas

Le champ `ton` et les contraintes reprises ne se déduisent d'aucune exigence. Ils sont
**demandés**, jamais remplis par défaut — c'est le point où la Conception rend la main,
conformément à `ameliore-le-design/references/ingestion.md` l.44-46.

La **pertinence** d'un motif d'écart n'est pas jugée : E10 exige qu'il soit écrit, daté et
signé, pas qu'il soit vrai. Le design qui lit cette vue hérite donc d'une décision opposable,
pas d'une décision validée.
