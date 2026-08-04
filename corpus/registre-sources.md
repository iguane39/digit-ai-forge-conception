# Registre des sources du corpus

Méthode de résolution reprise de `experts-forge` : **une entrée n'est servie que si son test
d'existence a été exécuté et son statut est `ok`**. Une entrée `todo` est visible dans le
corpus, citable comme piste, et **jamais utilisable comme appui d'une décision**.

Séparateur du CSV : `;` — le texte français contient des virgules.
Le CSV est en ASCII translittéré : il est lu par des scripts, pas par un humain.

## État au 04/08/2026

| Statut | Nombre | Conséquence |
|---|---|---|
| `ok` | 8 | Servies. Chacune résolue par lecture d'un fichier présent sur cette machine |
| `todo` | 3 | **Non servies.** Elles nomment un manque, elles ne le comblent pas |

## Les trois `todo`, et pourquoi

`P-09` découverte produit · `P-10` ingénierie des exigences · `P-11` découpe par domaine.

Aucun accès réseau n'a été engagé lors de la construction. Ces trois traditions existent
certainement dans la littérature ; les nommer de mémoire produirait une source non résolue,
c'est-à-dire exactement ce que la méthode interdit. Elles restent `todo`.

**Conséquence opérationnelle, assumée** :

- `qualifie-l-entrant` s'arrête aux 4 champs de seuil du CDC §4.1. Il ne conduit pas de
  découverte produit — `P-09` le permettrait, elle n'est pas servie.
- `oracle-exigences` E3/E6 restent lexicaux. `P-10` les rendrait sémantiques.
- Le seuil de scission à 60 exigences reste marqué `[HYP]`. `P-11` le calibrerait.

L'étape 2 du plan §8.4 du CDC porte leur résolution, **avec checkpoint humain** : ce qui
entre dans le corpus est un arbitrage, pas une collecte.

## Ajouter une entrée

1. Renseigner les 7 colonnes de `pratiques.csv`.
2. Exécuter le test d'existence et **écrire son résultat daté** dans la colonne
   `test_existence` — « lu sur disque : *chemin* », « installé : *chemin* », ou `AUCUN`.
3. Statut `ok` **seulement** si le test est concluant. Dans le doute : `todo`.

Une entrée dont le test d'existence est `AUCUN` et le statut `ok` est un défaut de registre.
