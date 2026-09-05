// oracle-tracabilite — bijection besoin ↔ exigence ↔ critère, et régénérabilité des vues.
// Usage : node oracle-tracabilite.mjs <EXIGENCES.json> [--vue <fichier>]...
// CDC §7.2 — règles T1 à T5.

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createHash } from 'node:crypto'
import { charger, constat, emettre, erreur, PASS, FAIL, SANS_OBJET, NATURES } from './_contrat.mjs'

const VERSION = '1.1.0'
const EN_TETE_SOURCE = /<!--\s*source-sha256:\s*([0-9a-f]{64})\s*-->/i

// TF-0818 : l'empreinte de la SOURCE prouve d'où vient la vue, jamais ce qu'elle contient.
// Mesuré le 05/09/2026 : la section « Surface implicite écartée » retirée d'un
// CADRAGE-DESIGN.md (996 caractères sur 4 327, dont deux écarts opposables), en-tête laissé
// intact — T3 rendait PASS, verdict global PASS, exit 0. La vue porte donc désormais AUSSI
// l'empreinte de son propre corps, et T5 la recalcule. C'est un contrôle de FORME : il voit
// qu'un octet du corps a changé, jamais lequel ni pourquoi.
const EN_TETE_CORPS = /<!--\s*corps-sha256:\s*([0-9a-f]{64})\s*-->[^\S\r\n]*\r?\n/i

// TF-0818 (3) — le contrat des vues porte DÉJÀ en prose la liste des sections attendues d'une
// fiche de cadrage. Elle est CITÉE dans le message d'échec pour dire au lecteur où regarder ;
// elle n'est pas CÂBLÉE : aucune section n'est cherchée dans la vue, et T5 ne sait pas
// laquelle manque. La citer sans la vérifier serait une transcription sans correspondance —
// c'est pourquoi le self-test rejoue la phrase citée contre `vues.md` et échoue si elle y a
// changé. Câbler la liste close est la seconde variante, non retenue dans ce lot.
const SECTIONS_ATTENDUES = {
  'CADRAGE-DESIGN.md':
    'Sections complémentaires à produire : le tableau élément de surface → exigences ' +
    'rattachées, les sections « Surface implicite écartée » et « Exigences socle écartées » ' +
    'définies plus bas, et une section finale disant ce que la vue ne dit pas.'
}
const SOURCE_DES_SECTIONS = 'skills/derive-les-vues/references/vues.md (section 1)'

// TF-0114 : l'empreinte juge un CONTENU, jamais l'encodage de fin de ligne du poste qui a
// fait le checkout. Sous Windows, core.autocrlf=true convertit LF -> CRLF à l'extraction ;
// sans cette normalisation, un artefact identique au caractère près change de SHA-256 selon
// l'OS. Même normalisation à appliquer partout où ce dépôt calcule ou embarque un
// source-sha256 (voir skills/derive-les-vues).
const normaliserFinsDeLigne = (texte) => texte.replace(/\r\n/g, '\n')

const cible = process.argv[2]
const vues = []
for (let i = 3; i < process.argv.length; i++) {
  if (process.argv[i] === '--vue') {
    const v = process.argv[++i]
    if (!v) erreur('--vue attend un chemin de fichier')
    vues.push(v)
  }
}

const ref = charger(cible)
if (!Array.isArray(ref.exigences)) erreur('champ `exigences` absent ou non tableau')
if (!Array.isArray(ref.besoins)) erreur('champ `besoins` absent ou non tableau')

const constats = []
const besoins = new Map(ref.besoins.map(b => [b?.id, b]))

// --- T1 : aucun orphelin, des deux côtés -----------------------------------

const besoinsCouverts = new Set()
for (const [i, e] of ref.exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`
  if (!e?.besoin) {
    constats.push(constat('T1', FAIL, ou, 'aucun besoin parent déclaré'))
  } else if (!besoins.has(e.besoin)) {
    constats.push(constat('T1', FAIL, ou, `besoin ${e.besoin} introuvable dans besoins[]`))
  } else {
    besoinsCouverts.add(e.besoin)
    constats.push(constat('T1', PASS, ou, `rattachée à ${e.besoin}`))
  }
}
for (const [i, b] of ref.besoins.entries()) {
  const ou = b?.id ? `besoins[${i}] (${b.id})` : `besoins[${i}]`
  constats.push(besoinsCouverts.has(b?.id)
    ? constat('T1', PASS, ou, 'porte au moins une exigence')
    : constat('T1', FAIL, ou, `besoin orphelin : ${b?.id} n'est couvert par aucune exigence`))
}

// --- T2 : exactement un critère non vide -----------------------------------

