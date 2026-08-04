# Protocoles d'ingestion par entrant

Table normative. Gabarit repris de `ameliore-le-design/references/ingestion.md` — même
problème, même solution, aucune divergence gratuite. L'extractible diffère : là-bas on
extrait de la matière **de design**, ici de la matière **d'exigence**.

## La table

| Entrant | Protocole | Extractible | Hors de portée | Seuil de suffisance |
|---|---|---|---|---|
| **Idée** | Appel à `clarifie-une-idee` (phases clarifier + challenger), puis fiche d'entrant. Rien d'autre ne se déduit | Problème, cible, job principal, contrainte dure | Surface fonctionnelle, volumétrie, règles de gestion, existant | Les 4 champs *problème · cible · job · palier visé*. En dessous : questions, aucune rédaction |
| **Cahier des charges** | Lecture + relevé des objets métier, rôles et règles **cités** | Objets, rôles, règles de gestion, vocabulaire, contraintes non fonctionnelles nommées | Ce que le CDC ne dit pas — jamais comblé par extrapolation silencieuse | ≥ 1 objet métier **et** ≥ 1 rôle. Sinon : traité comme « idée » |
| **Produit à reprendre** | Inventaire depuis les sources : routes, endpoints, modèles, jobs, migrations. **Lecture seule stricte** | Surface fonctionnelle réelle, modèle de données, points d'entrée | Intention produit, priorités, dette assumée vs subie, raisons des choix | Dépôt lisible **et** ≥ 1 point d'entrée énuméré. Sinon : entrant dégradé, déclaré |
| **Produit à faire évoluer** | Idem + delta demandé, exprimé en exigences neuves rattachées à la surface existante | Surface existante + périmètre du delta | L'impact sur l'existant non exercé — c'est le travail de Forge Tests | Surface existante énumérée **et** delta formulé en ≥ 1 exigence candidate |
| **Produit tiers à répliquer** | Observation documentée et **datée** : parcours publics, fonctions annoncées, documentation publique. Aucune authentification franchie | Fonctions, parcours, objets apparents | Règles de gestion, modèle de données, tout élément derrière login, toute intention | Fonctions **et** parcours observés, **et** garde-fou §Juridique accepté. Sinon : refus déclaré |

## Entrants multiples

Le plus riche l'emporte. Ordre de richesse décroissante :
produit à faire évoluer › produit à reprendre › cahier des charges › produit tiers › idée.

Les autres entrants deviennent des **contrôles** : ce qu'ils contredisent est signalé dans
`ENTRANT.md`, jamais arbitré en silence.

## Entrant dégradé

Un entrant qui atteint son seuil mais dont une partie est inaccessible (dépôt partiel,
produit majoritairement derrière login, CDC amputé) reste exploitable, à trois conditions :

1. Le **niveau de confiance est déclaré** dans `ENTRANT.md`.
2. Ce qui manque est **nommé**, pas résumé en « quelques éléments ».
3. Tout ce qui en découle porte `statut_epistemique.nature = hypothèse` avec son mode de
   validation. Un fait sans source est une hypothèse — `oracle-tracabilite` T4 le vérifie.

## Juridique — cinquième entrant seulement

Règle dure, non négociable.

| Reprenable | Jamais reprenable |
|---|---|
| Fonctions et parcours (le *quoi* fonctionnel) | Marque, nom, logo, identité visuelle |
| Objets métier et vocabulaire du domaine | Contenus, textes, visuels, données |
| Enchaînements d'écrans en tant que structure | Code, actifs protégés, éléments sous licence |

- Toute observation est **déclarée** dans le référentiel, avec sa **date** et son périmètre :
  ce qui a été vu, ce qui ne l'a pas été.
- **Aucune authentification n'est franchie.** Produit majoritairement derrière login →
  le déclarer et travailler sur hypothèses nommées.
- Aucune condition d'utilisation n'est contournée.

**`non_juge`** : la conformité juridique de la reprise. Ce verbe **signale** et documente ;
il ne valide pas. Aucun oracle ne rendra ce verdict — c'est un arbitrage humain, et le cas
échéant un avis de conseil.

## Format des questions sous le seuil

Une par ligne, indicée `a/b/c`, chacune avec option recommandée et défaut appliqué :

> **a) Quel est le job principal de l'écran d'accueil ?**
> Recommandé : *consulter l'état de ses demandes*, c'est ce que le CDC mentionne trois fois.
> **Défaut appliqué** : ce job, marqué `[HYP]` dans le référentiel.

Un défaut appliqué **est toujours marqué comme hypothèse** dans les artefacts aval. Un défaut
silencieux devient un fait au bout de deux relectures.
