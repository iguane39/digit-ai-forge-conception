// oracle-vues-profil — juge une vue par profil dérivée d'un RETRO-MODELE.md.
// Usage : node oracle-vues-profil.mjs <VUE.md> --modele <RETRO-MODELE.md>
// GO humain du 19/08/2026 (étude 20260819b du pilot, verdict O3) : une documentation par
// audience n'est opposable que si elle est une SÉLECTION ancrée d'un modèle vérifié et
// scellée par son empreinte — sinon c'est une réécriture du produit qui divergera à sa
// première évolution.
//
// Règles :
//   VP1 frontmatter complet : profil au jeu fermé (po|csm|utilisateur), source,
//       source_sha256 (64 hex), date
//   VP2 empreinte exacte : source_sha256 == sha256 du modèle normalisé LF (péremption détectée)
//   VP3 ancrage : >= 1 ancre [RM-xxx] dans la vue, et chaque id cité EXISTE dans le modèle
//   VP4 sections imposées du profil présentes (references/vues-par-profil.md)

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { constat, emettre, erreur, PASS, FAIL } from './_contrat.mjs'

const VERSION = '1.0.0'

const cible = process.argv[2]
const iModele = process.argv.indexOf('--modele')
const cheminModele = iModele > 0 ? process.argv[iModele + 1] : null
if (!cible) erreur('argument manquant : chemin de la vue')
if (!cheminModele) erreur('argument manquant : --modele <RETRO-MODELE.md>')

let brutVue, brutModele
try { brutVue = readFileSync(cible, 'utf8') } catch (e) {
  erreur(`vue illisible : ${cible} (${e.code ?? e.message})`)
}
try { brutModele = readFileSync(cheminModele, 'utf8') } catch (e) {
  erreur(`modèle illisible : ${cheminModele} (${e.code ?? e.message})`)
}
const vue = brutVue.split('\r\n').join('\n')
const modele = brutModele.split('\r\n').join('\n')

const constats = []

// Frontmatter --- clé: valeur ---
const champs = {}
{
  const lignes = vue.split('\n')
  if (lignes[0]?.trim() === '---') {
    for (let i = 1; i < lignes.length; i++) {
      if (lignes[i].trim() === '---') break
      const sep = lignes[i].indexOf(':')
      if (sep > 0) champs[lignes[i].slice(0, sep).trim()] = lignes[i].slice(sep + 1).trim()
    }
  }
}

// VP1 — frontmatter complet, profil au jeu fermé
const PROFILS = ['po', 'csm', 'utilisateur']
{
  const manquants = ['profil', 'source', 'source_sha256', 'date'].filter(c => !champs[c])
  if (manquants.length) {
    constats.push(constat('VP1', FAIL, cible, `frontmatter incomplet : ${manquants.join(', ')} manquant(s)`))
  } else if (!PROFILS.includes(champs.profil)) {
    constats.push(constat('VP1', FAIL, cible,
      `profil « ${champs.profil} » hors jeu fermé (${PROFILS.join(' | ')}) — un profil s'ajoute par delta du référentiel, jamais par improvisation`))
  } else if (!/^[0-9a-f]{64}$/i.test(champs.source_sha256)) {
    constats.push(constat('VP1', FAIL, cible, 'source_sha256 n\'est pas une empreinte SHA-256 (64 hex)'))
  } else {
    constats.push(constat('VP1', PASS, cible, `frontmatter complet, profil « ${champs.profil} »`))
  }
}

// VP2 — empreinte exacte (péremption)
{
  const attendu = createHash('sha256').update(modele).digest('hex')
  if ((champs.source_sha256 || '').toLowerCase() === attendu) {
    constats.push(constat('VP2', PASS, cible, 'empreinte de la source exacte — vue à jour'))
  } else {
    constats.push(constat('VP2', FAIL, cible,
      'empreinte de la source divergente — la vue est PÉRIMÉE (source modifiée) ou a été éditée à la main : régénérer, jamais corriger la vue'))
  }
}

// VP3 — ancrage au modèle
{
  const corps = vue.split('\n').slice(vue.startsWith('---') ? vue.split('\n').indexOf('---', 1) + 1 : 0).join('\n')
  const ancres = [...new Set((corps.match(/\[RM-[A-Z]\d{2,}\]/g) || []).map(a => a.slice(1, -1)))]
  const idsModele = new Set((modele.match(/\bRM-[A-Z]\d{2,}\b/g) || []))
  const orphelines = ancres.filter(a => !idsModele.has(a))
  if (ancres.length === 0) {
    constats.push(constat('VP3', FAIL, cible,
      'aucune ancre [RM-xxx] — une vue sans ancre est une source d\'information nouvelle, pas une projection'))
  } else if (orphelines.length) {
    constats.push(constat('VP3', FAIL, cible,
      `ancre(s) sans entrée au modèle : ${orphelines.join(', ')} — la vue affirme ce que le modèle ne porte pas`))
  } else {
    constats.push(constat('VP3', PASS, cible, `${ancres.length} ancre(s), toutes résolues dans le modèle`))
  }
}

// VP4 — sections imposées du profil
const SECTIONS_PROFIL = {
  po: [/objets et parcours/i, /r[èe]gles de gestion/i, /manques et hypoth[èe]ses/i],
  csm: [/ce que fait le produit/i, /questions et r[ée]ponses ancr[ée]es/i, /limites connues/i],
  utilisateur: [/ce que vous pouvez faire/i, /comment faire/i, /ce que le produit ne fait pas/i]
}
{
  const attendues = SECTIONS_PROFIL[champs.profil]
  if (!attendues) {
    constats.push(constat('VP4', FAIL, cible, 'sections non jugeables : profil hors jeu fermé (voir VP1)'))
  } else {
    const absentes = attendues.filter(re => !re.test(vue))
    absentes.length
      ? constats.push(constat('VP4', FAIL, cible, `${absentes.length} section(s) imposée(s) du profil absente(s)`))
      : constats.push(constat('VP4', PASS, cible, `les ${attendues.length} sections du profil « ${champs.profil} » sont présentes`))
  }
}

emettre({
  oracle: 'oracle-vues-profil',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    "l'adéquation du vocabulaire à l'audience (jargon, niveau de détail) — règles d'écriture tenues en revue",
    "la complétude de la sélection — une vue peut omettre une entrée pertinente du modèle sans être fausse",
    "la véracité du modèle source — jugée par oracle-retro-modele, jamais re-jugée ici"
  ]
})