for (const [i, e] of ref.exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`
  const c = e?.critere
  if (Array.isArray(c)) {
    constats.push(constat('T2', FAIL, ou,
      `critere est un tableau de ${c.length} entrées — une exigence porte exactement un critère`))
  } else if (typeof c !== 'string' || c.trim() === '') {
    constats.push(constat('T2', FAIL, ou, 'critere absent ou vide'))
  } else {
    constats.push(constat('T2', PASS, ou, 'un critère, non vide'))
  }
}

// --- T3 : les vues sont régénérables depuis la source ----------------------
// --- T5 : le corps de la vue est celui qui a été scellé (TF-0818) ----------
// Les deux règles lisent le même fichier une seule fois. T3 juge la PROVENANCE (d'où vient
// cette vue), T5 juge le CONTENU (est-ce bien celui qui a été dérivé). Une vue peut être
// alignée sur sa source ET amputée d'un tiers : c'est le défaut que T5 comble.

const sha = createHash('sha256')
  .update(normaliserFinsDeLigne(readFileSync(cible, 'utf8')), 'utf8')
  .digest('hex')

// Le corps est TOUT ce qui suit la ligne `corps-sha256` de l'en-tête de sceau — donc le sceau
// ne se hache jamais lui-même. Mêmes fins de ligne normalisées que la source (TF-0114).
const empreinteDuCorps = (corps) => createHash('sha256')
  .update(normaliserFinsDeLigne(corps), 'utf8').digest('hex')

if (vues.length === 0) {
  constats.push(constat('T3', SANS_OBJET, 'aucune vue fournie',
    'aucun argument --vue : la régénérabilité n\'est pas jugée, elle n\'est pas non plus supposée'))
  constats.push(constat('T5', SANS_OBJET, 'aucune vue fournie',
    'aucun argument --vue : l\'intégrité du corps n\'est pas jugée, elle n\'est pas non plus supposée'))
} else {
  for (const v of vues) {
    let contenu
    try {
      contenu = readFileSync(v, 'utf8')
    } catch (e) {
      constats.push(constat('T3', FAIL, v, `vue illisible (${e.code ?? e.message})`))
      constats.push(constat('T5', FAIL, v, `vue illisible (${e.code ?? e.message})`))
      continue
    }
    const m = contenu.match(EN_TETE_SOURCE)
    if (!m) {
      constats.push(constat('T3', FAIL, v,
        'en-tête `<!-- source-sha256: ... -->` absent : la vue ne déclare pas sa source'))
    } else if (m[1].toLowerCase() !== sha) {
      constats.push(constat('T3', FAIL, v,
        `vue périmée ou éditée à la main — déclare ${m[1].slice(0, 12)}…, source à ${sha.slice(0, 12)}…`))
    } else {
      constats.push(constat('T3', PASS, v, 'vue alignée sur la source'))
    }

    // T5 — l'empreinte du corps. Absente, elle n'est pas supposée : la vue a été scellée
    // avant TF-0818, sa provenance seule est jugée, et le verdict le DIT plutôt que de
    // laisser croire que le contenu a été vérifié. Aucune vue déjà scellée n'a été migrée.
    const c = contenu.match(EN_TETE_CORPS)
    if (!c) {
      constats.push(constat('T5', SANS_OBJET, v,
        'en-tête `<!-- corps-sha256: ... -->` absent : vue scellée avant TF-0818 — sa ' +
        'PROVENANCE est jugée par T3, son CONTENU ne l\'est pas. Une section entière peut en ' +
        'avoir été retirée sans que rien ici ne le voie ; la régénérer par `derive-les-vues` ' +
        'lui donne l\'empreinte de son corps'))
      continue
    }
    const corps = contenu.slice(c.index + c[0].length)
    const shaCorps = empreinteDuCorps(corps)
    if (c[1].toLowerCase() === shaCorps) {
      constats.push(constat('T5', PASS, v,
        `corps de la vue intact — ${corps.length} caractère(s) rehachés, empreinte identique`))
    } else {
      const rappel = SECTIONS_ATTENDUES[basename(v)]
      constats.push(constat('T5', FAIL, v,
        `corps de la vue altéré — le sceau annonce ${c[1].slice(0, 12)}…, le corps relu vaut ` +
        `${shaCorps.slice(0, 12)}… sur ${corps.length} caractère(s). Une vue est régénérable, ` +
        'jamais éditée : la corriger, c\'est modifier `EXIGENCES.json` puis rejouer ' +
        '`derive-les-vues`, jamais retoucher ce fichier' +
        (rappel
          ? `. Ce que cette vue doit porter, cité de ${SOURCE_DES_SECTIONS} et NON vérifié ` +
            `ici — à comparer à la main : "${rappel}"`
          : '')))
    }
  }
}

// --- T4 : le statut épistémique porte sa preuve ou son plan ----------------

for (const [i, e] of ref.exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`
  const s = e?.statut_epistemique
  if (!s || !NATURES.includes(s.nature)) {
    constats.push(constat('T4', FAIL, ou,
      `statut_epistemique.nature absent ou invalide — attendu ${NATURES.join(' | ')}`))
  } else if (s.nature === 'fait constaté') {
    constats.push(typeof s.source === 'string' && s.source.trim() !== ''
      ? constat('T4', PASS, ou, 'fait constaté, source citée')
      : constat('T4', FAIL, ou, 'fait constaté sans source : un fait sans source est une hypothèse'))
  } else {
    constats.push(typeof s.validation === 'string' && s.validation.trim() !== ''
      ? constat('T4', PASS, ou, 'hypothèse, mode de validation déclaré')
      : constat('T4', FAIL, ou, 'hypothèse sans mode de validation : rien ne dit comment la lever'))
  }
}

emettre({
  oracle: 'oracle-tracabilite',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La justesse du rattachement exigence → besoin. T1 vérifie que le lien existe, ' +
      'jamais qu\'il est le bon.',
    'La véracité de la source citée en T4 — vérifiée présente, jamais vraie.',
    'CE QUI a changé dans un corps de vue altéré (T5). L\'empreinte dit qu\'un octet a bougé, ' +
      'jamais quelle section manque : la liste des sections attendues est CITÉE dans le ' +
      'message, jamais vérifiée dans la vue.',
    'Le contenu d\'une vue sans en-tête `corps-sha256` (T5 SANS_OBJET). Aucune vue scellée ' +
      'avant TF-0818 n\'a été migrée : sa provenance seule est jugée, et le verdict le dit.'
  ]
})
