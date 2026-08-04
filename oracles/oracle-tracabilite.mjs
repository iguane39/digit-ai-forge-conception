// oracle-tracabilite — bijection besoin ↔ exigence ↔ critère, et régénérabilité des vues.
// Usage : node oracle-tracabilite.mjs <EXIGENCES.json> [--vue <fichier>]...
// CDC §7.2 — règles T1 à T4.

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { charger, constat, emettre, erreur, PASS, FAIL, SANS_OBJET, NATURES } from './_contrat.mjs'

const VERSION = '1.0.0'
const EN_TETE_SOURCE = /<!--\s*source-sha256:\s*([0-9a-f]{64})\s*-->/i

const cible = process.argv[2]
const vues = []
for (let i = 3; i < process.argv.length; i++) {
  if (process.argv[i] === '--vue') {
    const v = process.argv[++i]
    if (!v) erreur('--vue attend un chemin de fichier')
    vues.push(v)
  }
}

const ref = charger(cible)
if (!Array.isArray(ref.exigences)) erreur('champ `exigences` absent ou non tableau')
if (!Array.isArray(ref.besoins)) erreur('champ `besoins` absent ou non tableau')

const constats = []
const besoins = new Map(ref.besoins.map(b => [b?.id, b]))

// --- T1 : aucun orphelin, des deux côtés -----------------------------------

const besoinsCouverts = new Set()
for (const [i, e] of ref.exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`
  if (!e?.besoin) {
    constats.push(constat('T1', FAIL, ou, 'aucun besoin parent déclaré'))
  } else if (!besoins.has(e.besoin)) {
    constats.push(constat('T1', FAIL, ou, `besoin ${e.besoin} introuvable dans besoins[]`))
  } else {
    besoinsCouverts.add(e.besoin)
    constats.push(constat('T1', PASS, ou, `rattachée à ${e.besoin}`))
  }
}
for (const [i, b] of ref.besoins.entries()) {
  const ou = b?.id ? `besoins[${i}] (${b.id})` : `besoins[${i}]`
  constats.push(besoinsCouverts.has(b?.id)
    ? constat('T1', PASS, ou, 'porte au moins une exigence')
    : constat('T1', FAIL, ou, `besoin orphelin : ${b?.id} n'est couvert par aucune exigence`))
}

// --- T2 : exactement un critère non vide -----------------------------------

for (const [i, e] of ref.exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`
  const c = e?.critere
  if (Array.isArray(c)) {
    constats.push(constat('T2', FAIL, ou,
      `critere est un tableau de ${c.length} entrées — une exigence porte exactement un critère`))
  } else if (typeof c !== 'string' || c.trim() === '') {
    constats.push(constat('T2', FAIL, ou, 'critere absent ou vide'))
  } else {
    constats.push(constat('T2', PASS, ou, 'un critère, non vide'))
  }
}

// --- T3 : les vues sont régénérables depuis la source ----------------------

const sha = createHash('sha256').update(readFileSync(cible)).digest('hex')
if (vues.length === 0) {
  constats.push(constat('T3', SANS_OBJET, 'aucune vue fournie',
    'aucun argument --vue : la régénérabilité n\'est pas jugée, elle n\'est pas non plus supposée'))
} else {
  for (const v of vues) {
    let contenu
    try {
      contenu = readFileSync(v, 'utf8')
    } catch (e) {
      constats.push(constat('T3', FAIL, v, `vue illisible (${e.code ?? e.message})`))
      continue
    }
    const m = contenu.match(EN_TETE_SOURCE)
    if (!m) {
      constats.push(constat('T3', FAIL, v,
        'en-tête `<!-- source-sha256: ... -->` absent : la vue ne déclare pas sa source'))
    } else if (m[1].toLowerCase() !== sha) {
      constats.push(constat('T3', FAIL, v,
        `vue périmée ou éditée à la main — déclare ${m[1].slice(0, 12)}…, source à ${sha.slice(0, 12)}…`))
    } else {
      constats.push(constat('T3', PASS, v, 'vue alignée sur la source'))
    }
  }
}

// --- T4 : le statut épistémique porte sa preuve ou son plan ----------------

for (const [i, e] of ref.exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`
  const s = e?.statut_epistemique
  if (!s || !NATURES.includes(s.nature)) {
    constats.push(constat('T4', FAIL, ou,
      `statut_epistemique.nature absent ou invalide — attendu ${NATURES.join(' | ')}`))
  } else if (s.nature === 'fait constaté') {
    constats.push(typeof s.source === 'string' && s.source.trim() !== ''
      ? constat('T4', PASS, ou, 'fait constaté, source citée')
      : constat('T4', FAIL, ou, 'fait constaté sans source : un fait sans source est une hypothèse'))
  } else {
    constats.push(typeof s.validation === 'string' && s.validation.trim() !== ''
      ? constat('T4', PASS, ou, 'hypothèse, mode de validation déclaré')
      : constat('T4', FAIL, ou, 'hypothèse sans mode de validation : rien ne dit comment la lever'))
  }
}

emettre({
  oracle: 'oracle-tracabilite',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La justesse du rattachement exigence → besoin. T1 vérifie que le lien existe, ' +
      'jamais qu\'il est le bon.',
    'La véracité de la source citée en T4 — vérifiée présente, jamais vraie.'
  ]
})
