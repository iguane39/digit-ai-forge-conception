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
| **Produit à faire évoluer** | Idem + delta demandé. Si le delta arrive **en prose** (retour d'usage, lot d'anomalies de recette) : §« Delta en PROSE » d'abord — le seuil ci-contre est ce qu'il faut ATTEINDRE, pas ce qu'il faut supposer | Surface existante + périmètre du delta | L'impact sur l'existant non exercé — c'est le travail de Forge Tests | Surface existante énumérée **et** delta formulé en ≥ 1 exigence candidate |
| **Produit tiers à répliquer** | Observation documentée et **datée** : parcours publics, fonctions annoncées, documentation publique. Aucune authentification franchie | Fonctions, parcours, objets apparents | Règles de gestion, modèle de données, tout élément derrière login, toute intention | Fonctions **et** parcours observés, **et** garde-fou §Juridique accepté. Sinon : refus déclaré |

## Delta en PROSE — la marche en amont du seuil (TF-0374)

**Le fait.** Le 18/08/2026, un lot de corrections issu d'une recette humaine est arrivé sur
Approval : 1271 lignes de prose, 49 rubriques. Il a été traité **intégralement à la main** —
croisé contre les 16 sections du cahier des charges, une rubrique après l'autre. 9
contradictions et 3 régressions trouvées par lecture de code, dont un test qui échouera à coup
sûr dès l'implémentation d'une rubrique. **Aucun oracle n'a pu être joué**, faute d'artefact au
format d'une forge.

**Le diagnostic**, et il n'est pas celui qu'on croit. Le retour a été instruit comme « n'entre
dans aucune des cinq catégories ». C'est faux : « produit à faire évoluer » **est** la catégorie
— du code lisible plus un delta demandé. Ce qui manquait est ailleurs, et plus discret : le
**seuil de suffisance de cette catégorie présuppose le delta déjà formulé en exigences**. Un lot
de prose est l'ENTRÉE de cette formulation, pas sa sortie. Le seuil décrivait l'arrivée et rien
ne décrivait le chemin. (Instruit par l'étude d'opportunité
`output/03-etudes/20260818-etude-opportunite-retour-usage-vers-delta.md` du pilot, verdict O2.)

**Le protocole.** Quatre pas, dans cet ordre, et le troisième est celui qu'on saute.

**1. Une rubrique, une opération.** Le lot se découpe en rubriques numérotées — jamais en
« thèmes ». Une rubrique qui porte deux demandes en fait deux : la même règle qu'E6 pour une
exigence, et pour la même raison — on ne peut pas tracer la moitié d'une ligne.

**2. Chaque rubrique cite sa section du référentiel.** Pas « le cahier dit à peu près » : la
**référence de section** (`§08`, `paragraphe 05`). Une rubrique qu'aucune section ne porte est
un fait, pas un oubli de recherche : elle se note `section: aucune`, et c'est cette valeur qui
la fera classer en lacune ou en évolution au pas 3.

**3. La CAUSE RACINE, en ensemble fermé.** Le pas qu'on saute, et le seul qui décide ce que le
delta va coûter. Quatre valeurs, et aucune cinquième :

| Cause racine | Ce que c'est | Qui la juge déjà | Part mesurée sur Approval |
|---|---|---|---|
| `ecart-au-texte` | une exigence ÉCRITE au référentiel, non tenue par le code | `cat-dev-03` (under-build) | 22 / 49 (45 %) |
| `sur-livraison` | un comportement qu'aucune section ne demande | `cat-dev-03` (over-build) | 2 / 49 (4 %) |
| `lacune-de-specification` | le référentiel ne dit rien, et il aurait dû | `oracle-ears` EA4/EA5 pour l'asynchrone et la session | 12 / 49 (24 %) |
| `evolution-de-doctrine` | le référentiel disait autre chose, et **c'est l'avis qui change** | **personne, et c'est juste** — arbitrage humain | 12 / 49 (24 %) |

La quatrième ligne est la raison d'être de l'ensemble fermé. Une évolution de doctrine
**ressemble** à un écart : elle se présente comme « absent du produit ». La classer en écart
ferait bloquer un sprint sur un changement d'avis, et le gate qui bloque pour ça devient le
gate qu'on désactive. Le 49ᵉ point (1 mésusage du design system) se classe `evolution-de-
doctrine` faute de mieux, et l'écart est déclaré plutôt que rangé de force.

**4. La sortie est un `DELTA.json` opposable.** Une opération par rubrique, au format que
`oracle-delta` juge déjà (D1-D4) : `operations` non vide, statut dans l'ensemble fermé, forme
de chaque opération, cohérence avec le référentiel ciblé. Chaque opération porte en plus la
`section` du pas 2 et la `cause_racine` du pas 3. Les cas de tests s'en dérivent ensuite par
`cat-tst-02`, sans rien de neuf.

**Le seuil, une fois le protocole passé** : le seuil ordinaire de la catégorie s'applique tel
quel — ≥ 1 exigence candidate. Ce qui a changé n'est pas le seuil, c'est qu'on sait maintenant
comment l'atteindre depuis de la prose.

**Ce que ce protocole ne fait pas.** Il ne classe pas automatiquement les rubriques : il
**impose que chacune porte sa cause**, et les gates qui savent juger jugent. Les 12 évolutions
de doctrine restent un arbitrage humain — les automatiser serait décider à la place du
propriétaire du produit, ce qui n'est pas le rôle d'une forge.

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
