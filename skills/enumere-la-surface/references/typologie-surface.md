# Typologie de la surface fonctionnelle

Cinq types, fermés. Un élément qui n'entre dans aucun n'est pas de la surface — c'est du
contexte, il vit dans `ENTRANT.md`.

## Ce qu'on cherche, par entrant

On ne cherche pas les mêmes signaux dans une idée et dans un dépôt existant. Ce tableau dit,
pour chaque nature d'entrant, où regarder et à quoi se reconnaît un élément de surface.

| Entrant | Où chercher | Signal d'un élément |
|---|---|---|
| Idée | Les 4 champs de seuil | Un nom commun répété dans la formulation du job |
| Cahier des charges | Substantifs récurrents, verbes d'action, phrases en « le système doit » | Un nom qui porte un article défini et revient ≥ 2 fois |
| Produit à reprendre | Modèles de données, routes, endpoints, jobs, migrations, fichiers de traduction | Une table, une route, un handler, une commande |
| Produit à faire évoluer | Idem + l'énoncé du delta | Idem, plus tout élément **cité par le delta** même absent du code |
| Produit tiers | Menus, titres de page, libellés de bouton, documentation publique | Une entrée de menu, un écran atteignable sans authentification |

## Les cinq types

### `objet` — ce que le produit manipule
Un objet a un cycle de vie : il est créé, modifié, consulté, supprimé. Si la chose n'a pas
d'état, ce n'est pas un objet — c'est un attribut.

### `role` — qui agit
Un rôle se distingue par ce qu'il **peut faire de différent**. Deux libellés qui font
exactement les mêmes actions sont un seul rôle, et l'écart de vocabulaire est noté.

### `parcours` — une suite d'actions menant à un résultat
Nommé par son résultat, pas par ses étapes : « Déclaration d'une absence », pas « Cliquer sur
Nouveau puis remplir le formulaire ».

### `point-entree` — par où l'on entre
Écran, endpoint, tâche planifiée, import de fichier, webhook. C'est le type le plus oublié sur
un entrant textuel, et celui qui produit le plus de trous en aval.

### `regle` — une contrainte métier citée
Une règle **citée dans l'entrant**. Une règle déduite est une hypothèse : elle devient une
exigence marquée `hypothèse`, pas un élément de surface.

## Surface implicite SaaS — candidats proposés d'office

RC-3 (retour production) : le premier produit livré n'avait ni aide utilisateur ni onboarding —
absents du CDC, jamais proposés par personne, l'utilisateur les considère comme « la base de
toute appli SaaS ». Loi transverse qui en découle : **l'oubli n'existe pas** — cette liste close
est proposée d'office en fin d'énumération dès que l'entrant vise une application web/SaaS à
utilisateur final. Chaque candidat est **retenu** (un `id` comme n'importe quel élément de
surface, puis une exigence qui le couvre) ou **écarté explicitement**, raison consignée en
section 3 de `SURFACE.md` (« Écartés ») **et transcrite dans le champ `ecarts_surface_implicite`
du référentiel** (TF-0811, section « Les clés de la liste close » ci-dessous). Un candidat
mentionné dans aucune des deux est un oubli, jamais un arbitrage — et depuis TF-0811,
`oracle-surface` S4 le refuse au lieu de s'en plaindre.

Ceci ne rouvre pas la règle « on énumère ce qui est dit, pas ce qui est probable » ci-dessus :
c'est une liste **fermée et versionnée**, pas une invitation générale à ajouter ce qui « existe
toujours dans ce genre de produit ». L'élargir est une décision, pas une commodité — comme pour
la liste fermée des prédicats binaires de `redige-les-exigences`.

Hors périmètre déclaré d'un coup : un entrant sans IHM utilisateur final (batch, job planifié,
API interne, produit tiers analysé de l'extérieur) écarte le bloc entier avec une raison unique
— « pas d'utilisateur final » ou équivalent — sans examiner chaque ligne séparément.

Côté machine, ce cas se reconnaît le plus souvent tout seul : sans aucun `point-entree` au
libellé web, `oracle-surface` S4 rend un PASS motivé et ne réclame aucun écart. Si le produit a
malgré tout une surface que le lexique lit comme web — une API interne exposée par des routes,
par exemple —, la raison unique se recopie sur chacune des onze clés. Onze lignes est le prix de
l'opposabilité : c'est délibérément moins cher que de rendre l'omission indiscernable.

