// self-test — recette des oracles de la Forge Conception.
// Usage : node oracles/self-test.mjs
//
// Un oracle n'est admis que s'il prouve les deux sens :
//   la fixture verte PASSE (exit 0) et la fixture rouge ECHOUE (exit 1) sur CHAQUE regle.
// Un oracle qui ne fait jamais echouer sa fixture rouge ne juge rien.
//
// Sortie volontairement en ASCII : ce script tourne dans des consoles dont l'encodage
// n'est pas garanti (cf. journal Forge Tests du 04/08/2026, decodage cp1252).

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'

const ICI = dirname(fileURLToPath(import.meta.url))
const VERTE = join(ICI, 'fixtures', 'verte')
const ROUGE = join(ICI, 'fixtures', 'rouge')
const EARS_VERTE = join(ICI, 'fixtures', 'ears-verte', 'EXIGENCES.json')
const EARS_ROUGE = join(ICI, 'fixtures', 'ears-rouge', 'EXIGENCES.json')
const CONSTIT_VERTE = join(ICI, 'fixtures', 'constitution-verte', 'CONSTITUTION.md')
const CONSTIT_ROUGE = join(ICI, 'fixtures', 'constitution-rouge', 'CONSTITUTION.md')
const DELTA_VERTE = join(ICI, 'fixtures', 'delta-verte')
const DELTA_ROUGE = join(ICI, 'fixtures', 'delta-rouge')

const ORACLES = [
  {
    fichier: 'oracle-exigences.mjs',
    regles: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9'],
    args: (dossier) => [join(dossier, 'EXIGENCES.json')]
  },
  {
    fichier: 'oracle-tracabilite.mjs',
    regles: ['T1', 'T2', 'T3', 'T4'],
    args: (dossier) => [join(dossier, 'EXIGENCES.json'), '--vue', join(dossier, 'CADRAGE-DESIGN.md')]
  },
  {
    // TF-0070 : la verte passe au seuil PAR DEFAUT (S-06 couvert par E-008, palier V2) —
    // un operateur qui la joue via le registre central lit desormais le meme verdict que
    // ce self-test. La branche « ratio >= seuil -> avertissement nomme » (RC-1) est prouvee
    // a part, sur la fixture dediee seuil-rc1 (voir bloc apres la boucle).
    fichier: 'oracle-surface.mjs',
    regles: ['S1', 'S2', 'S3'],
    args: (dossier) => [join(dossier, 'EXIGENCES.json')]
  },
  {
    fichier: 'oracle-claims.mjs',
    regles: ['A1'],
    args: (dossier) => [join(dossier, 'EXIGENCES.json')]
  },
  {
    // TF-0014 (R-C3) : distingue mécaniquement l'état « bloqué sous le seuil » de « produit ».
    fichier: 'oracle-etat.mjs',
    regles: ['EM1', 'EM2', 'EM3'],
    args: (dossier) => [join(dossier, 'ETAT.json')]
  },
  {
    // TF-0101 (1/3) : scoring EARS par patron strict + ambiguïté lexicale. Fixtures dédiées
    // (pas VERTE/ROUGE partagées) : dossier reçu en paramètre mais ignoré au profit du fichier
    // propre à cet oracle, distingué par égalité de référence sur la constante VERTE/ROUGE.
    fichier: 'oracle-ears.mjs',
    regles: ['EA1', 'EA2', 'EA3'],
    args: (dossier) => [dossier === VERTE ? EARS_VERTE : EARS_ROUGE]
  },
  {
    // TF-0101 (2/3) : contrôle d'existence (exit 2 s'il est absent, comme tout autre oracle de
    // cette forge) et de format de CONSTITUTION.md. Fixtures dédiées, comme oracle-ears.
    fichier: 'oracle-constitution.mjs',
    regles: ['C1', 'C2', 'C3'],
    args: (dossier) => [dossier === VERTE ? CONSTIT_VERTE : CONSTIT_ROUGE]
  },
  {
    // TF-0101 (3/3) : format d'un delta de référentiel (cycle propose/apply/archive façon
    // OpenSpec), confronté à un référentiel cible via --referentiel. Fixtures dédiées.
    fichier: 'oracle-delta.mjs',
    regles: ['D1', 'D2', 'D3', 'D4'],
    args: (dossier) => {
      const d = dossier === VERTE ? DELTA_VERTE : DELTA_ROUGE
      return [join(d, 'DELTA.json'), '--referentiel', join(d, 'EXIGENCES.json')]
    }
  }
]

