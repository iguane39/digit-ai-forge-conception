---
name: redige-les-exigences
description: Rédige le référentiel d'exigences d'un produit — chaque exigence atomique, identifiée de façon stable, assortie d'un critère d'acceptation binaire ou chiffré, d'un palier MVP/V1/V2, d'un statut fait constaté ou hypothèse, et d'un lien vers l'élément de surface couvert — puis le fait juger par quatre oracles exécutés. Produit EXIGENCES.md et EXIGENCES.json, la source unique dont toutes les vues aval sont dérivées. Use when / déclencher dès qu'il faut transformer un besoin, un cadrage ou une surface fonctionnelle en spécification opposable, écrire des exigences testables, poser des critères d'acceptation, arbitrer un périmètre MVP, ou produire le PRD d'un produit à construire. Ne pas déclencher pour qualifier l'entrant (→ qualifie-l-entrant), énumérer la surface (→ enumere-la-surface), dériver les vues aval (→ derive-les-vues), ni pour produire epics, stories ou architecture d'implémentation (→ étape C de la SaaS Forge, moteur BMAD).
version: 1.1.0
---

# Rédige les exigences

Cœur de la forge. Il produit **la source unique** ; tout le reste en dérive.

## La frontière qui compte

La SaaS Forge produit déjà, à son étape C, un PRD, une architecture, des epics et des stories
via BMAD. **Ce verbe ne les double pas.**

Ce qu'il produit et que personne d'autre ne produit : un **référentiel d'exigences à
identifiants stables**. Forge Tests exige que chaque test porte l'identifiant de l'exigence
qu'il couvre — champ obligatoire, seuil à 100 %. Rien, dans la chaîne actuelle, ne fournit cet
identifiant : `Story.acceptance` est une liste de chaînes sans clé.

Une exigence sans critère testable et sans identifiant stable est un déchet en aval.

## Ce que ce skill apporte en propre

Cotation → grille ICE de `digit-ai-prospection`.
Itération → `la-boucle`, 3 passes.
Jugement → `quality-oracles` et les 4 oracles de la forge.
Epics, stories, architecture → BMAD, étape C de la SaaS Forge.

Reste en propre : le **schéma à 8 champs**, la grammaire d'un critère opposable, et la règle
d'identifiant jamais réaffecté.

## Quick start

```
1. Entrées       → ENTRANT.md + SURFACE.md
2. Schéma        → references/schema-referentiel.md
3. Grammaire     → references/formulation.md
4. Artefacts     → EXIGENCES.json (source) + EXIGENCES.md (lecture humaine)
5. Contrôle      → node oracles/oracle-exigences.mjs EXIGENCES.json
                   node oracles/oracle-tracabilite.mjs EXIGENCES.json
                   node oracles/oracle-surface.mjs EXIGENCES.json
                   node oracles/oracle-claims.mjs EXIGENCES.json
6. Boucle        → 3 passes maximum, puis livraison avec les écarts nommés
```

## Les huit champs

| Champ | Règle |
|---|---|
| `id` | Stable, **jamais réaffecté**. Un identifiant mort reste mort |
| `besoin` | Identifiant du besoin parent. Aucun orphelin, dans les deux sens |
| `enonce` | **Un** comportement observable. Un seul |
| `critere` | **Binaire ou chiffré.** Jamais « performant », « intuitif », « fluide » |
| `palier` | `MVP` · `V1` · `V2` |
| `statut_epistemique` | `fait constaté` + source, ou `hypothèse` + mode de validation |
| `surface` | Identifiants d'éléments de surface, ou `hors_surface` avec sa raison |
| `cotation` | ICE : impact, confiance, effort |

Schéma complet, types et exemples : `references/schema-referentiel.md`. La même référence porte
une courte liste d'**exigences socle candidates** (données de démo invisibles en production,
données volatiles éditables/datées/sourcées, effet observable de tout élément interactif) —
proposées d'office, retenues ou écartées explicitement en section 7 d'`EXIGENCES.md`.

## Le périmètre est un champ, pas un document

`MVP` / `V1` / `V2` est porté par **chaque exigence**. Il n'existe pas de référentiel par
palier : trois copies divergeraient à la première révision.

Frontière avec `digit-ai-propale` : celui-ci découpe en **lots commerciaux**, chiffrés et
contractuels. Ici on cote un **palier produit**, sans montant, sans charge, sans TJM.

## Le critère est la seule chose qui compte

Un énoncé mal écrit se corrige. Un critère non testable rend l'exigence inutilisable par les
trois forges aval — et invisible, parce qu'il se lit très bien.

Grammaire, liste fermée des prédicats observables, contre-exemples : `references/formulation.md`.

## La boucle

Générer → exécuter les 4 oracles → corriger. **3 passes maximum.** Au-delà : livrer avec les
écarts résiduels nommés.

Un critère resté rouge n'est **jamais requalifié** pour le faire passer. Assouplir une règle
d'oracle pour obtenir un vert est le seul défaut que cette forge ne pardonne pas : c'est
exactement ce contre quoi elle a été construite.

## `non_juge`

La **pertinence produit** d'une exigence, et la **justesse du palier**. Les oracles attrapent
les mots subjectifs, pas le vide de sens ; ils vérifient qu'un lien existe, pas qu'il est le
bon. Ces deux jugements appartiennent au commanditaire, et le référentiel le dit.

## Ce qui n'est jamais fait

Écrire une exigence pour un élément de surface absent de `SURFACE.md`. Réaffecter un
identifiant. Cocher un critère dont l'oracle n'a pas été lancé. Produire un ratio de
couverture sans la liste de ce qui n'est pas couvert. Chiffrer une charge.
