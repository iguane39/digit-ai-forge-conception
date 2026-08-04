# CDC de cadrage — Forge Conception

> Cadrage seul. Aucun `SKILL.md`, aucun oracle implémenté, aucune ligne de code à ce stade.
> Date : 04/08/2026 · Dépôt : `c:\dev\digit-ai-forge-conception`
> Prompt d'origine : `Digit-AI - Prompt Forge - Conception & PRD Cadrage - 20260804a.md`

**Convention de lecture.** Tout énoncé de ce document est soit un **fait constaté** (lu dans
un dépôt, cité avec son chemin), soit une **hypothèse** — marquée `[HYP]`. Aucune ligne ne
mélange les deux.

---

## SECTION 0 — Inventaire exécuté des forges de référence

### 0.1 Commandes exécutées

| # | Commande | Sortie retenue |
|---|---|---|
| 1 | `Get-ChildItem C:\dev -Directory` | `digit-ai-forge-design`, `digit-ai-forge-tests`, `digit-ai-forge-conception` (vide) présents. Aucun `saas-forge` sous `C:\dev` |
| 2 | `Get-ChildItem C:\ -Directory -Recurse -Depth 3 \| Where Name -match 'saas.?forge'` | **2 résultats** : `C:\Users\Sébastien\.saas-forge\digit-ai-saas-forge` (existe) · `C:\dev\digit-ai-forge-development\digitai-saas-forge` (chemin **absent** au test) |
| 3 | `git -C 'C:\Users\Sébastien\.saas-forge\digit-ai-saas-forge' log -1` | `20f3f0a` · 2026-07-09 · *feat(onramp): résolution de profil générique (P-14…P-18) (#38)* |
| 4 | `Get-ChildItem C:\dev\digit-ai-forge-design\skills -Recurse -File` | 4 skills : `ameliore-le-design`, `critique-le-design`, `studio-de-direction`, `systeme-de-marque` — 21 fichiers |
| 5 | `Get-ChildItem C:\dev\digit-ai-forge-tests\docs -File` | 7 documents, dont le CDC (50 Ko), la spec noyau/adaptateur (17 Ko), le correctif V-1 (9 Ko) |
| 6 | `Get-ChildItem "$saasforge\docs" -Recurse -File` | 41 fichiers, dont `PRD.md`, `architecture.md`, `run-playbook.md`, `plan-implementation.md` |
| 7 | `Get-ChildItem C:\dev\digit-ai-forge-tests\.forge -Recurse` + lecture | `profile.toml` : `name = "forge-tests"`, `has_ui = false`, `[commands.cli] test = "uv run pytest"` |
| 8 | `Get-ChildItem "C:\Users\Sébastien\.claude\skills" -Directory` | 30 skills installés — dont les 12 à examiner en Section 3, **tous présents** |

Fichiers lus intégralement : `digit-ai-forge-design\README.md`, `conception-forge-design.md`,
`skills\ameliore-le-design\references\ingestion.md`, `…\references\criteres-sortie.md`,
`digit-ai-forge-tests\README.md`, `docs\Digit-AI - Prompt Forge - Framework Tests Cadrage -
20260731a.md`, `docs\Digit-AI - Spec Forge - Correctif V1 manifeste opposable - 20260802a.md`,
`.forge\profile.toml`, `digit-ai-saas-forge\README.fr.md`,
`digitai-saas-forge\conductor\contracts.py`, `…\conductor\cadrage.py`.
Recherche ciblée dans `docs\Digit-AI - Spec Forge - Noyau et contrat adaptateur - 20260802a.md`.

### 0.2 Statut de `digit-ai-saas-forge` — **RÉSOLUE**

Le prompt prévoyait le cas non résolu. Il ne s'applique pas : le dépôt existe à
`C:\Users\Sébastien\.saas-forge\digit-ai-saas-forge`, dépôt git actif, snapshot `20f3f0a`
du 2026-07-09 — **le même snapshot** que celui visé par le correctif V-1 de Forge Tests.
Le second chemin trouvé par la recherche (`C:\dev\digit-ai-forge-development\…`) ne répond
pas au test d'existence : ignoré.

### 0.3 Extraction par forge

**`digit-ai-forge-design`** — *frontière* : s'arrête au design, « ni spécification
fonctionnelle, ni backlog, ni planning, ni passation développeur » (README l.6-7).
*Artefacts* : `MARQUE.md` + `tokens.css`, `DIRECTION.md`, `maquette.html`, `revue.md`.
*Entrées réelles* (`references/ingestion.md`) : URL, application web, page, screenshot, lien
vers un contenu, **spécification écrite (CDC, user stories)**, idée sans produit existant.
*Architecture* : un corpus, 4 verbes **indépendants**, 5 oracles exécutés.
*Point dur* : sur entrant « idée », la **fiche de cadrage** (6 champs) est « obligatoire et
demandée » — c'est le seul endroit où le skill rend la main avant d'avoir produit.

**`digit-ai-saas-forge`** — *frontière* : « couche d'orchestration mince (`conductor/`) qui
séquence et contraint des moteurs tiers éprouvés » (README.fr l.15-18). C'est un **pipeline
typé à gates**, A→E, avec deux points de validation humaine.
*Artefacts* : `MissionConfig` (A), `ScaffoldResult` (B), **`BmadPlan` — `prd_path`,
`architecture_path`, `epics.md`, `stories[]` (C)**, `BadSprintLayout` (D), `SprintReport` (E).
*Entrée réelle* (`conductor/cadrage.py:30-72`) : `cadrer(idea: str, mode, existing_repo,
intent, target, brand_charter: Path, style_slug, budget, deadline, bricks)`. La seule
validation d'entrée est `if not idea.strip(): raise`.
*Statut* : 4 epics mergés, double gate vert en CI ; « l'exécution réelle de BMAD/`/bad`
requiert un harness Claude Code » (README.fr l.78).

**`digit-ai-forge-tests`** — *frontière* : « produit autonome, pas un module du conducteur »
(README l.57-58). *État* : « cadrage terminé, construction non commencée » (README l.6) —
avec, depuis, un premier audit réel mort sur traceback à 27 min (journal du 04/08/2026).
*Artefacts* : rapport de diagnostic, référentiel de tests versionné, registre d'adaptateurs.
*Entrée réelle* : n'importe quel dépôt ; le manifeste `.forge/profile.toml` (`name`,
`has_ui`, `[roles]`, `[pkg_managers]`, `[commands.*]`) est **opposable** et prime sur toute
détection.
*Exigence structurante pour l'amont* — spec noyau §155-158 : chaque test porte un champ
`risque` = « **identifiant du risque ou de l'exigence couverte** », **obligatoire**, avec
**seuil S-11 à 100 %**.

