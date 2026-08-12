# Entrées pour le registre global `quality-oracles`

Prêtes à injecter. **Non injectées** — la décision appartient à l'utilisateur, conformément à
la pratique de Forge Design (`oracles/registre-entrees.md`).

Contrat commun aux quatre : Node seul, aucune dépendance npm, JSON sur stdout,
exit `0` PASS / `1` FAIL / `2` l'oracle n'a pas pu juger, `non_juge` déclaré.

---

## `oracle-exigences` v1.1.0

| | |
|---|---|
| **Domaine** | Testabilité d'un énoncé d'exigence |
| **Artefact jugé** | `EXIGENCES.json` |
| **Invocation** | `node oracles/oracle-exigences.mjs <EXIGENCES.json>` |
| **Règles** | E1 champs obligatoires · E2 identifiant unique et non réaffecté · E3 critère chiffré ou binaire · E4 liste noire de termes subjectifs · E5 palier valide · E6 énoncé atomique · E7 forme EARS non orpheline · E8 absolus/pronoms non vérifiables · E9 caractéristiques d'ensemble (contradiction, complétude) |
| **Fixtures** | `oracles/fixtures/verte` · `oracles/fixtures/rouge` |
| **`non_juge`** | La pertinence produit de l'exigence · l'atomicité sémantique sans marqueur · la justesse d'une condition EARS reconnue · la contradiction hors du lexique antonyme surveillé |

## `oracle-tracabilite` v1.0.0

| | |
|---|---|
| **Domaine** | Bijection besoin ↔ exigence ↔ critère, et régénérabilité des vues |
| **Artefact jugé** | `EXIGENCES.json` + les vues dérivées |
| **Invocation** | `node oracles/oracle-tracabilite.mjs <EXIGENCES.json> [--vue <fichier>]…` |
| **Règles** | T1 aucun orphelin des deux côtés · T2 exactement un critère · T3 vue alignée sur l'empreinte de sa source · T4 statut épistémique porteur de sa source ou de son mode de validation |
| **Fixtures** | idem, avec `CADRAGE-DESIGN.md` en vue |
| **`non_juge`** | La justesse du rattachement · la véracité de la source citée |

## `oracle-surface` v1.0.0

| | |
|---|---|
| **Domaine** | Couverture de la surface fonctionnelle énumérée |
| **Artefact jugé** | `EXIGENCES.json` |
| **Invocation** | `node oracles/oracle-surface.mjs <EXIGENCES.json> [--seuil 95]` |
| **Règles** | S1 chaque élément non couvert est **nommé** · S2 ratio publié avec sa liste · S3 lien de surface valide ou raison `hors_surface` |
| **Fixtures** | idem |
| **`non_juge`** | La complétude de l'inventaire de surface lui-même |

## `oracle-claims` v1.0.0

| | |
|---|---|
| **Domaine** | Aucune donnée chiffrée non marquée |
| **Artefact jugé** | `EXIGENCES.json` |
| **Invocation** | `node oracles/oracle-claims.mjs <EXIGENCES.json>` |
| **Règles** | A1 tout chiffre d'un champ narratif est tracé à une source ou marqué « à vérifier » · A2 les critères chiffrés sont hors périmètre, déclaré |
| **Fixtures** | idem |
| **`non_juge`** | La véracité de la source · les affirmations non chiffrées |

## `oracle-etat` v1.0.0

| | |
|---|---|
| **Domaine** | Protocole machine de sortie des verbes — distinguer « bloqué sous le seuil » de « produit » (TF-0014, R-C3) |
| **Artefact jugé** | `ETAT.json` |
| **Invocation** | `node oracles/oracle-etat.mjs <ETAT.json>` |
| **Règles** | EM1 statut dans l'ensemble fermé `produit`\|`bloque_question` · EM2 aucun signal contradictoire (artefacts et questions ne cohabitent jamais) · EM3 verbe émetteur reconnu |
| **Fixtures** | `oracles/fixtures/verte` · `oracles/fixtures/rouge` |
| **`non_juge`** | La pertinence des questions posées · l'écriture effective du fichier par le verbe |

## `oracle-ears` v1.0.0

| | |
|---|---|
| **Domaine** | Scoring EARS par patron strict (ubiquitous, event-driven, state-driven, optional, unwanted) et ambiguïté lexicale — TF-0101 |
| **Artefact jugé** | `EXIGENCES.json` |
| **Invocation** | `node oracles/oracle-ears.mjs <EXIGENCES.json>` |
| **Règles** | EA1 classification stricte (échec seulement quand « Si » ne peut être tranché entre optional/unwanted, faute de marqueur de polarité identifiable ou en présence des deux) · EA2 ambiguïté lexicale (quantificateurs/atténuateurs INCOSE R7, liste fermée distincte de la liste noire E4) · EA3 cohérence du `patron_ears` déclaré (facultatif) avec le patron calculé |
| **Fixtures** | `oracles/fixtures/ears-verte` · `oracles/fixtures/ears-rouge` (dédiées, pas les fixtures partagées) |
| **`non_juge`** | La justesse du déclencheur reconnu · la désambiguïsation optional/unwanted reste une heuristique lexicale, pas sémantique · l'ambiguïté lexicale hors liste fermée |

---

## Note de traçabilité

Le CDC de cadrage classait initialement `oracle-claims` comme **ÉTENDU** depuis un oracle
homonyme de Forge Design, cité par son `criteres-sortie.md` C6.

Le test d'existence exécuté avant construction l'a infirmé :
`C:\dev\digit-ai-forge-design\oracles\` contient `oracle-corpus`, `oracle-images`,
`oracle-mobile`, `oracle-slop`, `oracle-tokens` — **pas** `oracle-claims`. Le verdict a été
corrigé en **CRÉÉ** dans le CDC, §7.4.

*Effet de bord constaté et signalé, non traité* : le critère bloquant C6 de Forge Design
s'appuie sur un oracle absent de son dépôt, il ne peut donc pas être exécuté. Corriger un
dépôt de référence sort du périmètre de cette forge.

## Self-test

```
node oracles/self-test.mjs
```

Vérifie les **deux sens** pour chacun des 6 oracles : la fixture verte passe (exit 0), la
fixture rouge échoue (exit 1) **et déclenche chacune de ses règles**. Un oracle dont une règle
ne se déclenche jamais sur la fixture rouge ne juge rien : le self-test le refuse.

État au 12/08/2026 : **6 oracles, 23 règles** (`oracle-ears` ajouté — TF-0101). Self-test rouge
au 12/08 pour une cause **étrangère à cet ajout** : `oracle-tracabilite` T3 échoue sur la
fixture verte partagée par dérive d'encodage de fin de ligne (`core.autocrlf=true` sur ce poste
Windows change le SHA-256 constaté de `EXIGENCES.json` entre le commit — LF — et le disque —
CRLF au checkout). Constaté, prouvé, non corrigé : hors périmètre TF-0101, à traiter à part.
