<!-- source: EXIGENCES.json -->
<!-- source-sha256: e9de52d59db30741bc7c5ec5724c9d79c8497f0987445f80ca36d06df7d77e92 -->

# Fiche de cadrage design — Suivi des demandes d'absence

Vue dérivée. **Ne pas éditer à la main** : toute modification se fait dans `EXIGENCES.json`,
puis la vue est régénérée. Une vue éditée est détectée par `oracle-tracabilite` T3.

| Champ | Valeur | Origine |
|---|---|---|
| Secteur d'activité | Ressources humaines, gestion des absences | dérivé de `projet` |
| Cible | Salarié · Responsable | dérivé de `surface[].type = role` |
| Job principal | Déclarer une absence sans passer par son responsable | dérivé de `besoins[B-01]` |
| Ton attendu | *(à demander)* | **non dérivable** — 3 mots concrets, arbitrage humain |
| Contraintes reprises | *(à demander)* | **non dérivable** — ce qui doit survivre à la refonte |
| Hypothèses | Décompte du solde à valider avec la paie · délai de notification à cadrer | dérivé des exigences `statut_epistemique.nature = hypothèse` |

## Objets et parcours à couvrir

| Élément | Type | Exigences rattachées |
|---|---|---|
| Demande d'absence | objet | E-001 |
| Solde de congés | objet | E-002 |
| Salarié | rôle | E-001 |
| Responsable | rôle | E-004 |
| Déclaration d'une absence | parcours | E-004, E-005, E-007 |
| Export mensuel des absences | parcours | — (non couvert, avertissement `oracle-surface` S1) |

## Exigences socle écartées

Ce que le référentiel **ne demande pas**, et pourquoi — dérivé du champ racine
`ecarts_exigences_socle`, lui-même transcrit de la section 7 « Ce que le référentiel ne dit
pas » d'`EXIGENCES.md`. Une candidate absente de ce tableau **et** des exigences est un oubli,
jamais un arbitrage : `oracle-exigences` E10 le refuse.

| Candidate écartée | Motif | Décidé par | Date |
|---|---|---|---|
| `donnees-demonstration` | produit interne servi sur les seules données de l'entreprise : aucun jeu de démonstration n'est embarqué, la recette se fait sur un extrait anonymisé déposé hors du binaire livré | le commanditaire du produit | 2026-08-04 |
| `donnees-volatiles` | ni catalogue, ni tarif, ni barème : les seules données servies sont les demandes d'absence et les soldes, qui ne sont pas des référentiels périssables | le commanditaire du produit | 2026-08-04 |
| `effet-observable` | l'effet de chaque geste est déjà porté exigence par exigence (E-001, E-002, E-004), avec son critère observable : aucune règle transverse supplémentaire n'est retenue au palier MVP | le commanditaire du produit | 2026-08-04 |

Les trois candidates du schéma sont écartées : le design n'a donc à prévoir ni jeu de
démonstration, ni écran d'édition de référentiel périssable, et hérite de l'effet observable
exigence par exigence.

## Ce que cette vue ne dit pas

Le champ `ton` et les contraintes reprises ne se déduisent d'aucune exigence. Ils sont
**demandés**, jamais remplis par défaut — c'est le point où la Conception rend la main,
conformément à `ameliore-le-design/references/ingestion.md` l.44-46.
