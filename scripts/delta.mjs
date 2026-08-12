// scripts/delta.mjs — cycle delta propose/apply/archive façon OpenSpec, pour faire évoluer un
// référentiel EXIGENCES.json EXISTANT sans le régénérer de zéro. TF-0101 (3/3), utile au run de
// version du pilot (RUN-VERSION.md), aujourd'hui sans outillage pour ce cas précis.
//
// Ceci est un OUTIL, pas un oracle : il MUTE des fichiers sur disque. Il n'est jamais invoqué par
// les oracles ni par le self-test (`oracles/self-test.mjs` ne recette que des juges purs, sans
// effet de bord). Sa propre recette est `scripts/delta.self-test.mjs` — sur des copies dans un
// répertoire temporaire, jamais sur les fixtures partagées.
//
// Le cycle :
//   1. propose  — un delta DELTA.json est écrit à la main (ou par un skill), statut "propose".
//   2. apply    — ce script vérifie le format PAR oracle-delta.mjs (jamais contourné), applique
//                 les opérations sur le référentiel cible, statut -> "applique".
//   3. archive  — ce script déplace le delta appliqué vers un dossier d'archives, statut -> "archive".
//
// Usage :
//   node scripts/delta.mjs appliquer <DELTA.json> <EXIGENCES.json> [--sortie <chemin>]
//   node scripts/delta.mjs archiver  <DELTA.json> [--dossier <deltas/archive>]

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const ICI = dirname(fileURLToPath(import.meta.url))
const ORACLE_DELTA = join(ICI, '..', 'oracles', 'oracle-delta.mjs')

function echouer (message) {
  process.stderr.write(`delta.mjs: ${message}\n`)
  process.exit(1)
}

function chargerJson (chemin, quoi) {
  let brut
  try {
    brut = readFileSync(chemin, 'utf8')
  } catch (e) {
    echouer(`${quoi} introuvable ou illisible : ${chemin} (${e.code ?? e.message})`)
  }
  try {
    return JSON.parse(brut)
  } catch (e) {
    echouer(`${quoi} non parsable : ${chemin} (${e.message})`)
  }
}

function ecrireJson (chemin, valeur) {
  writeFileSync(chemin, JSON.stringify(valeur, null, 2) + '\n', 'utf8')
}

/** Rejoue oracle-delta.mjs — jamais contourné. Sort le process si le delta n'est pas conforme. */
function validerOuMourir (cheminDelta, cheminReferentiel) {
  const args = [ORACLE_DELTA, cheminDelta]
  if (cheminReferentiel) args.push('--referentiel', cheminReferentiel)
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', windowsHide: true })
  if (r.status === 2) {
    echouer(`oracle-delta n'a pas pu juger (référentiel ou delta illisible) :\n${r.stdout}${r.stderr}`)
  }
  if (r.status !== 0) {
    echouer(`delta refusé par oracle-delta (format non conforme) — appliquer un delta rouge ` +
      `casserait le référentiel en silence :\n${r.stdout}${r.stderr}`)
  }
  return JSON.parse(r.stdout)
}

// --- appliquer ---------------------------------------------------------------

function appliquer (argv) {
  const [cheminDelta, cheminReferentiel, ...reste] = argv
  if (!cheminDelta || !cheminReferentiel) {
    echouer('usage : appliquer <DELTA.json> <EXIGENCES.json> [--sortie <chemin>]')
  }
  let sortie = cheminReferentiel
  for (let i = 0; i < reste.length; i++) {
    if (reste[i] === '--sortie') sortie = reste[++i]
  }

  const rapport = validerOuMourir(cheminDelta, cheminReferentiel)
  const delta = chargerJson(cheminDelta, 'DELTA.json')
  if (delta.statut !== 'propose') {
    echouer(`delta au statut "${delta.statut}" : seul un delta "propose" peut être appliqué ` +
      '(garde-fou contre la double application)')
  }

  const ref = chargerJson(cheminReferentiel, 'référentiel')
  let appliquees = 0
  for (const op of delta.operations) {
    ref[op.cible] = Array.isArray(ref[op.cible]) ? ref[op.cible] : []
    const liste = ref[op.cible]
    if (op.type === 'ajoute') {
      liste.push(op.valeur)
    } else if (op.type === 'modifie') {
      const idx = liste.findIndex(x => x?.id === op.id)
      liste[idx] = { ...liste[idx], ...op.valeur }
    } else if (op.type === 'retire') {
      const idx = liste.findIndex(x => x?.id === op.id)
      liste.splice(idx, 1)
      // Un identifiant retiré ne revient jamais — même règle que E2 d'oracle-exigences.mjs.
      if (op.cible === 'exigences') {
        ref.identifiants_retires = Array.isArray(ref.identifiants_retires) ? ref.identifiants_retires : []
        if (!ref.identifiants_retires.includes(op.id)) ref.identifiants_retires.push(op.id)
      }
    }
    appliquees++
  }

  ecrireJson(sortie, ref)

  delta.statut = 'applique'
  delta.date_application = new Date().toISOString().slice(0, 10)
  ecrireJson(cheminDelta, delta)

  process.stdout.write(JSON.stringify({
    statut: 'applique',
    delta: delta.id,
    operations_appliquees: appliquees,
    referentiel_ecrit: sortie,
    verdict_oracle_delta: rapport.verdict
  }, null, 2) + '\n')
}

// --- archiver ------------------------------------------------------------------

function archiver (argv) {
  const [cheminDelta, ...reste] = argv
  if (!cheminDelta) echouer('usage : archiver <DELTA.json> [--dossier <deltas/archive>]')
  let dossier = join(ICI, '..', 'deltas', 'archive')
  for (let i = 0; i < reste.length; i++) {
    if (reste[i] === '--dossier') dossier = reste[++i]
  }

  const delta = chargerJson(cheminDelta, 'DELTA.json')
  if (delta.statut !== 'applique') {
    echouer(`delta au statut "${delta.statut}" : seul un delta "applique" peut être archivé`)
  }

  delta.statut = 'archive'
  delta.date_archivage = new Date().toISOString().slice(0, 10)

  if (!existsSync(dossier)) mkdirSync(dossier, { recursive: true })
  const cibleArchive = join(dossier, basename(cheminDelta))
  ecrireJson(cibleArchive, delta)
  renameSync(cheminDelta, `${cheminDelta}.archive-source-obsolete`)
  // Le fichier source original n'est pas supprimé silencieusement (pas de rm dans cet outil) :
  // il est renommé pour signaler sans ambiguïté qu'il n'est plus la version de référence — la
  // version qui fait foi est désormais celle du dossier d'archives.

  process.stdout.write(JSON.stringify({
    statut: 'archive',
    delta: delta.id,
    archive_vers: cibleArchive
  }, null, 2) + '\n')
}

// --- entrée --------------------------------------------------------------------

const [sousCommande, ...reste] = process.argv.slice(2)
if (sousCommande === 'appliquer') appliquer(reste)
else if (sousCommande === 'archiver') archiver(reste)
else {
  echouer('sous-commande attendue : "appliquer" ou "archiver"\n' +
    '  node scripts/delta.mjs appliquer <DELTA.json> <EXIGENCES.json> [--sortie <chemin>]\n' +
    '  node scripts/delta.mjs archiver  <DELTA.json> [--dossier <deltas/archive>]')
}
