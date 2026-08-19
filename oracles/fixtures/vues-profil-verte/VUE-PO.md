---
vue: profil
profil: po
source: RETRO-MODELE.md
source_sha256: 61b1f3027701545e1047837012890e68c89b471de129f9025ab47ee02465585b
date: 2026-08-19
---

# Vue PO — fixture-verte

## Objets et parcours

- Le compte utilisateur possède un panier unique [RM-F01].
- La commande suit trois états : brouillon, payée, expédiée [RM-F02] ; sa création passe
  par l'API POST /orders [RM-S01].

## Règles de gestion

- Le paiement est délégué à Stripe [RM-S02] ; la clé est exigée au démarrage, sans
  valeur par défaut [RM-P01].
- Le périmètre data tient en 4 tables [RM-D01].

## Manques et hypothèses

- Aucune hypothèse au modèle sur ce périmètre ; le comportement runtime et la volumétrie
  réelle sont hors de portée du modèle (section 8 de la source).
