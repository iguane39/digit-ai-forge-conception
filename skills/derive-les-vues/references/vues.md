# Contrats des trois vues

Chaque contrat est **constaté** dans le dépôt du consommateur, jamais supposé. Les chemins
cités sont ceux vérifiés le 04/08/2026.

---

## En-tête commun — obligatoire sur toute vue markdown

Les deux premières lignes, avant tout contenu :

> `<!-- source: EXIGENCES.json -->`
> `<!-- source-sha256: <64 caractères hexadécimaux> -->`

L'empreinte est celle des **octets** de `EXIGENCES.json`. Elle se recalcule à chaque
régénération. `oracle-tracabilite` T3 la compare ; une vue sans en-tête est un échec au même
titre qu'une vue périmée.

---

## 1. `CADRAGE-DESIGN.md` → Forge Design

**Contrat source** : `digit-ai-forge-design/skills/ameliore-le-design/references/ingestion.md`,
lignes 33-46. La fiche est *« obligatoire et demandée »* sur un entrant sans produit existant.

| Champ de la fiche | Dérivation |
|---|---|
| Secteur d'activité | `projet` + vocabulaire des `besoins[]` — partiel, complété à la main si l'entrant ne le nomme pas |
| Cible | `surface[]` de type `role` |
| Job principal | `besoins[]` de plus fort impact ICE |
| Ton attendu | **non dérivable** — `*(à demander)*` |
| Contraintes reprises | **non dérivable** — `*(à demander)*` |
| Hypothèses | Exigences dont `statut_epistemique.nature = hypothèse` |

Sections complémentaires à produire : le tableau *élément de surface → exigences rattachées*,
et une section finale disant ce que la vue ne dit pas.

**Note constatée** : `ingestion.md` porte déjà, ligne 12, l'entrant « Spécification écrite
(CDC, user stories) ». Le référentiel passe donc par un entrant existant. **Aucune extension
du pivot n'est requise.**

---

## 2. `MISSION.md` → SaaS Forge

**Contrat source** : `digitai-saas-forge/conductor/cadrage.py`, signature de `cadrer()`.
Emplacement du dépôt vérifié : `C:\Users\Sébastien\.saas-forge\digit-ai-saas-forge`.

| Argument | Dérivation | Défaut du conducteur |
|---|---|---|
| `idea` | Synthèse des `besoins[]`. **Seul argument validé** côté conducteur : non vide | — |
| `mode` | `greenfield` si entrant idée ou CDC · `brownfield` si produit à reprendre ou faire évoluer | `greenfield` |
| `existing_repo` | Chemin du dépôt, **exigé** en brownfield, **refusé** en greenfield | `None` |
| `intent` | `remediation` · `complement` · `both`, selon le delta de `ENTRANT.md` | `remediation` |
| `target` | Cible de production | `fastapi-saas` |
| `brand_charter` | Chemin du `DESIGN.md` client | `design/DESIGN.md` |
| `style_slug` | Style retenu | `digitai` |
| `budget`, `deadline` | **Jamais dérivés.** La forge ne chiffre pas | `None` |
| `bricks` | Décisions build/buy/skip, chacune **tracée à une exigence** | `[]` |

**Contrainte du conducteur à connaître** : les briques de t0 — multi-tenancy, rbac, auth-sso —
sont forcées en `build` et **ne peuvent pas être désactivées** depuis `cadrer()`. Une exigence
qui les contredirait est un conflit à remonter, pas à contourner.

`MISSION.md` porte, pour chaque argument, **sa valeur et sa justification**. Un argument laissé
au défaut est déclaré comme tel : c'est ce qui rend le cadrage opposable, là où l'étape A
n'accepte aujourd'hui qu'une chaîne libre.

---

## 3. `EXIGENCES.json` → Forge Tests

**Contrat source** : `digit-ai-forge-tests/docs/Digit-AI - Spec Forge - Noyau et contrat
adaptateur - 20260802a.md`, §155-158. Le référentiel de tests porte un champ `risque` =
*« identifiant du risque ou de l'exigence couverte »*, **obligatoire, seuil S-11 à 100 %**.

Aucune transformation : `EXIGENCES.json` **est** la vue. Les valeurs consommables sont les
`exigences[].id`.

Deux propriétés conditionnent l'usage, et sont vérifiées par `oracle-exigences` E2 :

1. **Unicité** — deux exigences ne partagent jamais un identifiant.
2. **Non-réaffectation** — un identifiant retiré n'est jamais réattribué. Forge Tests a écrit
   des tests contre lui ; le réutiliser casserait la traçabilité en silence.

**Limite déclarée** : Forge Tests est en construction non commencée à la date de ce document.
Le contrat est lu dans sa spécification, pas éprouvé en exécution. Le contrôle de bout en bout
reste manuel jusqu'à ce que la forge tourne.

---

## Régénération

À chaque modification de `EXIGENCES.json` : **les trois vues sont refaites**, l'empreinte
recalculée, et `oracle-tracabilite` relancé avec `--vue` sur chacune.

Une vue qui n'a pas été régénérée n'est pas « un peu périmée » : elle affirme un contenu que
la source ne dit plus.
