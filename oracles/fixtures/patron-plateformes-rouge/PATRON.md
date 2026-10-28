---
titre: Fixture rouge du contrôle de patron de plateformes (TF-2010) — cinq défauts, un par règle
sources:
  - id: S1
    url: https://docs.exemple.test/plateforme-a/deploiement
  - id: S2
    url: https://docs.exemple.test/plateforme-b/authentification
    lu_le: 2026-10-28
---

# Patron fabriqué défectueux

## 1. Responsabilités de chaque plateforme

| Plateforme | Porte | Source |
|---|---|---|
| Plateforme A | sert les fichiers statiques et exécute le code serveur en un seul déploiement | [S1] |
| Plateforme B | porte les comptes et les sessions | |

## 2. Variables d'environnement

| Nom | Vit chez | Exposé au navigateur | Source |
|---|---|---|---|
| `PLATEFORME_B_URL` | plateforme A, variable d'exécution | oui | [S1] |

PLATEFORME_B_CLE_SECRETE=sb_secret_abcdefgh12345678

## 3. Prévisualisations

| Voie | Forme d'URL | Source |
|---|---|---|
| Branche | `<branche>-<nom>.exemple.test` | [S9] |

## 4. Questions de conception à trancher

| Question | Défaut proposé | Fait qui l'impose |
|---|---|---|
| Quelle plateforme porte le code serveur ? | plateforme A | [S1] |
