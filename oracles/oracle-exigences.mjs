// oracle-exigences — testabilité de l'énoncé d'exigence.
// Usage : node oracle-exigences.mjs <EXIGENCES.json>
// CDC §7.1 — règles E1 à E6. E7-E9 : étude P-10 d'organization (EARS · ISO/IEC/IEEE 29148 ·
// INCOSE GtWR v4), TF-0015 — 3 contrôles proposés à l'état d'étude, ici rendus exécutables.

import { charger, constat, emettre, erreur, PASS, FAIL, PALIERS, NATURES } from './_contrat.mjs'

const VERSION = '1.1.0'

// --- Checklist versionnée ---------------------------------------------------

const CHAMPS_OBLIGATOIRES = [
  'id', 'besoin', 'enonce', 'critere', 'palier', 'statut_epistemique', 'cotation'
]

// E3 — un critère chiffré porte une valeur ET son unité, ou un comparateur numérique.
const UNITES = '%|ms|s|min|h|j|jours?|semaines?|mois|Ko|Mo|Go|px|caract[eè]res?|' +
  '[eé]l[eé]ments?|lignes?|items?|€|fois|tentatives?|niveaux?|utilisateurs?|' +
  'requ[eê]tes?|champs?|clics?|[eé]crans?'
const CHIFFRE = new RegExp(`(^|[^\\w])(?:[<>≤≥=]\\s*)?\\d+(?:[.,]\\d+)?\\s*(?:${UNITES})\\b`, 'i')
const COMPARATEUR = /[<>≤≥]\s*\d/

// E3 — un critère binaire porte un prédicat observable. Liste fermée, versionnée.
const PREDICATS_BINAIRES = [
  'est affiché', "n'est pas affiché", 'est présent', 'est absent', 'est visible',
  'est invisible', 'est créé', 'est supprimé', 'est enregistré', 'est rejeté',
  'est refusé', 'est accepté', 'est bloqué', 'est autorisé', 'est interdit',
  'est journalisé', 'est notifié', 'est envoyé', 'est reçu', 'est vrai', 'est faux',
  'retourne', 'renvoie', 'apparaît', 'disparaît', 'existe', "n'existe pas",
  'échoue', 'aboutit', 'est identique', 'est différent'
]

// R-C5 — les prédicats « est … » / « n'est pas … » acceptent aussi leurs formes accordées
// (féminin, pluriel : « est présente », « sont présentes », « ne sont pas créés »). La liste
// fermée ci-dessus ne change pas : chaque variante est DÉRIVÉE de son entrée, aucune n'est
// ajoutée à la main. Les prédicats verbaux (retourne, existe, échoue…) n'ont pas d'accord de
// genre et restent matchés tels quels — élargir à leur conjugaison plurielle sortirait du
// périmètre de ce correctif.
const ACCORD_IRREGULIER = { faux: ['fausse', 'fausses'] }

function formesAccordees (mot) {
  if (ACCORD_IRREGULIER[mot]) return [...ACCORD_IRREGULIER[mot], mot]
  const feminin = mot.endsWith('e') ? mot : mot + 'e'
  return [...new Set([feminin, mot + 's', feminin + 's'])]
}

function variantesPredicat (predicat) {
  let prefixeSingulier, prefixePluriel
  if (predicat.startsWith("n'est pas ")) {
    prefixeSingulier = "n'est pas "
    prefixePluriel = 'ne sont pas '
  } else if (predicat.startsWith('est ')) {
    prefixeSingulier = 'est '
    prefixePluriel = 'sont '
  } else {
    return [predicat] // prédicat verbal : forme unique, pas d'accord dérivé
  }
  const base = predicat.slice(prefixeSingulier.length)
  const variantes = new Set([predicat])
  for (const forme of formesAccordees(base)) {
    variantes.add(`${prefixeSingulier}${forme}`)
    variantes.add(`${prefixePluriel}${forme}`)
  }
  return [...variantes]
}

const PREDICATS_BINAIRES_ACCORDES = PREDICATS_BINAIRES.flatMap(variantesPredicat)

// E4 — liste noire. Un critère subjectif n'est pas un critère.
const LISTE_NOIRE = [
  'optimal', 'optimale', 'optimaux', 'optimales',
  'exhaustif', 'exhaustive', 'exhaustifs', 'exhaustives',
  'robuste', 'robustes', 'de qualité',
  'complet', 'complète', 'complets', 'complètes',
  'performant', 'performante', 'performants', 'performantes',
  'intuitif', 'intuitive', 'intuitifs', 'intuitives',
  'moderne', 'modernes', 'fluide', 'fluides',
  'ergonomique', 'ergonomiques', 'simple', 'simples',
  'rapide', 'rapides', 'convivial', 'conviviale', 'conviviaux', 'conviviales'
]
const RE_NOIRE = new RegExp(`\\b(${LISTE_NOIRE.join('|')})\\b`, 'gi')

