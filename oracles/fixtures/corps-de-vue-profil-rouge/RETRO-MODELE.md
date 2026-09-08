# Rétro-modèle — fixture-verte — 20260819a

## 1. Périmètre et méthode

Type d'entrant : produit à reprendre. Dépôt analysé : `fixture-app` au commit `abc1234`
(observé le 19/08/2026). Gestes : arborescence listée, manifestes lus, `grep` des routes.
**Lecture seule** : aucun fichier modifié, aucun serveur démarré, aucune authentification
franchie.

## 2. Volet fonctionnel

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-F01 | Un compte utilisateur possède un panier unique | src/models/cart.py:12 | fait constaté |
| RM-F02 | La commande passe par 3 états : brouillon, payée, expédiée | src/models/order.py:8-14 | fait constaté |

## 3. Volet technique

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-T01 | Backend Python 3.11, framework FastAPI 0.110 | pyproject.toml:9-11 | fait constaté |
| RM-T02 | Point d'entrée unique : src/main.py | commande : grep -l "uvicorn" (19/08/2026) | fait constaté |

## 4. Volet paramétrage

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-P01 | STRIPE_KEY lue au démarrage, sans valeur par défaut | src/config.py:22 | fait constaté |

## 5. Volet data

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-D01 | 4 tables : users, carts, orders, items | migrations/0001_init.sql:1-40 | fait constaté |

## 6. Volet services

| id | affirmation | ancre | confiance |
|---|---|---|---|
| RM-S01 | API exposée : POST /orders (création de commande) | src/routes/orders.py:17 | fait constaté |
| RM-S02 | Service consommé : Stripe (paiement) | src/services/payment.py:5 | fait constaté |

## 7. Confrontation exécutée

| id confronté | geste rejoué | verdict |
|---|---|---|
| RM-F01 | relecture src/models/cart.py:12 (19/08/2026) | confirmé |
| RM-T01 | cat pyproject.toml (19/08/2026) | confirmé |
| RM-P01 | grep STRIPE_KEY src/config.py (19/08/2026) | confirmé |
| RM-D01 | wc -l migrations/0001_init.sql (19/08/2026) | infirmé-corrigé |
| RM-S01 | grep -n "POST" src/routes/orders.py (19/08/2026) | confirmé |

## 8. Hors de portée

Comportement runtime non observé (aucun serveur démarré) ; jobs planifiés éventuels hors
du dépôt ; volumétrie réelle des tables (aucune base connectée) ; règles métier vivant
dans des données de production inaccessibles.