function lancer (fichier, args) {
  const r = spawnSync(process.execPath, [join(ICI, fichier), ...args], {
    encoding: 'utf8', // jamais de decodage par defaut de la plateforme
    windowsHide: true
  })
  if (r.error) return { code: 2, rapport: null, brut: String(r.error) }
  let rapport = null
  try { rapport = JSON.parse(r.stdout) } catch { /* laisse a null */ }
  return { code: r.status, rapport, brut: r.stdout + r.stderr }
}

let echecs = 0
const lignes = []

for (const o of ORACLES) {
  // --- sens 1 : la fixture verte passe ---
  const v = lancer(o.fichier, o.args(VERTE))
  if (v.code === 0) {
    lignes.push(`  [OK]   verte  exit 0`)
  } else {
    echecs++
    const fails = (v.rapport?.constats ?? []).filter(c => c.statut === 'FAIL')
    lignes.push(`  [FAIL] verte  exit ${v.code} -- attendu 0`)
    for (const f of fails.slice(0, 8)) lignes.push(`         ${f.regle} @ ${f.ou} : ${f.message}`)
    if (!v.rapport) lignes.push(`         sortie brute : ${v.brut.slice(0, 400)}`)
  }

  // --- sens 2 : la fixture rouge echoue, et sur chaque regle ---
  const r = lancer(o.fichier, o.args(ROUGE))
  if (r.code !== 1) {
    echecs++
    lignes.push(`  [FAIL] rouge  exit ${r.code} -- attendu 1`)
    if (!r.rapport) lignes.push(`         sortie brute : ${r.brut.slice(0, 400)}`)
  } else {
    const enEchec = new Set((r.rapport?.constats ?? [])
      .filter(c => c.statut === 'FAIL').map(c => c.regle))
    const muettes = o.regles.filter(x => !enEchec.has(x))
    if (muettes.length === 0) {
      lignes.push(`  [OK]   rouge  exit 1, ${o.regles.length}/${o.regles.length} regles en echec`)
    } else {
      echecs++
      lignes.push(`  [FAIL] rouge  regles jamais declenchees : ${muettes.join(', ')}`)
    }
  }

  // --- non_juge declare : exigence du standard quality-oracles ---
  const nj = v.rapport?.non_juge ?? r.rapport?.non_juge
  if (!Array.isArray(nj) || nj.length === 0) {
    echecs++
    lignes.push(`  [FAIL] non_juge absent ou vide`)
  }

  lignes.unshift('') // separation, remise en ordre juste apres
  const bloc = lignes.splice(0)
  console.log(`${o.fichier}${bloc.join('\n')}`)
}

// --- branche RC-1 d'oracle-surface : au-dessus du seuil, S1 avertit sans bloquer ---
// Fixture dediee seuil-rc1 (4/5 = 80 %, --seuil 80) : exit 0 exige, ET l'element non
// couvert doit rester NOMME en SANS_OBJET — un avertissement fondu dans la masse ne
// prouverait rien.
{
  const rc1 = lancer('oracle-surface.mjs',
    [join(ICI, 'fixtures', 'seuil-rc1', 'EXIGENCES.json'), '--seuil', '80'])
  const nomme = (rc1.rapport?.constats ?? [])
    .some(c => c.regle === 'S1' && c.statut === 'SANS_OBJET' && String(c.ou).includes('S-05'))
  if (rc1.code === 0 && nomme) {
    console.log('oracle-surface.mjs (branche RC-1, fixture seuil-rc1)\n  [OK]   80 % >= seuil 80 : exit 0, S-05 nomme en SANS_OBJET')
  } else {
    echecs++
    console.log(`oracle-surface.mjs (branche RC-1)\n  [FAIL] exit ${rc1.code} (attendu 0), S-05 nomme : ${nomme}`)
  }
}

