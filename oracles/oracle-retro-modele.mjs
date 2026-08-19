// oracle-retro-modele — juge un RETRO-MODELE.md (mode rétro-modèle du verbe 1).
// Usage : node oracle-retro-modele.mjs <RETRO-MODELE.md>
// GO humain du 19/08/2026 (étude 20260819a du pilot, verdict O1) : un modèle d'un projet
// existant n'est opposable que si chaque affirmation est ancrée et qu'un échantillon a été
// confronté au projet réel — sans quoi c'est une paraphrase plausible (mode d'échec METR
// 2025-07 : la vérification d'affirmations fausses coûte plus que l'acquisition).
//
// Règles :
//   RM1 les 8 sections du gabarit présentes (périmètre, 5 volets, confrontation, hors de portée)
//   RM2 chaque ligne de tableau de volet porte une ANCRE non vide — ou le volet déclare
//       « volet vide — <motif> » ; une affirmation sans ancre n'est pas une affirmation
//   RM3 confrontation exécutée : >= 5 lignes, verdicts au jeu fermé (confirmé / infirmé-corrigé)
//   RM4 « Hors de portée » non vide — un modèle sans limites déclarées n'a pas cherché les siennes
//   RM5 déclaration « lecture seule » présente dans la section périmètre

import { readFileSync } from 'node:fs'
import { constat, emettre, erreur, PASS, FAIL } from './_contrat.mjs'

const VERSION = '1.0.0'

const cible = process.argv[2]
if (!cible) erreur('argument manquant : chemin du RETRO-MODELE.md')
let brut
try { brut = readFileSync(cible, 'utf8') } catch (e) {
  erreur(`artefact illisible : ${cible} (${e.code ?? e.message})`)
}
const texte = brut.split('\r\n').join('\n')

const constats = []

// Découpe en sections de niveau ## (le titre # du document n'ouvre pas de section).
const SECTIONS = [
  { cle: 'perimetre', re: /p[ée]rim[èe]tre/i, nom: '1. Périmètre et méthode' },
  { cle: 'fonctionnel', re: /volet fonctionnel/i, nom: '2. Volet fonctionnel' },
  { cle: 'technique', re: /volet technique/i, nom: '3. Volet technique' },
  { cle: 'parametrage', re: /volet param[ée]trage/i, nom: '4. Volet paramétrage' },
  { cle: 'data', re: /volet data/i, nom: '5. Volet data' },
  { cle: 'services', re: /volet services/i, nom: '6. Volet services' },
  { cle: 'confrontation', re: /confrontation/i, nom: '7. Confrontation exécutée' },
  { cle: 'hors', re: /hors de port[ée]e/i, nom: '8. Hors de portée' }
]

const blocs = {}
{
  const morceaux = texte.split(/\n(?=## )/)
  for (const m of morceaux) {
    const titre = (m.split('\n')[0] || '')
    for (const s of SECTIONS) {
      if (s.re.test(titre) && !(s.cle in blocs)) blocs[s.cle] = m
    }
  }
}

// RM1 — sections présentes
const absentes = SECTIONS.filter(s => !(s.cle in blocs)).map(s => s.nom)
if (absentes.length) {
  constats.push(constat('RM1', FAIL, cible, `section(s) absente(s) : ${absentes.join(' · ')}`))
} else {
  constats.push(constat('RM1', PASS, cible, 'les 8 sections du gabarit sont présentes'))
}

// Lignes de données d'un tableau markdown (hors en-tête et séparateur).
function lignesTableau (bloc) {
  return (bloc || '').split('\n')
    .filter(l => /^\|/.test(l.trim()))
    .filter(l => !/^\|[\s:|-]+\|?\s*$/.test(l.trim())) // séparateur
    .slice(1) // en-tête
}

// RM2 — ancres des volets
const VOLETS = ['fonctionnel', 'technique', 'parametrage', 'data', 'services']
let sansAncre = 0
let lignesVolets = 0
for (const v of VOLETS) {
  const bloc = blocs[v]
  if (bloc === undefined) continue // déjà compté par RM1
  const lignes = lignesTableau(bloc)
  if (lignes.length === 0) {
    if (!/volet vide\s*[—–-]\s*\S{3,}/i.test(bloc)) sansAncre++ // ni tableau ni vide motivé
    continue
  }
  lignesVolets += lignes.length
  for (const l of lignes) {
    const cellules = l.split('|').map(c => c.trim())
    if ((cellules[3] || '').length < 4) sansAncre++
  }
}
if (sansAncre > 0) {
  constats.push(constat('RM2', FAIL, cible,
    `${sansAncre} affirmation(s) sans ancre (ou volet ni renseigné ni « volet vide — motif ») — une affirmation sans ancre est une paraphrase`))
} else {
  constats.push(constat('RM2', PASS, cible, `${lignesVolets} affirmation(s), toutes ancrées`))
}

// RM3 — confrontation exécutée
{
  const lignes = lignesTableau(blocs.confrontation)
  const horsJeu = lignes.filter(l => {
    const v = (l.split('|').map(c => c.trim())[3] || '')
    return !/^confirm[ée]?$|^infirm[ée]?[\s-]*corrig[ée]?$/i.test(v)
  })
  if (lignes.length < 5) {
    constats.push(constat('RM3', FAIL, cible,
      `${lignes.length} affirmation(s) confrontée(s) — >= 5 exigées : l'échantillon est le régime de preuve, pas un ornement`))
  } else if (horsJeu.length) {
    constats.push(constat('RM3', FAIL, cible,
      `${horsJeu.length} verdict(s) hors jeu fermé (attendu : confirmé | infirmé-corrigé)`))
  } else {
    constats.push(constat('RM3', PASS, cible, `${lignes.length} affirmations confrontées, verdicts au jeu fermé`))
  }
}

// RM4 — hors de portée non vide
{
  const corps = (blocs.hors || '').split('\n').slice(1).join('\n')
    .replace(/[\s|>#*-]/g, '')
  if (corps.length < 30) {
    constats.push(constat('RM4', FAIL, cible,
      '« Hors de portée » vide ou creuse — un modèle sans limites déclarées n\'a pas cherché les siennes'))
  } else {
    constats.push(constat('RM4', PASS, cible, '« Hors de portée » renseignée'))
  }
}

// RM5 — lecture seule déclarée au périmètre
if (/lecture seule/i.test(blocs.perimetre || '')) {
  constats.push(constat('RM5', PASS, cible, 'lecture seule déclarée au périmètre'))
} else {
  constats.push(constat('RM5', FAIL, cible,
    'déclaration « lecture seule » absente du périmètre — la règle dure du skill hôte doit être visible dans l\'artefact'))
}

emettre({
  oracle: 'oracle-retro-modele',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    "la véracité de chaque ancre — seul l'échantillon de confrontation (RM3) est rejoué, le reste relève de la revue",
    "l'exhaustivité du modèle — un volet peut être incomplet sans être faux",
    "la légalité d'accès au projet analysé (garde-fou juridique du type « produit tiers ») — mandat humain requis"
  ]
})
