// oracle-ears — scoring EARS par patron strict, brique locale et déterministe (zéro API payante).
// Usage : node oracle-ears.mjs <EXIGENCES.json>
// TF-0101 (1/3) — écart à l'état de l'art 2026 (Jama Connect Advisor, Polarion Copilot 25.12) :
// oracle-exigences E7 vérifie une forme EARS générique (condition non orpheline), sans classer
// l'exigence dans l'un des 5 patrons stricts EARS ni détecter l'ambiguïté lexicale. Cet oracle
// complète E7-E9, il ne les remplace pas.
//
// Les 5 patrons stricts (Mavin et al., EARS, Rolls-Royce 2009 ; QRA « Definitive Guide to EARS » ;
// joshmcdonald.medium.com « EARS, Fifteen Years On »), mot-clé de tête en français :
//   ubiquitous     — aucun mot-clé                 « Le système journalise chaque connexion. »
//   event-driven   — Quand / Lorsque <déclencheur>  (synonymes stricts en français : MÊME patron)
//   state-driven   — Tant que <état>
//   optional       — Si <fonctionnalité incluse>, réponse à polarité POSITIVE
//   unwanted       — Si <condition indésirable>, réponse à polarité NÉGATIVE
//
// Le français ne porte pas de mot-clé dédié à « Where <feature is included> » (optional) ni ne
// distingue lexicalement optional/unwanted au mot-clé de tête — les deux s'ouvrent sur « Si ».
// Ce module désambiguïse par la POLARITÉ du critère (positive => optional, négative => unwanted),
// et déclare l'ambiguïté plutôt que de trancher au hasard quand aucune polarité n'est identifiable
// ou que les deux le sont. Correctif apporté au passage : `formulation.md` associait « Lorsque » à
// « Option » — Quand et Lorsque sont des synonymes stricts en français, ils ne peuvent pas porter
// deux patrons EARS différents (cf. `skills/redige-les-exigences/references/formulation.md`).

import { charger, constat, emettre, erreur, PASS, FAIL, SANS_OBJET } from './_contrat.mjs'

const VERSION = '1.0.0'

export const PATRONS = ['ubiquitous', 'event-driven', 'state-driven', 'optional', 'unwanted']

// Polarité du critère — vocabulaire propre à cet oracle (désambiguïser optional/unwanted),
// distinct de la liste fermée E3 d'oracle-exigences.mjs : ici on ne juge pas la testabilité,
// on lit un sens (inclusion vs exclusion). Versionné ici, pas synchronisé automatiquement avec E3.
const MARQUEURS_POSITIFS = [
  'est présent', 'est présente', 'est visible', 'est créé', 'est créée', 'est autorisé',
  'est autorisée', 'est accepté', 'est acceptée', 'aboutit', 'existe', 'est vrai',
  'est identique', 'est affiché', 'est affichée', 'est activé', 'est activée',
  'est disponible', 'est inclus', 'est incluse'
]
const MARQUEURS_NEGATIFS = [
  "n'est pas", 'ne sont pas', 'est absent', 'est absente', 'est invisible', 'est bloqué',
  'est bloquée', 'est refusé', 'est refusée', 'est rejeté', 'est rejetée', 'est interdit',
  'est interdite', 'échoue', "n'existe pas", 'est faux', 'est différent', 'est différente',
  'jamais', 'aucun', 'aucune'
]

// EA2 — ambiguïté lexicale (INCOSE GtWR R7, « vague terms ») : quantificateurs et atténuateurs
// qui ne bornent rien de vérifiable. Distinct de la liste noire E4 d'oracle-exigences.mjs : E4
// attrape le ressenti subjectif (« robuste »), EA2 attrape la portée floue (« généralement »,
// « plusieurs ») — aucun recouvrement volontaire entre les deux listes.
const AMBIGUS = [
  'environ', 'approximativement', 'généralement', 'globalement', 'normalement',
  'habituellement', 'typiquement', 'au besoin', 'si besoin', 'si nécessaire',
  'dans la mesure du possible', 'autant que possible', 'dans les meilleurs délais',
  'le cas échéant', 'notamment', 'par exemple', 'la plupart', 'plusieurs',
  'certains', 'certaines', 'quelques', 'divers', 'diverses', 'etc.'
]
const AMBIGUS_RE = AMBIGUS.map(terme => {
  const echappe = terme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const multiMots = /\s/.test(terme)
  return { terme, re: new RegExp(multiMots ? echappe : `\\b${echappe}\\b`, 'i') }
})

// EA4 / EA5 — TF-0376 (18/08, retour d'usage Produit-01). Ce ne sont pas des règles de forme :
// ce sont deux SUJETS que le rédacteur oublie systématiquement, et qui concentrent les
// anomalies les plus chères. Mesure : sur les 12 lacunes de spécification du cahier Approval,
// CINQ tiennent à ces deux sujets seulement — dont la rubrique qualifiée « bug critique » par
// la recette elle-même (un fichier affiché « Conversion en cours » alors que la conversion
// était finie, jusqu'à une action utilisateur sans rapport) et la perte du brouillon à
// l'expiration de session.
//
// Ces cinq anomalies ne viennent PAS d'une erreur de développement : le développeur a
// implémenté exactement ce qui était écrit. Le cahier disait « conversion et consolidation
// asynchrones » et s'arrêtait là ; il disait « SSO via Microsoft Entra ID / OIDC » et
// s'arrêtait là. C'est la SPÉCIFICATION qui était incomplète, et rien ne le disait.
//
// Le contrat est le même que pour une exigence sans critère testable : dès que le vocabulaire
// est là, les quatre réponses sont DUES. Absent, il n'y a rien à exiger — SANS_OBJET, jamais
// un PASS de complaisance (un PASS dirait « vérifié », alors que rien ne l'a été).
const DECLENCHEURS_ASYNC = [
  'asynchrone', 'asynchrones', 'en arrière-plan', 'arrière-plan', 'tâche de fond',
  "file d'attente", 'file de traitement', 'différé', 'différée', 'webhook', 'worker',
  'traitement par lot', 'polling', 'scrutation', 'webhooks', 'workers'
]
const DECLENCHEURS_AUTH = [
  'authentification', 'authentifie', 'authentifié', 'sso', 'oidc', 'saml', 'entra id',
  'openid', 'jeton de session', 'jeton d\'accès', 'refresh token', 'oauth'
]

