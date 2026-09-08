# Contrats des trois vues

Chaque contrat est **constaté** dans le dépôt du consommateur, jamais supposé. Les chemins
cités sont ceux vérifiés le 04/08/2026.

---

## En-tête commun — obligatoire sur toute vue markdown

Les trois premières lignes, avant tout contenu :

> `<!-- source: EXIGENCES.json -->`
> `<!-- source-sha256: <64 caractères hexadécimaux> -->`
> `<!-- corps-sha256: <64 caractères hexadécimaux> -->`

**`source-sha256` — d'où vient cette vue.** L'empreinte est celle des **octets** de
`EXIGENCES.json`, fins de ligne **normalisées LF** (CRLF→LF) avant hachage — TF-0114 : sous
Windows, `core.autocrlf` convertit le fichier en CRLF au checkout, alors qu'un poste
Linux/macOS le voit en LF ; sans cette normalisation, un contenu identique au caractère près
produirait deux empreintes différentes selon l'OS. Elle se recalcule à chaque régénération.
`oracle-tracabilite` T3 la compare avec la même normalisation ; une vue sans en-tête est un
échec au même titre qu'une vue périmée.

**`corps-sha256` — ce que cette vue contient (TF-0818).** L'empreinte de la source prouve la
**provenance**, jamais le **contenu** : mesuré le 05/09/2026, un `CADRAGE-DESIGN.md` privé de
sa seule section « Surface implicite écartée » — 996 caractères sur 4 327, dont deux écarts
opposables — gardait un en-tête valide, et T3 rendait PASS. La vue porte donc aussi
l'empreinte SHA-256 de **son propre corps** : tout ce qui suit la ligne `corps-sha256`,
sceau exclu, mêmes fins de ligne normalisées LF. `oracle-tracabilite` **T5** la recalcule et la
compare ; une amputation, un ajout, un mot changé la font diverger.

Ordre de production, et il n'est pas indifférent : **le corps d'abord**, son empreinte
ensuite, l'en-tête en dernier. Hacher un fichier dont l'en-tête contiendrait déjà sa propre
empreinte n'aurait pas de point fixe.

```bash
# corps = le fichier SANS ses trois lignes d'en-tête ; empreinte à recopier en 3e ligne
node -e "const{createHash}=require('crypto');const fs=require('fs');\
process.stdout.write(createHash('sha256').update(fs.readFileSync('corps.md','utf8')\
.replace(/\r\n/g,'\n'),'utf8').digest('hex'))"
```

**Aucune vue déjà scellée n'a été migrée.** Une vue qui ne porte pas `corps-sha256` se juge
comme avant — provenance seule — et T5 le **dit** en `SANS_OBJET` plutôt que de laisser croire
que son contenu a été vérifié. La régénérer par ce verbe lui donne l'empreinte de son corps.

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
les sections **« Surface implicite écartée »** et **« Exigences socle écartées »** définies
plus bas, et une section finale disant ce que la vue ne dit pas.

Cette phrase est **citée mot pour mot** par `oracle-tracabilite` T5 dans son message d'échec,
pour dire au lecteur d'une vue altérée ce qu'elle devait porter. Elle n'y est pas **câblée** :
T5 ne cherche aucune de ces sections dans la vue. Le self-test rejoue la citation contre cette
phrase et échoue si elle a changé ici sans changer là — une citation qui dérive de sa source
est une transcription sans correspondance, pas un rappel.

**Section « Surface implicite écartée » (TF-0811).** Dérivée du champ racine
`ecarts_surface_implicite`, quatre colonnes reprises telles quelles — `element` · `motif` ·
`decide_par` · `date`. Elle dit au design ce que le produit **n'aura pas**, et sur décision de
qui : sans elle, un candidat d'office absent de la fiche se lit comme un oubli de la Conception,
et le design le repropose ou l'ignore au hasard. Le champ est facultatif à la lecture ; quand il
est absent ou vide, la section est produite quand même et porte la mention *(aucun écart
déclaré)* — une section absente ne se distinguerait pas d'un référentiel qui n'a rien décidé.

Cette vue est le seul aval qui reçoit le champ : `MISSION.md` ne le porte pas (aucun argument de
`cadrer()` ne l'accepte, et la Conception n'étend aucun contrat aval), et Forge Tests lit
`EXIGENCES.json` directement, donc le champ y est déjà.

