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
| État (state-driven) | **Tant que** | Tant que le solde est négatif, la demande n'est pas soumise. |
| Événement (event-driven) | **Quand** / **Lorsque** | Quand la demande est validée, le solde est diminué. |
| Option (optional) | **Si**, réponse à polarité **positive** | Si l'export mensuel est inclus dans l'offre, le fichier est généré le 1er. |
| Indésirable (unwanted) | **Si**, réponse à polarité **négative** | Si le run de tests est vide, alors le rapport est rejeté. |

*Correctif du 12/08/2026 (TF-0101)* : « Quand » et « Lorsque » sont des synonymes stricts en
français — la version précédente de cette table assignait « Lorsque » au patron *Option*, ce qui
aurait fait porter à deux synonymes deux patrons EARS différents. Les deux mots-clés désignent le
même patron *event-driven*. Le français ne porte pas de mot-clé dédié à l'*optional* anglais
(« Where <feature is included> ») : *Option* et *Indésirable* s'ouvrent tous les deux sur « Si »,
distingués uniquement par la **polarité du critère** — voir `oracle-ears` ci-dessous.

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

## Le scoring EARS strict — EA1 à EA3 (TF-0101)

`oracle-ears` va au-delà de la forme générique vérifiée par E7 : il **classe** chaque exigence
dans l'un des 5 patrons stricts ci-dessus et détecte l'**ambiguïté lexicale**, sur le modèle des
outils 2026 (Jama Connect Advisor, Polarion Copilot) — en local, déterministe, zéro API payante.

**EA1** — classification. Le seul cas d'échec mécanique : une exigence à mot-clé « Si » dont le
critère ne porte **ni** marqueur de polarité positive **ni** marqueur négatif reconnu (ou porte
les deux à la fois) — le patron reste `ambigu`, jamais tranché au hasard.

**EA2** — ambiguïté lexicale (INCOSE GtWR R7, « vague terms ») : liste fermée de quantificateurs
et atténuateurs qui ne bornent rien de vérifiable — `généralement`, `plusieurs`, `certains`, `le
cas échéant`, `dans les meilleurs délais`… Distincte de la liste noire E4 : E4 attrape le ressenti
(« robuste »), EA2 attrape la portée floue.

**EA3** — cohérence, si l'exigence porte un champ facultatif `patron_ears`, entre ce qui est
**déclaré** et ce qui est **calculé**. Absent : `SANS_OBJET`, rien à confronter.

## Les deux sujets toujours oubliés — EA4 et EA5 (TF-0376)

EA1-EA3 jugent la **forme**. EA4 et EA5 jugent deux **sujets**, et ce n'est pas la même chose :
ce sont deux thèmes qu'un cahier laisse vides sans que rien ne le signale, et ils concentrent
les anomalies les plus chères.

**Mesure qui les a fait naître** (recette Approval, 18/08/2026) : sur les **12 lacunes de
spécification** relevées dans le cahier, **cinq** tiennent à ces deux sujets seulement. Dont
celle que la recette a elle-même qualifiée de « bug critique » — un fichier affiché
« Conversion en cours » alors que la conversion était terminée, qui ne passait à « Prêt »
qu'après une action utilisateur sans rapport — et la perte du brouillon à l'expiration de
session.

**Ces cinq anomalies ne viennent pas d'une erreur de développement.** Le développeur a
implémenté exactement ce qui était écrit. Le cahier disait « conversion et consolidation
asynchrones » et s'arrêtait là ; il disait « SSO via Microsoft Entra ID / OIDC » et s'arrêtait
là. C'est la spécification qui était incomplète, et rien ne le disait.

**EA4 — dès qu'une exigence mentionne un traitement asynchrone**, quatre réponses sont dues :

| # | Réponse due | Ce qui casse sans elle |
|---|---|---|
| a | comment l'interface apprend la fin du traitement | l'interface **ment** : elle affiche un état périmé |
| b | l'état terminal d'un traitement échoué | un traitement bloqué est indistinguable d'un traitement lent |
| c | le délai maximal | « bloqué » n'a aucune définition, donc aucun test |
| d | la reprise | l'utilisateur n'a **aucun geste de sortie** |

**EA5 — dès qu'une exigence mentionne une authentification**, quatre autres :

| # | Réponse due | Ce qui casse sans elle |
|---|---|---|
| a | la durée de la session **applicative** | la durée du fournisseur d'identité n'est pas celle de l'application |
| b | le renouvellement silencieux | l'utilisateur est déconnecté en pleine saisie |
| c | la détection d'expiration | l'application affiche « une erreur est survenue » au lieu de la vraie cause |
| d | la restauration du contexte | le travail en cours est **perdu** |
| e | la **portée** de chaque geste délégué (déconnexion : session applicative seule · session du fournisseur sur cet appareil · comptes fédérés) | le comportement **le plus large** est hérité en silence — mesuré le 20/08 : sortir d'une application fermait la session Microsoft du navigateur, Outlook et Teams compris (TF-0397) |

Le contrat est celui d'E3 : **le vocabulaire présent rend les réponses dues**. Vocabulaire
absent → `SANS_OBJET`, jamais un PASS de complaisance. Les deux règles nomment **quelle**
réponse manque, jamais un total.

Ces deux sujets reviennent dans **toute** application de ce type : c'est un durcissement de la
forge, pas un service nouveau.

## Contre-exemples fréquents

| Formulation | Défaut | Règle |
|---|---|---|
| « Le système doit être disponible » | Ni chiffré, ni binaire | E3 |
| « Gérer les utilisateurs » | Pas un comportement observable, pas de critère | E3 |
| « L'écran affiche la liste ; l'utilisateur peut filtrer » | Deux exigences | E6 |
| « Le produit est conforme au RGPD » | Non testable en l'état — à décomposer en obligations vérifiables | E3 |
| « Améliorer les performances de 30 % » | Par rapport à quoi ? Base de comparaison absente | E3, et T4 sur la source du 30 % |
| « La conversion et la consolidation sont asynchrones » | Rien sur la fin observable, l'échec, le délai, la reprise | EA4 |
| « L'accès se fait par SSO via Entra ID / OIDC » | Rien sur la durée applicative, le renouvellement, l'expiration, le contexte | EA5 |