//: Les quatre réponses dues dès qu'un traitement asynchrone est mentionné. L'ordre est celui
//: du coût constaté : sans (a), l'interface ment ; sans (b), un traitement bloqué est
//: indistinguable d'un traitement lent ; sans (c), « bloqué » n'a pas de définition ; sans
//: (d), l'utilisateur n'a aucun geste de sortie.
const REPONSES_ASYNC = [
  { cle: 'notification de fin', motifs: ['notifi', 'averti', 'informé', 'rafraîchi', 'rafraichi', 'mis à jour', 'mise à jour', 'événement', 'evenement', 'signal', 'passe à'] },
  { cle: "état terminal d'échec", motifs: ['échec', 'echec', 'échou', 'echou', 'erreur', 'état terminal', 'abandon', 'expiré', 'expire'] },
  { cle: 'délai maximal', motifs: ['délai', 'delai', 'au plus', 'maximum', 'maximal', 'au-delà de', 'secondes', 'minutes'] },
  { cle: 'reprise', motifs: ['repris', 'reprend', 'rejou', 'relanc', 'nouvelle tentative', 'réessay', 'reessay'] }
]

//: Les quatre réponses dues dès qu'une authentification est mentionnée.
const REPONSES_AUTH = [
  { cle: 'durée de session applicative', motifs: ['durée', 'duree', 'validité', 'validite', 'expire', 'expiration', 'minutes', 'heures'] },
  { cle: 'renouvellement silencieux', motifs: ['renouvel', 'rafraîchi', 'rafraichi', 'refresh', 'silencieux', 'prolong'] },
  { cle: "détection d'expiration", motifs: ['détect', 'detect', 'expiré', 'expire', '401', 'invalide', 'révoqu', 'revoqu'] },
  { cle: 'restauration du contexte', motifs: ['restaur', 'contexte', 'brouillon', 'reprend', 'conserv', 'retour à la page'] },
  // TF-0397 (lot client-a-cockpit-ia, 20/08) — la PORTÉE du geste délégué, cinquième réponse due.
  // Déléguer un geste à un fournisseur d'identité, c'est choisir OÙ IL S'ARRÊTE — et le défaut
  // d'un fournisseur est toujours le plus large : l'omission vaut adoption. Mesuré : la spec de
  // bascule EasyAuth n'avait nulle part décidé où s'arrête la déconnexion ; le produit a appelé
  // /.auth/logout, qui purge la session App Service PUIS enchaîne sur la déconnexion d'Entra —
  // sortir du Cockpit fermait la session Microsoft du navigateur, Outlook et Teams compris.
  // Trois niveaux nommés à trancher : session applicative seule · session du fournisseur sur
  // cet appareil · comptes fédérés. Une ligne de spec au moment de la bascule aurait suffi.
  { cle: 'portée des gestes délégués (déconnexion : session applicative, fournisseur ou fédérée)',
    motifs: ['session applicative', 'application seule', 'session du fournisseur', 'comptes fédérés',
             'comptes federes', 'portée', 'portee', 'single logout', 'front-channel'] }
]

// EA6 — TF-0570 (24/08, retour d'usage Produit-01, deuxieme campagne). MEME PATRON QUE EA4/EA5,
// applique aux REFUS. Le fait : le cahier Approval §09 enumere les formats acceptes, la borne de
// 100 Mo, le plafond de 10 documents et le total de 1 Go — QUATRE REFUS SPECIFIES. Il ne dit
// nulle part ce que l'application affiche quand l'un survient, ni quel geste elle indique. Le
// developpeur a implemente exactement ce qui etait ecrit : les quatre refus existent cote
// serveur, avec leurs libelles anglais destines aux journaux, et rien ne demandait de les rendre
// lisibles. SEPT causes distinctes arrivaient a l'ecran sous une seule phrase — « Une erreur est
// survenue. Reessayez. » — et DANS SIX CAS SUR SEPT l'instruction affichee etait FAUSSE : elle
// demande de rejouer exactement le geste qui ne peut pas aboutir.
//
// COUT MESURE : 5 cles de message x 7 langues a rediger apres coup, un correctif transverse en
// trois couches (service, route, client), et DEUX ANOMALIES ANTERIEURES MAL CLASSEES parce que
// leur symptome etait indiscernable de six autres.
//
// La regle generique : *une contrainte enoncee sans sa contrepartie observable est une exigence
// incomplete* — c'est mot pour mot le contrat d'EA4 sur le declencheur asynchrone, et le refus
// est le second cas ou le rédacteur s'arrete a mi-chemin.
const DECLENCHEURS_REFUS = [
  'refus', 'refuse', 'refusé', 'rejet', 'rejeté', 'rejette', 'interdit', 'interdite',
  'non autorisé', 'non autorisée', 'formats acceptés', 'format accepté', 'extensions autorisées',
  'taille maximale', 'taille maximum', 'plafond', 'plafonné', 'quota',
  'ne doit pas dépasser', 'antivirus', 'liste blanche', 'liste noire', 'invalide',
  'non conforme'
  // NE PAS Y REMETTRE « au-delà de », « au plus », « limite de », « nombre maximal » : le
  // premier jeu de déclencheurs les portait, et EA6 a accusé « le système archive les journaux
  // au-delà de 12 mois » — une BORNE DE QUANTITÉ, pas un refus. Un déclencheur qui attrape une
  // borne attrape la moitié des exigences chiffrées, et une règle bruyante se fait contourner
  // au lieu de se corriger (R-33 bis). Un refus se nomme : refuser, rejeter, interdire, plafonner.
]

