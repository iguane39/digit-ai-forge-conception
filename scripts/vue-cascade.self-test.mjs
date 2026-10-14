// scripts/vue-cascade.self-test.mjs — recette de scripts/vue-cascade.mjs (l'OUTIL, pas un oracle).
// Opère sur des copies dans le répertoire temporaire du système : jamais sur les fixtures
// partagées d'oracles/fixtures/, jamais de fichier laissé dans le dépôt. Les deux sens sont joués :
// une cascade saine rend une vue scellée que T3 et T5 acceptent, une cascade en rupture rend son
// FAIL dans la vue au lieu d'un test rétro décoratif, et une cascade absente n'écrit rien.
// Usage : node scripts/vue-cascade.self-test.mjs

import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { rendreCorps } from './vue-cascade.mjs'

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = join(ICI, '..')
const GENERATEUR = join(ICI, 'vue-cascade.mjs')
const ORACLE = join(RACINE, 'oracles', 'oracle-tracabilite.mjs')
const FIX_VERTE = join(RACINE, 'oracles', 'fixtures', 'vue-cascade-verte')
const CASCADE_ROUGE_T6 = join(RACINE, 'oracles', 'fixtures', 'cascade-rouge', 'CASCADE.json')
const LF = (t) => String(t).replace(/\r\n/g, '\n')

let echecs = 0
function verifier (libelle, condition, detail) {
  if (condition) {
    console.log(`  [OK]   ${libelle}`)
  } else {
    echecs++
    console.log(`  [FAIL] ${libelle}${detail ? ` -- ${detail}` : ''}`)
  }
}

const lancer = (script, args) => {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', windowsHide: true })
  let json = null
  try { json = JSON.parse(r.stdout) } catch { /* sortie non JSON : le générateur */ }
  return { code: r.status, json, brut: r.stdout + r.stderr }
}

/** Un dossier de conception jetable : EXIGENCES.json + cascade/CASCADE.json (+ rien d'autre). */
const dossier = (racine, nom, cascade) => {
  const d = join(racine, nom)
  mkdirSync(join(d, 'cascade'), { recursive: true })
  writeFileSync(join(d, 'EXIGENCES.json'), readFileSync(join(FIX_VERTE, 'EXIGENCES.json'), 'utf8'))
  if (cascade !== null) writeFileSync(join(d, 'cascade', 'CASCADE.json'), cascade)
  return d
}

console.log('vue-cascade.mjs (TF-1686, vue de la cascade sous double sceau)')
const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-vue-cascade-'))
try {
  const cascadeVerte = readFileSync(join(FIX_VERTE, 'cascade', 'CASCADE.json'), 'utf8')

  // 1-5. Sens vert : la vue est écrite à côté du référentiel, scellée, et acceptée par T3 et T5.
  const vert = dossier(tmp, 'vert', cascadeVerte)
  const g = lancer(GENERATEUR, [join(vert, 'EXIGENCES.json')])
  const vue = existsSync(join(vert, 'CASCADE.md')) ? readFileSync(join(vert, 'CASCADE.md'), 'utf8') : ''
  verifier('1. cascade voisine trouvee d\'office, vue ecrite a cote du referentiel, exit 0',
    g.code === 0 && vue !== '', g.brut.slice(0, 200))
  const parties = ['## Intention', '## Stratégie', '## Tactique', '## Opérationnel', '## Test rétro', '## Tenir la cascade à jour']
  verifier('2. les six parties de la famille gd-cascade-produit sont rendues, dans l\'ordre',
    parties.every((p, i) => vue.indexOf(`\n${p}\n`) > (i ? vue.indexOf(`\n${parties[i - 1]}\n`) : -1)))
  verifier('3. chaque identifiant de la source est rendu',
    ['STR-1', 'STR-2', 'STR-3', 'TAC-1', 'TAC-2', 'TAC-3', 'E-001', 'E-006', 'E-008', 'C-1', 'N-1', 'PP-1'].every((i) => vue.includes(i)))
  verifier('4. l\'en-tete porte les quatre lignes du sceau, corps-sha256 en dernier',
    /^<!-- source: cascade\/CASCADE\.json -->\n<!-- source-sha256: [0-9a-f]{64} -->\n<!-- referentiel-sha256: [0-9a-f]{64} -->\n<!-- corps-sha256: [0-9a-f]{64} -->\n---\n/.test(vue))
  const juge = lancer(ORACLE, [join(vert, 'EXIGENCES.json'), '--cascade', join(vert, 'cascade', 'CASCADE.json'), '--vue', join(vert, 'CASCADE.md')])
  const statut = (regle) => (juge.json?.constats ?? []).filter((c) => c.regle === regle).map((c) => c.statut)
  verifier('5. double sceau accepte : oracle-tracabilite --vue rend T3 PASS et T5 PASS, exit 0',
    juge.code === 0 && statut('T3').join() === 'PASS' && statut('T5').join() === 'PASS', juge.brut.slice(0, 300))

  // 6. La fixture versionnée est la sortie du générateur : elle reste régénérable.
  verifier('6. oracles/fixtures/vue-cascade-verte/CASCADE.md = vue regeneree depuis sa source',
    LF(readFileSync(join(FIX_VERTE, 'CASCADE.md'), 'utf8')) === LF(vue))

  // 7. Déterminisme : aucune date de génération, deux générations rendent le même octet.
  const g2 = lancer(GENERATEUR, [join(vert, 'EXIGENCES.json')])
  verifier('7. deux generations d\'une meme source rendent le meme octet',
    g2.code === 0 && readFileSync(join(vert, 'CASCADE.md'), 'utf8') === vue)

  // 8. Sens rouge : une cascade en rupture (fixture rouge de T6) rend son FAIL dans la vue.
  const rouge = dossier(tmp, 'rouge', readFileSync(CASCADE_ROUGE_T6, 'utf8'))
  const gr = lancer(GENERATEUR, [join(rouge, 'EXIGENCES.json')])
  const vueRouge = existsSync(join(rouge, 'CASCADE.md')) ? readFileSync(join(rouge, 'CASCADE.md'), 'utf8') : ''
  verifier('8. cas rouge -- cascade en rupture : test retro **FAIL**, ruptures E-002 et E-006 nommees',
    gr.code === 0 && vueRouge.includes('**FAIL**') && vueRouge.includes('E-002') &&
    /^- .*E-006.*orpheline/m.test(vueRouge), gr.brut.slice(0, 200))

  // 9. Cascade absente : rien à dériver, rien d'écrit, exit 2.
  const sans = dossier(tmp, 'sans', null)
  const gs = lancer(GENERATEUR, [join(sans, 'EXIGENCES.json')])
  verifier('9. cas rouge -- aucune cascade voisine : exit 2, aucune vue ecrite',
    gs.code === 2 && !existsSync(join(sans, 'CASCADE.md')), gs.brut.slice(0, 200))

  // 10. Une barre verticale dans un champ ne casse pas un tableau.
  const piege = JSON.parse(cascadeVerte)
  piege.tactiques[0].moyen = 'brouillon | depose'
  verifier('10. une barre verticale est echappee dans les tableaux',
    rendreCorps(piege, {}).includes('brouillon \\| depose'))
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

console.log(echecs === 0 ? '\nVUE-CASCADE SELF-TEST VERT' : `\nVUE-CASCADE SELF-TEST ROUGE -- ${echecs} echec(s)`)
process.exit(echecs === 0 ? 0 : 1)
