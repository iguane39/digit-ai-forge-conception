# Cadrage métier — le modèle du métier d'un produit (TF-1564)

Le référentiel d'exigences dit **ce que le produit fait**. Il ne dit pas **ce que le métier du
client est** : ses processus, son vocabulaire, les faits qui doivent rester vrais. Sans ce modèle,
un produit dérive des faits métier (une date, un rôle, un rattachement, le contexte d'une réponse)
de ce qu'il trouve sous la main. Mesuré le 01/10/2026 chez un produit : 290 dates de bail sur 298
tirées de la date de modification des fichiers, 113 dates d'entrée sur 161 fausses, 71 quittances
sur 93 classées pièces de candidature par une règle qui comparait ces dates.

**Quand.** Le volet est **dû au niveau Complexe** (`references/NIVEAUX.md` du pilot) ; en dessous,
il est facultatif. Un artefact absent n'est jamais un FAIL : l'agrégateur le rend NON_JUGE, et
`oracle-constitution` C5 le signale en avertissement non bloquant.

## Les trois pièces

| Pièce | Où elle vit | Oracle |
|---|---|---|
| Carte des processus | `CADRAGE-METIER.md`, section « Processus » | `oracle-cadrage-metier` CM1, CM2 |
| Glossaire | `CADRAGE-METIER.md`, section « Glossaire » | `oracle-cadrage-metier` CM1, CM3 |
| Invariants du métier | `CONSTITUTION.md`, section « Invariants du métier » | `oracle-constitution` C5 |

Les invariants vivent dans la constitution parce que c'est ce qui ne change que par ratification
explicite. Processus et glossaire évoluent avec la compréhension du métier : ils ont leur fichier.

## Gabarit de `CADRAGE-METIER.md`

```markdown
# Cadrage métier — <produit>

## Processus

- <nom du processus> : <ce qui se passe, entre qui, dans quel ordre — au moins une phrase>

## Glossaire

| Terme | Définition | À ne pas confondre avec |
|---|---|---|
| <terme du client> | <sens exact, dans les mots du client> | <terme voisin> |
```

Le glossaire donne **un sens par terme** : deux définitions pour le même terme sont le défaut que
le glossaire existe pour empêcher (CM3 le refuse).

## Gabarit d'un invariant, dans `CONSTITUTION.md`

```markdown
## Invariants du métier

- <le fait qui doit rester vrai>. Source de vérité : <où il est établi> ; fenêtre de validité : <de quand à quand il vaut> ; exceptions : <les cas où il ne vaut pas, ou « aucune »> ; contrôle : <le test ou le script exécutable chez le produit>
```

Une puce par invariant, sur une ligne, quatre rubriques `rubrique : valeur` séparées par « ; ».
Exemple : « Une date de bail vient du contrat signé. Source de vérité : le contrat PDF ; fenêtre de
validité : de la signature à la résiliation ; exceptions : avenant daté ; contrôle :
tests/invariants/test_dates_bail.py ».

**Chaque invariant se traduit en contrôle exécutable chez le produit.** La forge de conception
juge que le contrôle est nommé (C5), jamais qu'il existe ni qu'il est juste : c'est un livrable du
produit, rejoué par ses propres tests.
