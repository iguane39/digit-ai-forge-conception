# Référentiel d'exigences — Portail de réservation de salles

> Fixture TF-0822, **sens vert** : le gabarit est complet, les sections 4 et 7 sont non vides,
> et chacune des trois entrées d'`ecarts_exigences_socle` du référentiel voisin est transcrite
> en section 7, clé et motif. `oracle-exigences-md` y rend PASS sur P1, P2, P3 et P4.

## 1. Origine

`ENTRANT.md` du 2026-09-05 (cahier des charges, seuil de suffisance atteint) et `SURFACE.md`
du même jour, dont les onze éléments sont repris tels quels dans le tableau `surface[]` du
référentiel. Référentiel généré le 2026-09-05.

## 2. Besoins

| id | énoncé |
|---|---|
| B-01 | Un collaborateur doit réserver une salle depuis son navigateur sans passer par un tiers. |
| B-02 | Un collaborateur qui se perd dans le portail doit toujours retrouver un chemin utilisable. |

## 3. Exigences par palier

Les dix exigences du palier MVP, avec leurs huit champs, vivent dans `EXIGENCES.json` — source
unique. Ce document en est la lecture humaine ; il ne les redouble pas ligne à ligne, il dit
d'où elles viennent, ce qu'elles laissent de côté, et ce que les oracles en ont dit.

| Palier | Exigences |
|---|---|
| MVP | E-001 à E-010 |
| V1 | aucune à ce jour |
| V2 | aucune à ce jour |

## 4. Hypothèses

Aucune exigence de ce référentiel n'est au statut `hypothèse` : les dix portent un statut
`fait constaté` avec sa source. La section reste écrite plutôt que retirée — une section
d'hypothèses absente et une section d'hypothèses vide ne se ressemblent pas, et c'est la
seconde qui est ici constatée.

## 5. Couverture de surface

Onze éléments de surface énumérés, onze couverts : 100 %. Aucun élément non couvert à nommer.

## 6. Relevé des oracles

| Oracle | Verdict | Raison |
|---|---|---|
| `oracle-exigences` | PASS | E1 à E10 verts, écarts socle déclarés |
| `oracle-surface` | PASS | S1 à S4 verts, surface implicite instruite |
| `oracle-claims` | PASS | aucune donnée chiffrée non marquée |
| `oracle-exigences-md` | PASS | gabarit complet, correspondances tenues |

## 7. Ce que le référentiel ne dit pas

Les trois **exigences socle candidates** proposées d'office ont été examinées. Aucune n'est
retenue au palier MVP, et chacune est écartée ci-dessous plutôt que passée sous silence. Ces
trois lignes sont transcrites telles quelles dans le champ `ecarts_exigences_socle` du
référentiel — la prose est ici la source, le champ en est la copie.

| clé | motif | décidé par | date |
|---|---|---|---|
| `donnees-demonstration` | portail réservé aux collaborateurs authentifiés : aucun jeu de démonstration n'est prévu, et aucun environnement de démonstration n'est ouvert | le commanditaire du produit | 2026-09-05 |
| `donnees-volatiles` | les salles et leurs créneaux sont saisis par les services généraux depuis le produit : aucun catalogue ni tarif figé dans le code n'existe | le commanditaire du produit | 2026-09-05 |
| `effet-observable` | chaque exigence de ce référentiel porte déjà son critère observable ; aucune règle transverse supplémentaire n'est retenue au palier MVP | le commanditaire du produit | 2026-09-05 |

Reste hors du référentiel, et attendu d'une décision : le sort des réservations récurrentes,
la politique de rétention des créneaux passés, et l'ouverture éventuelle du portail à des
intervenants extérieurs.
