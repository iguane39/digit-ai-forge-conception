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
| `ecarts_surface_implicite` | tableau | **Facultatif.** Les candidats d'office de la surface implicite délibérément écartés — `oracle-surface` S4 |
| `ecarts_exigences_socle` | tableau | **Facultatif.** Les exigences socle candidates délibérément écartées — `oracle-exigences` E10 |
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

`patron_ears` — chaîne, sur une exigence. Un des 5 patrons stricts EARS (`ubiquitous` ·
`event-driven` · `state-driven` · `optional` · `unwanted`), déclaré à la main pour confronter
l'intention de l'auteur au patron **calculé** par `oracle-ears` (règle EA3, TF-0101). Absent :
`oracle-ears` calcule seul, rien à confronter — pas un défaut.

`ecarts_surface_implicite` — tableau, à la racine du référentiel (TF-0811). Une entrée par
candidat de la surface implicite **écarté** : `{ element, motif, decide_par, date }`.

| Champ | Contrainte vérifiée par `oracle-surface` S4 |
|---|---|
| `element` | l'une des onze clés de la liste close (`enumere-la-surface/references/typologie-surface.md`, « Les clés de la liste close ») |
| `motif` | chaîne d'au moins **20 caractères** — plus court, ce n'est pas une raison, c'est un mot |
| `decide_par` | chaîne non vide — un écart est décidé par quelqu'un |
| `date` | `AAAA-MM-JJ` |

**Il ne se saisit nulle part ailleurs qu'en transcription de la section 3 « Écartés » de
`SURFACE.md`** : la prose reste le lieu où l'écart se rédige et s'argumente, le champ n'en est
que la forme lisible par un oracle. Écrire un écart directement dans le JSON, sans qu'il existe
dans `SURFACE.md`, produit un référentiel qui passe l'oracle et une décision que personne n'a
prise.

Le champ est **facultatif à la lecture** : absent, il vaut « aucun écart déclaré ». Un
référentiel écrit avant TF-0811 n'est donc pas invalidé — il est jugé sur la seule présence de
ses candidats. Il n'est en revanche pas facultatif dans les faits dès que le produit a une
surface web et qu'un candidat manque : S4 rend alors FAIL, en nommant le candidat.

`ecarts_exigences_socle` — tableau, à la racine du référentiel (TF-0814). Une entrée par
**exigence socle candidate** écartée : `{ element, motif, decide_par, date }`. Même forme, mêmes
quatre contraintes et même validateur que `ecarts_surface_implicite` — « écarté explicitement »
veut dire la même chose des deux côtés, c'est un seul contrôle partagé (`oracles/_contrat.mjs`).

| Champ | Contrainte vérifiée par `oracle-exigences` E10 |
|---|---|
| `element` | l'une des trois clés de la liste close (« Exigences socle candidates » ci-dessous) |
| `motif` | chaîne d'au moins **20 caractères** — plus court, ce n'est pas une raison, c'est un mot |
| `decide_par` | chaîne non vide — un écart est décidé par quelqu'un |
| `date` | `AAAA-MM-JJ` |

**Il ne se saisit nulle part ailleurs qu'en transcription de la section 7 « Ce que le référentiel
ne dit pas » d'`EXIGENCES.md`** : la prose reste le lieu où l'écart se rédige et s'argumente, le
champ n'en est que la forme lisible par un oracle.

Le champ est **facultatif à la lecture** : absent, il vaut « aucun écart déclaré ». Un
référentiel écrit avant TF-0814 n'est donc pas invalidé — il est jugé sur la seule présence de
ses candidates. Il n'est en revanche pas facultatif dans les faits dès qu'une candidate manque :
E10 rend alors FAIL, en la nommant.

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

## Exigences socle candidates

Trois lois transverses constatées en production, proposées d'office lors de la rédaction de
tout référentiel touchant un produit avec données ou éléments interactifs — jamais imposées,
jamais absentes en silence. Même mécanique que la surface implicite SaaS d'`enumere-la-surface` :
chaque candidate est **retenue** (une exigence normale, avec `id`, critère et `surface` ou
`hors_surface`) ou **écartée explicitement**, raison consignée en section 7 de `EXIGENCES.md`
(« Ce que le référentiel ne dit pas »), puis transcrite dans le champ racine
`ecarts_exigences_socle` du référentiel. Absente des deux, c'est un oubli — et depuis TF-0814,
`oracle-exigences` E10 le refuse.

| Candidate | Loi transverse | Exemple de critère |
|---|---|---|
| Données de démonstration invisibles en production | Un jeu de données de démo ne fuite jamais en production | En l'absence du drapeau d'environnement dédié (valeur par défaut : absent), aucune donnée de démonstration n'est affichée |
| Données volatiles éditables, datées, sourcées | Catalogue, tarifs, taux : toute donnée qui change dans le temps vit en base, jamais en dur dans le code, avec sa date de mise à jour et sa source | Chaque enregistrement du catalogue porte un champ `mise_a_jour_le` et un champ `source` non vides |
| Effet observable de tout élément interactif | Un contrôle sans effet observable est un défaut, jamais un détail | Chaque action déclenchée par un élément interactif produit un changement d'état visible ou un message |

