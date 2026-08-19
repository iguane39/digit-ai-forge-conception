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
date: AAAA-MM-JJ
---
```

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
2. Empreinte     → sha256 du source normalisé LF → frontmatter
3. Vue           → sections du profil, chaque affirmation ancrée [RM-xxx]
4. Contrôle      → node oracles/oracle-vues-profil.mjs <VUE.md> --modele <RETRO-MODELE.md>
5. Péremption    → source modifiée ? régénérer la vue, jamais l'éditer
```

Nommage : `VUE-PO.md` · `VUE-CSM.md` · `VUE-UTILISATEUR.md` (ou
`Digit-AI - Vue {profil} {Projet} - {AAAAMMJJ}{i}.md` en livrable).
