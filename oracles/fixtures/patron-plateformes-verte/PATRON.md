---
titre: Fixture verte du contrôle de patron de plateformes (TF-2010) — document fabriqué, aucune plateforme réelle
sources:
  - id: S1
    url: https://docs.exemple.test/plateforme-a/deploiement
    lu_le: 2026-10-28
  - id: S2
    url: https://docs.exemple.test/plateforme-b/authentification
    lu_le: 2026-10-28
---

# Patron fabriqué : front sur la plateforme A, auth sur la plateforme B

## 1. Responsabilités de chaque plateforme

| Plateforme | Porte | Source |
|---|---|---|
| Plateforme A | sert les fichiers statiques et exécute le code serveur en un seul déploiement | [S1] |
| Plateforme B | porte les comptes et les sessions | [S2] |

## 2. Variables d'environnement

| Nom | Vit chez | Exposé au navigateur | Source |
|---|---|---|---|
| `PLATEFORME_B_URL` | plateforme A, variable d'exécution | oui | [S2] |
| `PLATEFORME_B_CLE_SECRETE` | plateforme A, secret | non | [S2] |

## 3. Prévisualisations

| Voie | Forme d'URL | Source |
|---|---|---|
| Branche | `<branche>-<nom>.exemple.test` | [S1] |

## 4. Questions de conception à trancher

| Question | Défaut proposé | Fait qui l'impose |
|---|---|---|
| Quelle plateforme porte le code serveur ? | plateforme A | [S1] |
| Quelles URL de redirection l'auth autorise-t-elle ? | l'URL de production exacte | [S2] |

## 5. Hypothèses non résolues

Le motif de redirection des prévisualisations n'a pas été rejoué sur un projet de test.
