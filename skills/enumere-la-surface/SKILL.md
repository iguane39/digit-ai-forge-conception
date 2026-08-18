---
name: enumere-la-surface
description: Énumère mécaniquement la surface fonctionnelle d'un produit à concevoir — objets métier, rôles, parcours, points d'entrée, règles de gestion — depuis l'entrant qualifié, et produit un SURFACE.md où chaque élément porte un identifiant stable. Inverse le sens de la génération : on énumère d'abord ce qui existe, on rédige ensuite, pour que tout élément non couvert par une exigence soit un manque nommé et non une absence silencieuse. Use when / déclencher dès qu'il faut inventorier ce qu'un produit doit couvrir avant d'écrire des exigences, lister les objets métier, rôles ou parcours d'un CDC ou d'un dépôt existant, ou vérifier qu'une spécification n'oublie pas une partie du périmètre. Ne pas déclencher pour qualifier l'entrant lui-même (→ qualifie-l-entrant), pour rédiger les exigences (→ redige-les-exigences), ni pour énumérer la surface d'un produit déjà construit à des fins de test (→ Forge Tests, qui l'énumère depuis le code exécutable).
version: 1.2.0
---

# Énumère la surface

Deuxième verbe. Il ne rédige rien, ne priorise rien : il **compte**.

## Pourquoi ce verbe existe

Le défaut fondateur documenté par Forge Tests : *« les tests restaient sur les premières
pages, sans jamais atteindre les suivantes »*, par **biais de disponibilité du générateur** —
on écrit depuis ce qu'on a sous les yeux.

Une spécification souffre du même biais : on rédige des exigences pour les écrans auxquels on
pense. La réponse est la même, appliquée en amont — **énumérer d'abord, rédiger ensuite,
mesurer le ratio, nommer chaque élément non couvert**.

C'est `oracle-surface` qui rend la règle exécutée plutôt que déclarée.

## Ce que ce skill apporte en propre

Qualification de l'entrant → `qualifie-l-entrant`.
Rédaction → `redige-les-exigences`.
Énumération depuis du **code exécutable** → Forge Tests, autre objet, autre outil.

Reste en propre : l'énumération depuis un entrant **textuel ou partiel**, et l'attribution
d'identifiants stables qui survivront jusqu'au champ `risque` de Forge Tests.

## Quick start

```
1. Entrée        → ENTRANT.md, section 3 (extractible obtenu)
2. Typologie     → references/typologie-surface.md, 5 types
3. Implicite     → references/typologie-surface.md, « Surface implicite SaaS » : chaque
                   candidat retenu ou écarté explicitement (SURFACE.md section 3)
4. Identifiants  → S-01, S-02… stables, jamais réaffectés
5. Artefact      → SURFACE.md + le tableau `surface[]` du référentiel
6. Contrôle      → node oracles/oracle-surface.mjs EXIGENCES.json
7. État          → ETAT.json (statut produit|bloque_question) → node oracles/oracle-etat.mjs
```

## Les cinq types d'élément

| Type | Ce qu'on énumère | Exemple |
|---|---|---|
| `objet` | Les choses que le produit manipule | Demande d'absence, Solde |
| `role` | Qui agit, avec quels droits apparents | Salarié, Responsable |
| `parcours` | Une suite d'actions menant à un résultat | Déclaration d'une absence |
| `point-entree` | Par où l'on entre : écran, endpoint, job, import | Écran d'accueil, batch de nuit |
| `regle` | Une contrainte métier citée | Un solde ne devient pas négatif |

## Les règles dures

**Un élément, un identifiant, pour toujours.** Un élément retiré laisse son identifiant mort.
Il n'est jamais réaffecté — c'est la condition pour que la traçabilité survive à une révision.

**On énumère ce qui est dit, pas ce qui est probable.** Un objet métier absent de l'entrant
n'entre pas dans la surface parce qu'il « existe toujours dans ce genre de produit ». S'il
manque, c'est `ENTRANT.md` section 4 qui le porte, comme hors de portée.

**Exception close : la surface implicite SaaS.** RC-3 (retour production) — un produit livré
sans aide utilisateur ni onboarding, parce que personne ne les avait proposés et que le CDC ne
les demandait pas. La règle ci-dessus reste vraie pour tout le reste ; une liste fermée et
versionnée de candidats attendus par tout utilisateur final d'une application web est en plus
proposée d'office en fin d'énumération, chacun retenu (→ exigence) ou écarté explicitement dans
`SURFACE.md` section 3. Liste complète : `references/typologie-surface.md`, section « Surface
implicite SaaS ».

**Deux natures d'élément rendent huit exigences DUES — dès l'énumération (TF-0376).** Un
`point-entree` ou un `parcours` dont l'entrant dit qu'il est **asynchrone** (conversion, import,
consolidation, file, job de nuit) porte quatre questions ouvertes : comment l'interface apprend
la fin, quel est l'état terminal d'un échec, quel est le délai maximal, comment on reprend. Un
élément qui repose sur une **authentification** (SSO, OIDC, SAML) en porte quatre autres : durée
de la session applicative, renouvellement silencieux, détection d'expiration, restauration du
contexte. Le noter ICI, au moment où l'élément est énuméré, est le premier endroit où l'oubli
peut être vu — `oracle-ears` EA4/EA5 le constatera de toute façon à l'étape suivante, mais alors
la surface sera déjà figée. Mesure : cinq des douze lacunes de spécification du cahier Approval
tenaient à ces deux sujets seuls, dont un « bug critique » et une perte de brouillon — et le
développeur avait implémenté exactement ce qui était écrit. Détail des huit questions :
`redige-les-exigences/references/formulation.md`, section EA4/EA5.

**Aucune exécution du produit analysé.** L'énumération se fait par lecture. On ne démarre
aucun serveur, on ne lance aucun script du dépôt.

## Surface vide

Un entrant de type « idée » peut n'avoir aucune surface énumérable. C'est un cas légitime :
`oracle-surface` le déclare `SANS_OBJET`, jamais `PASS`. Une surface vide sur un entrant de
type « produit à reprendre » est en revanche un défaut d'énumération, pas une propriété.

## Ce qui n'est jamais fait

Compléter la surface par ce qui « manque évidemment ». Fusionner deux objets parce qu'ils se
ressemblent. Réutiliser l'identifiant d'un élément supprimé. Produire un pourcentage de
couverture sans la liste nominative de ce qui n'est pas couvert.