// --- branche TF-0114 : T3 ignore un CRLF/LF a contenu identique, mais juge toujours un
// contenu reellement different. Fixture ephemere (comme scripts/delta.self-test.mjs) :
// prouve la normalisation sans dependre du core.autocrlf du poste qui execute ce test.
{
  const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-tf0114-'))
  try {
    const objetFixture = {
      projet: 'Fixture TF-0114 (CRLF/LF)',
      besoins: [{ id: 'B-01', enonce: 'Besoin factice pour le self-test T3.' }],
      exigences: [{
        id: 'E-001',
        besoin: 'B-01',
        enonce: 'Exigence factice pour le self-test T3.',
        critere: 'Critere non vide.',
        statut_epistemique: { nature: 'fait constaté', source: 'fixture TF-0114' }
      }]
    }
    const contenuLF = JSON.stringify(objetFixture, null, 2) + '\n'
    const contenuCRLF = contenuLF.replace(/\n/g, '\r\n') // meme contenu, autres octets

    const exigencesLF = join(tmp, 'EXIGENCES-lf.json')
    const exigencesCRLF = join(tmp, 'EXIGENCES-crlf.json')
    writeFileSync(exigencesLF, contenuLF)
    writeFileSync(exigencesCRLF, contenuCRLF)

    // empreinte calculee comme l'oracle desormais la calcule : sur le contenu normalise LF
    const empreinte = createHash('sha256').update(contenuLF, 'utf8').digest('hex')
    const vueAlignee = join(tmp, 'VUE-alignee.md')
    writeFileSync(vueAlignee,
      `<!-- source: EXIGENCES.json -->\n<!-- source-sha256: ${empreinte} -->\n\n# Vue fixture TF-0114\n`)

    // empreinte volontairement fausse : un contenu REELLEMENT different, pas une variante d'EOL
    const vueDivergente = join(tmp, 'VUE-divergente.md')
    writeFileSync(vueDivergente,
      `<!-- source: EXIGENCES.json -->\n<!-- source-sha256: ${'0'.repeat(64)} -->\n\n# Vue fixture TF-0114\n`)

    const surLF = lancer('oracle-tracabilite.mjs', [exigencesLF, '--vue', vueAlignee])
    const surCRLF = lancer('oracle-tracabilite.mjs', [exigencesCRLF, '--vue', vueAlignee])
    const surDivergent = lancer('oracle-tracabilite.mjs', [exigencesLF, '--vue', vueDivergente])

    const t3 = (r, statut) => (r.rapport?.constats ?? []).some(c => c.regle === 'T3' && c.statut === statut)
    const ok = surLF.code === 0 && t3(surLF, 'PASS') &&
      surCRLF.code === 0 && t3(surCRLF, 'PASS') &&
      surDivergent.code === 1 && t3(surDivergent, 'FAIL')

    if (ok) {
      console.log('oracle-tracabilite.mjs (branche TF-0114, fixture CRLF/LF ephemere)\n' +
        '  [OK]   LF exit 0 et CRLF (meme contenu) exit 0 -- meme empreinte, T3 ne voit pas de difference\n' +
        '  [OK]   contenu reellement different -- T3 FAIL (la regle juge toujours)')
    } else {
      echecs++
      console.log('oracle-tracabilite.mjs (branche TF-0114)\n' +
        `  [FAIL] LF exit ${surLF.code} (attendu 0) | CRLF exit ${surCRLF.code} (attendu 0) | ` +
        `divergent exit ${surDivergent.code} (attendu 1)`)
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

console.log('')
console.log(`${ORACLES.length} oracles, ${ORACLES.reduce((n, o) => n + o.regles.length, 0)} regles.`)
console.log(echecs === 0 ? 'SELF-TEST VERT' : `SELF-TEST ROUGE -- ${echecs} anomalie(s)`)
process.exit(echecs === 0 ? 0 : 1)