// E6 — marqueurs d'énumération explicite. L'atomicité sémantique est `non_juge`.
const MARQUEURS_MULTIPLES = [';', ' puis ', ' ainsi que ', ' et/ou ', ' et également ', ' ou bien ']

// E7 — grammaire EARS transposée en français (étude P-10, §4). Toute exigence commençant par
// un mot-clé de condition doit porter sa partie principale complète après la virgule : une
// condition sans suite (« orpheline ») ne se vérifie pas. Les exigences sans mot-clé restent
// dans la forme « ubiquitaire » (sujet, prédicat, complément) — recevable telle quelle.
const MOTS_CONDITION = ['tant que', 'quand', 'lorsque', 'si']
const RE_CONDITION = new RegExp(`^(${MOTS_CONDITION.join('|')})\\b`, 'i')

function raisonOrpheline (enonce) {
  const virgule = enonce.indexOf(',')
  if (virgule === -1) return 'aucune virgule : la partie principale ne se distingue pas de la condition'
  const reste = enonce.slice(virgule + 1).trim()
  if (reste === '') return 'virgule suivie de rien : condition orpheline'
  const mots = reste.split(/\s+/).filter(Boolean)
  if (mots.length < 2) return `partie principale trop courte (${mots.length} mot) pour porter sujet et prédicat`
  return null
}

// E8 — absolus/superlatifs (INCOSE R26) et pronoms personnels/indéfinis (INCOSE R24), étude
// P-10 §3.3 M3/M4. Distincte d'E4 : E4 attrape le ressenti subjectif, E8 attrape l'absence de
// sujet vérifiable (pronom sans antécédent mécanique) ou une portée non bornée (« toujours »,
// « tous », « 100 % »).
const LISTE_ABSOLUS = ['toujours', 'jamais', 'tous', 'toutes', 'systématiquement']
const RE_ABSOLUS = new RegExp(`\\b(${LISTE_ABSOLUS.join('|')})\\b`, 'gi')
const RE_POURCENT_TOTAL = /\b100\s?%/g
const LISTE_PRONOMS = [
  'il', 'elle', 'ils', 'elles', 'cela', 'ça', 'on', 'lui', 'eux',
  'celui-ci', 'celle-ci', 'celui-là', 'celle-là'
]
const RE_PRONOMS = new RegExp(`\\b(${LISTE_PRONOMS.join('|')})\\b`, 'gi')

// E9 — caractéristiques d'ensemble (ISO/IEC/IEEE 29148 : *complete*, *consistent*), étude P-10
// §3.3 M2. Contrôle mécanique, pas sémantique : deux exigences du même besoin, partageant un
// élément de surface, dont les critères ne diffèrent que par un couple de prédicats antonymes
// de la liste fermée E3 sur un reste identique, sont réputées contradictoires. Le second volet
// (couverture d'ensemble) est une alarme grossière sur le jeu complet — le contrôle de
// référence, plus précis et paramétrable, reste `oracle-surface` S1/S2 ; le seuil ici reprend
// le raisonnement RC-1 (avertissement au-dessus d'un seuil large, jamais silencieux).
const PAIRES_ANTONYMES = [
  ['est autorisé', 'est interdit'],
  ['est autorisé', 'est bloqué'],
  ['est accepté', 'est refusé'],
  ['est accepté', 'est rejeté'],
  ['est présent', 'est absent'],
  ['est visible', 'est invisible'],
  ['est créé', 'est supprimé'],
  ['est vrai', 'est faux'],
  ['est identique', 'est différent'],
  ['aboutit', 'échoue'],
  ['existe', "n'existe pas"],
  ['est affiché', "n'est pas affiché"]
]
const SEUIL_E9 = 80

