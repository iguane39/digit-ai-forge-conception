---
projet: Suivi des demandes d'absence
version: 1.0.0
date_ratification: 2026-08-12
---

# Constitution — Suivi des demandes d'absence

Ce document liste les invariants non négociables du projet — ce qu'aucune exigence, aucun
palier, aucune reformulation n'a le droit de trahir. Distinct d'`EXIGENCES.json`, qui change à
chaque itération de palier ; ce fichier ne change que par ratification explicite (bump de
`version`).

## Promesse

Vos demandes d'absence se traitent sans relance et sans tableur, et vous savez à tout moment
où en est chacune.

## Principes non négociables

1. Aucune donnée de démonstration n'est visible en production, sous quelque compte que ce soit.
2. Un identifiant d'exigence retiré n'est jamais réaffecté à une nouvelle exigence.
3. Toute donnée volatile (barèmes, taux, catalogues) vit en base, éditable, datée et sourcée —
   jamais en dur dans le code.

## Hors du champ de la constitution

Les arbitrages de palier (MVP/V1/V2) et le contenu fonctionnel : ce sont des décisions produit,
pas des invariants — ils vivent dans `EXIGENCES.json`.
