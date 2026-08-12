# Forge Conception

> Transformer un entrant flou en un **référentiel d'exigences vérifiable**, dont les forges
> aval dérivent leur travail sans re-traduction humaine.

Un corpus, quatre verbes, quatre oracles exécutés. Elle s'arrête au référentiel : ni maquette,
ni code, ni test, ni déploiement.

Cadrage complet : [CDC](<Digit-AI - CDC Forge - Conception & PRD - 20260804a.md>) ·
prompt d'origine : [prompt de cadrage](<Digit-AI - Prompt Forge - Conception & PRD Cadrage - 20260804a.md>)

## Catalogue de services

> Section proposée par la campagne « catalogues » du pilot (2026-08-12) — générée depuis
> la source unique `catalogues/catalogue.jsonl` du pilot (v1.4.0, challengée état de
> l'art le 12/08/2026). **prouvé** = preuve exécutée ; *déclaré* = méthode documentée seulement.

| Service | Intention (« je veux… ») | Point d'entrée | Statut |
|---|---|---|---|
| **Qualifier l'entrant** | qualifier mon idée, CDC ou produit existant en entrant exploitable | `skills\qualifie-l-entrant (méthode, mode degrade)` | prouvé (experimental) |
| **Énumérer la surface** | énumérer toute la surface fonctionnelle de mon produit | `skills\enumere-la-surface (méthode, mode degrade)` | prouvé (experimental) |
| **Rédiger les exigences** | obtenir un référentiel d'exigences scellé et traçable | `skills\redige-les-exigences (méthode, mode degrade)` | prouvé (experimental) |
| **Dériver les vues aval** | produire le cadrage consommable par le design et la mission | `skills\derive-les-vues (méthode, mode degrade — D-C2 soldée le 04/08)` | prouvé (experimental) |
| **Valider les exigences (oracles)** | vérifier mécaniquement mon référentiel d'exigences | `node oracles\oracle-{exigences,tracabilite,surface,claims,etat,ears,constitution,delta}.mjs <artefact>` | prouvé (production) |
| **Constitution projet** | séparer mes invariants non négociables du référentiel qui évolue | `node oracles\oracle-constitution.mjs <CONSTITUTION.md>` | prouvé (experimental) |
| **Cycle delta (évolution d'un référentiel scellé)** | faire évoluer EXIGENCES.json par deltas proposés, appliqués, archivés | `node oracles\oracle-delta.mjs <delta> --referentiel <exigences> · node scripts\delta.mjs appliquer|archiver` | prouvé (experimental) |

Le catalogue consolidé des dix forges vit chez le pilot :
[digit-ai-forge-pilot/catalogues/CATALOGUES.md](https://github.com/iguane39/digit-ai-forge-pilot/blob/main/catalogues/CATALOGUES.md).

## Le problème

Forge Tests exige que **chaque test porte l'identifiant de l'exigence qu'il couvre** — champ
obligatoire, seuil à 100 % (`Spec Forge - Noyau et contrat adaptateur`, §157).

Rien, dans la chaîne, ne fournit cet identifiant. La SaaS Forge produit déjà un PRD complet à
son étape C via BMAD, mais ses `Story.acceptance` sont une liste de chaînes **sans clé**
(`conductor/contracts.py:68`). Le seuil est donc inatteignable sur tout ce que la chaîne
construit.

Cette forge ne produit pas un PRD de plus. Elle produit **le référentiel d'exigences identifiées
que personne d'autre ne fabrique**.

## Structure

```
corpus/            pratiques sourcées, statuts ok/todo — une entrée todo n'est pas servie
oracles/           les 8 juges exécutés, leurs fixtures, le self-test
skills/            les quatre verbes
scripts/           delta.mjs — cycle propose/apply/archive, seul endroit qui mute un référentiel
```

## Les quatre verbes

| Skill | Entrée | Sortie |
|---|---|---|
| [qualifie-l-entrant](skills/qualifie-l-entrant/) | idée, CDC, produit à reprendre, à faire évoluer, produit tiers | `ENTRANT.md`, ou des questions et un arrêt |
| [enumere-la-surface](skills/enumere-la-surface/) | `ENTRANT.md` | `SURFACE.md` : objets, rôles, parcours, points d'entrée, règles |
| [redige-les-exigences](skills/redige-les-exigences/) | `ENTRANT.md` + `SURFACE.md` | `EXIGENCES.json` + `EXIGENCES.md` |
| [derive-les-vues](skills/derive-les-vues/) | `EXIGENCES.json` | `CADRAGE-DESIGN.md`, `MISSION.md`, l'export pour Forge Tests |

Ils sont **indépendants**. On peut énumérer une surface sans avoir qualifié d'entrant, dériver
une vue depuis un référentiel écrit à la main. Aucune séquence n'est imposée : c'est ce qui
distingue une forge d'un pipeline.

## Les oracles

```bash
node oracles/self-test.mjs        # 8 oracles, 30 règles, fixtures verte et rouge
```

| Oracle | Règles | Domaine |
|---|---|---|
| `oracle-exigences` | E1–E9 | testabilité de l'énoncé : critère chiffré ou binaire, liste noire, atomicité, forme EARS (E7), absolus/pronoms (E8), caractéristiques d'ensemble (E9) |
| `oracle-tracabilite` | T1–T4 | orphelins des deux côtés, statut épistémique, vues régénérables |
| `oracle-surface` | S1–S3 | chaque élément non couvert est **nommé**, jamais fondu dans un ratio |
| `oracle-claims` | A1–A2 | aucune donnée chiffrée non marquée |
| `oracle-etat` | EM1–EM3 | l'état « bloqué sous le seuil » est mécaniquement distinguable de « produit » (TF-0014, R-C3) |
| `oracle-ears` | EA1–EA3 | scoring EARS par patron strict (ubiquitous, event-driven, state-driven, optional, unwanted) et ambiguïté lexicale (TF-0101) |
| `oracle-constitution` | C1–C3 | existence (exit 2 sinon) et format de `CONSTITUTION.md`, les invariants non négociables séparés d'`EXIGENCES.json` (TF-0101) |
| `oracle-delta` | D1–D4 | format d'un delta d'évolution de référentiel et sa cohérence avec la cible (TF-0101) |

Node seul, aucune dépendance npm. JSON sur stdout, exit 0/1/2, `non_juge` déclaré.
Entrées prêtes pour le registre global : [oracles/registre-entrees.md](oracles/registre-entrees.md)
— **non injectées**, la décision appartient à l'utilisateur.

Le self-test vérifie les **deux sens** : la fixture verte passe, la rouge échoue *et déclenche
chacune de ses règles*. Un oracle dont une règle ne se déclenche jamais ne juge rien.

## La constitution du projet (TF-0101)

`EXIGENCES.json` change à chaque itération de palier. Certains invariants ne doivent, eux,
**jamais** changer avec le produit : conformité réglementaire non négociable, principes
d'architecture qui engagent toutes les forges avales, garde-fous transverses du type des « lois
qui traversent tout » ci-dessus. Sans support séparé, ces invariants finissent dilués dans les
énoncés d'exigence, où une reformulation de palier peut les faire disparaître sans que rien ne
le signale — l'équivalent du trou que comble `constitution.md` dans GitHub Spec Kit.

`CONSTITUTION.md`, à la racine du projet cadré, à côté d'`EXIGENCES.json` (jamais dedans) :

```markdown
---
projet: <nom>
version: 1.0.0
date_ratification: AAAA-MM-JJ
---

# Constitution — <projet>

## Principes non négociables

1. <invariant, une phrase, un fait vérifiable — pas un souhait>
```

`version` suit le semver **de la constitution elle-même**, pas celui du produit : elle ne bouge
que par ratification explicite, jamais par cycle de palier. Format complet, exemple travaillé :
[oracles/fixtures/constitution-verte/CONSTITUTION.md](oracles/fixtures/constitution-verte/CONSTITUTION.md).

```bash
node oracles/oracle-constitution.mjs <chemin/CONSTITUTION.md>
```

Contrôle **d'existence** (le fichier absent sort en 2 — ERREUR, comme tout artefact manquant
dans cette forge, jamais en FAIL) et **de format** (C1 frontmatter bien formé, C2 `version`
semver, C3 au moins un principe non vide et non placeholder). Ce que l'oracle ne juge pas : la
pertinence des principes, et leur respect effectif par le produit livré — un contrôle de forme,
pas un audit de conformité.

## Le cycle delta — faire évoluer un référentiel existant (TF-0101)

Les quatre verbes produisent un référentiel **de zéro**. Le run de version du pilot
(`RUN-VERSION.md`) doit au contraire faire évoluer un `EXIGENCES.json` **déjà scellé** — cas que
la forge n'outillait pas jusqu'ici : le socle se rattrapait à la main. Cycle repris d'OpenSpec
(propose / apply / archive), adapté au format JSON de cette forge :

| Étape | Qui | Effet |
|---|---|---|
| **propose** | humain ou skill | écrit un `DELTA.json` (`id`, `titre`, `motivation`, `statut: "propose"`, `operations[]`) |
| **apply** | `node scripts/delta.mjs appliquer <DELTA.json> <EXIGENCES.json>` | rejoue `oracle-delta` (jamais contourné), applique les opérations, `statut -> "applique"` |
| **archive** | `node scripts/delta.mjs archiver <DELTA.json> [--dossier deltas/archive]` | déplace le delta appliqué en archive, `statut -> "archive"` |

Une opération est `{ type: "ajoute"|"modifie"|"retire", cible: "besoins"|"exigences"|"surface", id?, valeur? }`.
Exemple travaillé : [oracles/fixtures/delta-verte/DELTA.json](oracles/fixtures/delta-verte/DELTA.json).

**Le garde-fou tient dans une phrase** : `scripts/delta.mjs` n'écrit jamais sur un référentiel
avant qu'`oracle-delta` ait rendu PASS sur ce delta précis, confronté à ce référentiel précis
(`--referentiel`) — un delta rouge ne mute jamais rien, l'échec est visible avant l'écriture, pas
après. Un `retire` sur `exigences` verse l'identifiant dans `identifiants_retires` : la règle
« un identifiant ne se réaffecte jamais » (E2) s'applique aussi aux deltas. Une double
application est refusée (`statut` déjà `"applique"`), de même qu'un archivage prématuré
(`statut` encore `"propose"`).

`oracle-delta` **juge le format**, il ne mute rien — c'est `scripts/delta.mjs`, un outil et non
un oracle, qui écrit. Recette fonctionnelle dédiée (pas dans `oracles/self-test.mjs`, qui ne
recette que des juges purs, sans effet de bord) :

```bash
node scripts/delta.self-test.mjs   # sur des copies en répertoire temporaire, jamais sur les fixtures
```

## Invocation par un orchestrateur

Un orchestrateur (conducteur, script de run, agent pilote) qui invoque cette forge doit
connaître trois choses : quels artefacts attendre de chaque verbe, comment rejouer les oracles,
et ce que signifie un arrêt sous le seuil de suffisance.

**Les 4 verbes et leurs artefacts** — chaque verbe est indépendant, aucune séquence n'est
imposée :

| Verbe | Entrée | Sortie |
|---|---|---|
| `qualifie-l-entrant` | idée, CDC, produit à reprendre, à faire évoluer, produit tiers | `ENTRANT.md`, ou des questions et un arrêt |
| `enumere-la-surface` | `ENTRANT.md` | `SURFACE.md` |
| `redige-les-exigences` | `ENTRANT.md` + `SURFACE.md` | `EXIGENCES.json` + `EXIGENCES.md` |
| `derive-les-vues` | `EXIGENCES.json` | `CADRAGE-DESIGN.md`, `MISSION.md`, l'export pour Forge Tests |

**Rejouer les 8 oracles + le self-test**, depuis la racine du dépôt :

```bash
node oracles/self-test.mjs                                   # fixtures verte/rouge, 30 règles
node oracles/oracle-exigences.mjs   <chemin/EXIGENCES.json>
node oracles/oracle-tracabilite.mjs <chemin/EXIGENCES.json> --vue <chemin/CADRAGE-DESIGN.md>
node oracles/oracle-surface.mjs     <chemin/EXIGENCES.json>
node oracles/oracle-claims.mjs      <chemin/EXIGENCES.json>
node oracles/oracle-etat.mjs        <chemin/ETAT.json>
node oracles/oracle-ears.mjs        <chemin/EXIGENCES.json>
node oracles/oracle-constitution.mjs <chemin/CONSTITUTION.md>
node oracles/oracle-delta.mjs       <chemin/DELTA.json> [--referentiel <chemin/EXIGENCES.json>]
```

Sortie JSON sur stdout, exit 0 (PASS), 1 (FAIL — au moins un constat en échec, chacun localisé)
ou 2 (ERREUR — l'oracle n'a pas pu juger : référentiel illisible ou argument manquant). Un
orchestrateur doit distinguer 1 de 2 : le premier est un verdict, le second une incapacité à
juger.

**« Sous le seuil de suffisance » n'est pas un échec.** Quand `qualifie-l-entrant` (ou tout
autre verbe) constate que l'entrant ne porte pas assez d'information pour produire un artefact
opposable, la forge rend la main : elle pose des questions indicées `a/b/c`, chacune avec une
option recommandée et un défaut applicable, puis s'arrête. Un orchestrateur qui reçoit cet état
ne doit ni le traiter comme une erreur de pipeline ni relancer aveuglément — c'est un point de
décision humaine légitime. S'il choisit d'appliquer les défauts pour ne pas bloquer un run
automatisé, chaque défaut appliqué est marqué `hypothèse` dans le référentiel produit, jamais
`fait constaté`.

**Le marqueur machine `ETAT.json`** (TF-0014, R-C3). Jusqu'ici, l'état « bloqué sous le seuil »
n'était visible qu'à la lecture humaine du disque — rien ne le distinguait mécaniquement d'un
run qui a simplement produit peu. Chaque verbe qui se termine écrit, à côté de son artefact ou
de ses questions, un `ETAT.json` :

```json
{
  "verbe": "qualifie-l-entrant",
  "statut": "bloque_question",
  "artefacts": [],
  "questions": [
    { "id": "a", "question": "…", "recommande": "…", "defaut": "…" }
  ]
}
```

`statut` ∈ `produit` | `bloque_question` — ensemble fermé, rien d'autre n'est une sortie valide.
Un `statut: produit` porte toujours au moins un artefact et jamais de question ouverte ; un
`statut: bloque_question` porte toujours au moins une question (4 champs : `id`, `question`,
`recommande`, `defaut`) et jamais d'artefact. Les deux signaux ne cohabitent jamais dans le
même fichier — c'est précisément ce qu'`oracle-etat` (règles EM1–EM3) vérifie :

```bash
node oracles/oracle-etat.mjs <chemin/ETAT.json>
```

Un orchestrateur lit `ETAT.json` avant de lire quoi que ce soit d'autre sur le disque : c'est
la seule information dont la lecture ne nécessite pas de deviner ce que le verbe a voulu dire.

## Les trois interfaces aval

Aucune des trois forges n'a été modifiée pour recevoir ces artefacts. La Conception s'aligne
sur des contrats **constatés**, elle n'en impose aucun.

| Consommateur | Contrat constaté | Vue produite |
|---|---|---|
| Forge Design | fiche de cadrage 6 champs, `ameliore-le-design/references/ingestion.md` l.33-46 | `CADRAGE-DESIGN.md` |
| SaaS Forge | les 10 arguments de `cadrer()`, étape A du conducteur | `MISSION.md` |
| Forge Tests | champ `risque` du référentiel de tests, seuil 100 % | `EXIGENCES.json` |

**La dépendance est unidirectionnelle.** La Conception connaît les trois contrats ; aucune des
trois forges ne la connaît. Si elle disparaît, les trois continuent de fonctionner à
l'identique — c'est le test de non-couplage, et il est la raison pour laquelle ce projet n'est
pas un conducteur.

## Règles qui traversent tout

**Un identifiant ne se réaffecte jamais.** Une exigence supprimée laisse son identifiant mort.
Forge Tests a écrit des tests contre lui.

**Un fait sans source est une hypothèse.** Chaque exigence porte `fait constaté` + source, ou
`hypothèse` + mode de validation. `oracle-tracabilite` T4 le vérifie.

**Une vue est régénérable, jamais éditée.** Chaque vue porte l'empreinte SHA-256 de sa source.
Une vue retouchée à la main est détectée par T3.

**Sous le seuil de suffisance, on rend la main.** Questions indicées `a/b/c`, avec option
recommandée et défaut appliqué — et tout défaut appliqué est marqué comme hypothèse.

**Un critère rouge n'est jamais requalifié** pour obtenir un vert. Boucle bornée à 3 passes,
puis livraison avec les écarts résiduels nommés.

## Ce que la forge ne fait pas

- Pas de PRD d'implémentation, d'epics, de stories, d'architecture — c'est l'étape C de la
  SaaS Forge, moteur BMAD.
- Pas de maquette, pas de code, pas de test exécuté, pas de déploiement.
- Pas de planning, de chiffrage, de TJM, de charge, de découpage commercial en lots.
- **Pas de conducteur** : elle n'invoque, ne séquence, ne pilote aucune forge aval.
- Pas de MEP — aucune des quatre forges ne la couvre, et le trou est déclaré plutôt que masqué.

## État au 04/08/2026

| | |
|---|---|
| Corpus | 11 pratiques — **8 `ok`, 3 `todo` non servies** (aucun accès réseau engagé) |
| Oracles | 5, 20 règles, self-test **vert** — rouge : 9/9, 4/4, 3/3, 1/1, 3/3 règles déclenchées (E7-E9 et `oracle-etat` ajoutés depuis, TF-0015/TF-0014) |
| Verbes | 4 — runners `write-a-skill` : structure 6/6, description 5/5, checklist 6/6, sur chacun |
| Bout en bout | 3 vues produites, `oracle-tracabilite` T3 vert sur les deux vues markdown |
| Contrôle d'interface S-11 | **100 % (7/7)** — mais en mode **dégradé** : référentiel de tests écrit à la main, Forge Tests n'a pas tourné |
| Confrontation réelle | **non faite** — dépend de Forge Tests, en construction non commencée |

Les trois entrées `todo` du corpus et la confrontation réelle sont les deux écarts résiduels
assumés. Ils sont nommés ici plutôt que passés sous silence.

---

*Digit-AI · 2026*