function normaliserReste (texte, predicat) {
  const echappe = predicat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const sansPredicat = texte.replace(new RegExp(echappe, 'i'), ' ')
  return sansPredicat.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

// --- Exécution --------------------------------------------------------------

const cible = process.argv[2]
const ref = charger(cible)
const exigences = ref.exigences
if (!Array.isArray(exigences)) erreur('champ `exigences` absent ou non tableau')

const constats = []
const vus = new Map()
const retires = new Set(ref.identifiants_retires ?? [])

for (const [i, e] of exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`

  // E1 — les champs obligatoires sont présents et non vides.
  const manquants = CHAMPS_OBLIGATOIRES.filter(c => {
    const v = e?.[c]
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
  })
  // `surface` est obligatoire, sauf déclaration explicite de hors-surface.
  const aSurface = Array.isArray(e?.surface) && e.surface.length > 0
  const aHorsSurface = typeof e?.hors_surface === 'string' && e.hors_surface.trim() !== ''
  if (!aSurface && !aHorsSurface) manquants.push('surface|hors_surface')
  constats.push(manquants.length === 0
    ? constat('E1', PASS, ou, 'les 8 champs obligatoires sont renseignés')
    : constat('E1', FAIL, ou, `champs manquants ou vides : ${manquants.join(', ')}`))

  // E2 — identifiant unique, jamais réaffecté.
  if (!e?.id) {
    constats.push(constat('E2', FAIL, ou, 'identifiant absent : unicité invérifiable'))
  } else if (vus.has(e.id)) {
    constats.push(constat('E2', FAIL, ou, `identifiant déjà porté par ${vus.get(e.id)}`))
  } else if (retires.has(e.id)) {
    constats.push(constat('E2', FAIL, ou,
      `identifiant ${e.id} listé dans identifiants_retires : un identifiant mort ne revient pas`))
  } else {
    vus.set(e.id, ou)
    constats.push(constat('E2', PASS, ou, 'identifiant unique et non réaffecté'))
  }

  const critere = typeof e?.critere === 'string' ? e.critere : ''
  const enonce = typeof e?.enonce === 'string' ? e.enonce : ''

  // E3 — le critère est chiffré ou binaire.
  const chiffre = CHIFFRE.test(critere) || COMPARATEUR.test(critere)
  const binaire = PREDICATS_BINAIRES_ACCORDES.some(p => critere.toLowerCase().includes(p))
  constats.push(chiffre || binaire
    ? constat('E3', PASS, ou, chiffre ? 'critère chiffré avec unité' : 'critère binaire observable')
    : constat('E3', FAIL, ou,
      'critère ni chiffré (valeur + unité) ni binaire (prédicat observable de la liste fermée)'))

  // E4 — aucun terme de la liste noire, dans l'énoncé comme dans le critère.
  const trouves = [...`${enonce} ${critere}`.matchAll(RE_NOIRE)].map(m => m[0].toLowerCase())
  constats.push(trouves.length === 0
    ? constat('E4', PASS, ou, 'aucun terme subjectif')
    : constat('E4', FAIL, ou, `termes subjectifs : ${[...new Set(trouves)].join(', ')}`))

  // E5 — palier dans l'ensemble fermé.
  constats.push(PALIERS.includes(e?.palier)
    ? constat('E5', PASS, ou, `palier ${e.palier}`)
    : constat('E5', FAIL, ou, `palier invalide : ${JSON.stringify(e?.palier)} — attendu ${PALIERS.join(' | ')}`))

  // E6 — un énoncé, un comportement.
  const multiples = MARQUEURS_MULTIPLES.filter(m => enonce.toLowerCase().includes(m))
  constats.push(multiples.length === 0
    ? constat('E6', PASS, ou, 'aucun marqueur d\'énumération')
    : constat('E6', FAIL, ou,
      `énoncé non atomique — marqueurs : ${multiples.map(m => JSON.stringify(m)).join(', ')}`))

  // E7 — forme conditionnelle EARS (Tant que / Quand / Lorsque / Si) : partie principale non orpheline.
  if (RE_CONDITION.test(enonce.trim())) {
    const raison = raisonOrpheline(enonce.trim())
    constats.push(raison === null
      ? constat('E7', PASS, ou, 'forme conditionnelle reconnue, partie principale présente')
      : constat('E7', FAIL, ou, `condition orpheline — ${raison}`))
  } else {
    constats.push(constat('E7', PASS, ou, 'forme ubiquitaire (pas de condition en tête)'))
  }

  // E8 — absolus/superlatifs et pronoms personnels/indéfinis, énoncé et critère.
  const texteE8 = `${enonce} ${critere}`
  const trouvesE8 = [...new Set([
    ...[...texteE8.matchAll(RE_ABSOLUS)].map(m => m[0].toLowerCase()),
    ...[...texteE8.matchAll(RE_POURCENT_TOTAL)].map(m => m[0].trim()),
    ...[...texteE8.matchAll(RE_PRONOMS)].map(m => m[0].toLowerCase())
  ])]
  constats.push(trouvesE8.length === 0
    ? constat('E8', PASS, ou, 'aucun absolu ni pronom indéfini')
    : constat('E8', FAIL, ou, `absolus/pronoms non vérifiables : ${trouvesE8.join(', ')}`))

  // Contrôle de forme du statut épistémique (support de T4, non redondant : ici la nature seule).
  const nature = e?.statut_epistemique?.nature
  if (nature !== undefined && !NATURES.includes(nature)) {
    constats.push(constat('E1', FAIL, ou,
      `statut_epistemique.nature invalide : ${JSON.stringify(nature)} — attendu ${NATURES.join(' | ')}`))
  }
}

// --- E9 : caractéristiques d'ensemble ---------------------------------------

// Volet 1 — aucun couple d'exigences contradictoires sur le même besoin/surface.
const contradictionsVues = new Set()
for (let i = 0; i < exigences.length; i++) {
  const a = exigences[i]
  const critereA = typeof a?.critere === 'string' ? a.critere : ''
  for (let j = i + 1; j < exigences.length; j++) {
    const b = exigences[j]
    if (!a?.besoin || a.besoin !== b?.besoin) continue
    const surfA = new Set(a?.surface ?? [])
    const surfB = new Set(b?.surface ?? [])
    if (![...surfA].some(s => surfB.has(s))) continue
    const critereB = typeof b?.critere === 'string' ? b.critere : ''
    for (const [pA, pB] of PAIRES_ANTONYMES) {
      const aPorteA = critereA.toLowerCase().includes(pA)
      const aPorteB = critereA.toLowerCase().includes(pB)
      const bPorteA = critereB.toLowerCase().includes(pA)
      const bPorteB = critereB.toLowerCase().includes(pB)
      if (!((aPorteA && bPorteB) || (aPorteB && bPorteA))) continue
      const predA = aPorteA ? pA : pB
      const predB = bPorteA ? pA : pB
      if (normaliserReste(critereA, predA) !== normaliserReste(critereB, predB)) continue
      const cle = [a?.id, b?.id].sort().join('|')
      if (contradictionsVues.has(cle)) continue
      contradictionsVues.add(cle)
      constats.push(constat('E9', FAIL,
        `exigences[${i}] (${a?.id}) vs exigences[${j}] (${b?.id})`,
        `critères contradictoires sur le même besoin/surface : « ${predA} » vs « ${predB} »`))
    }
  }
}
if (contradictionsVues.size === 0) {
  constats.push(constat('E9', PASS, 'exigences[]',
    'aucun couple contradictoire détecté sur les paires antonymes surveillées'))
}

// Volet 2 — chaque élément du périmètre porte au moins une exigence (alarme d'ensemble,
// seuil large — le contrôle nominatif précis reste oracle-surface S1/S2).
const surfaceRefE9 = Array.isArray(ref.surface) ? ref.surface : []
if (surfaceRefE9.length === 0) {
  constats.push(constat('E9', PASS, 'surface[]', 'aucune surface énumérée : rien à borner'))
} else {
  const connusE9 = new Set(surfaceRefE9.map(s => s?.id))
  const couvertsE9 = new Set()
  for (const e of exigences) for (const s of e?.surface ?? []) if (connusE9.has(s)) couvertsE9.add(s)
  const ratioE9 = (couvertsE9.size / surfaceRefE9.length) * 100
  const arrondiE9 = Math.round(ratioE9 * 10) / 10
  const nonCouvertsE9 = surfaceRefE9.filter(s => !couvertsE9.has(s?.id)).map(s => s?.id)
  constats.push(ratioE9 >= SEUIL_E9
    ? constat('E9', PASS, 'surface[]',
      `ensemble jugé complet : ${arrondiE9} % ≥ ${SEUIL_E9} %` +
      (nonCouvertsE9.length ? ` (non couverts, cf. oracle-surface : ${nonCouvertsE9.join(', ')})` : ''))
    : constat('E9', FAIL, 'surface[]',
      `ensemble incomplet : ${arrondiE9} % < ${SEUIL_E9} % — non couverts : ${nonCouvertsE9.join(', ')}`))
}

emettre({
  oracle: 'oracle-exigences',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La pertinence produit de l\'exigence — E4 attrape les mots subjectifs, pas le vide de sens.',
    'L\'atomicité sémantique — E6 détecte les marqueurs d\'énumération, pas deux comportements ' +
      'fondus dans une seule phrase sans marqueur.',
    'La justesse d\'une condition EARS reconnue par E7 — la forme est vérifiée, pas que le ' +
      'déclencheur décrit corresponde à un état réel du système.',
    'La contradiction sémantique hors du lexique antonyme surveillé par E9 — deux exigences ' +
      'peuvent se contredire sans jamais employer un couple de prédicats de la liste fermée.'
  ]
})
