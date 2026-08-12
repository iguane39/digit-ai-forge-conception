// scripts/delta.self-test.mjs — recette fonctionnelle de scripts/delta.mjs (l'OUTIL, pas un
// oracle). Opère uniquement sur des copies dans le répertoire temporaire du système : jamais sur
// les fixtures partagées d'oracles/fixtures/, jamais de fichier laissé dans le dépôt.
// Usage : node scripts/delta.self-test.mjs

import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = join(ICI, '..')
const DELTA_MJS = join(ICI, 'delta.mjs')
const FIX_VERTE = join(RACINE, 'oracles', 'fixtures', 'delta-verte')
const FIX_ROUGE = join(RACINE, 'oracles', 'fixtures', 'delta-rouge')

let echecs = 0
function verifier (libelle, condition, detail) {
  if (condition) {
    console.log(`  [OK]   ${libelle}`)
  } else {
    echecs++
    console.log(`  [FAIL] ${libelle}${detail ? ` -- ${detail}` : ''}`)
  }
}

function lancer (args) {
  const r = spawnSync(process.execPath, [DELTA_MJS, ...args], { encoding: 'utf8', windowsHide: true })
  let json = null
  try { json = JSON.parse(r.stdout) } catch { /* laisse a null */ }
  return { code: r.status, json, brut: r.stdout + r.stderr }
}

function copier (src, dst) {
  writeFileSync(dst, readFileSync(src))
}

const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-delta-'))

try {
  // --- scénario 1 : appliquer un delta valide (fixture delta-verte) -----------
  const delta1 = join(tmp, 'DELTA.json')
  const ref1 = join(tmp, 'EXIGENCES.json')
  copier(join(FIX_VERTE, 'DELTA.json'), delta1)
  copier(join(FIX_VERTE, 'EXIGENCES.json'), ref1)

  const r1 = lancer(['appliquer', delta1, ref1])
  verifier('appliquer un delta propose -> exit 0', r1.code === 0, r1.brut.slice(0, 300))
  verifier('rapport annonce 3 operations appliquees', r1.json?.operations_appliquees === 3)

  const refApres = JSON.parse(readFileSync(ref1, 'utf8'))
  const e001 = refApres.exigences.find(e => e.id === 'E-001')
  const e002 = refApres.exigences.find(e => e.id === 'E-002')
  const e003 = refApres.exigences.find(e => e.id === 'E-003')
  verifier('ajoute : E-002 present dans le referentiel ecrit', !!e002)
  verifier('modifie : E-001.critere porte le nouveau texte', e001?.critere?.includes('identifiant propre'))
  verifier('retire : E-003 absent du referentiel ecrit', !e003)
  verifier('retire : E-003 verse dans identifiants_retires', refApres.identifiants_retires?.includes('E-003'))

  const deltaApres = JSON.parse(readFileSync(delta1, 'utf8'))
  verifier('delta.statut passe a "applique"', deltaApres.statut === 'applique')
  verifier('delta.date_application ecrite', typeof deltaApres.date_application === 'string' && deltaApres.date_application !== '')

  // --- scénario 2 : refus de la double application -----------------------------
  const r2 = lancer(['appliquer', delta1, ref1])
  verifier('appliquer un delta deja "applique" -> refuse (exit 1)', r2.code === 1)

  // --- scénario 3 : refus d'appliquer un delta invalide (fixture delta-rouge) —
  // le referentiel cible ne doit SUBIR AUCUNE ecriture : c'est la preuve que le garde-fou
  // (oracle-delta rejoue avant toute mutation) fonctionne, pas seulement qu'il repond exit 1.
  const deltaRouge = join(tmp, 'DELTA-rouge.json')
  const refRouge = join(tmp, 'EXIGENCES-rouge.json')
  copier(join(FIX_ROUGE, 'DELTA.json'), deltaRouge)
  copier(join(FIX_ROUGE, 'EXIGENCES.json'), refRouge)
  const empreinteAvant = readFileSync(refRouge, 'utf8')

  const r3 = lancer(['appliquer', deltaRouge, refRouge])
  verifier('appliquer un delta au format rouge -> refuse (exit 1)', r3.code === 1)
  const empreinteApres = readFileSync(refRouge, 'utf8')
  verifier('referentiel cible inchange apres refus', empreinteAvant === empreinteApres)

  // --- scénario 4 : archiver un delta applique ----------------------------------
  const dossierArchive = join(tmp, 'archive')
  const r4 = lancer(['archiver', delta1, '--dossier', dossierArchive])
  verifier('archiver un delta "applique" -> exit 0', r4.code === 0, r4.brut.slice(0, 300))
  const cheminArchive = join(dossierArchive, 'DELTA.json')
  verifier('fichier archive cree', existsSync(cheminArchive))
  const archive = existsSync(cheminArchive) ? JSON.parse(readFileSync(cheminArchive, 'utf8')) : {}
  verifier('archive.statut = "archive"', archive.statut === 'archive')
  verifier('source originale renommee (plus la version qui fait foi)', !existsSync(delta1) && existsSync(`${delta1}.archive-source-obsolete`))

  // --- scénario 5 : refus d'archiver un delta encore "propose" ------------------
  const delta5 = join(tmp, 'DELTA-propose.json')
  copier(join(FIX_VERTE, 'DELTA.json'), delta5)
  const r5 = lancer(['archiver', delta5])
  verifier('archiver un delta "propose" (jamais applique) -> refuse (exit 1)', r5.code === 1)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

console.log('')
console.log(echecs === 0 ? 'DELTA SELF-TEST VERT' : `DELTA SELF-TEST ROUGE -- ${echecs} anomalie(s)`)
process.exit(echecs === 0 ? 0 : 1)
