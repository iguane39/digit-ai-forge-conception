# Grammaire d'une exigence opposable

## L'énoncé

**Un comportement observable, un seul.** Sujet, verbe d'action, complément.

> Le salarié enregistre une demande d'absence depuis son espace personnel.

Marqueurs qui trahissent deux comportements fondus — refusés par `oracle-exigences` E6 :
`;` · ` puis ` · ` ainsi que ` · ` et/ou ` · ` et également ` · ` ou bien `.

**`non_juge`** : deux comportements réunis sans marqueur. *« L'agent crée le dossier et le
transmet »* passe E6 et reste deux exigences. Aucun oracle ne l'attrapera — c'est de la
relecture humaine.

## Le critère

C'est la seule partie qui rend l'exigence utilisable en aval. Deux formes admises.

### Chiffré — une valeur **et** son unité

> La notification est envoyée dans un délai inférieur ou égal à **5 min** après enregistrement.
> Une demande dont la date de fin dépasse **60 mois** est purgée.

Un nombre sans unité n'est pas un critère chiffré : « le délai est de 5 » ne dit rien.

### Binaire — un prédicat observable de la liste fermée

`est affiché` · `n'est pas affiché` · `est présent` · `est absent` · `est visible` ·
`est invisible` · `est créé` · `est supprimé` · `est enregistré` · `est rejeté` ·
`est refusé` · `est accepté` · `est bloqué` · `est autorisé` · `est interdit` ·
`est journalisé` · `est notifié` · `est envoyé` · `est reçu` · `est vrai` · `est faux` ·
`retourne` · `renvoie` · `apparaît` · `disparaît` · `existe` · `n'existe pas` ·
`échoue` · `aboutit` · `est identique` · `est différent`

Liste **fermée et versionnée** dans `oracles/oracle-exigences.mjs`. L'élargir est une décision,
pas une commodité : chaque ajout affaiblit la règle.

Les formes accordées de ces prédicats sont acceptées sans reformulation artificielle — féminin,
pluriel, et la bascule `est` → `sont` qui va avec un sujet pluriel :

> Les demandes concernées **sont présentes** dans la notification envoyée au responsable.

`sont présentes`, `est présente`, `sont créés`, `ne sont pas affichées`… sont dérivées de leur
entrée dans la liste, pas ajoutées à la main : la liste fermée elle-même ne bouge pas. Seuls les
prédicats verbaux (`retourne`, `existe`, `échoue`…) restent à écrire tels quels — un verbe plein
n'a pas d'accord de genre, et sa conjugaison plurielle sort du périmètre de cette règle.

## La liste noire

Aucun de ces termes ne peut apparaître dans un énoncé ni dans un critère — E4 :

optimal · exhaustif · robuste · de qualité · complet · performant · intuitif · moderne ·
fluide · ergonomique · simple · rapide · convivial *(et leurs accords)*

Ce ne sont pas de mauvais mots. Ce sont des mots qui **décrivent un ressenti** : deux
personnes les valident différemment, donc ils ne se testent pas.

## Réécrire un critère mou

| Avant | Après |
|---|---|
| L'affichage est **rapide** | La liste est affichée en 2 s au plus pour 500 lignes |
| Le formulaire est **intuitif** | Le formulaire est envoyé sans erreur de saisie par 8 utilisateurs sur 10 au premier essai |
| La reprise est **robuste** | Après coupure, le traitement retourne au dernier point de reprise enregistré |
| La couverture est **complète** | Chaque élément de `surface[]` porte au moins une exigence |
| L'export est **de qualité** | Le total du fichier exporté est identique au total affiché à l'écran |

Le motif est toujours le même : **remplacer l'adjectif par ce qu'on mesurerait pour le
contredire**. Si rien ne permettrait de le contredire, l'exigence n'en est pas une.

## Le piège du critère chiffré arbitraire

Remplacer « rapide » par « 2 s » ne suffit pas si le 2 sort de nulle part. Deux issues, aucune
troisième :

- le chiffre vient de l'entrant → `statut_epistemique = fait constaté` + source ;
- le chiffre est posé par la conception → `statut_epistemique = hypothèse` + mode de
  validation (« à confirmer avec le métier avant V1 »).

`oracle-claims` A1 n'inspecte que les **énoncés**, pas les critères : un critère chiffré est une
cible qu'on fixe, pas une affirmation qu'on avance. Le garde-fou du critère, c'est T4.

## Les formes conditionnelles (EARS) — E7 à E9

Étude P-10 d'organization (EARS, ISO/IEC/IEEE 29148, INCOSE GtWR v4), rendue exécutable par
TF-0015. Un `enonce` peut rester à la forme de base (« sujet, prédicat, complément ») ou ouvrir
sur une condition, avec un mot-clé fixe :

| Forme | Mot-clé | Exemple |
|---|---|---|
| Ubiquitaire | — | Le salarié enregistre une demande d'absence. |
| État | **Tant que** | Tant que le solde est négatif, la demande n'est pas soumise. |
| Événement | **Quand** | Quand la demande est validée, le solde est diminué. |
| Option | **Lorsque** | Lorsque l'export mensuel est inclus, le fichier est généré le 1er. |
| Indésirable | **Si** | Si le run de tests est vide, alors le rapport est rejeté. |

**E7** — une exigence qui commence par un de ces mots-clés doit porter sa partie principale
complète après la virgule. Une condition sans suite (« Si le délai dépasse le seuil, ») est une
**condition orpheline** : rien ne dit ce qui se passe.

**E8** — absolus/superlatifs (`toujours`, `jamais`, `tous`, `100 %`…) et pronoms personnels ou
indéfinis (`il`, `elle`, `on`, `cela`…) sont refusés dans l'énoncé comme dans le critère : un
pronom sans antécédent mécanique n'a pas de sujet vérifiable ; un absolu n'a pas de portée
bornée. Distincte d'E4 : E4 attrape le ressenti (« robuste »), E8 attrape l'absence de sujet ou
de borne.

**E9** — caractéristique d'*ensemble*, jugée sur le référentiel entier, pas exigence par
exigence : aucun couple d'exigences du même besoin, sur le même élément de surface, dont les
critères ne diffèrent que par un couple de prédicats antonymes (`est autorisé` / `est
interdit`…) sur un reste identique. Contrôle mécanique, pas sémantique — une contradiction
formulée autrement passe E9 et reste `non_juge`.

## Contre-exemples fréquents

| Formulation | Défaut | Règle |
|---|---|---|
| « Le système doit être disponible » | Ni chiffré, ni binaire | E3 |
| « Gérer les utilisateurs » | Pas un comportement observable, pas de critère | E3 |
| « L'écran affiche la liste ; l'utilisateur peut filtrer » | Deux exigences | E6 |
| « Le produit est conforme au RGPD » | Non testable en l'état — à décomposer en obligations vérifiables | E3 |
| « Améliorer les performances de 30 % » | Par rapport à quoi ? Base de comparaison absente | E3, et T4 sur la source du 30 % |