//: Les trois reponses dues des qu'un refus est specifie. L'ordre est celui du cout constate :
//: sans (a), le refus existe et personne ne le comprend ; sans (b), l'utilisateur rejoue le
//: geste impossible ; sans (c), sept causes se confondent en une et deux anomalies distinctes
//: se classent comme une seule.
const REPONSES_REFUS = [
  { cle: "message vu par l'utilisateur",
    motifs: ['message', 'affich', 'libell', 'texte', 'notifi', 'informé', 'informe', 'indique', 'signale', 'traduit', 'traduction'] },
  { cle: "geste indiqué (ce que l'utilisateur peut faire)",
    motifs: ['geste', 'action', 'peut ', 'invite', 'propose', 'convertir', 'réduire', 'reduire', 'supprim', 'remplac', 'contacter', 'réessay', 'reessay', 'corrig'] },
  { cle: 'cause distinguée des autres refus',
    motifs: ['cause', 'motif', 'distinct', 'spécifique', 'specifique', 'propre à', 'propre a', 'code', 'par refus', 'chaque refus', 'selon le', 'clé de message', 'cle de message'] }
]

// EA7 — TF-0576 (24/08, retour d'usage Produit-01). TROISIEME INSTANCE DU MEME PATRON, apres EA4
// (declencheur asynchrone sans clause de reponse observable) et EA6 (refus sans contrepartie
// observable) : *une contrainte enoncee sans sa contrepartie observable est une exigence
// incomplete*. Ici la contrainte est une DEPENDANCE EXTERNE, et la contrepartie manquante est son
// mode d'INDISPONIBILITE.
//
// LE FAIT. `AntivirusPort.is_clean(content) -> bool` declarait exactement deux issues : propre, ou
// infecte. La troisieme — L'ANALYSE N'A PAS EU LIEU — n'existait pas au contrat. L'adaptateur
// n'avait donc nulle part ou la mettre : `socket.gaierror` remontait NUE jusqu'a l'ASGI. Or les
// deux cas sont OPPOSES : un fichier infecte est un refus definitif, il ne faut pas insister ; un
// scanner injoignable est une panne transitoire, et reessayer est le bon geste. Un booleen ne peut
// pas porter cette difference. Le meme trou existait sur CINQ ports du meme produit — stockage,
// file, secrets, annuaire : tous declaraient leur signature heureuse, aucun son mode de panne.
//
// DEUX REPONSES SONT DUES, et la seconde est celle qu'on oublie : le mode d'indisponibilite lui-meme,
// DISTINCT du refus ; et le SORT DU GESTE UTILISATEUR quand il survient — rejouable, differe, ou
// perdu. Sans la seconde, l'interface choisit a la place de la specification, et elle choisit mal.
const DECLENCHEURS_DEPENDANCE = [
  'dépendance externe', 'service tiers', 'adaptateur', 'socket', 'api externe', 'api tierce',
  'stockage objet', 'stockage blob', "file d'attente", 'file de messages', 'antivirus',
  'annuaire', 'coffre-fort', 'coffre de secrets', 'passerelle de paiement', 'smtp',
  'fournisseur externe', 'appel réseau', 'client http'
]

//: Les deux reponses dues des qu'une dependance externe est mentionnee.
const REPONSES_DEPENDANCE = [
  { cle: "mode d'indisponibilité, distinct du refus",
    motifs: ['indisponib', 'injoignab', 'inaccessib', 'panne', 'timeout', 'délai dépassé', 'delai depasse',
             'hors service', 'dégradé', 'degrade', 'échec technique', 'echec technique', 'erreur technique'] },
  { cle: 'sort du geste utilisateur quand elle survient',
    motifs: ['rejou', 'réessay', 'reessay', 'nouvelle tentative', 'différ', 'differ', 'file de reprise',
             'perdu', 'conserv', 'brouillon', 'abandon', 'repris'] }
]