**Section « Exigences socle écartées » (TF-0814).** Même forme, dérivée du champ racine
`ecarts_exigences_socle` : quatre colonnes reprises telles quelles — `element` · `motif` ·
`decide_par` · `date`. Elle dit au design ce que le référentiel **ne demande pas** parmi les
trois exigences socle candidates (données de démonstration invisibles en production, données
volatiles éditables/datées/sourcées, effet observable de tout élément interactif) et sur décision
de qui. Champ facultatif à la lecture ; absent ou vide, la section est produite quand même et
porte la mention *(aucun écart déclaré)*. Comme la précédente, cette vue est le seul aval qui la
reçoit.

**Note constatée** : `ingestion.md` porte déjà, ligne 12, l'entrant « Spécification écrite
(CDC, user stories) ». Le référentiel passe donc par un entrant existant. **Aucune extension
du pivot n'est requise.**

**Cas constaté (premier produit réel) — ton fourni par délégation.** Certains entrants ne
nomment pas le ton, mais le délèguent à une référence externe : « reprendre le ton du site
X », « même registre que la marque Y ». Ce n'est pas le cas *non dérivable* de la ligne
« Ton attendu » ci-dessus — une source existe, elle demande seulement à être observée.

Résolution : le ton se dérive par **observation datée** de la référence déléguée (3 mots
concrets constatés à la lecture du site ou du support cité, jamais *moderne* ni *élégant*).
La fiche le porte comme une **hypothèse**, au même schéma que `statut_epistemique` dans
`EXIGENCES.json` :
- `nature` : hypothèse (une lecture du ton par un tiers reste subjective, même sourcée) ;
- `source` : la référence déléguée et la date d'observation — ex. « ton observé sur
  https://exemple.com le 04/08/2026 : direct, technique, peu d'adjectifs » ;
- `validation` : le mode de levée si le commanditaire doit confirmer avant livraison design.

Ce champ **n'est plus** porté en `*(à demander)*` dans ce cas : une délégation nommée est une
source, pas une absence. `*(à demander)*` reste réservé au cas où l'entrant ne dit rien du
ton — ni mots, ni référence à observer. Aucune question n'est posée à l'humain pour trancher
un ton observable : l'observation datée tient lieu de réponse, sujette à la même
`validation` que toute autre hypothèse.

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

À chaque modification de `EXIGENCES.json` : **les trois vues sont refaites**, les **deux**
empreintes recalculées — celle de la source ET celle du corps, dans cet ordre —, et
`oracle-tracabilite` relancé avec `--vue` sur chacune. Une vue régénérée qui ne porterait que
`source-sha256` sortirait `SANS_OBJET` sur T5 : la règle le dit, elle ne le reproche pas, mais
le contrôle du contenu n'aurait alors pas eu lieu. Un écart de surface
implicite ajouté ou retiré est une modification du référentiel comme une autre : la fiche de
cadrage est régénérée, faute de quoi elle affirme un périmètre que la source ne dit plus.

Exemple travaillé, source et vue scellée ensemble :
[oracles/fixtures/surface-implicite-verte](../../../oracles/fixtures/surface-implicite-verte)
— treize candidats de la liste close, neuf retenus, quatre écartés, la vue régénérée sur
l'empreinte de sa source.

Second exemple travaillé, une candidate socle écartée et deux retenues :
[oracles/fixtures/exigences-socle-verte](../../../oracles/fixtures/exigences-socle-verte)
— la fiche porte la section « Exigences socle écartées », scellée sur l'empreinte de sa source.

Ces deux exemples ont été scellés **avant** TF-0818 : ils ne portent que `source-sha256`, et
n'ont pas été migrés. L'exemple travaillé du sceau **à deux empreintes** est
[oracles/fixtures/corps-de-vue-verte](../../../oracles/fixtures/corps-de-vue-verte) — même
fiche, même source, en-tête complet ; sa jumelle `corps-de-vue-rouge` est la même vue amputée
de sa seule section « Exigences socle écartées » (862 caractères sur 2 649, un tiers du corps),
en-tête laissé intact : T3 y reste vert, T5 seule la refuse.

Une vue qui n'a pas été régénérée n'est pas « un peu périmée » : elle affirme un contenu que
la source ne dit plus.
