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

// D5 — origine « retour d'usage en prose » : chaque opération porte sa SECTION et sa CAUSE
// RACINE (TF-0374, 18/08). Le protocole `qualifie-l-entrant/references/entrants.md` §« Delta
// en PROSE » les prescrit ; sans cette règle, il les prescrirait et rien ne les vérifierait —
// c'est-à-dire qu'il ne les prescrirait pas (R-35).
//
// La règle s'arme de DEUX façons, et la seconde est la plus utile : `origine` déclarée, ou
// n'importe quelle opération portant DÉJÀ l'un des deux champs. Ce second déclenchement
// attrape l'adoption PARTIELLE — trois rubriques classées, quarante-six muettes — qui est pire
// que rien : elle donne l'apparence d'un delta instruit. Aucun des deux : SANS_OBJET, un delta
// ordinaire n'a pas à porter ces champs.
//
// L'ensemble des causes est FERMÉ à quatre. La quatrième est sa raison d'être : une évolution
// de doctrine RESSEMBLE à un écart (elle se présente comme « absent du produit »), et la
// classer en écart ferait bloquer un sprint sur un changement d'avis. Mesure sur Approval le
// 18/08 : 24 des 49 rubriques étaient des écarts au texte ou des sur-livraisons, 12 des lacunes
// de spécification, et 12 des évolutions de doctrine — soit un quart du lot que rien ne doit
// transformer en défaut.
const CAUSES_RACINES = ['ecart-au-texte', 'sur-livraison', 'lacune-de-specification',
  'evolution-de-doctrine']
const ORIGINE_PROSE = 'retour-usage-prose'

const origineDeclaree = delta?.origine === ORIGINE_PROSE
const dejaClasse = operations.some(op => op?.cause_racine !== undefined || op?.section !== undefined)
if (!origineDeclaree && !dejaClasse) {
  constats.push(constat('D5', SANS_OBJET, 'delta',
    `ni \`origine: "${ORIGINE_PROSE}"\` ni aucune opération classée — un delta ordinaire n a pas ` +
    'à porter `section` ni `cause_racine`'))
} else {
  const motif = origineDeclaree
    ? `origine "${ORIGINE_PROSE}" déclarée`
    : 'au moins une opération porte `section` ou `cause_racine` — le lot est donc instruit, et ' +
      'une instruction PARTIELLE est pire que pas d instruction : elle a l apparence d un delta jugé'
  for (const [i, op] of operations.entries()) {
    const ouReel = `operations[${i}]`
    const manquants = ['section', 'cause_racine'].filter(c => !String(op?.[c] ?? '').trim())
    if (manquants.length) {
      constats.push(constat('D5', FAIL, ouReel,
        `${manquants.join(' et ')} absent(s) alors que ${motif}. \`section\` : la référence du ` +
        'référentiel, ou `aucune` — qui est une réponse, pas un blanc. `cause_racine` : ' +
        CAUSES_RACINES.join(' | ')))
    } else if (!CAUSES_RACINES.includes(op.cause_racine)) {
      constats.push(constat('D5', FAIL, ouReel,
        `cause_racine hors ensemble fermé : ${JSON.stringify(op.cause_racine)} — attendu ` +
        `${CAUSES_RACINES.join(' | ')}. La quatrième existe pour que ce qui change est un AVIS ` +
        'ne soit pas compté comme un défaut du code'))
    } else {
      constats.push(constat('D5', PASS, ouReel,
        `section "${op.section}", cause racine "${op.cause_racine}"`))
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
    'D5 vérifie que chaque opération PORTE sa section et sa cause racine, jamais que le ' +
      "classement est juste : une rubrique rangée en `evolution-de-doctrine` pour éviter qu'elle " +
      'bloque passe la règle. Le classement se relit, il ne se calcule pas — et `cat-dev-03` le ' +
      'confronte en aval au code réel.',
    "D5 ne s'arme pas sur un lot ENTIÈREMENT muet qui ne déclare pas son origine : rien ne " +
      "distingue alors un retour d'usage d'un delta ordinaire. C'est la limite du déclenchement " +
      "par déclaration, et elle se corrige en déclarant `origine`, pas en devinant.",
    'Le contenu métier d\'une opération "modifie" ou "ajoute" — jugé, une fois appliqué, par les ' +
      'oracles habituels (oracle-exigences, oracle-surface…) sur le référentiel résultant.',
    'L\'ordre d\'application de plusieurs deltas concurrents — chaque delta est jugé seul.'
  ]
})
