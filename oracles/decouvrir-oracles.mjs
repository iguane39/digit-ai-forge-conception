#!/usr/bin/env node
// decouvrir-oracles -- les oracles de la Forge Conception, LUS SUR LE DISQUE (TF-1319,
// 23/09/2026 : temps 2 du verdict O3 de l'etude du pilot du 19/08/2026 sur le meta-oracle
// d'enclenchement).
//
// POURQUOI. Un run consigne au ledger une entree `oracles_verdict` par oracle qui a tourne (forme
// canonique TF-0385). Pour dire lesquels MANQUENT, le juge du pilot doit savoir ce que chaque forge
// mobilisee porte. Cette forge savait deja le faire : depuis le 14/08, run-oracles-conception.mjs
// lance « chaque oracle du dossier », lu par `readdirSync`, jamais par une liste. Mais cette
// connaissance etait enfermee dans le lanceur, qui ne sait que LANCER : personne ne pouvait lui
// demander la liste sans jouer tous les oracles sur un referentiel. Ce module la sort, et le lanceur
// l'importe -- une seule regle, deux lecteurs : ce que la forge DECLARE porter est exactement ce que
// son lanceur LANCE (mesure le 23/09/2026 : 11 oracles, les memes des deux cotes).
//
// LE CONTRAT, COMMUN AU PARC (`digit-ai/decouverte-oracles@1`, CONTRAT-INTERFACE.md §3 du pilot) :
//   node oracles/decouvrir-oracles.mjs [--racine <dossier-de-la-forge>]
//   stdout : { contrat, forge, racine, regle, oracles: [{ nom, chemin }], non_juge: [] }
//   exit 0 : decouverte faite -- une liste vide est un resultat, et elle se lit comme telle ;
//   exit 2 : dossier des oracles illisible, motif dit. Jamais d'exit 1 : decouvrir n'est pas juger.
// Ce module ne lance aucun oracle et n'ecrit rien.
//
// LA REGLE est celle du lanceur, au caractere pres : tout fichier de `oracles/` (premier niveau)
// dont le nom repond a /^oracle-[\w-]+\.mjs$/. `controle-s11.mjs` n'y entre pas, et c'est son
// propre en-tete qui le dit (« Ce n'est PAS un oracle de la forge ») -- alors que `manifeste.json`
// le range parmi les `oracles_transverses` : l'ecart est DECLARE en non_juge, pas tranche ici.
//
// Recette a double sens : `oracles/self-test.mjs`, branche « decouverte des oracles (TF-1319) ».

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const CONTRAT = 'digit-ai/decouverte-oracles@1'
export const FORGE = 'digit-ai-forge-conception'
export const MOTIF_ORACLE = /^oracle-[\w-]+\.mjs$/
export const REGLE = 'tout fichier de `oracles/` (premier niveau) nomme `oracle-<nom>.mjs` -- la regle meme '
  + 'du lanceur run-oracles-conception.mjs, qui l\'importe d\'ici ; lue sur le disque a chaque appel'

/** Les fichiers-oracles d'un dossier, tries -- la liste que le lanceur joue. */
export function nomsDesOracles (dossier) {
  return readdirSync(dossier).filter((f) => MOTIF_ORACLE.test(f)).sort()
}

/** La decouverte au contrat commun. `racine` = la racine de la forge (le parent de `oracles/`). */
export function decouvrirOracles (racine) {
  const dossier = join(racine, 'oracles')
  const base = { contrat: CONTRAT, forge: FORGE, racine, regle: REGLE, oracles: [] }
  let lisible = false
  try { lisible = existsSync(dossier) && statSync(dossier).isDirectory() } catch { lisible = false }
  if (!lisible) {
    return { ...base, motif: `dossier des oracles introuvable ou illisible : ${dossier} -- rien n'a ete decouvert`, non_juge: [] }
  }
  const oracles = nomsDesOracles(dossier).map((f) => ({ nom: f.replace(/\.mjs$/, ''), chemin: `oracles/${f}` }))
  // Ce que le manifeste de la forge DECLARE oracle sans que son nom le dise : lu, jamais recopie.
  // Un manifeste absent ou illisible ne retire rien a la decouverte -- il n'ajoute simplement rien.
  let declaresHorsRegle = []
  try {
    const manifeste = JSON.parse(readFileSync(join(dossier, 'manifeste.json'), 'utf8'))
    declaresHorsRegle = (manifeste.oracles_transverses || []).filter((f) => !MOTIF_ORACLE.test(f))
  } catch { declaresHorsRegle = [] }
  return {
    ...base,
    oracles,
    non_juge: [
      'la regle lit le NOM du fichier : un controle nomme autrement n\'est pas decouvert ici',
      'decouvrir n\'est pas lancer : cette liste ne dit ni qu\'un oracle a tourne, ni sur quel referentiel il s\'applique (granularite retenue : la forge, etude du 19/08 §5)',
      ...declaresHorsRegle.map((f) => `\`${f}\` est range parmi les oracles_transverses de manifeste.json mais son nom ne le declare pas oracle : non decouvert, ecart dit plutot que tranche`),
    ],
  }
}

// ---- CLI ---------------------------------------------------------------------------------------
const lanceEnDirect = process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase().split('\\').join('/') ===
    resolve(process.argv[1]).toLowerCase().split('\\').join('/')
if (lanceEnDirect) {
  const args = process.argv.slice(2)
  const i = args.indexOf('--racine')
  const racine = resolve(i >= 0 && args[i + 1] ? args[i + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'))
  const r = decouvrirOracles(racine)
  console.log(JSON.stringify(r, null, 1))
  process.exit(r.motif ? 2 : 0)
}