// EA8 — TF-0577 (24/08, retour d'usage Produit-01, PR 3685). QUATRIÈME INSTANCE DU MÊME PATRON,
// après EA4 (déclencheur asynchrone), EA6 (refus spécifié) et EA7 (dépendance externe) : *une
// contrainte énoncée sans sa contrepartie observable est une exigence incomplète*. Ici la
// contrainte est l'identité DÉLÉGUÉE, et la contrepartie manquante est celle-ci : COMMENT
// TESTE-T-ON CE QUE CE CHOIX REND INTESTABLE ?
//
// LE FAIT. Un produit qui délègue son authentification à un fournisseur d'entreprise hérite d'une
// contrainte que rien dans les forges n'anticipait : on ne peut pas tester de bout en bout ce
// qu'on ne peut pas authentifier, et on ne peut pas authentifier N identités distinctes sans N
// comptes réels chez le fournisseur. Or les tests qui comptent le plus sont ceux qui TRAVERSENT
// PLUSIEURS IDENTITÉS — le passage de main séquentiel, le refus qui prime en parallèle, la copie
// en lecture seule, l'administrateur qui annule sans décider à la place d'un approbateur.
//
// PERSONNE N'AYANT POSÉ LE PRINCIPE, CHAQUE PRODUIT L'INVENTE. Produit-01 l'a inventé de la façon
// la plus tentante et la plus fausse : en FABRIQUANT les sessions — une clé écrite à la main dans
// le stockage du navigateur, la redirection sautée. Coût mesuré : contrôle d'audience de la
// bibliothèque cliente SAUTÉ pour les 5 profils · un `client_id` FAUX survivant NEUF JOURS · trois
// fichiers portant trois valeurs du même identifiant, deux fausses · les 5 workflows inter-profils
// échouant au PREMIER passage réel en intégration continue après n'avoir jamais été verts · une
// demi-journée de diagnostic. Le cahier disait « SSO via Microsoft Entra ID / OIDC » et s'arrêtait
// là — comme il disait « conversion asynchrone » (EA4) et « formats acceptés » (EA6).
//
// POURQUOI UNE RÈGLE À PART, ET PAS UNE SIXIÈME RÉPONSE D'EA5. EA5 juge le CYCLE DE VIE de la
// session — durée, renouvellement, détection d'expiration, restauration du contexte, portée du
// geste délégué. La TESTABILITÉ est un autre sujet, et EA5 porte déjà cinq réponses. Surtout, le
// DÉCLENCHEUR n'est pas le même : « authentification » et « jeton de session » désignent aussi une
// authentification LOCALE, qui n'a besoin d'aucun substitut. EA8 ne se réveille que si la
// DÉLÉGATION est nommée — un fournisseur tiers, un protocole de fédération.
const DECLENCHEURS_DELEGATION = [
  'sso', 'oidc', 'saml', 'entra id', 'entra', 'azure ad', 'openid connect', 'openid',
  "fournisseur d'identité", "fournisseur d'identite", 'identité déléguée', 'identite deleguee',
  'google workspace', 'okta', 'auth0', 'keycloak', 'adfs', 'easyauth', 'idp', 'fédération',
  'federation', "annuaire d'entreprise"
]

//: Les quatre réponses dues dès qu'une identité déléguée est nommée. L'ordre est celui du coût
//: constaté : sans (a) le produit invente son substitut, et il l'invente mal ; sans (b) le
//: substitut existe et ne sert à rien, faute d'identités à jouer ; sans (c) personne ne sait
//: comment on passe du substitut au fournisseur réel, et les deux chemins divergent en silence ;
//: sans (d) le substitut est atteignable en cible — et ce n'est pas une commodité, c'est une FAILLE.
const REPONSES_DELEGATION = [
  { cle: "mode de substitution local (comment on s'authentifie sans le fournisseur)",
    motifs: ['substitut', 'simul', 'mode local', 'emetteur local', 'émetteur local', 'idp local',
             'fournisseur local', 'bouchon', 'doublure', 'authentification locale', 'auth_mode',
             'interrupteur'] },
  { cle: 'identités de test que le substitut rend disponibles',
    motifs: ['identites de test', 'identités de test', 'profils de test', 'comptes de test',
             "jeu d'identites", "jeu d'identités", 'par identite', 'par identité', 'par profil',
             'multi-profils', 'multi profils', 'plusieurs identites', 'plusieurs identités'] },
  { cle: 'mécanisme de bascule entre substitut et fournisseur réel',
    motifs: ['bascule', 'commut', 'reglage', 'réglage', 'drapeau', "variable d'environnement",
             'auth_mode', 'selon le mode', 'mode cible', 'mode reel', 'mode réel'] },
  // (d) n'est PAS une précaution de rédaction. Un mode d'authentification simulé atteignable sur un
  // environnement servi est une faille. Et le garde doit porter sur un FAIT VÉRIFIABLE, jamais sur
  // le NOM de l'environnement : `environment == "dev"` ne discrimine rien — un Dev cloud porte
  // exactement cette valeur avec un fournisseur RÉEL. L'implémentation de référence (PR 3685) pose
  // deux gardes fail-closed : le mode local exige un émetteur privé, le mode cible une audience unique.
  { cle: "ce qui EMPÊCHE le substitut d'être atteignable en cible (garde fail-closed sur un FAIT, pas sur un nom d'environnement)",
    motifs: ['fail-closed', 'fail closed', 'refuse au demarrage', 'refuse au démarrage',
             'refus au demarrage', 'refus au démarrage', 'garde', 'interdit en production',
             'interdit en cible', 'inatteignable', 'jamais atteignable', 'emetteur prive',
             'émetteur privé', 'audience unique', 'ne demarre pas', 'ne démarre pas'] }
]