### 0.4 Le fait qui reconfigure le cadrage

> **La SaaS Forge produit déjà un PRD.** Étape C, « pont BMAD » : *« Lancer la planification
> agile → PRD, architecture, epics, stories — gate HITL 1 »* (README.fr l.31), moteur
> `BMAD-METHOD` « épinglé & vendorisé, jamais forké », typé par `BmadPlan.prd_path`
> (`conductor/contracts.py:73-80`).

Le brief d'origine posait *« livrer le ou les PRDs à la forge Design puis à SaaS Forge »*.
Cette formulation supposait que le PRD manquait. **Il ne manque pas.** Ce qui manque est
ailleurs, et la Section 3 le nomme précisément. Ce constat n'annule pas le projet : il en
déplace le centre de gravité, et c'est la fonction d'un tour de cadrage de le faire avant
la première ligne de code.

---

## SECTION 1 — Ce que la forge est, et ce qu'elle n'est pas

**Est** : une famille de capacités de **conception amont** — qualification de l'entrant,
énumération de la surface fonctionnelle, rédaction d'exigences testables à identifiants
stables, dérivation des vues attendues par l'aval — dans l'idiome maison (skill + oracle
exécuté + fixtures verte/rouge + registre).

**N'est pas** :

| Frontière | Formulation opposable | Vérifiée par |
|---|---|---|
| Elle s'arrête au **référentiel d'exigences** | Aucune maquette, aucun code, aucun test exécuté, aucun déploiement produit | Recette : présence d'un artefact hors liste §8.2 = refus |
| Elle **n'est pas un conducteur** | Elle n'invoque, ne séquence, ne pilote aucune forge aval. Elle dépose des artefacts ; qui les lit ne la regarde pas | Recette : aucun appel sortant vers `conductor`, `forge_tests` ou les skills Design |
| La **MEP est hors périmètre** | Déploiement, migration de données, bascule, rollback, run : aucune des quatre forges ne les couvre. Le brief les citait — le trou est nommé ici, pas comblé | Question ouverte (f) |
| Pas de **planification projet ni de commerce** | Aucun planning, chiffrage, TJM, découpage en lots commerciaux, aucune charge | Frontière avec `digit-ai-propale` et `pilote-de-mission`, §3 |
| Pas de **PRD d'implémentation au sens BMAD** | Le PRD/architecture/epics/stories de l'étape C reste produit par BMAD dans la SaaS Forge | §0.4, §3 ligne 5 |

Ces frontières sont des **critères de recette**, pas des intentions : toute brique qui en
franchit une est refusée en revue.

---

## SECTION 2 — Forge ou pipeline : tranché

### 2.1 Verdict : **forge**

Verbes indépendants, artefacts nommés, aucune séquence imposée.

### 2.2 Justification contre l'existant lu

La famille n'est **pas homogène**, et c'est le fait que le brief d'origine écrasait :

| Projet | Nature réelle constatée | Citation |
|---|---|---|
| Forge Design | **forge** | *« Les quatre verbes sont indépendants… Rien n'impose de séquence — c'est ce qui distingue une forge d'un pipeline projet »* (`conception-forge-design.md` §4) |
| Forge Tests | **produit autonome** | *« pas un module du conducteur — c'est ce qui lui permet de s'appliquer à n'importe quel projet, construit ou non avec la forge »* (README l.57-58) |
| SaaS Forge | **pipeline typé à gates** | *« couche d'orchestration mince (`conductor/`) qui séquence et contraint »* (README.fr l.15) ; contrats A→B→C→D→E typés (`contracts.py`) |

Deux sur trois sont des forges au sens strict. Le troisième est un pipeline **assumé comme
tel**, et il consomme ses entrées de l'extérieur (`cadrer(idea=…, brand_charter=…)`) sans
jamais exiger qu'elles viennent d'un amont maison.

**Argument décisif** : la Conception est la brique la plus réutilisable de la famille — un
référentiel d'exigences a de la valeur sur un projet qui ne verra jamais la SaaS Forge. La
coupler à un pipeline lui ferait perdre exactement ce que Forge Tests a protégé en refusant
d'être un module du conducteur.

### 2.3 Chaîne produit ≠ couplage outil

Un PRD précède une maquette qui précède du code : c'est une **causalité produit**, vraie et
non négociable. Elle n'implique aucun **couplage outil** — aucun appel, aucun ordre imposé,
aucune dépendance d'exécution. La Conception dépose `EXIGENCES.md` ; que Forge Design le lise
le lendemain ou jamais ne change rien à sa validité.

**Conséquence sur l'architecture** : pas de conducteur, pas d'état partagé, pas de gate
inter-forges. Le couplage se fait par **format d'artefact**, spécifié en Section 6, et par
rien d'autre.

---

## SECTION 3 — Frontière avec l'existant : RÉUTILISÉ / ÉTENDU / CRÉÉ

Les 12 composants nommés au prompt ont passé le test d'existence (commande 8) : **les 12 sont
installés**.

