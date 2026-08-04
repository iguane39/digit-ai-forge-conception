# Prompt de cadrage — Forge Conception

> Prompt autoportant destiné à un agent d'exécution outillé (Claude Code).
> Dépôt cible : `c:\dev\digit-ai-forge-conception`.
> Tout copier-coller à partir de la ligne suivante.

---

## CONTEXTE

Je construis la **forge Conception** — quatrième et dernière pièce d'une famille interne :
`digit-ai-forge-design` (design), `digit-ai-saas-forge` (implémentation),
`digit-ai-forge-tests` (qualité). Elle comble le seul trou restant : **l'amont**, entre une
intention produit et une spécification opposable.

Objectif de fond : transformer un entrant flou en un **référentiel d'exigences vérifiable**,
dont les forges aval peuvent dériver leur travail sans re-traduction humaine.

Dépôt cible : `c:\dev\digit-ai-forge-conception` (aujourd'hui vide).

---

## LIVRABLE ATTENDU DE CE TOUR — et rien d'autre

Un **CDC de cadrage en markdown**, écrit dans le dépôt cible, nommé selon la convention
maison :

`Digit-AI - CDC Forge - Conception & PRD - {AAAAMMJJ}{a,b,c…}.md` — date réelle du jour,
jamais codée en dur.

Il contient les **8 sections** ci-dessous, dans cet ordre.

**Aucune ligne de code. Aucun `SKILL.md`. Aucun oracle implémenté. Aucun `pyproject.toml`,
`package.json` ni arborescence de projet créée.** Si tu es tenté de produire du code,
arrête-toi et signale-le. Le précédent est explicite : Forge Design et Forge Tests ont
toutes deux eu un tour de cadrage sans une ligne de code avant construction.

---

## SECTION 0 — Inventaire exécuté des forges de référence *(obligatoire, en premier, bloquante)*

Ne rédige **rien** avant d'avoir réellement lu les dépôts. Lecture **ciblée**, pas
récursive — évite `.venv`, `node_modules`, `dist`, `test-results`.

À lire nommément, si présents :

- `c:\dev\digit-ai-forge-design` → `README.md`, `conception-forge-design.md`, et dans le
  skill `ameliore-le-design` : `references/ingestion.md` et `references/criteres-sortie.md`
- `c:\dev\digit-ai-forge-tests` → `README.md` et les 5 documents de `docs/`
- `digit-ai-saas-forge` → **localisation inconnue**. Cherche-la. Si tu ne la trouves pas,
  écris `référence non résolue — digit-ai-saas-forge` et traite tout ce qui en dépend comme
  **question ouverte**. N'extrapole pas son fonctionnement depuis les mentions qu'en font
  les docs de Forge Tests.

Restitue les **commandes exécutées et leurs sorties**. Pour chaque forge lue, extrais en
5 lignes maximum : sa frontière déclarée, ses artefacts de sortie nommés, et ses **entrées
réellement acceptées**.

Si aucun accès n'est possible : écris `inventaire impossible — accès manquant` et
**arrête-toi**. Aucun contrat d'interface ne se dérive d'un dépôt non lu.

---

## SECTION 1 — Ce que la forge est, et ce qu'elle n'est pas

Sur le gabarit du §1 de `conception-forge-design.md`.

**Frontières dures, à écrire comme critères de recette et non comme intentions** — toute
brique qui les franchit est refusée en revue :

- La forge s'arrête au **référentiel d'exigences**. Pas de maquette, pas de code, pas de
  test, pas de déploiement.
- Elle n'est **pas un conducteur**. Elle ne pilote pas les forges aval, ne les invoque pas,
  ne les séquence pas. Elle produit des artefacts ; qui les consomme et quand ne la regarde
  pas.
- **La MEP est hors périmètre** — aucune des quatre forges ne la couvre. Dis-le
  explicitement plutôt que de la laisser orpheline.
- Pas de planning, pas de chiffrage, pas de TJM, pas de découpage commercial en lots
  *(cf. frontière avec `digit-ai-propale`, Section 3)*.

---

## SECTION 2 — Trancher : forge ou pipeline *(décision structurante)*

Le brief d'origine décrivait une chaîne séquentielle *Conception → Design → Implémentation
→ Tests → MEP*. **Cette description contredit les deux forges existantes**, qui posent
l'indépendance comme propriété fondatrice :

> `conception-forge-design.md` §4 : *« Les quatre verbes sont indépendants… Rien n'impose de
> séquence — c'est ce qui distingue une forge d'un pipeline projet. »*
> `README` Forge Tests : *« produit autonome, pas un module du conducteur — c'est ce qui lui
> permet de s'appliquer à n'importe quel projet, construit ou non avec la forge. »*

**Tranche explicitement**, et justifie contre ce que tu as lu en Section 0 :

- **forge** (verbes indépendants, artefacts consommables par qui veut) — hypothèse par
  défaut, cohérente avec l'existant ;
- **pipeline** (séquence imposée, gates) — si retenue, dis ce que la Conception perd en
  réutilisabilité, et pourquoi ça vaut le coup.

Écris la conséquence sur l'architecture. Une chaîne de causalité **produit** (un PRD précède
une maquette qui précède du code) n'implique pas un couplage **outil** : distingue les deux
dans ta réponse.

