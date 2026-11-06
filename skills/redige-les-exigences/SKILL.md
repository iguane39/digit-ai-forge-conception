---
name: redige-les-exigences
description: Rédige le référentiel d'exigences d'un produit — chaque exigence atomique, identifiée de façon stable, assortie d'un critère d'acceptation binaire ou chiffré, d'un palier MVP/V1/V2, d'un statut fait constaté ou hypothèse, et d'un lien vers l'élément de surface couvert — puis le fait juger par quatre oracles exécutés. Produit EXIGENCES.md et EXIGENCES.json, la source unique dont toutes les vues aval sont dérivées. Use when / déclencher dès qu'il faut transformer un besoin, un cadrage ou une surface fonctionnelle en spécification opposable, écrire des exigences testables, poser des critères d'acceptation, arbitrer un périmètre MVP, ou produire le PRD d'un produit à construire. Ne pas déclencher pour qualifier l'entrant (→ qualifie-l-entrant), énumérer la surface (→ enumere-la-surface), dériver les vues aval (→ derive-les-vues), ni pour produire epics, stories ou architecture d'implémentation (→ étape C de la SaaS Forge, moteur BMAD).
version: 1.7.0
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
0. Dossier       → forge/etapes/conception/ chez le produit : tous les artefacts ci-dessous
                   y vivent (mobiliser.mjs --verifier du pilot n'accepte que ce chemin)
1. Entrées       → ENTRANT.md + SURFACE.md
2. Schéma        → references/schema-referentiel.md
3. Grammaire     → references/formulation.md
   Plateformes   → references/patron-plateformes-workers-supabase-actions.md (si l'entrant
                   nomme Workers ou Pages, Supabase et GitHub Actions : 17 questions à trancher,
                   chacune avec son fait daté et sa source)
   Réglages      → node scripts/reglages-plateforme.mjs --plateformes <celles de l'entrant> :
                   lit le registre des réglages sûrs du pilot ; une exigence vérifiable par
                   réglage classé `defaut`, une question de conception (options, coût) par
                   réglage classé `decision` (patron, section 7)
4. Artefacts     → EXIGENCES.json (source) + EXIGENCES.md (lecture humaine)
   Parcours      → à la création de CHAQUE parcours de la surface : une entrée { id, nom, roles }
                   dans la clé racine `parcours`, et les rôles de la surface dans la clé racine
                   `roles` : c'est ce que forge-tests lit pour exiger un e2e par parcours × rôle
                   (references/schema-referentiel.md, oracle-surface S6)
5. Contrôle      → node oracles/oracle-exigences.mjs EXIGENCES.json
                   node oracles/oracle-tracabilite.mjs EXIGENCES.json
                   node oracles/oracle-surface.mjs EXIGENCES.json
                   node oracles/oracle-claims.mjs EXIGENCES.json
                   node oracles/oracle-ears.mjs EXIGENCES.json
6. Boucle        → 3 passes maximum, puis livraison avec les écarts nommés
7. État          → ETAT.json (statut produit|bloque_question) → node oracles/oracle-etat.mjs
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
proposées d'office, retenues ou écartées explicitement.

**L'écart s'écrit dans le référentiel, pas seulement en prose (TF-0814).** La section 7
d'`EXIGENCES.md` (« Ce que le référentiel ne dit pas ») reste le lieu où l'écart se rédige ; elle
est transcrite, sans reformulation, dans le champ racine `ecarts_exigences_socle` —
`{ element, motif, decide_par, date }`, une entrée par candidate écartée, `element` pris dans les
trois clés de la liste close. `oracle-exigences` (règle **E10**) juge alors chaque candidate :
portée par une exigence → PASS, écartée avec un motif d'au moins vingt caractères, daté et signé
→ PASS imprimé « [ÉCARTÉ] », ni l'un ni l'autre → **FAIL**, la candidate nommée. Aucune condition
d'applicabilité n'est inférée : un produit sans donnée de production ou sans élément interactif
écrit son écart, il ne compte pas sur l'oracle pour le deviner.

**Un parcours se déclare pour chaque rôle (TF-2253).** Forge-tests exige un test de bout en bout
par case « parcours × rôle », et il la lit dans le référentiel : clé racine `parcours` (une entrée
`{ id, nom, roles }` par élément de surface de type `parcours`) et clé racine `roles` (les libellés
des rôles de la surface). Sans elles, son pan n'exige rien de plus qu'avant, et personne ne le voit.
`roles` d'un parcours vient de l'entrant ; à défaut, tous les rôles de la surface, noté comme
hypothèse. `oracle-surface` **S6** juge la clé : absente, il avertit sans bloquer (référentiel
antérieur) ; présente et fausse, il échoue en nommant le parcours ou le rôle.

**Une exigence remonte jusqu'à l'intention (TF-1680).** Le besoin parent ne dit ni le moyen
choisi, ni l'alternative écartée, ni l'effet attendu. Quand le produit tient sa cascade ISTO
(`cascade/CASCADE.json`, format `pilot/cascade-isto@1` du pilot), chaque exigence y est citée
par une tactique et une seule. Elle peut porter en plus le champ facultatif `tactique`
(`TAC-1`). `node oracles/oracle-tracabilite.mjs EXIGENCES.json --cascade cascade/CASCADE.json`
rejoue alors la chaîne exigence → tactique → stratégie → intention (règle **T6**). Sans
cascade, T6 rend un SANS_OBJET motivé. Détail : `references/schema-referentiel.md`, champ
`tactique`.

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