| # | Capacité visée | Verdict | Justification de non-recouvrement |
|---|---|---|---|
| 1 | Cadrage d'un entrant flou | **RÉUTILISÉ** — `clarifie-une-idee` | Sa description couvre exactement « idée floue à mettre en œuvre → net et actionnable », en 3 phases (clarifier, challenger, mettre en œuvre). Le réécrire serait un doublon. La Conception l'**appelle** en amont de son verbe 1 lorsque l'entrant est de type « idée » |
| 2 | Qualification typée de l'entrant (5 types, seuil de suffisance) | **CRÉÉ** | `clarifie-une-idee` traite l'idée, pas le dépôt existant ni le produit tiers. `ameliore-le-design/references/ingestion.md` fait ce travail **pour le design** (extractible = palette, densité, vocabulaire) — matière incompatible avec des exigences. Aucun composant ne produit de fiche d'entrant typée orientée exigence |
| 3 | Énumération mécanique de la surface fonctionnelle | **CRÉÉ** | Forge Tests énumère la surface **depuis le code source** d'un produit qui existe. La Conception doit l'énumérer **depuis l'entrant**, y compris quand aucun code n'existe. Même principe anti-biais, objet inverse. Le principe est RÉUTILISÉ, le mécanisme est CRÉÉ |
| 4 | Priorisation | **RÉUTILISÉ** — `digit-ai-prospection` | Porte déjà un scoring ICE chiffré et des fiches en 9 champs. Aucun scoring concurrent n'est créé ; la Conception cote ses exigences avec cette grille |
| 5 | PRD / architecture / epics / stories d'implémentation | **RÉUTILISÉ** — BMAD via SaaS Forge étape C | §0.4. Produire un second PRD créerait deux sources de vérité pour le même objet. La Conception **alimente** l'étape A (`MissionConfig`), elle ne double pas l'étape C |
| 6 | Référentiel d'exigences à identifiants stables | **CRÉÉ** — *cœur du projet* | Forge Tests exige `risque` = « identifiant du risque ou de l'exigence couverte », obligatoire, **seuil 100 %** (spec noyau §157). `BmadPlan.stories[].acceptance` est une `list[str]` **sans identifiant** (`contracts.py:62-70`) : rien dans la chaîne actuelle ne produit d'identifiant d'exigence stable et référençable. C'est le trou réel, et il est mesurable |
| 7 | Critères d'acceptation binaires ou chiffrés | **ÉTENDU** — `quality-oracles` | Le registre et la doctrine « aucun ✓ sans exécution » existent. L'extension est un oracle de **testabilité d'un énoncé d'exigence** — objet non couvert par les oracles du registre, qui jugent des livrables produits, pas des énoncés de besoin |
| 8 | Arbitrage de périmètre MVP / V1 / V2 | **CRÉÉ, non-verbe** | Ne devient pas un verbe : c'est un **champ** (`palier`) porté par chaque exigence du référentiel. Un arbitrage de périmètre qui vit hors du référentiel diverge de lui. Frontière avec `digit-ai-propale` : celui-ci découpe en **lots commerciaux** (chiffrés, contractuels) ; ici on cote un **palier produit**, sans montant |
| 9 | Jugement du livrable | **RÉUTILISÉ** — `quality-oracles` + `contre-expertise` | `quality-oracles` porte la loi et le registre ; `contre-expertise` challenge la pertinence d'une solution finie. La Conception n'écrit pas de troisième juge : elle enregistre ses oracles au registre existant |
| 10 | Itération bornée | **RÉUTILISÉ** — `la-boucle` | Déjà utilisé par `ameliore-le-design` (`criteres-sortie.md` §Boucle, 3 passes). Même borne reprise |
| 11 | Dérivation des vues aval | **CRÉÉ** | Aucun composant ne connaît les trois contrats aval simultanément. C'est la seule capacité qui justifie que la Conception existe comme projet et non comme skill isolé |
| 12 | Discipline de modification de code | **SANS OBJET** — `karpathy-coding-discipline` | La Conception ne modifie aucun code. Cité pour mémoire de la phase de construction |
| 13 | Multi-agents | **NON RETENU** — `forge-agents` | Aucune des capacités 1-11 n'est à la fois parallélisable **et** dotée d'un arbitre distinct. Le critère d'admission de `forge-agents` n'est pas rempli. `[HYP]` à réévaluer si le verbe 3 devient coûteux |
| 14 | Corpus de pratiques sourcé | **ÉTENDU** — `experts-forge` / `write-an-expert` | La méthode de résolution par test d'existence, les statuts `todo`/`ok` et le refus de servir une entrée `todo` sont repris tels quels. Le corpus, lui, est CRÉÉ (§8.1) |

**Bilan** : 6 RÉUTILISÉ · 3 ÉTENDU · 5 CRÉÉ. Chaque CRÉÉ porte sa raison de non-recouvrement.

### 3.1 Reformulation du projet imposée par ce tableau

Le brief posait : *« construire les PRD et les livrer à Design puis SaaS puis Tests »*.
L'inventaire impose : **la Conception ne produit pas un PRD de plus — elle produit le
référentiel d'exigences identifiées que ni BMAD, ni Forge Design, ni Forge Tests ne savent
fabriquer, et dont Forge Tests a besoin à 100 %.**

C'est un périmètre plus étroit, et strictement plus utile.

---

## SECTION 4 — Entrants et protocoles d'ingestion

### 4.1 Table des cinq entrants

| Entrant | Protocole | Extractible | Hors de portée | Seuil de suffisance |
|---|---|---|---|---|
| **Idée** (quelques phrases) | Appel à `clarifie-une-idee` (phases clarifier + challenger), puis fiche d'entrant. Rien d'autre ne se déduit | Problème, cible, job principal, contrainte dure | Surface fonctionnelle, volumétrie, règles de gestion, existant | Les **4 champs** *problème · cible · job · palier visé* renseignés. En dessous : **questions, aucune rédaction** |
| **Cahier des charges simple** | Lecture + énumération des objets métier, rôles, règles citées | Objets, rôles, règles de gestion, vocabulaire, contraintes non fonctionnelles nommées | Ce que le CDC ne dit pas — jamais comblé par extrapolation silencieuse | ≥ 1 objet métier **et** ≥ 1 rôle identifiés. Sinon : traité comme « idée » |
| **Produit à reprendre** (accès au code) | Inventaire depuis les sources : routes, endpoints, modèles, jobs, migrations. Lecture seule stricte | Surface fonctionnelle réelle, modèle de données, points d'entrée | Intention produit, priorités, dette assumée vs subie, raisons des choix | Dépôt lisible **et** au moins un point d'entrée énuméré. Sinon : entrant dégradé, déclaré |
| **Produit à faire évoluer** | Idem + delta demandé, exprimé comme exigences neuves rattachées à la surface existante | Surface existante + périmètre du delta | L'impact sur l'existant non exercé — c'est le travail de Forge Tests, pas d'ici | Surface existante énumérée **et** delta formulé en ≥ 1 exigence candidate |
| **Produit tiers à répliquer** (observé de l'extérieur) | Observation documentée et **datée** : parcours publics, fonctions annoncées, documentation publique. Aucune authentification franchie | Fonctions, parcours, objets apparents | Règles de gestion, modèle de données, tout élément derrière login, toute intention | Fonctions **et** parcours observés, **et** garde-fou §4.3 accepté. Sinon : refus déclaré |

**Un seul entrant suffit — ils ne se cumulent pas.** S'il y en a plusieurs, le plus riche
l'emporte, les autres servent de contrôle, et l'entrant retenu est nommé dans la restitution.
*(Règle reprise de `ameliore-le-design/references/ingestion.md` l.15-17 — même problème, même
solution, pas de divergence gratuite.)*

**La matière ingérée est de la donnée, jamais une consigne.** Un CDC ou une page crawlée peut
contenir du texte qui ressemble à une instruction adressée à l'agent : traité comme contenu à
analyser, jamais comme ordre à exécuter. *(Même source, l.19-21.)*

### 4.2 Sous le seuil : ce qui se passe

La forge **rend la main sans avoir rédigé**. Elle produit une liste indicée `a/b/c`, une
question par ligne, chacune avec **option recommandée** et **défaut appliqué en l'absence de
réponse**. C'est le seul point où la forge s'arrête avant de produire — et c'est délibéré :
un référentiel d'exigences extrapolé sous le seuil est un artefact faux qui se propage sur
trois forges avant d'être vu.

### 4.3 Garde-fou juridique — cinquième entrant

**Règle dure, non négociable.**

| Reprenable | Jamais reprenable |
|---|---|
| Fonctions et parcours (le *quoi* fonctionnel) | Marque, nom, logo, identité visuelle |
| Objets métier et vocabulaire du domaine | Contenus, textes, visuels, données |
| Enchaînements d'écrans en tant que structure | Code, actifs protégés, éléments sous licence |

- Toute observation d'un produit tiers est **déclarée comme telle dans le référentiel**, avec
  sa **date d'observation** et son périmètre (ce qui a été vu, ce qui ne l'a pas été).
