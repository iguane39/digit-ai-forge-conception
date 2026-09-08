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
//   VP5 empreinte du CORPS : la vue porte `corps_sha256` et VP5 la recalcule (TF-0827)
//
// TF-0827 — VP5 est la jumelle de `oracle-tracabilite` T5, posée sur la SECONDE famille de vues
// de cette forge. VP2 prouve d'où vient la vue, jamais ce qu'elle contient, et VP4 — la liste
// close des sections imposées par profil — ne voit qu'un TITRE. Mesure du 05/09/2026 sur
// `fixtures/vues-profil-verte` : la section « Règles de gestion » VIDÉE de son contenu, le titre
// laissé en place (162 caractères retirés sur 750, soit 22 % de la vue), rendait VP1, VP2, VP3
// et VP4 tous PASS, exit 0 — la décision disparue était indétectable. Contre-mesure du même
// banc : la même section retirée AVEC son titre fait bien échouer VP4, et c'est la seule
// amputation que la liste close attrape, puisqu'il suffit de garder le titre pour lui échapper.
// Corollaire porté à la doctrine : une liste de sections câblée ne remplace jamais une empreinte
// de corps — elle prouve qu'un titre est là, jamais qu'il y a quelque chose dessous.
//
// Le champ est FACULTATIF à la lecture, exactement comme `corps-sha256` l'est pour T5 : une vue
// scellée avant TF-0827 rend un SANS_OBJET motivé, et AUCUNE vue existante n'est migrée.

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { constat, emettre, erreur, PASS, FAIL, SANS_OBJET } from './_contrat.mjs'

const VERSION = '1.1.0'

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
// TF-0827 : la ligne qui FERME le frontmatter, retenue ici — le corps commence juste après, ce
// qui garantit que le sceau (`corps_sha256`, dans le frontmatter) ne se hache jamais lui-même.
let ligneFinFrontmatter = -1
{
  const lignes = vue.split('\n')
  if (lignes[0]?.trim() === '---') {
    for (let i = 1; i < lignes.length; i++) {
      if (lignes[i].trim() === '---') { ligneFinFrontmatter = i; break }
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

// VP5 — l'empreinte du CORPS (TF-0827), jumelle de `oracle-tracabilite` T5.
// Absente, elle n'est pas supposée : la vue a été scellée avant cette règle, sa PROVENANCE
// seule est jugée (VP2), et le verdict le DIT plutôt que de laisser croire que le contenu a été
// vérifié. Aucune vue déjà scellée n'a été migrée.
{
  const sceau = (champs.corps_sha256 || '').toLowerCase()
  if (ligneFinFrontmatter === -1) {
    constats.push(constat('VP5', SANS_OBJET, cible,
      'aucun frontmatter fermé : le corps de la vue n\'est pas délimitable, VP5 ne juge rien ' +
      '(voir VP1)'))
  } else if (sceau === '') {
    constats.push(constat('VP5', SANS_OBJET, cible,
      'champ `corps_sha256` absent du frontmatter : vue scellée avant TF-0827 — sa PROVENANCE ' +
      'est jugée par VP2, son CONTENU ne l\'est pas. Une section entière peut en avoir été ' +
      'VIDÉE, titre laissé en place, sans que VP4 ni rien d\'autre ne le voie ; la régénérer ' +
      'par `derive-les-vues` lui donne l\'empreinte de son corps'))
  } else if (!/^[0-9a-f]{64}$/.test(sceau)) {
    constats.push(constat('VP5', FAIL, cible,
      '`corps_sha256` n\'est pas une empreinte SHA-256 (64 hex) — un sceau illisible n\'est pas ' +
      'un sceau absent : il annonce un contrôle qui n\'a pas lieu'))
  } else {
    const corps = vue.split('\n').slice(ligneFinFrontmatter + 1).join('\n')
    const calcule = createHash('sha256').update(corps, 'utf8').digest('hex')
    if (calcule === sceau) {
      constats.push(constat('VP5', PASS, cible,
        `corps de la vue intact — ${corps.length} caractère(s) rehachés, empreinte identique`))
    } else {
      constats.push(constat('VP5', FAIL, cible,
        `corps de la vue altéré — le sceau annonce ${sceau.slice(0, 12)}…, le corps relu vaut ` +
        `${calcule.slice(0, 12)}… sur ${corps.length} caractère(s). Une vue est régénérable, ` +
        'jamais éditée : la corriger, c\'est modifier le RETRO-MODELE.md puis rejouer ' +
        '`derive-les-vues`, jamais retoucher ce fichier. VP4 ne voit qu\'un titre — une ' +
        'section vidée de son contenu lui échappe, et c\'est ce que cette empreinte attrape'))
    }
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
    "la véracité du modèle source — jugée par oracle-retro-modele, jamais re-jugée ici",
    "CE QUI a changé dans un corps de vue altéré (VP5). L'empreinte dit qu'un octet a bougé, " +
      "jamais quelle section a été vidée : VP4 vérifie les titres imposés, VP5 le contenu " +
      "sous ces titres, et ni l'une ni l'autre ne dit ce qui manque (TF-0827)",
    "le contenu d'une vue sans champ `corps_sha256` (VP5 SANS_OBJET). Aucune vue scellée avant " +
      "TF-0827 n'a été migrée : sa provenance seule est jugée, et le verdict le dit"
  ]
})
