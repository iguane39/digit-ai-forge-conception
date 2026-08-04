<!-- source: EXIGENCES.json -->
<!-- source-sha256: c74af1807b4abdba3f0e4f6ae844d31706dbf8e0211372aa6296bba95751a8eb -->

# Configuration de mission — Suivi des demandes d'absence

Vue dérivée, destinée à l'étape A de la SaaS Forge (`conductor/cadrage.py`, `cadrer()`).
**Ne pas éditer à la main.**

| Argument | Valeur | Justification |
|---|---|---|
| `idea` | Permettre à un salarié de déclarer une absence sans passer par son responsable, et à un responsable de savoir qui est absent à une date donnée | Synthèse de B-01 et B-02 |
| `mode` | `greenfield` | Entrant de type cahier des charges, aucun dépôt existant |
| `existing_repo` | `None` | Refusé par le conducteur en greenfield |
| `intent` | *(sans objet en greenfield)* | — |
| `target` | `fastapi-saas` | Défaut du conducteur, non contredit par une exigence |
| `brand_charter` | `design/DESIGN.md` | Défaut du conducteur — **aucune charte client fournie** |
| `style_slug` | `digitai` | Défaut du conducteur |
| `budget` | `None` | **Jamais dérivé** — la forge ne chiffre pas |
| `deadline` | `None` | **Jamais dérivé** |
| `bricks` | *(aucune brique additionnelle)* | Aucune exigence ne motive une brique hors t0 |

## Briques de t0

`multi-tenancy`, `rbac`, `auth-sso` sont **forcées en `build`** par le conducteur et ne peuvent
pas être désactivées depuis `cadrer()`.

Point de vigilance : le référentiel distingue deux rôles (S-03 Salarié, S-04 Responsable) sans
exiger de gestion fine des droits. `rbac` sera donc construit **au-delà** de ce que le
référentiel demande. Ce n'est pas un conflit — c'est une contrainte de la cible, signalée pour
que l'écart ne soit pas lu comme une exigence oubliée.

## Arguments laissés au défaut

`target`, `brand_charter`, `style_slug` sont au défaut du conducteur. **Déclaré ici**, pas
subi : aucune exigence ne les contredit, et aucune charte client n'a été fournie avec l'entrant.

C'est ce qui rend ce cadrage opposable, là où l'étape A n'accepte aujourd'hui qu'une chaîne de
caractères libre dont la qualité n'est ni tracée ni vérifiable.
