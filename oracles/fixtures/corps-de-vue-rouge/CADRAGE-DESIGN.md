<!-- source: EXIGENCES.json -->
<!-- source-sha256: d9398e33486c4a08045e67950c68b62961ed67af18ee2fc6d1dd4167f2453fdc -->
<!-- corps-sha256: 4fac5cc96dccb1c3647dbb3d401ce541fb78c3dc68820f9a9d2c4d19171db8cd -->

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

## Hors du champ de cette vue

Le champ `ton` et les contraintes reprises ne se déduisent d'aucune exigence. Ils sont
**demandés**, jamais remplis par défaut — c'est le point où la Conception rend la main,
conformément à `ameliore-le-design/references/ingestion.md` l.44-46.

La **pertinence** d'un motif d'écart n'est pas jugée : E10 exige qu'il soit écrit, daté et
signé, pas qu'il soit vrai. Le design qui lit cette vue hérite donc d'une décision opposable,
pas d'une décision validée.
