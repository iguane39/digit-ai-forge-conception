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
 * Deux champs racine portent désormais des écarts : `ecarts_surface_implicite` (les seize
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

/**
 * TF-2119 puis TF-2132 — QUI décide d'un écart : une décision humaine RÉFÉRENCÉE.
 *
 * Fait (lot de Produit-86 du 03/11/2026) : l'onboarding a été écarté avec `decide_par` « la
 * session de build », S4 a rendu PASS, et le porteur juge cet écart contraire à la loi n° 3 :
 * un écart s'écrit explicitement, par DÉCISION HUMAINE. `defautDEcart` exige un `decide_par` non
 * vide, rien de plus : « la session de build » le remplit. TF-2119 a posé deux conditions pour la
 * surface implicite ; TF-2132 les étend à `ecarts_exigences_socle` (E10), qui partage le contrat
 * commun et n'avait pas la condition. Elles vivent ici, une seule fois, pour que « décidé par un
 * humain » ne veuille pas dire deux choses selon la règle qui lit :
 *   1. `decide_par` ne désigne ni une session, ni un agent, ni un build, ni une IA, un script, un
 *      pipeline… (lexique fermé) ;
 *   2. `decide_par` porte une décision humaine RÉFÉRENCÉE, sous l'une de ces trois formes :
 *      un identifiant de décision (D-N), une entrée de ledger (« ledger » suivi d'un numéro, ou
 *      « seq N »), une citation humaine DATÉE (texte entre guillemets d'au moins 10 caractères
 *      et une date AAAA-MM-JJ ou JJ/MM/AAAA, dans `decide_par`).
 * La FORME de la référence est jugée, jamais son existence : une référence inventée passe
 * (déclaré en `non_juge` par chaque oracle). Un nom d'humain seul ne suffit plus.
 *
 * `objet` : ce qui est écarté, dit dans le message (« un écart de surface implicite », « un écart
 * d'exigence socle »). Rend la chaîne VIDE quand le décideur tient, sinon ce qui lui manque.
 */
const RE_DESIGNE_UNE_MACHINE = lexique(['session', 'agent', 'build', 'ia', 'claude', 'assistant',
  'modèle', 'pipeline', 'script', 'bot', 'orchestrateur', 'automatique', 'automatiquement'])
const RE_DECISION_ID = new RegExp(`${AVANT}D-\\d+${APRES}`, 'u')
const RE_LEDGER = new RegExp(`ledger[^\\n]{0,60}?\\d|${AVANT}seq\\.?\\s*[:#]?\\s*\\d+`, 'iu')
const RE_CITATION = /[«"“][^»"”]{10,}[»"”]/u
const RE_DATE_CITEE = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/

export function defautDuDecideur (decidePar, objet = 'un écart de surface implicite') {
  const t = typeof decidePar === 'string' ? decidePar.trim() : ''
  if (t === '') return '' // l'absence est déjà nommée par le contrat commun
  if (RE_DESIGNE_UNE_MACHINE.test(t)) {
    return `\`decide_par\` « ${t} » désigne une session, un agent ou un build : ${objet} est ` +
      'une décision humaine (loi n° 3, « l\'oubli n\'existe pas »). ' +
      'Nommer l\'humain qui a décidé, avec sa décision référencée (identifiant D-N, entrée de ' +
      'ledger, ou citation humaine datée)'
  }
  const reference = RE_DECISION_ID.test(t) || RE_LEDGER.test(t) ||
    (RE_CITATION.test(t) && RE_DATE_CITEE.test(t))
  if (!reference) {
    return `\`decide_par\` « ${t} » ne porte aucune décision humaine référencée (${objet}) : ` +
      'ajouter un identifiant de décision (D-N), une entrée de ledger (« ledger seq N »), ou ' +
      'une citation humaine datée (« … » et une date AAAA-MM-JJ) — un nom seul n\'atteste pas ' +
      'la décision'
  }
  return ''
}