// EA9 — TF-0588 (24/08, retour d'usage Produit-01, lot 20260824d). CINQUIÈME INSTANCE DU MÊME
// PATRON, après EA4 (déclencheur asynchrone), EA6 (refus spécifié), EA7 (dépendance externe) et
// EA8 (identité déléguée) : *une contrainte énoncée sans sa contrepartie observable est une
// exigence incomplète*. Ici l'intention est « une stratégie de tests », et la contrepartie
// manquante est : SUR QUELS PÉRIMÈTRES, ET À QUOI RECONNAÎT-ON QU'ELLE EST FAITE ?
//
// LE FAIT, et il est embarrassant parce que rien n'était faux. Une stratégie de tests a été
// demandée, construite, validée. Elle a produit un backend réellement testé — 423 tests, 87,9 %
// — et un front PLANIFIÉ : 137 tests hérités, deux écrans à 1,88 % et 12,5 %, aucun parcours de
// refus, et un seuil vert au-dessus de tout cela. Toutes les portes étaient vertes, la stratégie
// était donc réputée EXÉCUTÉE. Il manquait la moitié du produit, et AUCUNE porte ni aucun rapport
// ne pouvait le dire. Le propriétaire l'a demandé lui-même : « j'avais demandé la construction et
// l'EXÉCUTION COMPLÈTE de la stratégie de tests, pourquoi les tests front n'ont pas été
// implémentés ? » — et la réponse était : parce que rien, dans la demande comme dans le rendu, ne
// disait qu'ils manquaient.
//
// LE DÉFAUT QUI EN EST SORTI a été signalé par un utilisateur AVEC UNE CAPTURE D'ÉCRAN, jamais
// par la chaîne : tout échec d'ajout de document affichait « Une erreur est survenue. Réessayez »,
// conseil FAUX dans six cas sur sept. Il était structurellement hors d'atteinte de la suite, parce
// que la recette couvrait EXCLUSIVEMENT les parcours qui aboutissent — zéro parcours de refus.
//
// DEUX ÉTATS SEULEMENT PAR PÉRIMÈTRE, et c'est tout l'enseignement du lot : *implémenté et
// exécuté* (avec sa mesure), ou *exclu* (avec son motif). Il n'existe pas de troisième état —
// UN PLAN N'EST PAS UN TEST. La liste des périmètres est tirée de ce qui manquait réellement, et
// le versant REFUS y est obligatoire et non recommandé : c'est là que les utilisateurs se
// bloquent, et c'est le seul périmètre qui était à ZÉRO pendant que tout le reste était vert.
const DECLENCHEURS_STRATEGIE_TESTS = [
  'stratégie de tests', 'strategie de tests', 'plan de tests', 'plan de test',
  'couverture de tests', 'taux de couverture', 'campagne de tests', 'recette',
  'suite de tests', 'politique de tests'
]

//: Les quatre réponses dues dès qu'une stratégie de tests est demandée. L'ordre est celui du coût
//: constaté : sans (a) la moitié du produit peut rester non testée sans que rien ne le dise ;
//: sans (b) chaque périmètre est réputé fait dès qu'un document existe ; sans (c) la recette ne
//: couvre que les parcours qui aboutissent, et c'est là que les utilisateurs se bloquent ; sans
//: (d) un chiffre vert ne dit rien de ce qu'il n'a pas mesuré.
const REPONSES_STRATEGIE_TESTS = [
  { cle: 'les PÉRIMÈTRES énumérés (chaque couche exécutable : service, interface, tâches de fond)',
    motifs: ['périmètre', 'perimetre', 'par couche', 'backend', 'back-end', 'front', 'interface',
             'worker', 'tâche de fond', 'tache de fond', 'chaque couche', 'côté serveur',
             'cote serveur'] },
  { cle: "l'ÉTAT de chaque périmètre — implémenté et exécuté (avec sa mesure), ou exclu (avec son motif) ; un PLAN n'est pas un test",
    motifs: ['implémenté et exécuté', 'implemente et execute', 'exécuté', 'execute', 'exclu',
             'hors périmètre', 'hors perimetre', 'avec sa mesure', 'mesure à l\'appui',
             'taux atteint', 'seuil atteint'] },
  { cle: 'les parcours de REFUS, distinctement de ceux qui aboutissent',
    motifs: ['refus', 'rejet', 'cas d\'erreur', 'cas d erreur', 'chemin d\'erreur',
             'chemin d erreur', 'parcours en échec', 'parcours en echec', 'échec fonctionnel',
             'echec fonctionnel', 'cas négatif', 'cas negatif'] },
  { cle: "l'ACCESSIBILITÉ et les chemins d'erreur d'INFRASTRUCTURE (indisponibilité, panne transitoire)",
    motifs: ['accessibilité', 'accessibilite', 'rgaa', 'wcag', 'a11y', 'indisponib', 'panne',
             'transitoire', 'erreur technique', 'infrastructure'] }
]

