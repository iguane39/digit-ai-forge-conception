# Forge Conception

> Transformer un entrant flou en un **référentiel d'exigences vérifiable**, dont les forges
> aval dérivent leur travail sans re-traduction humaine.

Un corpus, quatre verbes, quatre oracles exécutés. Elle s'arrête au référentiel : ni maquette,
ni code, ni test, ni déploiement.

Cadrage complet : [CDC](<Digit-AI - CDC Forge - Conception & PRD - 20260804a.md>) ·
prompt d'origine : [prompt de cadrage](<Digit-AI - Prompt Forge - Conception & PRD Cadrage - 20260804a.md>)

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
oracles/           les 4 juges exécutés, leurs fixtures, le self-test
skills/            les quatre verbes
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
node oracles/self-test.mjs        # 4 oracles, 14 règles, fixtures verte et rouge
```

| Oracle | Règles | Domaine |
|---|---|---|
| `oracle-exigences` | E1–E6 | testabilité de l'énoncé : critère chiffré ou binaire, liste noire, atomicité |
| `oracle-tracabilite` | T1–T4 | orphelins des deux côtés, statut épistémique, vues régénérables |
| `oracle-surface` | S1–S3 | chaque élément non couvert est **nommé**, jamais fondu dans un ratio |
| `oracle-claims` | A1–A2 | aucune donnée chiffrée non marquée |

Node seul, aucune dépendance npm. JSON sur stdout, exit 0/1/2, `non_juge` déclaré.
Entrées prêtes pour le registre global : [oracles/registre-entrees.md](oracles/registre-entrees.md)
— **non injectées**, la décision appartient à l'utilisateur.

Le self-test vérifie les **deux sens** : la fixture verte passe, la rouge échoue *et déclenche
chacune de ses règles*. Un oracle dont une règle ne se déclenche jamais ne juge rien.

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

**Rejouer les 4 oracles + le self-test**, depuis la racine du dépôt :

```bash
node oracles/self-test.mjs                                   # fixtures verte/rouge, 14 règles
node oracles/oracle-exigences.mjs   <chemin/EXIGENCES.json>
node oracles/oracle-tracabilite.mjs <chemin/EXIGENCES.json> --vue <chemin/CADRAGE-DESIGN.md>
node oracles/oracle-surface.mjs     <chemin/EXIGENCES.json>
node oracles/oracle-claims.mjs      <chemin/EXIGENCES.json>
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
| Oracles | 4, 14 règles, self-test **vert** — rouge : 6/6, 4/4, 3/3, 1/1 règles déclenchées |
| Verbes | 4 — runners `write-a-skill` : structure 6/6, description 5/5, checklist 6/6, sur chacun |
| Bout en bout | 3 vues produites, `oracle-tracabilite` T3 vert sur les deux vues markdown |
| Contrôle d'interface S-11 | **100 % (7/7)** — mais en mode **dégradé** : référentiel de tests écrit à la main, Forge Tests n'a pas tourné |
| Confrontation réelle | **non faite** — dépend de Forge Tests, en construction non commencée |

Les trois entrées `todo` du corpus et la confrontation réelle sont les deux écarts résiduels
assumés. Ils sont nommés ici plutôt que passés sous silence.

---

*Digit-AI · 2026*
