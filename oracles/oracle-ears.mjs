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

// EA4 / EA5 — TF-0376 (18/08, retour d'usage Approval2). Ce ne sont pas des règles de forme :
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
  { cle: 'restauration du contexte', motifs: ['restaur', 'contexte', 'brouillon', 'reprend', 'conserv', 'retour à la page'] }
]

const pliSansAccent = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
// TF-0387 (constaté le 18/08 sur EX-044 de factory.digit-ai.fr) — mon `includes()` détectait
// « sso » À L'INTÉRIEUR de « ressource », et EA5 exigeait alors quatre réponses sur le cycle de
// session d'une exigence qui ne mentionne aucune authentification. L'exigence réelle a été
// REFORMULÉE POUR CONTOURNER le faux positif — un contrôle bruyant ne se corrige pas, il se
// fait contourner (R-33 bis). Les termes courts (sso, saml, oidc) étaient les plus exposés.
// Correctif : la même construction à FRONTIÈRES DE MOT que les AMBIGUS d'EA2 — un terme simple
// est encadré de , un terme multi-mots est cherché tel quel, et le texte comme le terme sont
// pliés sans accent AVANT la construction ( ne connaît pas « é »).
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
    "EA4/EA5 jugent l'exigence PRISE SEULE. Un projet qui répond aux quatre questions dans une " +
      "exigence transverse (« toute session expire après 30 min ») fera échouer chaque exigence " +
      "d'authentification particulière : le rattachement d'une réponse portée ailleurs n'est pas " +
      'mécanisé, et le déclarer vaut mieux que de le supposer.'
  ]
})