const pliSansAccent = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
// TF-0387 (constaté le 18/08 sur EX-044 de factory.digit-ai.fr) — mon `includes()` détectait
// « sso » À L'INTÉRIEUR de « ressource », et EA5 exigeait alors quatre réponses sur le cycle de
// session d'une exigence qui ne mentionne aucune authentification. L'exigence réelle a été
// REFORMULÉE POUR CONTOURNER le faux positif — un contrôle bruyant ne se corrige pas, il se
// fait contourner (R-33 bis). Les termes courts (sso, saml, oidc) étaient les plus exposés.
// Correctif : la même construction à FRONTIÈRES DE MOT que les AMBIGUS d'EA2 — un terme simple
// est encadré de \b, un terme multi-mots est cherché tel quel, et le texte comme le terme sont
// pliés sans accent AVANT la construction (\b ne connaît pas « é »).
const _RE_TERMES = new Map()
const _reTerme = (t) => {
  if (!_RE_TERMES.has(t)) {
    const plie = pliSansAccent(t)
    const echappe = plie.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    _RE_TERMES.set(t, new RegExp(/\s/.test(plie) ? echappe : `\\b${echappe}\\b`, 'i'))
  }
  return _RE_TERMES.get(t)
}
// Deux régimes, et les confondre casse l'un ou l'autre (mesuré sur la fixture verte en
// corrigeant TF-0387) : un DÉCLENCHEUR est un mot entier (« sso » ne doit pas se voir dans
// « ressource ») ; un RADICAL de réponse est un préfixe ancré en début de mot (« repris »
// doit voir « reprise », « détect » doit voir « détectée » — jamais le milieu d'un mot).
const _RE_STEMS = new Map()
const _reStem = (t) => {
  if (!_RE_STEMS.has(t)) {
    const plie = pliSansAccent(t)
    const echappe = plie.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    _RE_STEMS.set(t, new RegExp(`\\b${echappe}`, 'i'))
  }
  return _RE_STEMS.get(t)
}
const mentionne = (texte, termes) => { const plie = pliSansAccent(texte); return termes.some(t => _reTerme(t).test(plie)) }
const mentionneRadical = (texte, radicaux) => { const plie = pliSansAccent(texte); return radicaux.some(t => _reStem(t).test(plie)) }

/**
 * Les réponses MANQUANTES parmi celles dues. Nommées, jamais comptées : c'est la réponse
 * absente qui se rédige, pas un total.
 */
function reponsesManquantes (texte, dues) {
  return dues.filter(r => !mentionneRadical(texte, r.motifs)).map(r => r.cle)
}

function detecterAmbigus (texte) {
  return AMBIGUS_RE.filter(({ re }) => re.test(texte)).map(({ terme }) => terme)
}

/**
 * Classe un énoncé dans l'un des 5 patrons EARS.
 * Retourne { patron, ambigu, positif, negatif } — `patron` est `null` si `ambigu` est vrai :
 * un oracle ne tranche jamais par défaut ce qu'il ne peut pas décider.
 */
function classifier (enonce, critere) {
  const tete = (enonce ?? '').trim()
  if (/^tant que\b/i.test(tete)) return { patron: 'state-driven', ambigu: false }
  if (/^(quand|lorsque)\b/i.test(tete)) return { patron: 'event-driven', ambigu: false }
  if (/^si\b/i.test(tete)) {
    const texte = `${enonce} ${critere}`.toLowerCase()
    const positif = MARQUEURS_POSITIFS.some(m => texte.includes(m))
    const negatif = MARQUEURS_NEGATIFS.some(m => texte.includes(m))
    if (positif && !negatif) return { patron: 'optional', ambigu: false }
    if (negatif && !positif) return { patron: 'unwanted', ambigu: false }
    return { patron: null, ambigu: true, positif, negatif }
  }
  return { patron: 'ubiquitous', ambigu: false }
}

const cible = process.argv[2]
const ref = charger(cible)
const exigences = ref.exigences
if (!Array.isArray(exigences)) erreur('champ `exigences` absent ou non tableau')

const constats = []