Hors périmètre déclaré d'un coup : un produit sans données de production, sans catalogue ni
tarif volatil, ou sans élément interactif écarte la ligne correspondante avec cette seule raison
— pas d'examen ligne à ligne nécessaire au-delà.

### Les clés de la liste close, et où s'écrit un écart (TF-0814)

Jusqu'au 05/09/2026, ces trois candidates-là avaient exactement le trou que la surface implicite
avait avant TF-0811 : la règle « retenue ou écartée explicitement » était écrite, mais l'écart ne
vivait qu'en prose, en section 7, qu'**aucun** oracle de la forge ne prend en entrée — sur onze
oracles, zéro ne lit `EXIGENCES.md`, et les huit qui jugent `EXIGENCES.json` n'avaient aucun
champ à lire. Une candidate oubliée et une candidate écartée en connaissance de cause
produisaient le même référentiel.

Le référentiel porte désormais son champ racine, transcrit de la section 7 et de nulle part
ailleurs :

```json
"ecarts_exigences_socle": [
  {
    "element": "donnees-demonstration",
    "motif": "le produit n'embarque aucun jeu de démonstration : la recette se fait sur un extrait anonymisé",
    "decide_par": "le commanditaire du produit",
    "date": "2026-09-05"
  }
]
```

`element` prend l'une des trois **clés** de la liste close — c'est la table ci-dessus, vue par la
machine :

| Clé | Candidate |
|---|---|
| `donnees-demonstration` | Données de démonstration invisibles en production |
| `donnees-volatiles` | Données volatiles éditables, datées, sourcées |
| `effet-observable` | Effet observable de tout élément interactif |

Ce que `oracle-exigences` **E10** juge alors, candidate par candidate, chacune **nommée** :

| État | Verdict |
|---|---|
| Candidate portée par au moins une exigence | PASS |
| Candidate absente + écart déclaré qui tient | PASS, message préfixé « [ÉCARTÉ] » |
| Candidate absente + aucun écart, ou écart qui ne tient pas | **FAIL**, la candidate nommée |

Il n'y a **pas de quatrième état**. Contrairement à `oracle-surface` S4, qui n'exige la surface
implicite que si le produit a une surface web, E10 n'infère aucune condition d'applicabilité : le
« hors périmètre d'un coup » ci-dessus s'écrit, il ne se devine pas. Trois lignes d'écart sont le
prix de l'opposabilité — délibérément moins cher que de rendre l'omission indiscernable.

Depuis **TF-0822** (06/09/2026), la transcription elle-même est vérifiée : `oracle-exigences-md`
règle **P3** confronte chaque entrée d'`ecarts_exigences_socle` à la section 7 de ce document —
la clé **et** le motif doivent y figurer. Une entrée du JSON absente de la prose est un FAIL qui
la nomme. Le même oracle juge le gabarit ci-dessous (P1) et exige que les sections 4 et 7 soient
non vides (P2). Un référentiel sans `EXIGENCES.md` n'est pas accusé pour autant : l'oracle sort
alors en 2 — il n'a pas jugé — et aucune migration n'est due.

La **présence** d'une candidate est inférée d'un lexique fermé sur l'énoncé et le critère,
volontairement permissif : E10 peut taire une candidate, jamais en inventer une. Ce que l'oracle
ne juge pas non plus : la pertinence du motif d'un écart, et le respect effectif d'une candidate
retenue par le produit livré — celui-là relève de forge-tests et de la MEP.


## Gabarit de `EXIGENCES.md`

| Section | Contenu |
|---|---|
| 1. Origine | `ENTRANT.md` et `SURFACE.md` de référence, dates |
| 2. Besoins | Table `id` · énoncé |
| 3. Exigences par palier | MVP, puis V1, puis V2. Les 8 champs en table |
| 4. Hypothèses | Extrait des exigences `hypothèse`, avec leur mode de validation. Section obligatoire |
| 5. Couverture de surface | Ratio **et** liste nominative des éléments non couverts |
| 6. Relevé des oracles | Les 4 verdicts exécutés, `SANS_OBJET` compris, avec leur raison |
| 7. Ce que le référentiel ne dit pas | Section obligatoire et non vide. L'écart entre ce qui est spécifié et ce qui reste à trancher — dont l'écart de chaque exigence socle candidate, transcrit ensuite dans `ecarts_exigences_socle` |

La section 7 est le pendant du *« Ce que la maquette ne fait pas »* de Forge Design. Sans elle,
un référentiel se lit comme un produit déjà conçu aux trois quarts.
