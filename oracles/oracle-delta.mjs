// oracle-delta — format d'un delta de référentiel et, si fourni, sa cohérence avec la cible.
// Usage : node oracle-delta.mjs <DELTA.json> [--referentiel <EXIGENCES.json>]
// TF-0101 (3/3) — écart à l'état de l'art 2026 : pas de cycle delta propose/apply/archive façon
// OpenSpec pour faire évoluer un référentiel EXISTANT. Directement utile au run de version du
// pilot (RUN-VERSION.md), aujourd'hui sans outillage — le socle se rattrape à la main.
//
// Ce module JUGE le format d'un delta. Il ne mute rien : la mutation (appliquer, archiver) vit
// dans `scripts/delta.mjs`, qui invoque CET oracle avant toute écriture — jamais l'inverse.
// Un delta non conforme au format n'est jamais appliqué, quelle que soit la pression du run.

import { readFileSync } from 'node:fs'
import { constat, emettre, erreur, PASS, FAIL, SANS_OBJET } from './_contrat.mjs'

const VERSION = '1.0.0'

export const STATUTS_DELTA = ['propose', 'applique', 'archive']
export const TYPES_OPERATION = ['ajoute', 'modifie', 'retire']
export const CIBLES = ['besoins', 'exigences', 'surface']
const CHAMPS_OBLIGATOIRES = ['id', 'titre', 'motivation', 'statut', 'operations']

function chargerJson (chemin, quoi) {
  let brut
  try {
    brut = readFileSync(chemin, 'utf8')
  } catch (e) {
    erreur(`${quoi} introuvable ou illisible : ${chemin} (${e.code ?? e.message})`)
  }
  try {
    return JSON.parse(brut)
  } catch (e) {
    erreur(`${quoi} non parsable : ${chemin} (${e.message})`)
  }
}

// --- Arguments ---------------------------------------------------------------

const cible = process.argv[2]
if (!cible) erreur('argument manquant : chemin du DELTA.json')
let cheminReferentiel = null
for (let i = 3; i < process.argv.length; i++) {
  if (process.argv[i] === '--referentiel') {
    cheminReferentiel = process.argv[++i]
    if (!cheminReferentiel) erreur('--referentiel attend un chemin de fichier')
  }
}

const delta = chargerJson(cible, 'DELTA.json')
const constats = []

// D1 — champs obligatoires, `operations` non vide.
const manquants = CHAMPS_OBLIGATOIRES.filter(c => {
  const v = delta?.[c]
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
})
if (!Array.isArray(delta?.operations) || delta.operations.length === 0) {
  if (!manquants.includes('operations')) manquants.push('operations (vide ou non tableau)')
}
constats.push(manquants.length === 0
  ? constat('D1', PASS, 'delta', 'les 5 champs obligatoires sont renseignés, operations non vide')
  : constat('D1', FAIL, 'delta', `champs manquants, vides ou invalides : ${manquants.join(', ')}`))

// D2 — statut dans l'ensemble fermé.
constats.push(STATUTS_DELTA.includes(delta?.statut)
  ? constat('D2', PASS, 'delta.statut', `statut ${delta.statut}`)
  : constat('D2', FAIL, 'delta.statut',
    `statut absent ou hors ensemble fermé : ${JSON.stringify(delta?.statut)} — attendu ${STATUTS_DELTA.join(' | ')}`))

// D3 — forme de chaque opération.
const operations = Array.isArray(delta?.operations) ? delta.operations : []
for (const [i, op] of operations.entries()) {
  const ou = `operations[${i}]`
  const problemes = []
  if (!TYPES_OPERATION.includes(op?.type)) {
    problemes.push(`type hors ensemble fermé : ${JSON.stringify(op?.type)} — attendu ${TYPES_OPERATION.join(' | ')}`)
  }
  if (!CIBLES.includes(op?.cible)) {
    problemes.push(`cible hors ensemble fermé : ${JSON.stringify(op?.cible)} — attendu ${CIBLES.join(' | ')}`)
  }
  if (op?.type === 'ajoute') {
    if (typeof op?.valeur !== 'object' || op.valeur === null || Array.isArray(op.valeur)) {
      problemes.push('opération "ajoute" sans `valeur` (objet attendu)')
    } else if (!op.valeur.id) {
      problemes.push('opération "ajoute" : `valeur.id` manquant')
    }
  } else if (op?.type === 'modifie' || op?.type === 'retire') {
    if (!op?.id) problemes.push(`opération "${op?.type}" sans \`id\` cible`)
  }
  constats.push(problemes.length === 0
    ? constat('D3', PASS, ou, `opération "${op?.type}" sur "${op?.cible}" bien formée`)
    : constat('D3', FAIL, ou, problemes.join(' ; ')))
}
if (operations.length === 0) {
  constats.push(constat('D3', SANS_OBJET, 'operations[]', 'aucune opération à juger (cf. D1)'))
}

// D4 — cohérence avec le référentiel ciblé, seulement si fourni : un `ajoute` ne réutilise pas
// un id déjà porté par la cible ni listé dans `identifiants_retires` (miroir de la règle E2
// d'oracle-exigences.mjs — un identifiant mort ne revient pas) ; `modifie`/`retire` désignent un
// id qui existe réellement dans la cible.
if (!cheminReferentiel) {
  constats.push(constat('D4', SANS_OBJET, 'delta',
    'aucun --referentiel fourni : cohérence avec la cible non confrontée'))
} else {
  const ref = chargerJson(cheminReferentiel, 'référentiel')
  const retires = new Set(ref.identifiants_retires ?? [])
  for (const [i, op] of operations.entries()) {
    const ouReel = `operations[${i}]`
    if (!CIBLES.includes(op?.cible)) continue // déjà signalé par D3, ne pas dupliquer le bruit
    const liste = Array.isArray(ref?.[op.cible]) ? ref[op.cible] : []
    const idsConnus = new Set(liste.map(x => x?.id))
    if (op.type === 'ajoute') {
      const idNouveau = op?.valeur?.id
      if (!idNouveau) continue // déjà signalé par D3
      if (idsConnus.has(idNouveau)) {
        constats.push(constat('D4', FAIL, ouReel,
          `"ajoute" réutilise un id déjà porté par ${op.cible} : ${idNouveau}`))
      } else if (retires.has(idNouveau)) {
        constats.push(constat('D4', FAIL, ouReel,
          `"ajoute" réutilise un id mort (identifiants_retires) : ${idNouveau} — un identifiant retiré ne revient jamais`))
      } else {
        constats.push(constat('D4', PASS, ouReel, `id "${idNouveau}" libre dans ${op.cible}`))
      }
    } else if (op.type === 'modifie' || op.type === 'retire') {
      if (!op?.id) continue // déjà signalé par D3
      constats.push(idsConnus.has(op.id)
        ? constat('D4', PASS, ouReel, `id "${op.id}" existe bien dans ${op.cible}`)
        : constat('D4', FAIL, ouReel, `"${op.type}" désigne un id absent de ${op.cible} : ${op.id}`))
    }
  }
}

emettre({
  oracle: 'oracle-delta',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La pertinence de la `motivation` — D1 vérifie qu\'elle est renseignée, jamais qu\'elle est fondée.',
    'Le contenu métier d\'une opération "modifie" ou "ajoute" — jugé, une fois appliqué, par les ' +
      'oracles habituels (oracle-exigences, oracle-surface…) sur le référentiel résultant.',
    'L\'ordre d\'application de plusieurs deltas concurrents — chaque delta est jugé seul.'
  ]
})
