# Typologie de la surface fonctionnelle

Cinq types, fermés. Un élément qui n'entre dans aucun n'est pas de la surface — c'est du
contexte, il vit dans `ENTRANT.md`.

## Ce qu'on cherche, par entrant

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
section 3 de `SURFACE.md` (« Écartés »). Un candidat non mentionné dans SURFACE.md est un oubli,
jamais un arbitrage.

Ceci ne rouvre pas la règle « on énumère ce qui est dit, pas ce qui est probable » ci-dessus :
c'est une liste **fermée et versionnée**, pas une invitation générale à ajouter ce qui « existe
toujours dans ce genre de produit ». L'élargir est une décision, pas une commodité — comme pour
la liste fermée des prédicats binaires de `redige-les-exigences`.

Hors périmètre déclaré d'un coup : un entrant sans IHM utilisateur final (batch, job planifié,
API interne, produit tiers analysé de l'extérieur) écarte le bloc entier avec une raison unique
— « pas d'utilisateur final » ou équivalent — sans examiner chaque ligne séparément.

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

**Critères d'acceptation précisés** (2ᵉ inspection utilisateur du premier produit, lot 03) —
« exister » ne suffit pas, la perception de l'utilisateur fait foi ; ces critères s'écrivent
dans l'exigence dès que le candidat est retenu :
- **Onboarding** (RC-4) : une expérience **dominante** de première connexion — panneau de
  bienvenue en tête de page, progression visible (x/N étapes), badge persistant tant que non
  complété, actions directes depuis le panneau, disparition à complétion. Une carte repliable
  discrète « existe » mais n'est pas perçue comme un onboarding : exigence non tenue.
- **Aide utilisateur** (RD-7) : **trois niveaux** — aide de page (rôle de l'écran, circuit,
  pièges), encarts par section non évidente, aide par champ. Une page d'aide unique ne tient
  pas l'exigence.

## Identifiants

`S-01`, `S-02`… Numérotation continue, jamais réaffectée.

| Situation | Traitement |
|---|---|
| Élément retiré | Son identifiant reste mort. Le consigner dans `identifiants_retires` |
| Élément scindé en deux | L'ancien meurt, deux neufs naissent. Jamais de réutilisation |
| Élément renommé | Même identifiant, libellé changé. Un renommage n'est pas une suppression |

## Gabarit de `SURFACE.md`

| Section | Contenu |
|---|---|
| 1. Origine | Quel `ENTRANT.md`, quelle section, quelle date |
| 2. Tableau | `id` · `type` · `libelle` · d'où il vient dans l'entrant |
| 3. Écartés | Ce qui a été vu et **volontairement** exclu, avec la raison. Sans cette section, un oubli et un arbitrage se ressemblent |
| 4. Non énumérable | Ce que l'entrant ne permet pas d'énumérer, repris de `ENTRANT.md` §4 |

## `non_juge`

La **complétude de l'inventaire lui-même**. On ne peut pas prouver mécaniquement qu'un
inventaire tiré d'un entrant textuel n'a rien oublié. `oracle-surface` mesure la couverture de
**ce qui a été énuméré** — jamais de ce qui existe. La section 4 est le seul garde-fou, et
c'est un garde-fou humain.