for (const [i, e] of exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`
  const enonce = typeof e?.enonce === 'string' ? e.enonce : ''
  const critere = typeof e?.critere === 'string' ? e.critere : ''

  // EA1 — classification stricte. Le seul cas d'échec mécanique : une exigence à mot-clé « Si »
  // dont le critère ne porte aucun marqueur de polarité identifiable (ou les deux à la fois) —
  // le français ne permet pas de trancher optional/unwanted au mot-clé seul.
  const c = classifier(enonce, critere)
  if (c.ambigu) {
    const raison = (c.positif && c.negatif)
      ? 'critère portant à la fois un marqueur positif et un marqueur de négation'
      : 'critère sans marqueur positif ni marqueur de négation identifiable'
    constats.push(constat('EA1', FAIL, ou,
      `patron EARS indécidable entre "optional" et "unwanted" — ${raison}`))
  } else {
    constats.push(constat('EA1', PASS, ou, `classée "${c.patron}"`))
  }

  // EA2 — ambiguïté lexicale, énoncé et critère.
  const trouvesEA2 = detecterAmbigus(`${enonce} ${critere}`)
  constats.push(trouvesEA2.length === 0
    ? constat('EA2', PASS, ou, 'aucun terme ambigu de la liste fermée')
    : constat('EA2', FAIL, ou, `termes ambigus (portée non bornée) : ${[...new Set(trouvesEA2)].join(', ')}`))

  // EA3 — cohérence du patron déclaré (`patron_ears`, champ facultatif) et du patron calculé.
  // Absent => SANS_OBJET, rien à confronter. Patron calculé indécidable => SANS_OBJET, EA1 porte
  // déjà le défaut. Un SANS_OBJET ne vaut jamais PASS (cf. _contrat.mjs).
  const declare = e?.patron_ears
  if (declare === undefined) {
    constats.push(constat('EA3', SANS_OBJET, ou, 'aucun `patron_ears` déclaré à confronter'))
  } else if (!PATRONS.includes(declare)) {
    constats.push(constat('EA3', FAIL, ou,
      `\`patron_ears\` hors ensemble fermé : ${JSON.stringify(declare)} — attendu ${PATRONS.join(' | ')}`))
  } else if (c.ambigu) {
    constats.push(constat('EA3', SANS_OBJET, ou, 'patron calculé indécidable (cf. EA1), confrontation impossible'))
  } else if (declare !== c.patron) {
    constats.push(constat('EA3', FAIL, ou, `déclaré "${declare}", calculé "${c.patron}" — incohérent`))
  } else {
    constats.push(constat('EA3', PASS, ou, `déclaré et calculé cohérents : "${declare}"`))
  }

  // EA4 — traitement asynchrone : les quatre réponses dues (TF-0376).
  const texte = `${enonce} ${critere}`
  if (!mentionne(texte, DECLENCHEURS_ASYNC)) {
    constats.push(constat('EA4', SANS_OBJET, ou, 'aucun traitement asynchrone mentionné — rien à exiger'))
  } else {
    const manque = reponsesManquantes(texte, REPONSES_ASYNC)
    constats.push(manque.length === 0
      ? constat('EA4', PASS, ou, 'traitement asynchrone : les quatre réponses sont présentes')
      : constat('EA4', FAIL, ou,
        `traitement asynchrone déclaré, réponse(s) DUE(S) et absente(s) : ${manque.join(', ')} — ` +
        "une exigence qui annonce un traitement asynchrone sans dire comment sa fin s'observe est " +
        'incomplète au même titre qu\'une exigence sans critère testable'))
  }

  // EA5 — authentification : le cycle de vie de la session (TF-0376).
  if (!mentionne(texte, DECLENCHEURS_AUTH)) {
    constats.push(constat('EA5', SANS_OBJET, ou, 'aucune authentification mentionnée — rien à exiger'))
  } else {
    const manque = reponsesManquantes(texte, REPONSES_AUTH)
    constats.push(manque.length === 0
      ? constat('EA5', PASS, ou, 'authentification : le cycle de vie de la session est spécifié')
      : constat('EA5', FAIL, ou,
        `authentification déclarée, réponse(s) DUE(S) et absente(s) : ${manque.join(', ')} — ` +
        "« SSO via OIDC » ne dit rien de la durée applicative ni de ce que devient le travail " +
        'en cours quand la session expire'))
  }

  // EA6 — refus spécifié : la contrepartie observable est due (TF-0570).
  if (!mentionne(texte, DECLENCHEURS_REFUS)) {
    constats.push(constat('EA6', SANS_OBJET, ou, 'aucun refus spécifié — rien à exiger'))
  } else {
    const manque = reponsesManquantes(texte, REPONSES_REFUS)
    constats.push(manque.length === 0
      ? constat('EA6', PASS, ou, 'refus spécifié : le message, le geste et la distinction de cause sont dits')
      : constat('EA6', FAIL, ou,
        `refus spécifié, réponse(s) DUE(S) et absente(s) : ${manque.join(', ')} — ` +
        'un refus dit côté serveur et muet côté écran produit une phrase générique pour toutes ' +
        "ses causes, et l'instruction qu'elle porte est fausse pour presque toutes"))
  }

  // EA7 — dépendance externe : le mode d'indisponibilité et le sort du geste (TF-0576).
  if (!mentionne(texte, DECLENCHEURS_DEPENDANCE)) {
    constats.push(constat('EA7', SANS_OBJET, ou, 'aucune dépendance externe mentionnée — rien à exiger'))
  } else {
    const manque = reponsesManquantes(texte, REPONSES_DEPENDANCE)
    constats.push(manque.length === 0
      ? constat('EA7', PASS, ou, "dépendance externe : son indisponibilité et le sort du geste sont dits")
      : constat('EA7', FAIL, ou,
        `dépendance externe déclarée, réponse(s) DUE(S) et absente(s) : ${manque.join(', ')} — ` +
        'un contrat qui ne connaît que son cas heureux ne laisse à son adaptateur aucun endroit ' +
        "pour dire « je n'ai pas pu » : la panne remonte nue, et un refus définitif devient " +
        'indiscernable d\'une panne transitoire'))
  }

  // EA8 — identité déléguée : le substitut local, ses identités, sa bascule, son garde (TF-0577).
  if (!mentionne(texte, DECLENCHEURS_DELEGATION)) {
    constats.push(constat('EA8', SANS_OBJET, ou, "aucune identité déléguée nommée — une authentification LOCALE n'a besoin d'aucun substitut"))
  } else {
    const manque = reponsesManquantes(texte, REPONSES_DELEGATION)
    constats.push(manque.length === 0
      ? constat('EA8', PASS, ou, 'identité déléguée : le substitut local, ses identités de test, sa bascule et son garde sont dits')
      : constat('EA8', FAIL, ou,
        `identité déléguée nommée, réponse(s) DUE(S) et absente(s) : ${manque.join(', ')} — ` +
        "on ne peut pas tester de bout en bout ce qu'on ne peut pas authentifier, et on ne peut " +
        'pas authentifier N identités sans N comptes réels chez le fournisseur. Sans ces réponses, ' +
        "le produit INVENTE son substitut — et la façon la plus tentante de l'inventer, fabriquer " +
        "la session dans le stockage du navigateur, saute le seul contrôle qui aurait vu l'erreur"))
  }

  // EA9 — stratégie de tests : les périmètres, leur état, les refus, l'accessibilité (TF-0588).
  if (!mentionne(texte, DECLENCHEURS_STRATEGIE_TESTS)) {
    constats.push(constat('EA9', SANS_OBJET, ou, "aucune stratégie de tests demandée — rien à énumérer"))
  } else {
    const manque = reponsesManquantes(texte, REPONSES_STRATEGIE_TESTS)
    constats.push(manque.length === 0
      ? constat('EA9', PASS, ou, 'stratégie de tests : les périmètres, leur état, les refus et les chemins techniques sont dits')
      : constat('EA9', FAIL, ou,
        `stratégie de tests demandée, réponse(s) DUE(S) et absente(s) : ${manque.join(', ')} — ` +
        "une stratégie sans périmètres énumérés est réputée honorée quand un DOCUMENT existe, pas " +
        "quand les tests existent et s'exécutent : un plan n'est pas un test. Mesuré : la moitié " +
        "d'un produit non testée sous des portes toutes vertes, et le défaut trouvé par un " +
        "utilisateur avec une capture d'écran"))
  }
}

