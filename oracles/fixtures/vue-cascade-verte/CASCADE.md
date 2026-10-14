<!-- source: cascade/CASCADE.json -->
<!-- source-sha256: f81d19f9dcbc5606bdea84d50ccacd5b60979453ac60b55d949e41744114aabd -->
<!-- referentiel-sha256: b8d2536ff3676421cdec530d5bf6107db970c698f2d89d249c392081c7a0fb14 -->
<!-- corps-sha256: de19c7c04fd1c3f86a9311a77312ca39d06a23bc7f5a86b815bb9ab90f95fe08 -->
---
role: cascade du produit — intention, stratégie, tactique, opérationnel, puis test rétro (references/INTENTION.md du pilot) ; vue dérivée, jamais éditée à la main
sources_de_verite: [cascade/CASCADE.json, EXIGENCES.json]
version: 1.0.0
verifie_le: 2026-10-14
gabarit: gd-cascade-produit
version_du_gabarit: 1.0.0
---

# Cascade du produit — Suivi des demandes d'absence (fixture TF-1680)

**Version 1.0.0 du 2026-10-14 · statut : ratifiée le 2026-10-14 (fixture de recette).** Règle : references/INTENTION.md 2.0.0. Vue dérivée de la source de la cascade par `scripts/vue-cascade.mjs` de la forge Conception (forme de la famille `gd-cascade-produit`) et scellée : la modifier, c'est modifier la source puis régénérer.

Ce document rattache chaque exigence du produit à un moyen choisi (une **tactique**), chaque moyen à un effet attendu (une **stratégie**), et chaque effet à ce que le demandeur cherche (l'**intention**). Une **alternative écartée** est l'autre moyen qu'on aurait pu prendre ; un **indicateur** dit à quoi l'on verra qu'un effet est atteint ; une **rupture** est un maillon qui ne remonte pas au niveau du dessus.

## Intention

Ce que le demandeur cherche, dans ses mots :

> « Je veux que mes salariés déclarent leurs absences sans passer par moi, et savoir qui est absent un jour donné. »
>
> — Cahier des charges client, section 1 « Contexte »

**Reformulation** : Le responsable veut cesser d'être l'intermédiaire des déclarations d'absence tout en gardant la vue sur la présence de son équipe.

**Validée** le 2026-10-14 par le commanditaire du produit (fixture de recette : validation simulée, aucune entrée de ledger réelle).

| Partie prenante | Rôle | Ce qu'elle cherche |
|---|---|---|
| PP-1 | responsable d'équipe | ne plus relayer les déclarations |

**Contraintes** : C-1 Conservation des données d'absence pendant 60 mois. (Politique de conservation, version en vigueur)

**Non-objectifs** : N-1 Calculer la paie. (motif : relève de l'outil de paie existant)

## Stratégie

Les effets que le produit doit produire. Le manque fonde chaque effet ; l'indicateur dit comment on le verra, la cible ce qu'on attend.

| Stratégie | Effet attendu | Manque qui le fonde | Indicateur | Valeur actuelle | Cible |
|---|---|---|---|---|---|
| **STR-1** | Le salarié déclare seul son absence. | Chaque déclaration passe aujourd'hui par un courriel au responsable. | déclarations sans intervention du responsable ÷ déclarations ; dénominateur : déclarations du mois ; lu : journal des demandes | non mesurée : produit pas encore en service | 100 % des déclarations au premier mois de service |
| **STR-2** | Le responsable sait qui est absent à une date donnée. | La présence se reconstitue à la main depuis les courriels. | dates consultées avec réponse ÷ dates consultées ; dénominateur : consultations de la liste ; lu : journal de l'écran des absents | non mesurée : produit pas encore en service | 100 % des consultations |
| **STR-3** | L'entreprise tient ses obligations de conservation. | Aucune règle de conservation n'est appliquée aux courriels d'absence. | données conservées dans la durée légale ÷ données d'absence ; dénominateur : enregistrements d'absence ; lu : requête de contrôle de rétention | non mesurée : produit pas encore en service | 100 % des enregistrements |

## Tactique

Mode de lecture : une ligne par moyen retenu, dans l'ordre de la source ; la colonne « Alternative écartée » dit ce qu'on n'a pas pris et pourquoi, la dernière si ce pourquoi est écrit dans une source (« sourcée ») ou reconstruit par qui a rédigé la cascade (« reconstruite », à ratifier).

| Tactique | Stratégie | Moyen retenu | Alternative écartée, et pourquoi | Source | Statut |
|---|---|---|---|---|---|
| **TAC-1** | STR-1 | Saisie en libre-service avec décompte automatique du solde. | Formulaire transmis au responsable pour saisie. — Le responsable ne veut plus être l'intermédiaire. | Cahier des charges client, section 1 | sourcée |
| **TAC-2** | STR-2 | Liste des absents par date, notifications et récapitulatif mensuel. | Calendrier partagé tenu à la main. — Un calendrier tenu à la main reproduit le relais que l'intention supprime. | Cahier des charges client, section 2 | sourcée |
| **TAC-3** | STR-3 | Conservation bornée à la durée légale. | Conservation illimitée. — La politique de conservation l'impose. | Politique de conservation, version en vigueur | sourcée |

## Opérationnel

Mode de lecture : une ligne par tactique ; la troisième colonne liste les exigences qui la réalisent, la dernière les autres éléments qui la mettent en œuvre.

| Tactique | Stratégie | Exigences | Autres éléments |
|---|---|---|---|
| **TAC-1** | STR-1 | E-001, E-002 | — |
| **TAC-2** | STR-2 | E-004, E-005, E-007, E-008 | — |
| **TAC-3** | STR-3 | E-006 | — |

## Test rétro

Verdict de la règle T6 d'`oracle-tracabilite` (forge Conception) à la génération, jugé contre le référentiel : **PASS**, 7 constat(s) tenu(s) sur 7.

- Rattachement : 7 exigence(s) remontent à l'intention par une seule tactique active et une stratégie active.
- Mesures M1 à M4 (cibles à fixer, justifications reconstruites, exigences sans test, stratégies non mesurées) : non rejouées par cette forge, elles relèvent d'`oracle-cascade-isto` du pilot (étape 4 ci-dessous).

## Tenir la cascade à jour

1. Une exigence nouvelle cite sa tactique dans la source de la cascade, jamais dans cette vue.
2. Un changement déclare le plus haut niveau qu'il touche (I, S, T ou O) par une entrée d'historique, avec la décision qui l'a voulu.
3. Un élément qui sort reste dans la source, marqué `retiree`, avec son motif ou son remplaçant.
4. Juger la remontée : `node oracles/run-oracles-conception.mjs <EXIGENCES.json>` (forge Conception, la cascade voisine est passée d'office à T6) ; juger le reste de la source : `node <PILOT_ROOT>/oracles/oracle-cascade-isto.mjs <CASCADE.json> --exigences <EXIGENCES.json> --tests <dossier des tests>`.
5. Régénérer cette vue : `node scripts/vue-cascade.mjs <EXIGENCES.json>` (forge Conception), puis juger son sceau : `node oracles/oracle-tracabilite.mjs <EXIGENCES.json> --cascade <cascade/CASCADE.json> --vue <CASCADE.md>`.

| Version | Date | Niveau touché | Ce qui change | Décision |
|---|---|---|---|---|
| 1.0.0 | 2026-10-14 | I | cascade initiale de la fixture | fixture de recette TF-1680 |

*Gabarit : gd-cascade-produit · version du gabarit 1.0.0*