| Candidat | Type suggéré | Origine |
|---|---|---|
| Aide utilisateur | `point-entree` (écran, lien ou contenu d'aide) | RC-3, retour littéral |
| Onboarding / premier lancement | `parcours` | RC-3, retour littéral |
| Compte utilisateur | `objet` + `parcours` (création, édition) | RC-3, retour littéral |
| Favicon | `objet` (asset minimal d'identification) | RC-3, retour littéral |
| États vides guidés | `parcours` (état d'une vue avant tout contenu) | RC-3, retour littéral |
| Gestion des erreurs visible | `regle` (un échec produit un message observable, jamais un écran silencieux) | Généralisation — invariant d'attente d'un utilisateur final |
| Mentions légales / pied de page | `point-entree` | Généralisation |
| Responsive mobile | `regle` (contrainte d'affichage transversale) | Généralisation |
| Accessibilité RGAA — site public français | `regle` (RGAA 4.1/WCAG AA : obligation légale, pas un objectif) + `point-entree` (déclaration d'accessibilité publiée avec son taux) | RF-6, lot Produit-09 20260820a — retour littéral |
| Livrables légaux d'accessibilité (si site public FR) | `objet` ×4 : schéma pluriannuel, plan d'action annuel, mécanisme de signalement, voie de recours | RF-6 — aucune forge ne les produisait, aucun CDC ne les demandait |
| **Page 404 par langue** — proposée **si et seulement si** le produit a une surface web | `point-entree` (une page servie, atteignable par une adresse inconnue) | P-2 (`PATRONS-EPROUVES.md` du pilot), TF-0804 — retour d'un produit, 404 nu du serveur servi en production du 25/08 au 01/09/2026 |

**Critères d'acceptation précisés** (2ᵉ inspection utilisateur du premier produit, lot 03) —
« exister » ne suffit pas, la perception de l'utilisateur fait foi ; ces critères s'écrivent
dans l'exigence dès que le candidat est retenu :
- **Onboarding** (RC-4) : une expérience **dominante** de première connexion — panneau de
  bienvenue en tête de page, progression visible (x/N étapes), badge persistant tant que non
  complété, actions directes depuis le panneau, disparition à complétion. Une carte repliable
  discrète « existe » mais n'est pas perçue comme un onboarding : exigence non tenue.
- **Aide utilisateur** (RD-7 — 7ᵉ constat de ce retour) : **trois niveaux** — aide de page (rôle de l'écran, circuit,
  pièges), encarts par section non évidente, aide par champ. Une page d'aide unique ne tient
  pas l'exigence.
- **Page 404 par langue** (P-2, TF-0804) : **cinq critères**, à recopier dans l'exigence dès
  que le candidat est retenu — (1) une 404 **par langue**, du **même gabarit** que les autres
  pages : menu complet, charte, consentement, liens de secours (accueil, plan du site, contact),
  car une 404 « spéciale » vieillit seule ; (2) le **statut 404 conservé** — une page d'erreur
  rendue en 200 est un soft-404 indexable ; (3) **`noindex` et exclusion du sitemap**,
  l'exclusion **déclarée** dans l'oracle SEO du produit, sans quoi elle passe pour un oubli ;
  (4) la **langue choisie au préfixe du chemin** (`/fr/inconnu` rend la 404 en français ; sans
  préfixe, la langue par défaut) ; (5) un **contrôle exécutable qui joue les cas** : adresse
  inconnue rendant une 404 avec menu, préfixe respecté, ressource non-HTML inconnue (image,
  script) rendant une 404 nue et jamais une page. La conception écrit ce cinquième critère,
  elle ne l'exécute pas : le contrôle se construit chez forge-tests et se joue à la MEP (M-9).

Ce candidat est le seul de la liste à porter une **condition d'applicabilité** qui lui soit
propre plutôt qu'une simple suggestion de type : il n'est proposé que **si le produit a une
surface web**. P-2 écarte lui-même trois cas — une application sans surface web (rien à servir),
un routeur qui possède déjà sa page d'erreur par langue (c'est lui qu'on juge alors, pas le
produit), et les réponses d'API, qui répondent 404 en JSON et jamais en page. Ces trois cas ne
sont pas des exceptions à la loi n° 3 : ce sont des **écarts**, et un écart s'écrit.

## Les clés de la liste close, et où s'écrit un écart (TF-0811)

Jusqu'au 05/09/2026, l'écart d'un candidat d'office ne vivait qu'en prose, en section 3 de
`SURFACE.md`, qu'aucun oracle ne lisait : `oracle-surface` **S4** ne pouvait qu'avertir, jamais
refuser — un référentiel qui écarte légitimement la 404 aurait été accusé au même titre qu'un
référentiel qui l'oublie. **L'oubli restait indiscernable de la décision**, ce que la loi
transverse n° 3 interdit précisément.

Le référentiel porte désormais un champ racine dédié, transcrit de la section 3 et de nulle part
ailleurs (`redige-les-exigences/references/schema-referentiel.md`) :

```json
"ecarts_surface_implicite": [
  {
    "element": "accessibilite-rgaa",
    "motif": "produit interne à l'entreprise : hors du champ du site public français",
    "decide_par": "le commanditaire du produit",
    "date": "2026-09-05"
  }
]
```

`element` prend l'une des onze **clés** de la liste close, dans cet ordre — c'est la même table
que celle ci-dessus, vue par la machine :

| Clé | Candidat |
|---|---|
| `aide-utilisateur` | Aide utilisateur |
| `onboarding` | Onboarding / premier lancement |
| `compte-utilisateur` | Compte utilisateur |
| `favicon` | Favicon |
| `etats-vides` | États vides guidés |
| `erreurs-visibles` | Gestion des erreurs visible |
| `mentions-legales` | Mentions légales / pied de page |
| `responsive-mobile` | Responsive mobile |
| `accessibilite-rgaa` | Accessibilité RGAA — site public français |
| `livrables-accessibilite` | Livrables légaux d'accessibilité |
| `page-404` | Page 404 par langue |

Ce que S4 juge alors, candidat par candidat, chacun **nommé** :

| État | Verdict |
|---|---|
| Surface web + candidat présent à la surface énumérée | PASS |
| Surface web + candidat absent + écart déclaré qui tient | PASS, message préfixé « [ÉCARTÉ] » |
| Surface web + candidat absent + aucun écart, ou écart qui ne tient pas | **FAIL**, le candidat nommé |
| Aucun point d'entrée web énuméré | PASS motivé — le bloc n'est pas dû |

Un écart **tient** à quatre conditions cumulatives : `element` dans la liste close, `motif` d'au
moins **20 caractères**, `decide_par` non vide, `date` au format `AAAA-MM-JJ`. Les trois
dernières ne sont pas de la bureaucratie : un écart est opposable parce qu'il est écrit, daté et
signé. S4 ne juge en revanche ni la véracité ni la suffisance du motif — c'est une décision
humaine, déclarée en `non_juge`.

Le champ est **facultatif à la lecture** : absent, il vaut « aucun écart déclaré ». Un
référentiel écrit avant TF-0811 n'est donc jamais accusé d'un défaut de format — il est jugé sur
la seule présence de ses candidats, exactement comme il l'aurait été.

## Identifiants

`S-01`, `S-02`… Numérotation continue, jamais réaffectée.

| Situation | Traitement |
|---|---|
| Élément retiré | Son identifiant reste mort. Le consigner dans `identifiants_retires` |
| Élément scindé en deux | L'ancien meurt, deux neufs naissent. Jamais de réutilisation |
| Élément renommé | Même identifiant, libellé changé. Un renommage n'est pas une suppression |

## Gabarit de `SURFACE.md`

Quatre sections, dont aucune n'est décorative : les deux dernières sont ce qui distingue un
inventaire honnête d'une liste de ce qu'on avait sous les yeux.

| Section | Contenu |
|---|---|
| 1. Origine | Quel `ENTRANT.md`, quelle section, quelle date |
| 2. Tableau | `id` · `type` · `libelle` · d'où il vient dans l'entrant |
| 3. Écartés | Ce qui a été vu et **volontairement** exclu, avec la raison. Sans cette section, un oubli et un arbitrage se ressemblent. Un candidat de la surface implicite écarté ici porte les quatre colonnes `clé` · `motif` · `décidé par` · `date`, transcrites telles quelles dans `ecarts_surface_implicite` |
| 4. Non énumérable | Ce que l'entrant ne permet pas d'énumérer, repris de `ENTRANT.md` §4 |

## `non_juge`

La **complétude de l'inventaire lui-même**. On ne peut pas prouver mécaniquement qu'un
inventaire tiré d'un entrant textuel n'a rien oublié. `oracle-surface` mesure la couverture de
**ce qui a été énuméré** — jamais de ce qui existe. La section 4 est le seul garde-fou, et
c'est un garde-fou humain.

La **pertinence d'un motif d'écart**, de même : S4 exige qu'il soit écrit, daté et signé, pas
qu'il soit vrai. La liste close est le seul endroit où l'oubli devient impossible ; ce qu'on
décide d'en écarter reste une décision humaine, simplement opposable.
