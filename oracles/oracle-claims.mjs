// oracle-claims — aucune donnée chiffrée non marquée.
// Usage : node oracle-claims.mjs <EXIGENCES.json>
// CDC §7.4 — règles A1 et A2.
//
// Séparation qui fonde cet oracle : un chiffre dans un `critere` est une CIBLE que l'on fixe
// (exigée par oracle-exigences E3) ; un chiffre dans un `enonce` est une AFFIRMATION sur le
// monde. Seule la seconde demande une source.

import { charger, constat, emettre, erreur, PASS, FAIL, SANS_OBJET } from './_contrat.mjs'

const VERSION = '1.0.0'

// Un chiffre porteur d'affirmation. Les ordinaux et les identifiants ne comptent pas.
const CHIFFRE = /(^|[^\w-])\d+(?:[ .,]\d+)*\s*(?:%|k|K|M|Md|milliers?|millions?|milliards?|€|\$|ms|s|min|h|jours?|semaines?|mois|ans?|Ko|Mo|Go|To|utilisateurs?|clients?|requ[eê]tes?|lignes?|dossiers?|commandes?|fois)\b/
const MARQUEUR = /à vérifier/i

// Faux positifs à écarter : références internes et versions.
const NEUTRALISER = [
  /\b[A-Z]-\d+\b/g,          // E-001, B-01, S-12
  /\bv?\d+\.\d+(\.\d+)?\b/g, // 1.0.0, v2.1
  /\b(19|20)\d{2}\b/g,       // années nues
  /\bMVP\b|\bV1\b|\bV2\b/g
]

function nettoyer (texte) {
  let t = texte
  for (const re of NEUTRALISER) t = t.replace(re, ' ')
  return t
}

const cible = process.argv[2]
const ref = charger(cible)
if (!Array.isArray(ref.exigences)) erreur('champ `exigences` absent ou non tableau')

const constats = []

function juger (ou, texte, statut) {
  const propre = nettoyer(texte ?? '')
  if (!CHIFFRE.test(propre)) {
    return constat('A1', PASS, ou, 'aucun chiffre porteur d\'affirmation')
  }
  if (MARQUEUR.test(texte)) {
    return constat('A1', PASS, ou, 'chiffre marqué « à vérifier »')
  }
  const nature = statut?.nature
  const source = typeof statut?.source === 'string' ? statut.source.trim() : ''
  if (nature === 'fait constaté' && source !== '') {
    return constat('A1', PASS, ou, `chiffre tracé à une source : ${source}`)
  }
  return constat('A1', FAIL, ou,
    'chiffre avancé sans source ni mention « à vérifier » — ' +
    `statut épistémique : ${nature ?? 'absent'}${source === '' ? ', source vide' : ''}`)
}

// R-C6 — un besoin n'a pas de `statut_epistemique` au sens des exigences (le schéma ne l'offre
// pas) mais peut porter un champ `source` optionnel. Un chiffre dans `besoin.enonce` est admis
// dès que `besoin.source` est non vide, ou que l'énoncé porte « à vérifier ».
function jugerBesoin (ou, texte, source) {
  const propre = nettoyer(texte ?? '')
  if (!CHIFFRE.test(propre)) {
    return constat('A1', PASS, ou, 'aucun chiffre porteur d\'affirmation')
  }
  if (MARQUEUR.test(texte)) {
    return constat('A1', PASS, ou, 'chiffre marqué « à vérifier »')
  }
  const src = typeof source === 'string' ? source.trim() : ''
  if (src !== '') {
    return constat('A1', PASS, ou, `chiffre tracé à une source : ${src}`)
  }
  return constat('A1', FAIL, ou,
    'chiffre avancé sans source ni mention « à vérifier » — besoin.source absent ou vide')
}

// A1 sur les énoncés d'exigence.
for (const [i, e] of ref.exigences.entries()) {
  const ou = e?.id ? `exigences[${i}].enonce (${e.id})` : `exigences[${i}].enonce`
  constats.push(juger(ou, e?.enonce, e?.statut_epistemique))
}

// A1 sur les énoncés de besoin. Un besoin sans statut épistémique doit marquer ses chiffres.
if (Array.isArray(ref.besoins)) {
  for (const [i, b] of ref.besoins.entries()) {
    const ou = b?.id ? `besoins[${i}].enonce (${b.id})` : `besoins[${i}].enonce`
    constats.push(jugerBesoin(ou, b?.enonce, b?.source))
  }
} else {
  constats.push(constat('A1', SANS_OBJET, 'besoins[]', 'aucun besoin déclaré'))
}

// A2 — trace explicite du périmètre écarté. Un oracle dit aussi ce qu'il ne juge pas.
constats.push(constat('A2', SANS_OBJET, 'exigences[].critere',
  `${ref.exigences.length} critère(s) hors périmètre : un critère chiffré est une cible, ` +
  'pas une affirmation. Jugé par oracle-exigences E3'))

emettre({
  oracle: 'oracle-claims',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La véracité de la source citée. L\'oracle vérifie qu\'une source existe, jamais qu\'elle dit vrai.',
    'Les affirmations non chiffrées — « le marché est mûr » passe A1 sans être moins invérifiable.'
  ]
})
