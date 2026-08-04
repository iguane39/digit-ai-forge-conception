# Schéma du référentiel

`EXIGENCES.json` est la **source unique**. `EXIGENCES.md` en est une lecture humaine, et les
trois vues aval en sont dérivées. Une modification se fait dans le JSON, jamais dans une vue.

## Structure

| Clé racine | Type | Rôle |
|---|---|---|
| `projet` | chaîne | Nom du produit |
| `date_generation` | `AAAA-MM-JJ` | Date réelle, jamais codée en dur |
| `entrant` | objet | `type`, `libelle`, `seuil_suffisance` — repris de `ENTRANT.md` |
| `identifiants_retires` | tableau de chaînes | Les identifiants morts. **Jamais réaffectés** |
| `besoins` | tableau | `id`, `enonce`, `source` (facultatif) |
| `surface` | tableau | `id`, `type`, `libelle` — repris de `SURFACE.md` |
| `exigences` | tableau | Les 8 champs ci-dessous |

## Les huit champs d'une exigence

| Champ | Type | Obligatoire | Contrainte vérifiée |
|---|---|---|---|
| `id` | chaîne | oui | Unique · absent de `identifiants_retires` — `oracle-exigences` E2 |
| `besoin` | chaîne | oui | Existe dans `besoins[]` — `oracle-tracabilite` T1 |
| `enonce` | chaîne | oui | Atomique — E6 |
| `critere` | **chaîne**, jamais tableau | oui | Binaire ou chiffré — E3 · exactement un — T2 |
| `palier` | `MVP` \| `V1` \| `V2` | oui | E5 |
| `statut_epistemique` | objet | oui | `{nature: "fait constaté", source}` ou `{nature: "hypothèse", validation}` — T4 |
| `surface` | tableau de chaînes | oui\* | Identifiants connus — `oracle-surface` S3 |
| `cotation` | objet | oui | `{impact, confiance, effort}`, grille ICE |

\* `surface` peut être vide **à condition** que `hors_surface` porte une raison non vide.
C'est le cas des exigences non fonctionnelles — rétention, sécurité, disponibilité.

## Champs facultatifs

`hors_surface` — chaîne, sur une exigence. Requis dès que `surface` est vide. Une exigence sans
lien de surface **et** sans raison est un trou silencieux : S3 la refuse.

`source` — chaîne, sur un **besoin**. Un besoin n'a pas de `statut_epistemique` — ce
formalisme est réservé aux exigences. Mais un `besoin.enonce` peut porter un chiffre (« réduire
le délai de 30 % ») sans qu'aucun champ n'existe pour le sourcer : `source` comble ce trou.
`oracle-claims` A1 l'accepte comme preuve suffisante, non vide, au même titre que la mention
« à vérifier » dans l'énoncé. Un besoin sans chiffre n'a pas besoin de `source`.

## Les deux formes du statut épistémique

| Nature | Champ requis | Ce qu'il signifie |
|---|---|---|
| `fait constaté` | `source` non vide | Vient de l'entrant. La source est citable et localisée |
| `hypothèse` | `validation` non vide | Ne vient pas de l'entrant. Le champ dit **comment on la lèvera** |

Un fait sans source est une hypothèse — T4 le traite comme tel. C'est la règle qui empêche un
défaut appliqué de devenir un fait au bout de deux relectures.

## Cotation ICE

`impact`, `confiance`, `effort`, chacun de 1 à 5. Grille reprise de `digit-ai-prospection`, non
redéfinie ici. La cotation **ne décide pas** du palier : elle l'éclaire. Le palier est un
arbitrage humain, déclaré `non_juge`.

## Identifiants

| Situation | Traitement |
|---|---|
| Exigence supprimée | Identifiant ajouté à `identifiants_retires`. Il ne revient jamais |
| Exigence scindée | L'ancienne meurt, deux neuves naissent |
| Exigence reformulée | Même identifiant. Une reformulation n'est pas une suppression |
| Exigence dont le critère change de fond | Nouvel identifiant — l'aval a testé l'ancien |

Cette dernière ligne est la moins intuitive et la plus importante : Forge Tests a écrit des
tests contre un identifiant. Changer ce que l'identifiant signifie sans le renommer casse la
traçabilité en silence.

## Gabarit de `EXIGENCES.md`

| Section | Contenu |
|---|---|
| 1. Origine | `ENTRANT.md` et `SURFACE.md` de référence, dates |
| 2. Besoins | Table `id` · énoncé |
| 3. Exigences par palier | MVP, puis V1, puis V2. Les 8 champs en table |
| 4. Hypothèses | Extrait des exigences `hypothèse`, avec leur mode de validation. Section obligatoire |
| 5. Couverture de surface | Ratio **et** liste nominative des éléments non couverts |
| 6. Relevé des oracles | Les 4 verdicts exécutés, `SANS_OBJET` compris, avec leur raison |
| 7. Ce que le référentiel ne dit pas | Section obligatoire et non vide. L'écart entre ce qui est spécifié et ce qui reste à trancher |

La section 7 est le pendant du *« Ce que la maquette ne fait pas »* de Forge Design. Sans elle,
un référentiel se lit comme un produit déjà conçu aux trois quarts.
