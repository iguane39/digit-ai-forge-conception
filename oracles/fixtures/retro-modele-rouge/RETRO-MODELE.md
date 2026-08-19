# Rétro-modèle — fixture-rouge — 20260819a

## 1. Périmètre et méthode

Type d'entrant : produit à reprendre. Dépôt analysé : `fixture-app`. Le projet a été lu
rapidement, sans autre précision de méthode.

## 2. Volet fonctionnel

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-F01 | Un compte utilisateur possède un panier unique | | fait constaté |

## 3. Volet technique

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-T01 | Backend Python, probablement FastAPI | | hypothèse |

## 4. Volet paramétrage

## 5. Volet data

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-D01 | 4 tables : users, carts, orders, items | migrations/0001_init.sql:1-40 | fait constaté |

## 7. Confrontation exécutée

| id confronté | geste rejoué | verdict |
|---|---|---|
| RM-F01 | relecture rapide | plausible |
| RM-D01 | cat migrations/0001_init.sql | confirmé |

## 8. Hors de portée

