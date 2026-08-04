// oracle-exigences — testabilité de l'énoncé d'exigence.
// Usage : node oracle-exigences.mjs <EXIGENCES.json>
// CDC §7.1 — règles E1 à E6.

import { charger, constat, emettre, erreur, PASS, FAIL, PALIERS, NATURES } from './_contrat.mjs'

const VERSION = '1.0.0'

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
  const binaire = PREDICATS_BINAIRES.some(p => critere.toLowerCase().includes(p))
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

  // Contrôle de forme du statut épistémique (support de T4, non redondant : ici la nature seule).
  const nature = e?.statut_epistemique?.nature
  if (nature !== undefined && !NATURES.includes(nature)) {
    constats.push(constat('E1', FAIL, ou,
      `statut_epistemique.nature invalide : ${JSON.stringify(nature)} — attendu ${NATURES.join(' | ')}`))
  }
}

emettre({
  oracle: 'oracle-exigences',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La pertinence produit de l\'exigence — E4 attrape les mots subjectifs, pas le vide de sens.',
    'L\'atomicité sémantique — E6 détecte les marqueurs d\'énumération, pas deux comportements ' +
      'fondus dans une seule phrase sans marqueur.'
  ]
})