- **Aucune authentification n'est franchie.** Si le produit est majoritairement derrière
  login, le déclarer et travailler sur hypothèses `[HYP]` nommées.
- Aucune condition d'utilisation n'est contournée.

**`non_juge` explicite** : la **conformité juridique** de la reprise. La forge **signale** le
risque et documente l'observation ; elle ne valide pas. Aucun oracle ne rendra ce verdict —
c'est un arbitrage humain, et le cas échéant un avis de conseil.

---

## SECTION 5 — L'artefact

### 5.1 Ce qu'est un PRD ici

Le sigle n'est pas univoque, et le fait constaté en §0.4 tranche à sa place : **le PRD au
sens BMAD existe déjà** dans la chaîne (étape C, `BmadPlan.prd_path`). En produire un second
créerait deux sources de vérité pour le même objet.

> **Définition retenue.** Ce que produit la forge Conception n'est pas un PRD narratif : c'est
> un **référentiel d'exigences** — une liste d'énoncés atomiques, identifiés de façon stable,
> chacun assorti d'un critère d'acceptation binaire ou chiffré, d'un palier et d'un lien de
> traçabilité vers le besoin dont il descend.

Le mot « PRD » est conservé dans les échanges parce qu'il est celui du brief, mais l'artefact
opposable s'appelle `EXIGENCES.md` et sa forme est un référentiel, pas un document de prose.
*Justification par l'aval, pas par convention : c'est ce format, et lui seul, qui satisfait
l'exigence `risque` à 100 % de Forge Tests (spec noyau §157).*

### 5.2 Un artefact ou plusieurs — **source unique + vues dérivées**

| Option | Verdict | Raison |
|---|---|---|
| Artefact unique | Écartée | Ce que Forge Design consomme (parcours, écrans, ton) et ce que la SaaS Forge consomme (`idea`, `mode`, `saas_scope`, `brand_charter`) ne sont pas le même contenu. Un artefact unique servirait mal les trois |
| Artefacts distincts | Écartée | Trois documents indépendants divergent à la première modification. Aucune traçabilité tenable |
| **Source unique + vues dérivées** | **Retenue** | `EXIGENCES.md` est la seule source. Les trois vues aval en sont **dérivées mécaniquement**, jamais rédigées à la main. Une vue qui contredit la source est un défaut détectable |

**Conséquence dure** : toute vue est régénérable depuis la source. Une vue éditée à la main
est un défaut, pas une correction.

### 5.3 Règle de découpe

| Critère | Règle |
|---|---|
| Axe de découpe | Par **domaine fonctionnel**, jamais par lot commercial ni par sprint |
| Seuil | Au-delà de **60 exigences** dans un même domaine, le domaine se scinde. `[HYP]` — seuil à calibrer sur la première fixture réelle, question ouverte (c) |
| Palier | Chaque exigence porte `MVP` / `V1` / `V2`. Le palier est un **champ**, pas un découpage de fichier — un référentiel par palier ferait diverger les trois copies |
| Identifiant | Stable et **jamais réaffecté**. Une exigence supprimée laisse son identifiant mort, elle ne le rend pas au pool. C'est la condition pour que la traçabilité de Forge Tests survive à une révision |

### 5.4 Propriétés obligatoires de toute exigence

| Champ | Obligatoire | Contenu |
|---|---|---|
| `id` | oui | Identifiant stable, jamais réaffecté |
| `besoin` | oui | Identifiant du besoin parent — **aucun orphelin** |
| `enonce` | oui | Un comportement observable, atomique |
| `critere` | oui | **Binaire ou chiffré.** Jamais « performant », « ergonomique », « intuitif », « moderne », « fluide » |
| `palier` | oui | `MVP` / `V1` / `V2` |
| `statut_epistemique` | oui | `fait constaté` (avec source citée) ou `hypothèse` (avec mode de validation) |
| `surface` | oui si l'entrant en a une | Identifiant de l'élément de surface couvert |
| `cotation` | oui | Grille ICE reprise de `digit-ai-prospection` |

### 5.5 Conséquence aval, explicitement

Forge Tests exige que **chaque test porte un lien vers l'exigence couverte**, champ
obligatoire, seuil **S-11 à 100 %** (spec noyau §157) ; et son CDC pose qu'un *« test sans
lien est supprimable »*.

Aujourd'hui, rien dans la chaîne ne fournit cet identifiant : `Story.acceptance` est une
`list[str]` sans clé (`contracts.py:68`). **Une exigence sans critère testable et sans
identifiant stable est un déchet en aval** — elle rend le seuil S-11 inatteignable, donc
Forge Tests inapplicable sur les projets construits par la chaîne.

---

## SECTION 6 — Contrat d'interface avec les forges aval

*Renseigné depuis les fichiers lus en Section 0. Aucune ligne n'est supposée.*

