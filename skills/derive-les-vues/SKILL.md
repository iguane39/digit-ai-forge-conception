---
name: derive-les-vues
description: Dérive du référentiel d'exigences les trois vues attendues par les forges aval — la fiche de cadrage 6 champs de Forge Design, la configuration de mission de la SaaS Forge, et l'export d'identifiants consommable par le champ risque de Forge Tests — chacune scellée par l'empreinte de sa source pour qu'une vue périmée ou éditée à la main soit détectée. Use when / déclencher dès qu'un référentiel d'exigences existe et qu'il faut le passer à une forge aval, produire une fiche de cadrage design, préparer le cadrage d'une mission SaaS Forge, exporter des identifiants d'exigence pour une campagne de tests, régénérer des vues après modification du référentiel, ou décliner un rétro-modèle en documentations par audience (vues par profil PO / CSM / utilisateur, scellées par empreinte). Ne pas déclencher pour rédiger ou modifier les exigences elles-mêmes (→ redige-les-exigences), ni pour exécuter une forge aval — ce verbe dépose des artefacts, il n'invoque personne.
version: 1.4.0
---

# Dérive les vues

Quatrième verbe. Il ne décide rien : il **traduit** la source unique dans le format que
chaque consommateur accepte déjà.

## La règle qui fonde ce verbe

**Une vue est régénérable, jamais éditée.** Toute modification se fait dans `EXIGENCES.json`,
puis les vues sont refaites. Une vue éditée à la main est un défaut détecté par
`oracle-tracabilite` T3, pas une correction.

Mécanisme : chaque vue porte en tête l'empreinte SHA-256 de la source dont elle est issue. Si
la source bouge ou si la vue est retouchée, l'empreinte ne correspond plus.

## Ce que ce skill n'a pas le droit de faire

**Il n'invoque aucune forge aval.** Il écrit des fichiers ; qui les lit, et quand, ne le
regarde pas. C'est ce qui empêche la Conception de devenir un conducteur — et c'est ce qui
permet aux trois forges aval de continuer à fonctionner si la Conception disparaît.

## Quick start

```
1. Entrée        → EXIGENCES.json
2. Contrats      → references/vues.md
3. Empreinte     → node -e "…sha256 de EXIGENCES.json normalisé LF (CRLF→LF)…"  (en-tête de chaque vue)
4. Artefacts     → CADRAGE-DESIGN.md · MISSION.md · EXIGENCES.json exposé
5. Contrôle      → node oracles/oracle-tracabilite.mjs EXIGENCES.json --vue CADRAGE-DESIGN.md
6. État          → ETAT.json (statut produit|bloque_question) → node oracles/oracle-etat.mjs
```

## Les trois vues

| Vue | Consommateur | Ce qu'il accepte déjà |
|---|---|---|
| `CADRAGE-DESIGN.md` | Forge Design | La fiche 6 champs de `ameliore-le-design/references/ingestion.md`, plus les sections « Surface implicite écartée » (TF-0811) et « Exigences socle écartées » (TF-0814) |
| `MISSION.md` | SaaS Forge | Les 10 arguments de `cadrer()`, étape A du conducteur |
| `EXIGENCES.json` | Forge Tests | Le champ `risque` de son référentiel de tests, seuil 100 % |

Aucune des trois forges n'a été modifiée pour recevoir ces vues. C'est le test de
non-couplage : la Conception s'aligne sur des contrats existants, elle n'en impose aucun.

## Vues par profil (GO du 19/08, étude 20260819b du pilot)

Deuxième famille de vues, même règle fondatrice : source unique = le `RETRO-MODELE.md`
d'un projet existant (mode rétro-modèle de `qualifie-l-entrant`), trois profils pilotes
en jeu fermé — `po` · `csm` · `utilisateur` — chaque vue scellée par l'empreinte SHA-256
de sa source (péremption détectée) et chaque affirmation ancrée `[RM-xxx]`. Jugées par
`node oracles/oracle-vues-profil.mjs <VUE.md> --modele <RETRO-MODELE.md>` (VP1-VP4).
Protocole et gabarits : `references/vues-par-profil.md`. Un profil s'ajoute par delta de
ce référentiel, jamais par improvisation.

## Ce que le produit n'aura pas — la surface implicite écartée (TF-0811)

`CADRAGE-DESIGN.md` porte une section dédiée, dérivée du champ racine
`ecarts_surface_implicite` du référentiel : une ligne par candidat d'office de la surface
implicite délibérément écarté, avec son motif, qui l'a décidé et quand. Champ facultatif à la
lecture : absent ou vide, la section est produite quand même et porte *(aucun écart déclaré)* —
une section absente ne se distinguerait pas d'un référentiel qui n'a rien tranché.

Ce verbe **ne décide aucun écart et n'en invente aucun** : il traduit ceux que le référentiel
porte déjà, eux-mêmes transcrits de la section 3 « Écartés » de `SURFACE.md`. Format des quatre
champs et liste close des clés : `enumere-la-surface/references/typologie-surface.md`.
L'oracle qui juge la même chose côté source est `oracle-surface` S4.

## Ce que le référentiel ne demande pas — les exigences socle écartées (TF-0814)

Même mécanique, même vue, autre champ racine : `ecarts_exigences_socle` porte les **exigences
socle candidates** écartées (données de démonstration invisibles en production, données volatiles
éditables/datées/sourcées, effet observable de tout élément interactif). `CADRAGE-DESIGN.md`
porte donc une seconde section dérivée, une ligne par candidate écartée avec son motif, qui l'a
décidé et quand. Champ facultatif à la lecture, section produite quand même — *(aucun écart
déclaré)* quand il est absent ou vide.

Ce verbe **ne décide aucun écart et n'en invente aucun** : il traduit ceux que le référentiel
porte déjà, eux-mêmes transcrits de la section 7 « Ce que le référentiel ne dit pas »
d'`EXIGENCES.md`. Format des quatre champs et liste close des trois clés :
`redige-les-exigences/references/schema-referentiel.md`. L'oracle qui juge la même chose côté
source est `oracle-exigences` E10.

## Les champs non dérivables

Trois champs de la fiche de cadrage ne se déduisent d'aucune exigence :

| Champ | Pourquoi |
|---|---|
| `ton` | « 3 mots concrets, pas *moderne* ni *élégant* » — un arbitrage esthétique |
| `contraintes reprises` | Ce qui doit survivre à la refonte : décision du commanditaire |
| `secteur` (en partie) | Déductible seulement si l'entrant le nomme |

Ils sont **demandés**, jamais remplis par défaut. La vue les porte en `*(à demander)*` et le
dit explicitement dans sa section finale. C'est le point où la Conception rend la main —
conformément à `ingestion.md` l.44-46, qui pose déjà cette règle côté Design.

**Exception constatée pour `ton`** : si l'entrant délègue le ton à une référence nommée
(« reprendre le ton du site X »), ce n'est plus un champ sans source — il se dérive par
observation datée de cette référence, porté en **hypothèse** avec sa source (référence +
date d'observation), jamais en `*(à demander)*`. Détail et gabarit dans
`references/vues.md`, section CADRAGE-DESIGN.md.

## Ce qui n'est jamais fait

Éditer une vue. Inventer un `ton`. Remplir un argument de `cadrer()` par un défaut silencieux.
Appeler une forge aval. Livrer une vue dont l'empreinte n'a pas été recalculée après une
modification de la source.
