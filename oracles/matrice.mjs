// matrice — la matrice COMPLETE des verdicts fixture x oracle applicable.
// Usage : node oracles/matrice.mjs            (imprime la matrice courante et le bloc JSON
//                                              pret a coller dans matrice-attendue.json)
//
// Sortie volontairement en ASCII, comme self-test.mjs : ce module tourne dans des consoles
// dont l'encodage n'est pas garanti.
//
// TF-0823 — POURQUOI CE MODULE EXISTE.
//
// Le self-test associe un COUPLE (fixture verte, fixture rouge) a un oracle, et ne dit rien des
// autres verdicts qu'une fixture rend. Le defaut est structurel, pas accidentel : chaque regle
// neuve posee sur un oracle PARTAGE peut faire basculer une fixture voisine en silence, et rien
// ne le dit. Mesure du 05/09/2026 : l'entree de la regle E10 (TF-0814) dans `oracle-exigences` a
// fait passer `fixtures/delta-rouge/EXIGENCES.json` de exit 0 a exit 1 sur cet oracle -- le
// self-test ne branche jamais `oracle-exigences` sur cette fixture, et il a fallu un balayage
// MANUEL des douze fixtures pour le voir. Mesure du 06/09/2026, avant ce module : sur les 56
// cellules des quatorze fixtures portant un EXIGENCES.json croisees avec les quatre oracles qui
// le jugent, DOUZE rendaient exit 1 sans qu'aucun cas du self-test ne les regarde.
//
// Ce module ne juge rien : il CALCULE. Le jugement est dans le self-test, qui compare le
// resultat a `matrice-attendue.json` -- une donnee editable et datee, versionnee dans le depot.
// Une cellule qui change est alors soit une regression, soit un geste explicite : mettre a jour
// la matrice attendue dans le commit qui change la regle.

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readdirSync, existsSync } from 'node:fs'

const ICI = dirname(fileURLToPath(import.meta.url))
export const DOSSIER_FIXTURES = join(ICI, 'fixtures')
export const CHEMIN_MATRICE_ATTENDUE = join(ICI, 'matrice-attendue.json')

/**
 * Les oracles, et l'artefact que chacun EXIGE pour etre applicable a une fixture. Un oracle est
 * joue sur une fixture si et seulement si tous ses artefacts requis y sont : c'est ce qui
 * distingue une cellule VIDE (l'oracle n'a rien a juger la) d'une cellule ERREUR (il avait de
 * quoi juger et n'a pas pu). Les arguments sont ceux du README, a l'identique.
 *
 * `code` est l'en-tete de colonne, trois lettres, pour que la matrice tienne en largeur de
 * console. La table est CLOSE et confrontee au dossier : un `oracle-*.mjs` present sur le
 * disque et absent d'ici fait echouer la recette -- un oracle neuf hors matrice serait
 * exactement le trou que ce module comble.
 */
export const ORACLES_MATRICE = [
  { oracle: 'oracle-exigences', code: 'EXI', requiert: ['EXIGENCES.json'], args: (d) => [join(d, 'EXIGENCES.json')] },
  { oracle: 'oracle-exigences-md', code: 'EXM', requiert: ['EXIGENCES.md'], args: (d) => [join(d, 'EXIGENCES.md')] },
  {
    oracle: 'oracle-tracabilite',
    code: 'TRA',
    requiert: ['EXIGENCES.json', 'CADRAGE-DESIGN.md'],
    args: (d) => [join(d, 'EXIGENCES.json'), '--vue', join(d, 'CADRAGE-DESIGN.md')]
  },
  { oracle: 'oracle-surface', code: 'SUR', requiert: ['EXIGENCES.json'], args: (d) => [join(d, 'EXIGENCES.json')] },
  { oracle: 'oracle-claims', code: 'CLA', requiert: ['EXIGENCES.json'], args: (d) => [join(d, 'EXIGENCES.json')] },
  { oracle: 'oracle-etat', code: 'ETA', requiert: ['ETAT.json'], args: (d) => [join(d, 'ETAT.json')] },
  { oracle: 'oracle-ears', code: 'EAR', requiert: ['EXIGENCES.json'], args: (d) => [join(d, 'EXIGENCES.json')] },
  { oracle: 'oracle-constitution', code: 'CON', requiert: ['CONSTITUTION.md'], args: (d) => [join(d, 'CONSTITUTION.md')] },
  {
    oracle: 'oracle-delta',
    code: 'DEL',
    requiert: ['DELTA.json', 'EXIGENCES.json'],
    args: (d) => [join(d, 'DELTA.json'), '--referentiel', join(d, 'EXIGENCES.json')]
  },
  { oracle: 'oracle-retro-modele', code: 'RTM', requiert: ['RETRO-MODELE.md'], args: (d) => [join(d, 'RETRO-MODELE.md')] },
  {
    oracle: 'oracle-vues-profil',
    code: 'VUP',
    requiert: ['VUE-PO.md', 'RETRO-MODELE.md'],
    args: (d) => [join(d, 'VUE-PO.md'), '--modele', join(d, 'RETRO-MODELE.md')]
  }
]

/** Les verdicts, dans les mots du contrat commun. Un exit inattendu se NOMME, jamais tu. */
export const verdictDeExit = (code) =>
  code === 0 ? 'PASS' : code === 1 ? 'FAIL' : code === 2 ? 'ERREUR' : `EXIT_${code}`