---

## SECTION 3 — Frontière avec l'existant : RÉUTILISÉ / ÉTENDU / CRÉÉ

Pour chaque capacité visée — cadrage d'entrant, discovery et hypothèses, énumération de la
surface fonctionnelle, priorisation, rédaction d'exigences, critères d'acceptation,
arbitrage de périmètre MVP/V1, jugement du livrable, itération bornée — statue **RÉUTILISÉ**
(quel composant), **ÉTENDU** (lequel, comment) ou **CRÉÉ** (pourquoi rien n'existe).

Skills à examiner **nommément**, s'ils sont présents dans l'environnement :

`clarifie-une-idee` · `pilote-de-mission` · `digit-ai-prospection` (cas d'usage, scoring ICE,
fiches 9 champs) · `digit-ai-propale` (découpage en lots) · `contre-expertise` ·
`experts-forge` et `write-an-expert` · `quality-oracles` et `write-an-oracle` ·
`write-a-skill` · `la-boucle` · `forge-agents` · `karpathy-coding-discipline`.

**Règle dure** : toute capacité classée CRÉÉ sans justification de non-recouvrement est un
défaut de conception, pas une fonctionnalité.

Recouvrement déjà pressenti, à confirmer ou infirmer par lecture : `clarifie-une-idee`
couvre déjà « idée floue → actionnable » ; dis si la Conception le RÉUTILISE en amont
d'elle-même, l'ÉTEND, ou pourquoi elle s'en distingue.

---

## SECTION 4 — Entrants et protocoles d'ingestion

Cinq entrants, de natures incompatibles. Produis la table sur le modèle de
`references/ingestion.md` du pivot Design :

| Entrant | Protocole | Extractible | Hors de portée | Seuil de suffisance |
|---|---|---|---|---|
| Idée (quelques phrases) | | | | |
| Cahier des charges simple | | | | |
| Produit existant à reprendre (accès au code) | | | | |
| Produit existant à faire évoluer | | | | |
| Produit tiers à répliquer (observé de l'extérieur) | | | | |

Le **seuil de suffisance** est obligatoire : en dessous, la forge **pose ses questions et ne
rédige pas**. Précise le format — liste indicée a/b/c, une par ligne, option recommandée,
défaut appliqué en l'absence de réponse.

**Garde-fou juridique sur le cinquième entrant.** Répliquer un produit tiers engage :
marques, éléments protégés, contenus, conditions d'utilisation. Écris la règle dure — reprise
possible de **fonctions et parcours**, jamais de marque, d'identité visuelle, de contenu ni
d'actif protégé ; toute observation d'un produit tiers est **déclarée comme telle** dans le
PRD, avec sa date. Fais du contrôle de conformité juridique un `non_juge` explicite : la
forge signale, elle ne valide pas.

---

## SECTION 5 — L'artefact : que contient un PRD ici, et combien y en a-t-il

**Définis le PRD**, ne suppose pas que le sigle est univoque. Justifie ta définition par ce
que les forges aval consomment réellement (Section 0), pas par une convention générique.

Tranche ces trois questions, avec conséquence écrite :

1. **Un artefact ou plusieurs ?** Ce que Forge Design consomme (parcours, écrans, états, ton)
   et ce que SaaS Forge consomme (modèle de données, contrats d'API, règles métier, non
   fonctionnels) ne sont pas le même contenu. Retiens : artefact unique / PRD + vues dérivées
   / artefacts distincts à source unique.
2. **Règle de découpe** quand le produit est gros : par domaine fonctionnel, par lot
   livrable, par version (MVP/V1/V2) ? Et la borne : au-delà de combien d'exigences on
   découpe.
3. **Propriétés obligatoires de toute exigence** :
   - traçabilité `besoin → exigence → critère d'acceptation`, à identifiant stable ;
   - **critère d'acceptation binaire ou chiffré** — jamais « performant », « ergonomique »,
     « robuste » ;
   - marquage explicite **fait constaté / hypothèse à valider**, avec sa source ou son mode
     de validation.

Rappelle la conséquence aval : Forge Tests exige *« un lien de traçabilité vers le risque ou
l'exigence couverte ; un test sans lien est supprimable »*. Le référentiel d'exigences de la
Conception **est** la source de cette traçabilité. Une exigence sans critère testable est un
déchet en aval.

---

## SECTION 6 — Contrat d'interface avec les forges aval

**Écrit contre les entrées réellement constatées en Section 0, jamais inventé.**

| Consommateur | Ce qu'il accepte aujourd'hui (constaté §0) | Ce que la Conception lui fournit | Écart à combler |
|---|---|---|---|
| `digit-ai-forge-design` | | | |
| `digit-ai-saas-forge` | | | |
| `digit-ai-forge-tests` | | | |

Point de vigilance identifié à l'avance : le README de Forge Design liste les entrées de
`ameliore-le-design` comme *« idée, design, spécification, produit existant »* et déclare la
**fiche de cadrage obligatoire** quand il n'y a pas d'existant. Un PRD n'est donc pas son
entrant natif. Statue : la Conception produit-elle **aussi** cette fiche de cadrage, ou
faut-il ÉTENDRE `references/ingestion.md` du pivot ? Dis lequel, et ce que ça coûte.

Si `digit-ai-saas-forge` n'a pas été résolue en Section 0, sa ligne porte `non résolu` et
bascule en question ouverte — pas d'interface dérivée d'un dépôt non lu.

---

## SECTION 7 — Les oracles : comment juger un PRD par exécution

**C'est le point dur du projet.** L'idiome maison est *skill + oracle exécuté + fixtures
verte/rouge + registre*, et la doctrine `quality-oracles` interdit tout ✓ sans exécution
comme tout jugement de son propre travail. Un PRD est du texte : la question n'est pas d'y
échapper, elle est de trouver ce qui reste **déterministe** dedans.

Spécifie les oracles neufs au standard §3 de `quality-oracles` — déterministe, checklist
versionnée, artefact réel, PASS/FAIL **localisant**, `non_juge` déclaré, sortie JSON,
exit 0/1/2, fixture verte + fixture rouge, entrée au registre.

Pistes à instruire, à retenir ou écarter avec raison :

- **complétude structurelle** — sections obligatoires présentes et non vides ;
- **testabilité** — chaque exigence porte un critère binaire ou chiffré ; détection lexicale
  des critères subjectifs interdits (« optimal », « exhaustif », « robuste », « de qualité »,
  « complet », « performant », « intuitif », « moderne ») ;
- **traçabilité** — bijection `besoin ↔ exigence ↔ critère` ; aucun orphelin des deux côtés ;
- **marquage des hypothèses** — toute affirmation non sourcée porte son tag ;
- **sources résolues** — toute pratique invoquée depuis le corpus a un statut `ok` (test
  d'existence, méthode `experts-forge`) ; une entrée `todo` n'est pas servie ;
- **couverture de la surface fonctionnelle** — écho du défaut fondateur de Forge Tests : un
  inventaire mécanique de la surface décrite dans l'entrant, et tout élément inventorié sans
  exigence associée devient un **FAIL nommé**, jamais une absence silencieuse.

**Déclare les `non_juge` sans les maquiller** : la pertinence produit d'une exigence, la
justesse d'un arbitrage de périmètre, l'adéquation au marché, la conformité juridique. Ce
sont des arbitrages humains — aucun oracle ne les rendra.

---

## SECTION 8 — Corpus, architecture, garde-fous, plan phasé

**8.1 Corpus.** Nomme les traditions retenues, chacune avec sa **source résolue** (test
d'existence : référence réellement identifiable, statut `ok`/`todo`). Le mot « meilleures
pratiques » est interdit comme critère : une pratique est nommée et sourcée, ou elle n'entre
pas. Champ à couvrir au minimum : formulation du problème avant la solution, découverte et
hypothèses, énumération de la surface fonctionnelle, priorisation, rédaction d'exigences
testables, arbitrage de périmètre. Corpus **d'amorçage**, pas catalogue exhaustif — il
grandit par ajout sourcé.

**8.2 Architecture.** Sur le modèle `un corpus, N verbes, des oracles`. Nomme chaque verbe
avec entrée / sortie / frontière / oracle(s) / `non_juge`, en une fiche par verbe (gabarit §5
de `conception-forge-design.md`). **Justifie le nombre de verbes** : quatre pour Design n'est
pas une loi. Un verbe qui ne produit pas d'artefact nommé n'est pas un verbe.

**8.3 Garde-fous non négociables.**

- Lecture seule sur tout code ou dépôt analysé ; toute écriture sur branche dédiée, sous feu
  vert humain.
- Aucune donnée inventée non signalée — chiffres de marché, volumétries, coûts, personas :
  source citée, ou marqué « à vérifier ».
- Aucun chiffrage, aucun TJM, aucun montant : placeholder assumé.
- Distinction stricte fait constaté / hypothèse, dans tout le livrable.
- Boucle de correction **bornée à 3 itérations**, puis livraison avec les écarts résiduels
  nommés.
- Générateur et juge séparés : la forge ne valide pas ses propres PRD par auto-déclaration.

**8.4 Plan phasé.** Table ordonnée par dépendance : étape, dépend de, **critère de fin
binaire**, oracle de vérification, checkpoint humain requis ou non. Marque ce qui est
parallélisable. Aucune généralisation avant preuve d'exécution sur une fixture.

**8.5 Risques et points ouverts.** Sur le modèle §11 de `conception-forge-design.md`.

---

## GARDE-FOUS D'EXÉCUTION DE CE TOUR

- **Zéro ligne de code, zéro fichier créé hors le CDC lui-même.**
- **Ne devine pas.** Toute entrée manquante et bloquante devient une question en liste
  indicée a/b/c, avec option recommandée et défaut appliqué en l'absence de réponse —
  regroupées **en fin de document**.
- **Ne déclenche pas** `la-boucle`, `pilote-de-mission` ni `clarifie-une-idee` sur ce prompt :
  ce sont des objets d'analyse en Section 3, pas des modes d'exécution. **Compose** en
  revanche avec `quality-oracles` (vérification du contrat de sortie) et `write-a-skill` /
  `write-an-oracle` (standards à citer, pas à exécuter).
- **Ne modifie aucun des trois dépôts de référence.** Lecture seule stricte.
- Après remise du CDC : **arrête-toi et attends mon feu vert** avant toute construction.

---

## CONTRAT DE SORTIE — le CDC est refusé s'il manque un seul point

1. Les **8 sections** (0 à 8) sont présentes et non vides.
2. La Section 0 contient des **commandes réellement exécutées et leurs sorties**, ou la
   mention explicite d'inventaire impossible ; le statut de `digit-ai-saas-forge` y est
   tranché (résolue / non résolue).
3. La Section 2 tranche **forge ou pipeline**, avec justification citant l'existant lu.
4. Chaque capacité de la Section 3 porte un verdict **RÉUTILISÉ / ÉTENDU / CRÉÉ** nommant le
   composant examiné ; aucun CRÉÉ sans justification de non-recouvrement.
5. La table de la Section 4 couvre les **5 entrants**, chacun avec protocole, extractible,
   hors de portée et **seuil de suffisance** ; le garde-fou juridique du 5ᵉ entrant est écrit.
6. La Section 5 tranche les **3 questions** (un artefact ou plusieurs · règle de découpe ·
   propriétés d'exigence) et impose la traçabilité `besoin → exigence → critère`.
7. La Section 6 contient les **3 lignes de consommateurs** renseignées depuis la Section 0,
   pas depuis une supposition ; l'écart avec les entrées réelles de Forge Design est nommé.
8. La Section 7 spécifie **au moins 3 oracles** au standard `quality-oracles` (déterministe,
   PASS/FAIL localisant, fixture verte + rouge, JSON, exit 0/1/2) et déclare ses `non_juge`.
9. Chaque pratique invoquée en 8.1 porte une **source résolue** avec statut `ok` ou `todo` ;
   aucune entrée `todo` n'est présentée comme acquise.
10. **Aucun critère subjectif** (« optimal », « exhaustif », « robuste », « de qualité »,
    « complet », « meilleures pratiques ») n'apparaît comme critère de succès. Chaque critère
    est binaire ou chiffré.
11. Les **hypothèses sont marquées comme telles**, distinctes des faits constatés, dans tout
    le document.
12. **Zéro ligne de code produite.** Les questions ouvertes sont regroupées en fin de
    document, en liste indicée a/b/c, une par ligne, avec option recommandée et défaut.

---

## PROTOCOLE DE TESTS DU LIVRABLE

Le CDC est un document : son oracle est **le contrat de sortie ci-dessus**, vérifié point par
point avant remise — présence des 8 sections, comptage des verdicts de frontière, recherche
lexicale des mots subjectifs interdits, absence de bloc de code, présence des `non_juge`,
présence des fixtures par oracle.

**Jeu d'essai à passer mentalement avant remise** : (1) cas nominal — les trois forges lues ;
(2) cas limite — `digit-ai-saas-forge` introuvable, qui doit produire une **question ouverte
déclarée** et non une interface inventée ; (3) cas limite — entrant réduit à une phrase, qui
doit produire un **arrêt avec questions** et non un PRD extrapolé.

**Boucle : générer → vérifier contre le contrat → corriger. 3 itérations maximum.** Au-delà,
livre avec les écarts résiduels listés. Si `quality-oracles` est disponible, délègue-lui la
vérification plutôt que de la réimplémenter.
