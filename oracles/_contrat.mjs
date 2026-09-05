// Contrat commun des oracles de la Forge Conception.
// Node seul, aucune dépendance npm. JSON sur stdout, exit 0 / 1 / 2.
//
//   0 = PASS      aucune règle en échec
//   1 = FAIL      au moins une règle en échec, chacune localisée
//   2 = ERREUR    l'oracle n'a pas pu juger (référentiel illisible, argument manquant)
//
// Un oracle ne juge jamais ce qu'il ne peut pas décider : il le déclare en `non_juge`.

import { readFileSync } from 'node:fs'

export const PASS = 'PASS'
export const FAIL = 'FAIL'
export const SANS_OBJET = 'SANS_OBJET'

/** Charge un référentiel. Sort en 2 — jamais en 1 — si la lecture échoue. */
export function charger (chemin) {
  if (!chemin) erreur('argument manquant : chemin du référentiel')
  let brut
  try {
    brut = readFileSync(chemin, 'utf8')
  } catch (e) {
    erreur(`référentiel illisible : ${chemin} (${e.code ?? e.message})`)
  }
  try {
    return JSON.parse(brut)
  } catch (e) {
    erreur(`référentiel non parsable : ${chemin} (${e.message})`)
  }
}

/** Un constat localisant. `ou` désigne l'élément fautif, jamais « quelque part ». */
export function constat (regle, statut, ou, message) {
  return { regle, statut, ou, message }
}

/**
 * Émet le rapport et sort.
 * Le statut global est FAIL dès qu'un constat est FAIL. Un SANS_OBJET ne vaut jamais PASS :
 * il est compté à part et reste visible dans le rapport.
 */
export function emettre ({ oracle, version, cible, constats, non_juge }) {
  const echecs = constats.filter(c => c.statut === FAIL)
  const sansObjet = constats.filter(c => c.statut === SANS_OBJET)
  const rapport = {
    oracle,
    version,
    cible,
    verdict: echecs.length === 0 ? PASS : FAIL,
    compte: {
      total: constats.length,
      pass: constats.filter(c => c.statut === PASS).length,
      fail: echecs.length,
      sans_objet: sansObjet.length
    },
    constats,
    non_juge
  }
  process.stdout.write(JSON.stringify(rapport, null, 2) + '\n')
  process.exit(echecs.length === 0 ? 0 : 1)
}

/** Sortie 2 : l'oracle n'a pas jugé. À ne jamais confondre avec un échec de règle. */
export function erreur (message) {
  process.stdout.write(JSON.stringify({ verdict: 'ERREUR', message }, null, 2) + '\n')
  process.exit(2)
}

/** Les champs traversés par plusieurs oracles, définis une seule fois. */
export const PALIERS = ['MVP', 'V1', 'V2']
export const NATURES = ['fait constaté', 'hypothèse']

/**
 * TF-0799 — frontières de mot Unicode pour les gardes lexicales.
 *
 * `\b` est ASCII dans le moteur de Node : un caractère accentué y vaut frontière de mot. Sur
 * des textes français, cela produit les DEUX défauts, mesurés le 05/09/2026 :
 *   — faux positif : `\belle\b` se déclenche À L'INTÉRIEUR de « réelle » (le `é` fait
 *     frontière) — un critère juste est refusé, et l'auteur réécrit l'énoncé pour esquiver la
 *     garde plutôt que pour écrire juste ;
 *   — faux négatif : un motif dont le bord est accentué n'atteint jamais sa forme accentuée —
 *     `\bça\b`, `\bcelle-là\b`, `de qualité\b`, `10 €`, `80 %`, `etc.\b` ne matchent rien.
 *
 * AVANT / APRÈS généralisent EXACTEMENT le caractère de mot d'ASCII (`[A-Za-z0-9_]`) à son
 * équivalent Unicode (`[\p{L}\p{N}_]`) : sur un texte sans accent, le verdict est inchangé —
 * seul l'accent cesse de faire frontière. Les chiffres et le `_` restent des caractères de mot,
 * pour qu'aucune garde ne s'élargisse au passage (`elle2` ne devient pas un pronom).
 *
 * Tout motif qui les emploie EXIGE le drapeau `u` — lequel rend invalides les échappements
 * inutiles (`\-` hors classe, par exemple) : rejouer `node oracles/self-test.mjs` après chaque
 * motif changé.
 */
export const AVANT = '(?<![\\p{L}\\p{N}_])'
export const APRES = '(?![\\p{L}\\p{N}_])'

/**
 * Une garde lexicale sur une liste fermée de motifs, bornée aux frontières Unicode ci-dessus.
 * Le `s?` final tolère le pluriel du dernier mot du motif (« erreurs », « états vides »).
 */
export const lexique = (motifs) => new RegExp(`${AVANT}(${motifs.join('|')})s?${APRES}`, 'iu')

/**
 * TF-0811 puis TF-0814 — le format COMMUN d'un écart explicite, défini une seule fois.
 *
 * Deux champs racine portent désormais des écarts : `ecarts_surface_implicite` (les onze
 * candidats d'office de la surface implicite, `oracle-surface` S4) et `ecarts_exigences_socle`
 * (les trois exigences socle candidates, `oracle-exigences` E10). Ce qui fait qu'un écart
 * TIENT ne dépend pas de la liste close visée : deux définitions divergeraient au premier
 * correctif, et « écarté explicitement » cesserait de vouloir dire la même chose selon la
 * règle qui lit. La liste des clés recevables est donc le seul paramètre.
 *
 * Rend la chaîne VIDE quand l'écart tient, sinon ce qui lui manque, en clair.
 */
export const MOTIF_MINIMUM = 20 // caractères : plus court, ce n'est pas une raison, c'est un mot
const RE_DATE_ECART = /^\d{4}-\d{2}-\d{2}$/

export function defautDEcart (e, cles) {
  const texte = (v) => (typeof v === 'string' ? v.trim() : '')
  if (!e || typeof e !== 'object' || Array.isArray(e)) return 'entrée non objet'
  if (!cles.includes(texte(e.element))) {
    return `\`element\` « ${texte(e.element) || '(vide)'} » hors de la liste close ` +
      `(${cles.join(', ')})`
  }
  if (texte(e.motif).length < MOTIF_MINIMUM) {
    return `\`motif\` de ${texte(e.motif).length} caractère(s), minimum ${MOTIF_MINIMUM} — ` +
      'un écart sans raison écrite est un oubli déguisé'
  }
  if (texte(e.decide_par) === '') {
    return '`decide_par` absent ou vide — un écart est décidé par quelqu\'un'
  }
  if (!RE_DATE_ECART.test(texte(e.date))) return '`date` absente ou hors format AAAA-MM-JJ'
  return ''
}
