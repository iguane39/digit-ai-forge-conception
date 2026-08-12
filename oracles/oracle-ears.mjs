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
      'sans faire échouer la règle.'
  ]
})
