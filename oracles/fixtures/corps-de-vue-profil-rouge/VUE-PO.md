---
vue: profil
profil: po
source: RETRO-MODELE.md
source_sha256: 61b1f3027701545e1047837012890e68c89b471de129f9025ab47ee02465585b
corps_sha256: cb119b6f6ae2a2b47f58dd2245a7fcc913e4d7db13d36d7d65dc9cf63d407423
date: 2026-08-19
---

# Vue PO — fixture-verte

## Objets et parcours

- Le compte utilisateur possède un panier unique [RM-F01].
- La commande suit trois états : brouillon, payée, expédiée [RM-F02] ; sa création passe
  par l'API POST /orders [RM-S01].

## Règles de gestion


## Manques et hypothèses

- Aucune hypothèse au modèle sur ce périmètre ; le comportement runtime et la volumétrie
  réelle sont hors de portée du modèle (section 8 de la source).
