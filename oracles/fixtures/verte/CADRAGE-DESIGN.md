<!-- source: EXIGENCES.json -->
<!-- source-sha256: ca1dfa5d7e813f558c56b28a7f8cad5fb0359e99c21254aa81d5fcc4185ed0ff -->

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

## Ce que cette vue ne dit pas

Le champ `ton` et les contraintes reprises ne se déduisent d'aucune exigence. Ils sont
**demandés**, jamais remplis par défaut — c'est le point où la Conception rend la main,
conformément à `ameliore-le-design/references/ingestion.md` l.44-46.
