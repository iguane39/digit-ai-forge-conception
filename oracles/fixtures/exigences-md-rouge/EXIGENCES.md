# Référentiel d'exigences — Portail de réservation de salles

> Fixture TF-0822, **sens rouge**. Le référentiel `EXIGENCES.json` est le MÊME que celui de la
> fixture verte, au caractère près : seule la PROSE change. Un seul FAIL possible par règle,
> celui que la règle doit prouver.
>
> - **P1** — la section 6 « Relevé des oracles » est absente du gabarit.
> - **P2** — la section 4 « Hypothèses » est présente mais VIDE.
> - **P3** — la section 7 existe et n'est pas vide, mais aucune des trois entrées d'
>   `ecarts_exigences_socle` n'y est écrite : c'est le défaut fondateur, l'écart saisi
>   directement dans le JSON sans que personne ne l'ait décidé en prose.
> - **P4** — la section 3 de `SURFACE.md` existe et écarte autre chose que les deux entrées
>   d'`ecarts_surface_implicite` du référentiel.

## 1. Origine

`ENTRANT.md` du 2026-09-05 et `SURFACE.md` du même jour.

## 2. Besoins

| id | énoncé |
|---|---|
| B-01 | Un collaborateur doit réserver une salle depuis son navigateur sans passer par un tiers. |
| B-02 | Un collaborateur qui se perd dans le portail doit toujours retrouver un chemin utilisable. |

## 3. Exigences par palier

| Palier | Exigences |
|---|---|
| MVP | E-001 à E-010 |

## 4. Hypothèses

## 5. Couverture de surface

Onze éléments énumérés, onze couverts : 100 %.

## 7. Ce que le référentiel ne dit pas

Reste hors du référentiel, et attendu d'une décision : le sort des réservations récurrentes, la
politique de rétention des créneaux passés, et l'ouverture éventuelle du portail à des
intervenants extérieurs.