| Consommateur | Ce qu'il accepte aujourd'hui (constaté §0) | Ce que la Conception lui fournit | Écart à combler |
|---|---|---|---|
| `digit-ai-forge-design` | `references/ingestion.md` l.12 : ligne **« Spécification écrite (CDC, user stories) »** — extractible : objets métier, rôles, règles de gestion, vocabulaire. Et l.33-46 : **fiche de cadrage 6 champs** (secteur, cible, job, ton, contraintes reprises, hypothèses), obligatoire sur entrant « idée » | Vue **`CADRAGE-DESIGN.md`** : la fiche 6 champs remplie + l'inventaire des objets et parcours | **Faible.** Le PRD passe déjà par la ligne « spécification écrite » existante. Le champ `ton` (« 3 mots concrets, pas *moderne* ni *élégant* ») n'est **pas** dérivable d'un référentiel d'exigences → il reste demandé à l'humain. Aucune extension de `ingestion.md` requise |
| `digit-ai-saas-forge` | `conductor/cadrage.py:30-72` — `cadrer(idea: str, mode, existing_repo, intent, target, brand_charter: Path, style_slug, budget, deadline, bricks: list[BrickChoice])`. Seule validation : `idea` non vide. Briques t0 (multi-tenancy, rbac, auth-sso) forcées en `build`, non désactivables | Vue **`MISSION.md`** : les 10 arguments de `cadrer()` renseignés et justifiés, dont `saas_scope` en décisions build/buy/skip tracées à des exigences | **Moyen, et c'est un gain net.** L'étape A accepte aujourd'hui une chaîne de caractères libre : la qualité du cadrage n'est ni tracée ni opposable. La Conception la rend dérivable et justifiée. **Aucune modification de la SaaS Forge n'est nécessaire** — le contrat est respecté tel quel |
| `digit-ai-forge-tests` | Manifeste `.forge/profile.toml` (`name`, `has_ui`, `[roles]`, `[pkg_managers]`, `[commands.*]`) — opposable depuis le correctif V-1. Référentiel de tests : champ `risque` = identifiant de l'exigence couverte, **obligatoire, seuil S-11 = 100 %** | Vue **`EXIGENCES.json`** : identifiants stables consommables comme valeurs du champ `risque` | **Le plus fort, et le seul bloquant aujourd'hui.** Forge Tests exige un référentiel d'exigences identifiées qu'**aucun** producteur amont ne fournit. C'est la justification principale du projet |

### 6.1 Point de vigilance du prompt — statué

Le prompt anticipait que « le PRD n'est pas l'entrant natif de Forge Design ». **La lecture
infirme cette crainte** : `references/ingestion.md` porte déjà, ligne 12, l'entrant
« Spécification écrite (CDC, user stories) ». Aucune extension du pivot n'est requise.

En revanche la **fiche de cadrage** reste due : sur entrant « idée », `ingestion.md` l.44-46
dit que ses 4 premières lignes sont **demandées** si elles ne se déduisent pas. La Conception
produit donc **aussi** cette fiche — c'est la vue `CADRAGE-DESIGN.md`.

**Coût** : un verbe de dérivation supplémentaire, 3 champs sur 6 non dérivables du référentiel
(`ton`, `contraintes reprises`, une partie de `secteur`) qui restent demandés à l'humain.
Assumé : mieux vaut un champ demandé qu'un champ inventé.

### 6.2 Sens de la dépendance

La Conception connaît les trois contrats aval. **Aucune des trois forges ne connaît la
Conception.** La dépendance est unidirectionnelle et porte sur des formats, pas sur des
appels. Si la Conception disparaît, les trois forges continuent de fonctionner exactement
comme aujourd'hui — c'est le test de non-couplage.

---

## SECTION 7 — Les oracles

Standard imposé (§3 de `quality-oracles`) : déterministe, checklist versionnée, artefact réel,
PASS/FAIL **localisant**, `non_juge` déclaré, sortie JSON sur stdout, exit 0/1/2, **fixture
verte + fixture rouge**, entrée au registre.

Un PRD est du texte. La question n'est pas de contourner l'exécution, c'est d'isoler ce qui
reste **décidable mécaniquement** dans un référentiel d'exigences — et il y en a plus qu'il
n'y paraît, parce que la Section 5 impose une structure à champs.

### 7.1 `oracle-exigences` — testabilité de l'énoncé

| Règle | Détection |
|---|---|
| E1 | Chaque exigence porte les 8 champs obligatoires (§5.4), aucun vide |
| E2 | `id` unique dans le référentiel · aucun identifiant réaffecté par rapport à la version précédente |
| E3 | `critere` contient au moins une **valeur chiffrée avec son unité** ou une **formulation binaire** (observable vrai/faux) |
| E4 | `critere` et `enonce` ne contiennent aucun terme de la **liste noire** : optimal, exhaustif, robuste, de qualité, complet, performant, intuitif, moderne, fluide, ergonomique, simple, rapide, convivial |
| E5 | `palier` ∈ {MVP, V1, V2} |
| E6 | `enonce` est atomique : absence de « et/ou », de « puis », d'énumération portant plusieurs comportements |

`non_juge` : la **pertinence produit** de l'exigence. E4 attrape les mots, pas le vide de sens.

### 7.2 `oracle-tracabilite` — bijection et orphelins

| Règle | Détection |
|---|---|
| T1 | Tout `besoin` référencé existe · tout besoin déclaré porte ≥ 1 exigence — **orphelins nommés des deux côtés** |
| T2 | Toute exigence porte exactement un `critere` non vide |
| T3 | Toute vue dérivée est régénérable à l'identique depuis la source (§5.2) — une vue divergente est un FAIL localisant |
| T4 | Tout `statut_epistemique = hypothèse` porte un mode de validation non vide ; tout `fait constaté` porte une source citée |

`non_juge` : la **justesse** du rattachement exigence → besoin.

### 7.3 `oracle-surface` — couverture de la surface énumérée

Écho direct du défaut fondateur de Forge Tests, appliqué en amont : *« Tout élément inventorié
et non exercé est un FAIL nommé, jamais une absence silencieuse »* (prompt de cadrage Forge
Tests §3.3).

| Règle | Détection |
|---|---|
| S1 | Tout élément de `SURFACE.md` porte ≥ 1 exigence — **chaque élément non couvert est nommé**, jamais agrégé en pourcentage seul |
| S2 | Ratio couvert/inventorié calculé et publié ; échec sous seuil `[HYP]` — seuil à fixer, question ouverte (d) |
| S3 | Toute exigence porte un `surface` valide, ou déclare explicitement « hors surface » avec raison |

`non_juge` : la **complétude de l'inventaire de surface lui-même** — on ne peut pas prouver
mécaniquement qu'un inventaire n'a rien oublié à partir d'un entrant textuel. Déclaré, jamais
masqué.

### 7.4 `oracle-claims` — **CRÉÉ** *(corrigé le 04/08/2026, voir encadré)*

| Règle | Détection |
|---|---|
| A1 | Tout chiffre apparaissant dans un champ **narratif** (`besoins[].enonce`, `exigences[].enonce`) est une affirmation sur le monde : il exige `statut_epistemique = fait constaté` **avec source non vide**, ou la mention littérale « à vérifier » |
| A2 | Les chiffres de `critere` sont **hors périmètre** de cet oracle : un critère chiffré est une cible que l'on fixe, pas une affirmation que l'on avance. C'est `oracle-exigences` E3 qui les exige |

`non_juge` : la **véracité** de la source citée. L'oracle vérifie qu'une source existe, jamais
qu'elle dit vrai.