emettre({
  oracle: 'oracle-ears',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La justesse du déclencheur reconnu — la forme est classée, pas que la condition décrite ' +
      'corresponde à un état réel du système (même limite que E7).',
    'La désambiguïsation optional/unwanted par polarité est une heuristique lexicale, pas une ' +
      'lecture sémantique : un critère au vocabulaire hors des deux listes fermées reste `ambigu` ' +
      'et se corrige en reformulant, jamais en élargissant les listes au cas par cas.',
    'L\'ambiguïté lexicale hors de la liste fermée EA2 — un terme flou absent de la liste passe ' +
      'sans faire échouer la règle.',
    'EA4/EA5 lisent un VOCABULAIRE, pas un sens : une exigence qui décrit un traitement ' +
      "asynchrone sans employer aucun des mots de la liste passe en SANS_OBJET. C'est la limite " +
      "symétrique d'EA2, et elle se corrige en rédigeant, pas en élargissant la liste au cas par cas.",
    'EA4/EA5 constatent la PRÉSENCE des quatre réponses, jamais leur justesse : « dans un délai ' +
      "maximal » satisfait la règle sans dire quel délai. Le chiffre est jugé par E3 (critère " +
      "testable), pas ici — les deux contrôles sont jumeaux, aucun ne remplace l'autre.",
    'EA7 lit une DÉPENDANCE NOMMÉE, pas une architecture : une exigence qui décrit un appel ' +
      "d'infrastructure sans employer aucun des termes de la liste passe en SANS_OBJET. La forme " +
      'la plus sûre du contrôle serait STRUCTURELLE — un port dont un adaptateur ouvre une socket ' +
      "ou un client HTTP — mais elle demande de lire le CODE, ce qu'un oracle de conception ne " +
      'voit pas : ce versant est mécanisable côté development, et il y est déclaré plutôt que promis ici.',
    'EA6 lit un VOCABULAIRE DE REFUS, pas une intention : une exigence qui borne implicitement ' +
      "(« l'import accepte les PDF ») sans employer aucun mot de refus passe en SANS_OBJET. " +
      'La borne implicite est le cas que la règle ne voit pas, et se corrige en rédigeant le refus.',
    'EA6 constate la PRÉSENCE du message, du geste et de la distinction de cause, jamais leur ' +
      "justesse : « un message est affiché » satisfait la règle sans dire lequel, et « réessayer » " +
      'la satisfait aussi alors que c’est précisément l’instruction fausse qui a fait naître la ' +
      "règle. Le texte du message relève de la revue humaine, pas d'un oracle lexical.",
    'EA8 lit une DÉLÉGATION NOMMÉE, pas une architecture d\'identité : une exigence qui confie ' +
      "l'authentification à un tiers sans employer aucun des termes de la liste passe en " +
      "SANS_OBJET — même limite qu'EA7, et elle se corrige en NOMMANT le fournisseur.",
    'EA8 constate la PRÉSENCE des quatre réponses, jamais leur JUSTESSE, et la quatrième est ' +
      "celle où l'écart compte le plus : « le mode local est interdit en production » satisfait " +
      "la règle alors que c'est précisément la forme FAUSSE du garde. Un garde qui s'appuie sur " +
      "le NOM de l'environnement ne discrimine rien — un Dev cloud porte la valeur `dev` avec un " +
      'fournisseur RÉEL. Le garde juste porte sur un FAIT vérifiable (un émetteur privé, une ' +
      "audience unique), et cette différence relève de la revue humaine et du versant " +
      "development, pas d'un oracle lexical.",
    'EA9 lit un VOCABULAIRE DE DEMANDE, pas une intention : une exigence qui commande des tests ' +
      "sans employer aucun des termes de la liste passe en SANS_OBJET — meme limite qu'EA7 et EA8.",
    "EA9 et EA6 se REVEILLENT sur le meme mot, et l'interaction est declaree plutot que " +
      "corrigee : la reponse (c) d'EA9 demande que les parcours de REFUS soient testes, et le " +
      "mot « refus » est un declencheur d'EA6, qui exige alors le message et le geste d'un refus " +
      "UTILISATEUR. Une exigence qui dit « les parcours de refus sont couverts » verra donc EA6 " +
      "s'allumer a tort. Distinguer « specifier un refus » de « tester des refus » est une lecture " +
      "de SENS, que cet oracle ne fait pas ; les autres formulations acceptees par EA9 (« cas " +
      "d'erreur », « parcours en echec fonctionnel ») contournent la collision sans rien " +
      "affaiblir. Elargir EA6 pour exclure ce cas eteindrait la regle sur des refus REELS : le " +
      "prix est paye du bon cote.",
    "EA4/EA5 jugent l'exigence PRISE SEULE. Un projet qui répond aux quatre questions dans une " +
      "exigence transverse (« toute session expire après 30 min ») fera échouer chaque exigence " +
      "d'authentification particulière : le rattachement d'une réponse portée ailleurs n'est pas " +
      'mécanisé, et le déclarer vaut mieux que de le supposer.'
  ]
})
