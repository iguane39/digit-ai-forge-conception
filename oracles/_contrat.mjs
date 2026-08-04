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