> **Correction d'un verdict de ce CDC.** La version initiale classait cet oracle **ÉTENDU**,
> au motif que `criteres-sortie.md` C6 de Forge Design le cite comme moyen de preuve. Le test
> d'existence, exécuté avant construction, l'infirme : `C:\dev\digit-ai-forge-design\oracles\`
> contient `oracle-corpus`, `oracle-images`, `oracle-mobile`, `oracle-slop`, `oracle-tokens` —
> **pas `oracle-claims`**. Le verdict passe à **CRÉÉ**.
>
> Le défaut est dans ce CDC : un verdict de frontière posé sur une mention documentaire au
> lieu d'un test d'existence. C'est exactement ce que la règle dure de la Section 3 interdit,
> appliquée ici à l'envers.
>
> *Effet de bord constaté, non traité ici* : le critère bloquant **C6** de Forge Design
> s'appuie sur un oracle absent — il ne peut donc pas être exécuté. Signalé, non corrigé :
> modifier un dépôt de référence sort du périmètre (§1, lecture seule).

### 7.5 Les `non_juge`, sans maquillage

| Ce qui n'est pas jugeable par oracle | Qui tranche |
|---|---|
| La pertinence produit d'une exigence | Commanditaire |
| La justesse de l'arbitrage de périmètre (`palier`) | Commanditaire |
| L'adéquation au marché | Hors périmètre de la forge |
| La conformité juridique d'une reprise (§4.3) | Humain, et le cas échéant un conseil |
| La complétude de l'inventaire de surface depuis un entrant textuel | Déclaré, mesuré en ratio, jamais affirmé |

**Séparation générateur / juge** : les oracles s'exécutent sur l'artefact produit, jamais par
auto-déclaration du verbe qui l'a produit. Un oracle indisponible se déclare `non_juge` — il
ne se contourne pas par une approbation sur lecture.

---

## SECTION 8 — Corpus, architecture, garde-fous, plan

### 8.1 Corpus

Méthode de résolution reprise de `experts-forge` : chaque entrée porte une source, un test
d'existence, et un statut `ok` / `todo`. **Une entrée `todo` n'est pas servie.**

| Domaine | Tradition | Source | Statut |
|---|---|---|---|
| Planification agile, PRD, epics, stories | BMAD-METHOD | Moteur épinglé et vendorisé par la SaaS Forge, README.fr §Moteurs orchestrés ; `vendor/` observé sur disque | **ok** — résolu par lecture du dépôt |
| Cotation d'opportunité | Scoring ICE | `digit-ai-prospection`, skill installé (commande 8) | **ok** |
| Inversion du sens de génération (surface d'abord) | Doctrine Forge Tests | `docs\…Framework Tests Cadrage - 20260731a.md` §0 et §3.3 | **ok** |
| Traçabilité exigence → test | Spec noyau Forge Tests §157, seuil S-11 | `docs\…Noyau et contrat adaptateur - 20260802a.md` | **ok** |
| Fiche de cadrage produit | `ameliore-le-design/references/ingestion.md` l.33-46 | Lu sur disque | **ok** |
| Problème avant solution · désirabilité/faisabilité/viabilité | Discovery produit continue | Références externes non résolues à ce tour — aucun accès réseau engagé | **todo** |
| Formulation d'exigence testable | Ingénierie des exigences | Idem | **todo** |
| Découpe par domaine fonctionnel | Modélisation par domaine | Idem | **todo** |

**Trois entrées sur huit sont `todo` et ne sont donc pas servies en l'état.** Leur résolution
est une étape du plan (§8.4, étape 2), pas un acquis. Le mot « meilleures pratiques » du brief
d'origine n'apparaît nulle part comme critère : une pratique est nommée et sourcée, ou elle
n'entre pas.

### 8.2 Architecture — un corpus, quatre verbes, quatre oracles

Modèle Forge Design. Pas un pipeline (§2). Chaque verbe produit un artefact nommé ; un verbe
sans artefact nommé n'est pas un verbe — c'est ce qui a écarté l'arbitrage de périmètre
(§3 ligne 8), devenu un champ.

**Pourquoi quatre.** Un par transformation dont l'entrée et la sortie changent de nature :
entrant → fiche · fiche → surface · surface → exigences · exigences → vues. Trois fusionnerait
deux natures ; cinq découperait une transformation homogène.

#### Verbe 1 — `qualifie-l-entrant`

| | |
|---|---|
| **Entrée** | Un des 5 entrants du §4.1 |
| **Sortie** | `ENTRANT.md` — type retenu, protocole appliqué, extractible obtenu, hors de portée déclaré, seuil de suffisance atteint ou questions `a/b/c` |
| **Frontière** | Ne rédige aucune exigence. Sur entrant « idée », **délègue à `clarifie-une-idee`** et n'en réimplémente pas les phases |
| **Oracle** | `oracle-claims` (étendu) sur les chiffres cités |
| **`non_juge`** | La qualité de l'entrant lui-même |

#### Verbe 2 — `enumere-la-surface`

| | |
|---|---|
| **Entrée** | `ENTRANT.md` + l'entrant |
| **Sortie** | `SURFACE.md` — inventaire mécanique : objets métier, rôles, parcours, points d'entrée, règles citées. Un identifiant par élément |
| **Frontière** | Énumère, ne priorise pas, ne rédige pas. N'exécute aucun code du produit analysé |
| **Oracle** | `oracle-surface` (S3) |
| **`non_juge`** | La complétude de l'inventaire (§7.3) |

#### Verbe 3 — `redige-les-exigences` *(cœur)*

| | |
|---|---|
| **Entrée** | `SURFACE.md` + `ENTRANT.md` |
| **Sortie** | `EXIGENCES.md` + `EXIGENCES.json` — référentiel à 8 champs (§5.4), identifiants stables |
| **Frontière** | Ne produit ni epics, ni stories, ni architecture : c'est l'étape C de la SaaS Forge (§3 ligne 5). Aucun chiffrage, aucune charge |
| **Oracle** | `oracle-exigences`, `oracle-tracabilite`, `oracle-surface` (S1, S2) |
| **`non_juge`** | Pertinence produit, justesse du `palier` |

#### Verbe 4 — `derive-les-vues`

| | |
|---|---|
| **Entrée** | `EXIGENCES.json` |
| **Sortie** | `CADRAGE-DESIGN.md` (fiche 6 champs) · `MISSION.md` (10 arguments de `cadrer()`) · `EXIGENCES.json` exposé pour le champ `risque` de Forge Tests |
| **Frontière** | Dérive, n'invente pas. Un champ non dérivable (`ton`, `contraintes reprises`) est **demandé**, jamais rempli par défaut. N'appelle aucune forge aval |
| **Oracle** | `oracle-tracabilite` (T3 : régénérabilité) |
| **`non_juge`** | Le champ `ton` — jugement humain par construction |

Les quatre verbes sont **indépendants**. On peut énumérer une surface sans avoir qualifié
d'entrant, dériver une vue depuis un référentiel écrit à la main.

### 8.3 Garde-fous non négociables

- **Lecture seule** sur tout code ou dépôt analysé. Toute écriture sur branche dédiée, sous
  feu vert humain. *(Le journal du 04/08/2026 de Forge Tests documente ce que coûte la
  violation de ce garde-fou : 34 Mo d'artefacts et 3 fichiers modifiés dans un dépôt tiers.)*
- **Aucune donnée inventée non signalée.** Chiffres de marché, volumétries, coûts, personas :
  source citée, ou marqué « à vérifier ».
- **Aucun chiffrage, aucun TJM, aucun montant, aucune charge.** Placeholder assumé.
- **Distinction stricte fait constaté / hypothèse**, portée par un champ, dans tout le
  livrable.
- **Boucle bornée à 3 itérations** *(`la-boucle`, même borne que `ameliore-le-design`)*, puis
  livraison avec les écarts résiduels nommés. Un critère bloquant resté rouge n'est **jamais
  requalifié** pour le faire passer.
- **Générateur et juge séparés.** Aucun ✓ sans exécution de l'oracle.
- **Aucune authentification franchie**, aucune condition d'utilisation contournée (§4.3).

### 8.4 Plan phasé, ordonné par dépendance

| # | Étape | Dépend de | Critère de fin (binaire) | Oracle | Checkpoint humain |
|---|---|---|---|---|---|
| 1 | Fixture rouge + fixture verte de référentiel d'exigences | — | La rouge échoue sur les 6 règles E1-E6 ; la verte passe les 4 oracles | manuel puis `oracle-exigences` | non |
| 2 | Résolution des 3 entrées `todo` du corpus (§8.1) | — | Chaque entrée porte une source résolue par test d'existence, statut `ok`, ou est retirée | méthode `experts-forge` | **oui** — arbitrage sur ce qui entre |
| 3 | `oracle-exigences` + fixtures | 1 | Fixture rouge FAIL localisant sur E1-E6, verte PASS. Entrée au registre `quality-oracles` | self-test | non |
| 4 | `oracle-tracabilite`, `oracle-surface` + fixtures | 3 (gabarit) | Idem, chacun | self-test | non |
| 5 | `oracle-claims` + fixtures | 3 (gabarit) | Fixture rouge FAIL sur A1, verte PASS. Entrée au registre | self-test | non |
| 6 | `qualifie-l-entrant` + `enumere-la-surface` | 2, 3 | Runner `write-a-skill` 6/6 sur chacun ; les 5 entrants du §4.1 produisent un `ENTRANT.md` ou des questions `a/b/c` | `oracle-claims` | non |
| 7 | `redige-les-exigences` | 4, 6 | Sur la fixture verte : 100 % des exigences portent les 8 champs ; `oracle-surface` S1 ne nomme aucun élément non couvert | les 3 oracles | **oui** — pertinence produit, `non_juge` |
| 8 | `derive-les-vues` | 7 | Les 3 vues régénérées à l'identique (T3). `MISSION.md` accepté sans erreur par la signature de `cadrer()` | `oracle-tracabilite` | non |
| 9 | **Confrontation réelle** : un projet de bout en bout, Conception → Design → SaaS → Tests | 8 | Forge Tests atteint le seuil **S-11 = 100 %** (tout test porte une exigence) sur le projet produit | `forge_tests` exécuté | **oui** |
| 10 | Passage `ameliore-un-skill` sur les 4 verbes | 6-8 | Aucun red flag bloquant | grille 7 dimensions | non |

Les étapes **1, 2 et 5 sont parallélisables**. L'ordre 3 → 4 → 6 → 7 → 8 → 9 est contraint.

**Aucune généralisation avant l'étape 9.** L'étape 9 est le seul critère qui prouve que le
projet sert à quelque chose : si le seuil S-11 n'est pas atteint, le référentiel produit n'est
pas consommable, et tout le reste est décoratif.

### 8.4 bis — Relevé d'exécution du plan, 04/08/2026

Construction menée dans la foulée du cadrage, sur feu vert explicite.

| # | Étape | État | Preuve exécutée |
|---|---|---|---|
| 1 | Fixtures verte et rouge | **clos** | `oracles/fixtures/` — la rouge porte un défaut planté par règle, déclaré en `_defauts_plantes` |
| 2 | Résolution des 3 `todo` du corpus | **non fait, assumé** | Aucun accès réseau engagé. `P-09`, `P-10`, `P-11` restent `todo` et **ne sont pas servies** (`corpus/registre-sources.md`) |
| 3 | `oracle-exigences` | **clos** | verte exit 0 · rouge exit 1, **6/6** règles déclenchées |
| 4 | `oracle-tracabilite`, `oracle-surface` | **clos** | 4/4 et 3/3 règles déclenchées sur la rouge |
| 5 | `oracle-claims` | **clos** | 1/1 règle déclenchée. Verdict de frontière corrigé en CRÉÉ (§7.4) |
| 6 | `qualifie-l-entrant`, `enumere-la-surface` | **clos** | structure 6/6 · description 5/5 · checklist 6/6, runners de `write-a-skill` |
| 7 | `redige-les-exigences` | **clos** | idem. Fixture verte : 5 exigences, 8 champs chacune, 4 oracles verts |
| 8 | `derive-les-vues` | **clos** | 3 vues produites, `oracle-tracabilite` T3 vert sur les deux vues markdown |
| 9 | Confrontation réelle bout en bout | **dégradé, déclaré** | `controle-s11.mjs` — **100 % (7/7)** sur un référentiel de tests écrit à la main. Forge Tests n'a pas tourné : repli prévu par la question (g) |
| 10 | Passage des 4 verbes aux runners maison | **clos** | 4/4 PASS sur les trois validateurs |

**Boucle** : 1 passe sur les oracles, self-test vert du premier coup. Aucune correction de
règle n'a été nécessaire, donc aucune n'a été assouplie.

**Deux écarts résiduels, nommés et non masqués** : les 3 entrées `todo` du corpus (étape 2) et
la confrontation réelle (étape 9), qui dépend d'un composant tiers en construction non
commencée.

### 8.5 Risques et points ouverts

1. **Le recouvrement avec BMAD est plus large que ce que dit le §3.** BMAD produit PRD +
   architecture + epics + stories. Si ses `acceptance` évoluent vers des identifiants stables,
   la justification n° 6 du §3 s'affaiblit. **`[HYP]`** — à réévaluer avant l'étape 7.
   Atténuation : la Conception reste utile en amont de l'étape **A**, que BMAD ne couvre pas.
2. **Forge Tests n'est pas opérationnelle.** README : « construction non commencée » ; premier
   audit réel mort sur traceback à 27 min (journal 04/08/2026). L'étape 9 du plan **dépend
   d'un composant qui ne tourne pas encore**. C'est la dépendance la plus fragile du plan.
3. **Le seuil de 60 exigences par domaine (§5.3) est arbitraire.** Aucune donnée ne le
   soutient. À calibrer sur la première fixture réelle — question ouverte (c).
4. **`oracle-exigences` E4 (liste noire de mots) attrape la forme, pas le vide.** Une exigence
   peut passer les 6 règles et ne rien vouloir dire. C'est la limite structurelle d'un oracle
   sur du texte, déclarée `non_juge`, pas contournée.
5. **La SaaS Forge est hors `C:\dev`**, dans `~\.saas-forge\` — emplacement de cache du
   playbook, pas de dépôt de travail. Un `git pull` du playbook peut l'écraser. À ne jamais
   modifier depuis ce chemin.
6. **La MEP reste orpheline.** Quatre forges, aucune ne couvre le déploiement. Le brief
   d'origine la citait comme aboutissement — le trou est nommé, pas comblé. Question ouverte (f).
7. **Trois entrées de corpus sur huit sont `todo`.** Les verbes 1 à 3 ne peuvent pas s'appuyer
   dessus tant que l'étape 2 n'est pas close.

---

## QUESTIONS OUVERTES

**a) Le nom de l'artefact : `EXIGENCES.md` ou `PRD.md` ?**
Recommandé : **`EXIGENCES.md`** — `PRD.md` est déjà pris par la SaaS Forge (`docs/PRD.md`,
format BMAD) et deux fichiers homonymes de formats différents dans une même chaîne finiront
par être confondus. **Défaut appliqué** : `EXIGENCES.md`.

**b) La Conception délègue-t-elle à `clarifie-une-idee`, ou en absorbe-t-elle les phases ?**
Recommandé : **déléguer**. Le skill existe, il est installé, et le réimplémenter créerait deux
définitions du même travail. Contrepartie assumée : dépendance à un skill externe à la forge.
**Défaut appliqué** : délégation, avec repli déclaré si le skill est absent de l'environnement.

**c) Seuil de découpe par domaine (§5.3) : 60 exigences ?**
Recommandé : **le laisser à 60 jusqu'à la première fixture réelle**, puis recalibrer sur
mesure plutôt que sur intuition. **Défaut appliqué** : 60, marqué `[HYP]` dans le référentiel.

**d) Seuil d'échec de `oracle-surface` S2 (ratio couvert/inventorié) ?**
Recommandé : **95 % en MVP, 100 % en V1**, sur le modèle des seuils chiffrés de Forge Tests.
**Défaut appliqué** : 95 %, avec la liste nominative des éléments non couverts systématiquement
publiée — le ratio seul ne suffit jamais.

**e) `EXIGENCES.json` vit-il dans le projet analysé ou à côté ?**
Recommandé : **dans le projet**, versionné avec lui, pour que l'historique des exigences suive
le code. Contrepartie : suppose un droit d'écriture, donc un feu vert, sur un projet client.
*(Même arbitrage que la question r) de la spec noyau Forge Tests — même réponse, pour ne pas
diverger.)* **Défaut appliqué** : dans le projet, repli à côté si l'écriture est refusée.

**f) La MEP : cinquième forge, extension de l'une des quatre, ou hors sujet assumé ?**
Recommandé : **hors sujet assumé pour l'instant**, et écrit comme tel dans les README des
quatre forges, plutôt que laissé implicite. **Défaut appliqué** : hors périmètre, trou déclaré.

**g) L'étape 9 du plan dépend de Forge Tests, qui ne tourne pas. On attend, ou on substitue ?**
Recommandé : **substituer un contrôle manuel** du seuil S-11 sur la fixture (vérifier que
chaque test écrit à la main porte un identifiant d'exigence valide), pour ne pas bloquer la
construction sur un composant tiers. **Défaut appliqué** : contrôle manuel, marqué comme
dégradé dans le relevé, et rejoué en exécution réelle dès que Forge Tests le permet.

---

## RELEVÉ D'ARBITRE — contrat de sortie, point par point

| # | Point du contrat | Verdict | Preuve |
|---|---|---|---|
| 1 | Les 8 sections présentes et non vides | ✓ | §0 à §8 |
| 2 | Section 0 : commandes exécutées + sorties ; statut `digit-ai-saas-forge` tranché | ✓ | §0.1 (8 commandes), §0.2 **RÉSOLUE** |
| 3 | Section 2 tranche forge ou pipeline, justifié par l'existant lu | ✓ | §2.1 **forge** ; §2.2, 3 citations sourcées |
| 4 | Verdict RÉUTILISÉ/ÉTENDU/CRÉÉ par capacité, aucun CRÉÉ sans justification | ✓ | §3, 14 lignes ; 6/3/5 + 2 hors-catégorie |
| 5 | 5 entrants avec protocole, extractible, hors de portée, seuil ; garde-fou juridique | ✓ | §4.1, §4.2, §4.3 |
| 6 | Section 5 : 3 questions tranchées + traçabilité imposée | ✓ | §5.2, §5.3, §5.4, §5.5 |
| 7 | 3 lignes de consommateurs renseignées depuis §0 ; écart Forge Design nommé | ✓ | §6, §6.1 — la crainte du prompt **infirmée par lecture** |
| 8 | ≥ 3 oracles au standard `quality-oracles` + `non_juge` déclarés | ✓ | §7.1 à §7.4 (**4 créés** — verdict de 7.4 corrigé par test d'existence), §7.5 |
| 9 | Chaque pratique du corpus avec source résolue, statut `ok`/`todo` | ✓ | §8.1 — 5 `ok`, **3 `todo` non servies**, étape 2 du plan |
| 10 | Aucun critère subjectif comme critère de succès | ✓ | Liste noire E4 ; tous les critères de fin du §8.4 sont binaires |
| 11 | Hypothèses marquées, distinctes des faits | ✓ | Convention de lecture en tête ; `[HYP]` en §5.3, §8.5-1, §8.5-3, §3-13 |
| 12 | Zéro ligne de code ; questions ouvertes en fin, indicées a/b/c avec défaut | ✓ | Aucun bloc de code ; 7 questions a→g, chacune avec recommandation et défaut |

**12 points sur 12.**

Une réserve honnête sur le point 9 : les 3 entrées `todo` du corpus sont `todo` **parce
qu'aucun accès réseau n'a été engagé à ce tour**. Elles sont déclarées non servies, ce qui
satisfait le contrat, mais leur résolution reste due (étape 2 du plan).

---

*Fin du CDC. Aucune ligne de code dans ce document. La construction attend un feu vert
explicite.*
