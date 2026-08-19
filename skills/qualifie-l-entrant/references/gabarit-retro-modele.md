# Gabarit de `RETRO-MODELE.md`

Huit sections, toutes obligatoires — jugées par `oracles/oracle-retro-modele.mjs`
(RM1-RM5). Nommage : `Digit-AI - Retro-modele {Projet} - {AAAAMMJJ}{a,b,c…}.md`, ou
`RETRO-MODELE.md` en dépôt.

Ids d'affirmation, stables et cités par les vues aval : `RM-F01…` (fonctionnel),
`RM-T01…` (technique), `RM-P01…` (paramétrage), `RM-D01…` (data), `RM-S01…` (services).

---

# Rétro-modèle — {Projet} — {AAAAMMJJ}{i}

## 1. Périmètre et méthode

Type d'entrant retenu (un des cinq), dépôt/version analysés (commit ou date de
l'observation), gestes exécutés. Déclaration obligatoire : **lecture seule** — aucun
fichier modifié, aucun serveur démarré, aucune authentification franchie.

## 2. Volet fonctionnel

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-F01 | *(objet métier, parcours ou règle de gestion)* | *(fichier:ligne ou commande + date)* | fait constaté / hypothèse |

## 3. Volet technique

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-T01 | | | |

## 4. Volet paramétrage

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-P01 | *(l'ancre est la ligne qui LIT la variable)* | | |

Volet sans matière : une ligne `volet vide — <motif>` à la place du tableau.

## 5. Volet data

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-D01 | | | |

## 6. Volet services

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-S01 | *(exposé ou consommé, avec son sens)* | | |

## 7. Confrontation exécutée

Au moins 5 affirmations rejouées. Verdicts fermés.

| id confronté | geste rejoué | verdict |
|---|---|---|
| RM-x | *(commande, relecture, test — avec date)* | confirmé / infirmé-corrigé |

## 8. Hors de portée

Ce que ce modèle **ne peut pas** affirmer : catégories inaccessibles, code non lisible,
comportements runtime non observés. Section jamais vide — un modèle qui prétend tout
voir n'a pas cherché ses limites.
