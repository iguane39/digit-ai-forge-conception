// controle-s11 — contrôle d'interface avec Forge Tests, en mode DÉGRADÉ.
// Usage : node oracles/controle-s11.mjs <EXIGENCES.json> <referentiel-tests.json>
//
// Ce n'est PAS un oracle de la forge : il ne juge pas un artefact produit ici, il vérifie que
// l'artefact produit ici est CONSOMMABLE par un tiers.
//
// Forge Tests exige que chaque test porte un champ `risque` = identifiant de l'exigence
// couverte, avec un seuil S-11 à 100 % (Spec Forge - Noyau et contrat adaptateur, §157).
// Forge Tests étant en construction non commencée, ce contrôle rejoue la règle sur un
// référentiel de tests écrit à la main — c'est le repli prévu par la question ouverte (g)
// du CDC. Il sera remplacé par une exécution réelle dès que la forge tournera.

import { charger, constat, emettre, erreur, PASS, FAIL } from './_contrat.mjs'

const VERSION = '1.0.0'
const SEUIL_S11 = 100 // non négociable côté Forge Tests

const cibleExigences = process.argv[2]
const cibleTests = process.argv[3]
if (!cibleTests) erreur('usage : controle-s11.mjs <EXIGENCES.json> <referentiel-tests.json>')

const ref = charger(cibleExigences)
const tests = charger(cibleTests)
if (!Array.isArray(ref.exigences)) erreur('champ `exigences` absent ou non tableau')
if (!Array.isArray(tests.tests)) erreur('champ `tests` absent ou non tableau')

const connus = new Set(ref.exigences.map(e => e?.id))
const retires = new Set(ref.identifiants_retires ?? [])
const constats = []
let resolus = 0

for (const [i, t] of tests.tests.entries()) {
  const ou = t?.id ? `tests[${i}] (${t.id})` : `tests[${i}]`
  const r = t?.risque
  if (!r) {
    constats.push(constat('S11', FAIL, ou, 'champ `risque` absent — un test sans lien est supprimable'))
  } else if (retires.has(r)) {
    constats.push(constat('S11', FAIL, ou,
      `pointe ${r}, identifiant retiré : la traçabilité est rompue en silence`))
  } else if (!connus.has(r)) {
    constats.push(constat('S11', FAIL, ou, `pointe ${r}, inconnu du référentiel`))
  } else {
    resolus++
    constats.push(constat('S11', PASS, ou, `résout vers ${r}`))
  }
}

const ratio = tests.tests.length === 0 ? 0 : (resolus / tests.tests.length) * 100
constats.push(ratio >= SEUIL_S11
  ? constat('S11-ratio', PASS, 'referentiel-tests',
    `${Math.round(ratio * 10) / 10} % (${resolus}/${tests.tests.length}), seuil ${SEUIL_S11} %`)
  : constat('S11-ratio', FAIL, 'referentiel-tests',
    `${Math.round(ratio * 10) / 10} % (${resolus}/${tests.tests.length}) sous le seuil ${SEUIL_S11} %`))

// Sens inverse : une exigence sans aucun test n'est pas un échec S-11, mais c'est une
// information que Forge Tests produirait. On la remonte sans la transformer en verdict.
const couvertes = new Set(tests.tests.map(t => t?.risque))
const sansTest = ref.exigences.filter(e => !couvertes.has(e?.id)).map(e => e?.id)

emettre({
  oracle: 'controle-s11 (interface, DÉGRADÉ)',
  version: VERSION,
  cible: `${cibleExigences} × ${cibleTests}`,
  constats,
  non_juge: [
    'La pertinence du test lui-même — ce contrôle vérifie le lien, jamais ce que le test exerce.',
    `Exigences sans aucun test dans ce référentiel : ${sansTest.length ? sansTest.join(', ') : 'aucune'}. ` +
      'Information remontée, pas un verdict : la couverture est le travail de Forge Tests.',
    'Ce contrôle rejoue une règle spécifiée, jamais exécutée par Forge Tests — ' +
      'en construction non commencée au 04/08/2026. À remplacer par une exécution réelle.'
  ]
})
