# Vues par profil — décliner un rétro-modèle en documentations par audience

Né du GO humain du 19/08/2026 sur l'étude d'opportunité
`digit-ai-factory\output\03-etudes\20260819-etude-opportunite-retro-documentation.md`
(verdict O3 : couche de vues consommant le rétro-modèle — jamais une régénération
d'acquisition par document). La règle fondatrice du skill s'applique inchangée : **une
vue est régénérable, jamais éditée** — toute correction se fait dans `RETRO-MODELE.md`,
puis les vues sont refaites.

## Source et scellement

- **Source unique** : le `RETRO-MODELE.md` du projet (mode rétro-modèle de
  `qualifie-l-entrant`, jugé par `oracle-retro-modele.mjs`). Jamais le code directement :
  une vue qui relit le code refait l'acquisition sans son régime de preuve.
- **Scellement** : chaque vue porte en frontmatter l'empreinte SHA-256 de sa source
  (contenu normalisé LF, CRLF→LF — même idiome que les vues d'exigences). Source
  modifiée ou vue retouchée → l'empreinte ne correspond plus, la vue est périmée.
- **Ancrage** : chaque affirmation d'une vue cite au moins un id du modèle (`[RM-F01]`,
  `[RM-D02]`…). Une vue est une SÉLECTION du modèle avec un niveau de détail et un
  vocabulaire — jamais une source d'information nouvelle.

## Frontmatter imposé

```
---
vue: profil
profil: po | csm | utilisateur
source: <chemin du RETRO-MODELE.md>
source_sha256: <64 hex, contenu source normalisé LF>
corps_sha256: <64 hex, sha256 de TOUT ce qui suit la ligne `---` de fermeture>
date: AAAA-MM-JJ
---
```

**Le double sceau (TF-0827).** `source_sha256` prouve **d'où vient** la vue ; il ne dit rien de
**ce qu'elle contient**. Mesuré le 05/09/2026 sur `oracles/fixtures/vues-profil-verte` : la
section « Règles de gestion » **vidée de son contenu, le titre laissé en place** — 161
caractères de corps sur 598, plus du quart de la vue — rendait VP1, VP2, VP3 et VP4 tous PASS,
exit 0. La règle qui vérifie les sections imposées (VP4) ne voit qu'un **titre** : la même
section retirée AVEC son titre, elle, échoue — c'est la seule amputation qu'elle attrape, et ce
n'est pas celle qui fait disparaître une décision.

`corps_sha256` est donc la seconde empreinte, jumelle de `corps-sha256` sur les vues dérivées
d'`EXIGENCES.json` (`vues.md`, TF-0818). Elle se calcule sur **tout ce qui suit la ligne `---`
de fermeture du frontmatter**, fins de ligne normalisées LF — le sceau vit dans le frontmatter,
il ne se hache donc jamais lui-même. `oracle-vues-profil` **VP5** la recalcule.

Le champ est **facultatif à la lecture** : absent, VP5 rend un `SANS_OBJET` motivé et le dit —
la vue a été scellée avant cette règle, sa provenance seule est jugée. **Aucune vue existante
n'est migrée** ; la régénérer par ce verbe lui donne l'empreinte de son corps. Un `corps_sha256`
présent mais qui n'est pas 64 hex est en revanche un **FAIL** : un sceau illisible n'est pas un
sceau absent, il annonce un contrôle qui n'a pas lieu.

## Les trois profils pilotes (jeu fermé v0)

Trois profils avant généralisation — décision de l'étude : prouver la mécanique sur
trois audiences hétérogènes avant d'ouvrir les dix. L'ajout d'un profil est un delta de
CE référentiel (sections + entrée du jeu fermé de l'oracle), jamais une improvisation.

| Profil | Ce qu'il lit | Sections imposées de la vue |
|---|---|---|
| `po` | le produit comme périmètre à arbitrer | « Objets et parcours » · « Règles de gestion » · « Manques et hypothèses » |
| `csm` | le produit comme réponses à donner au client | « Ce que fait le produit » · « Questions et réponses ancrées » · « Limites connues » |
| `utilisateur` | le produit comme gestes à accomplir | « Ce que vous pouvez faire » · « Comment faire » · « Ce que le produit ne fait pas » |

Règles d'écriture par profil (non jugées par l'oracle, tenues en revue) :

- `po` : vocabulaire du modèle, ids visibles, hypothèses (`confiance: hypothèse`)
  toujours reprises dans « Manques et hypothèses ».
- `csm` : phrases répondables au téléphone ; chaque « Limite connue » reprend une entrée
  « Hors de portée » ou une affirmation `hypothèse` du modèle.
- `utilisateur` : aucun terme technique du volet technique ; les ids `[RM-…]` restent
  présents (ils sont l'ancre, pas le style) mais en fin de ligne.

## Quick start

```
1. Entrée        → RETRO-MODELE.md (oracle-retro-modele PASS exigé d'abord)
2. Empreintes    → sha256 de la source ET sha256 du corps, normalisés LF → frontmatter
3. Vue           → sections du profil, chaque affirmation ancrée [RM-xxx]
4. Contrôle      → node oracles/oracle-vues-profil.mjs <VUE.md> --modele <RETRO-MODELE.md>
5. Péremption    → source modifiée ? régénérer la vue, jamais l'éditer
6. Intégrité     → corps édité à la main ? VP5 le voit, même titres en place
```

Nommage : `VUE-PO.md` · `VUE-CSM.md` · `VUE-UTILISATEUR.md` (ou
`Digit-AI - Vue {profil} {Projet} - {AAAAMMJJ}{i}.md` en livrable).
