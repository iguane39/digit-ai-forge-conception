<!-- source: EXIGENCES.json -->
<!-- source-sha256: e2c5b13ac83e3463cb4a72bbaca0277b02a4c0057a4c0ebf9960e2de7ef631b5 -->

# Fiche de cadrage design — Portail de réservation de salles

Vue dérivée. **Ne pas éditer à la main** : toute modification se fait dans `EXIGENCES.json`,
puis la vue est régénérée. Une vue éditée est détectée par `oracle-tracabilite` T3.

| Champ | Valeur | Origine |
|---|---|---|
| Secteur d'activité | Services généraux, réservation d'espaces de travail | dérivé de `projet` |
| Cible | Collaborateur | dérivé de `surface[].type = role` |
| Job principal | Réserver une salle depuis son navigateur sans passer par un tiers | dérivé de `besoins[B-01]` |
| Ton attendu | *(à demander)* | **non dérivable** — 3 mots concrets, arbitrage humain |
| Contraintes reprises | *(à demander)* | **non dérivable** — ce qui doit survivre à la refonte |
| Hypothèses | *(aucune)* | dérivé des exigences `statut_epistemique.nature = hypothèse` |

## Objets et parcours à couvrir

| Élément | Type | Exigences rattachées |
|---|---|---|
| Page d'accueil du portail | point d'entrée | E-001 |
| Page 404 par langue | point d'entrée | E-002 |
| Page d'aide utilisateur à trois niveaux | point d'entrée | E-003 |
| Compte utilisateur | objet | E-004 |
| Mentions légales et pied de page | point d'entrée | E-005 |
| Onboarding de première connexion | parcours | E-006 |
| États vides guidés des listes | parcours | E-007 |
| Gestion des erreurs visible | règle | E-008 |
| Responsive mobile | règle | E-009 |
| Favicon du portail | objet | E-010 |
| Collaborateur | rôle | E-001 |

## Surface implicite écartée

Ce que le produit **n'aura pas**, et pourquoi — dérivé de `ecarts_surface_implicite`, lui-même
transcrit de la section 3 « Écartés » de `SURFACE.md`. Un candidat d'office absent de ce tableau
**et** de la surface énumérée est un oubli, jamais un arbitrage : `oracle-surface` S4 le refuse.

| Candidat écarté | Motif | Décidé par | Date |
|---|---|---|---|
| `accessibilite-rgaa` | portail interne à l'entreprise, accessible par authentification seule : il n'entre pas dans le champ du site public français où le RGAA 4.1 est une obligation légale | le commanditaire du produit | 2026-09-05 |
| `livrables-accessibilite` | corollaire de l'écart précédent : sans obligation RGAA, ni schéma pluriannuel ni déclaration d'accessibilité ne sont dus, et aucun n'est produit pour la forme | le commanditaire du produit | 2026-09-05 |

Les neuf autres candidats de la liste close sont **retenus** : ils figurent au tableau
ci-dessus, chacun porteur d'au moins une exigence.

## Ce que cette vue ne dit pas

Le champ `ton` et les contraintes reprises ne se déduisent d'aucune exigence. Ils sont
**demandés**, jamais remplis par défaut — c'est le point où la Conception rend la main,
conformément à `ameliore-le-design/references/ingestion.md` l.44-46.

La **pertinence** d'un motif d'écart n'est pas jugée : S4 exige qu'il soit écrit, daté et
signé, pas qu'il soit vrai. Le design qui lit cette vue hérite donc d'une décision opposable,
pas d'une décision validée.