/** Les dossiers de fixtures, tries : l'ordre de la matrice ne depend pas du systeme de fichiers. */
export const fixtures = () =>
  readdirSync(DOSSIER_FIXTURES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort()

/** Les `oracle-*.mjs` reellement presents dans le dossier — la table est confrontee a eux. */
export const oraclesSurDisque = () =>
  readdirSync(ICI).filter(f => /^oracle-[\w-]+\.mjs$/.test(f)).map(f => f.replace(/\.mjs$/, '')).sort()

/**
 * Calcule la matrice complete. Rend `{ matrice, horsTable, absentsDuDisque }` :
 *   matrice[fixture][oracle] = 'PASS' | 'FAIL' | 'ERREUR'  (les cellules non applicables sont
 *   ABSENTES de l'objet, jamais remplies d'une valeur qui ressemblerait a un verdict)
 */
export function calculer () {
  const matrice = {}
  for (const f of fixtures()) {
    const dossier = join(DOSSIER_FIXTURES, f)
    const ligne = {}
    for (const o of ORACLES_MATRICE) {
      if (!o.requiert.every(a => existsSync(join(dossier, a)))) continue
      const r = spawnSync(process.execPath, [join(ICI, `${o.oracle}.mjs`), ...o.args(dossier)],
        { encoding: 'utf8', windowsHide: true })
      ligne[o.oracle] = r.error ? 'LANCEMENT_IMPOSSIBLE' : verdictDeExit(r.status)
    }
    if (Object.keys(ligne).length > 0) matrice[f] = ligne
  }
  const table = ORACLES_MATRICE.map(o => o.oracle)
  const disque = oraclesSurDisque()
  return {
    matrice,
    horsTable: disque.filter(o => !table.includes(o)),
    absentsDuDisque: table.filter(o => !disque.includes(o))
  }
}

/**
 * Confronte la matrice calculee a la matrice attendue. Rend la liste des ecarts, chacun NOMMANT
 * sa fixture et son oracle — c'est tout le contrat de la regle : « un verdict qui differe est un
 * echec de recette nommant la fixture et l'oracle ».
 *
 * Trois formes d'ecart, et pas une de moins : le verdict a change ; la cellule n'est PAS dans la
 * matrice attendue (fixture ou oracle neuf — la mise a jour est un geste explicite) ; la cellule
 * est attendue et n'a pas ete calculee (fixture ou artefact disparu).
 */
export function comparer (reelle, attendue) {
  const ecarts = []
  for (const [f, ligne] of Object.entries(reelle ?? {})) {
    for (const [o, obtenu] of Object.entries(ligne)) {
      const attendu = attendue?.[f]?.[o]
      if (attendu === undefined) {
        ecarts.push({ fixture: f, oracle: o, attendu: '(cellule absente de la matrice attendue)', obtenu })
      } else if (attendu !== obtenu) {
        ecarts.push({ fixture: f, oracle: o, attendu, obtenu })
      }
    }
  }
  for (const [f, ligne] of Object.entries(attendue ?? {})) {
    for (const [o, attendu] of Object.entries(ligne)) {
      if (reelle?.[f]?.[o] === undefined) {
        ecarts.push({ fixture: f, oracle: o, attendu, obtenu: '(cellule non calculee : fixture ou artefact disparu)' })
      }
    }
  }
  return ecarts
}

const ABREGE = { PASS: 'PASS', FAIL: 'FAIL', ERREUR: 'ERR ' }

/**
 * La matrice, LISIBLE : une ligne par fixture, une colonne par oracle, un point pour une
 * cellule non applicable. Publiee dans la sortie du self-test pour qu'un lecteur voie ce que
 * chaque fixture rend — pas seulement ce que la recette en dit.
 */
export function imprimer (matrice) {
  const noms = Object.keys(matrice)
  const largeur = Math.max(8, ...noms.map(n => n.length))
  const lignes = []
  lignes.push(`  ${'fixture'.padEnd(largeur)}  ` +
    ORACLES_MATRICE.map(o => o.code.padEnd(4)).join(' '))
  for (const n of noms) {
    lignes.push(`  ${n.padEnd(largeur)}  ` + ORACLES_MATRICE.map(o => {
      const v = matrice[n][o.oracle]
      return (v === undefined ? ' .  ' : (ABREGE[v] ?? v.slice(0, 4))).padEnd(4)
    }).join(' '))
  }
  const cellules = noms.reduce((n, f) => n + Object.keys(matrice[f]).length, 0)
  lignes.push(`  legende : ${ORACLES_MATRICE.map(o => `${o.code}=${o.oracle}`).join(', ')}`)
  lignes.push(`  ${noms.length} fixtures x ${ORACLES_MATRICE.length} oracles, ${cellules} cellules applicables`)
  return lignes.join('\n')
}

// --- Invocation directe : de quoi mettre la matrice attendue a jour a la main ---------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { matrice, horsTable, absentsDuDisque } = calculer()
  console.log(imprimer(matrice))
  if (horsTable.length > 0) console.log(`  ORACLES HORS TABLE : ${horsTable.join(', ')}`)
  if (absentsDuDisque.length > 0) console.log(`  ORACLES ABSENTS DU DISQUE : ${absentsDuDisque.join(', ')}`)
  console.log('')
  console.log('bloc `cellules` pret a coller dans matrice-attendue.json :')
  console.log(JSON.stringify(matrice, null, 2))
}
