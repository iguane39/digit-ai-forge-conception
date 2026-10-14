// oracle-tracabilite — bijection besoin ↔ exigence ↔ critère, et régénérabilité des vues.
// Usage : node oracle-tracabilite.mjs <EXIGENCES.json> [--vue <fichier>]... [--cascade <CASCADE.json>]
// CDC §7.2 — règles T1 à T5 ; T6 remontée ISTO exigence → tactique → stratégie → intention (TF-1680).

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createHash } from 'node:crypto'
import { charger, constat, emettre, erreur, PASS, FAIL, SANS_OBJET, NATURES } from './_contrat.mjs'

const VERSION = '1.2.0'
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

// TF-1680 : la cascade ISTO du pilot (`references/INTENTION.md` 2.0.0, format
// `pilot/cascade-isto@1`, gabarit `gabarits/CASCADE-ISTO.json`) range intention, stratégies et
// tactiques dans un artefact COMPAGNON, `cascade/CASCADE.json`, et c'est la cascade qui cite
// les exigences (`tactiques[].exigences`). Le référentiel garde sa forme ; une exigence peut
// porter en plus le champ FACULTATIF `tactique` (identifiant `TAC-n` de la cascade), que T6
// confronte à la cascade quand `--cascade` la fournit. Sans le champ ni la cascade, T6 rend un
// SANS_OBJET motivé : aucun référentiel existant n'est accusé, aucune migration n'est due.
const FORMAT_CASCADE = 'pilot/cascade-isto@1'
const active = (x) => (x?.statut ?? 'active') !== 'retiree'
const plein = (v) => typeof v === 'string' && v.trim() !== ''

const cible = process.argv[2]
const vues = []
let cheminCascade = null
for (let i = 3; i < process.argv.length; i++) {
  if (process.argv[i] === '--vue') {
    const v = process.argv[++i]
    if (!v) erreur('--vue attend un chemin de fichier')
    vues.push(v)
  } else if (process.argv[i] === '--cascade') {
    cheminCascade = process.argv[++i]
    if (!cheminCascade) erreur('--cascade attend le chemin de CASCADE.json')
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

// --- T6 : chaque exigence remonte à une tactique, une stratégie, l'intention (TF-1680) ---------
// Retour du 02/10/2026 sur un produit réel : le référentiel ne remontait qu'à des besoins, liste
// plate sans indicateur ni cible ; en reconstruisant la cascade, 5 tactiques sur 14 n'ont trouvé
// leur alternative écartée nulle part, et le rattachement a dû vivre hors du référentiel. T1
// vérifie que le besoin existe ; T6 rejoue la chaîne jusqu'à l'intention, quand on la lui donne.

const ouExigence = (e, i) => (e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`)
const portent = ref.exigences
  .map((e, i) => [e, i])
  .filter(([e]) => e && Object.prototype.hasOwnProperty.call(e, 'tactique'))
// Le champ, s'il est écrit, est une chaîne non vide — avec ou sans cascade.
const malFormees = new Set()
for (const [e, i] of portent) {
  if (!plein(e.tactique)) {
    malFormees.add(e)
    constats.push(constat('T6', FAIL, ouExigence(e, i),
      'champ `tactique` présent mais vide ou non chaîne — attendu l\'identifiant d\'une tactique ' +
      'de la cascade (« TAC-1 »), ou le champ retiré'))
  }
}

if (cheminCascade === null) {
  constats.push(constat('T6', SANS_OBJET, 'aucune cascade fournie',
    portent.length === 0
      ? 'aucune exigence ne porte de champ `tactique` et aucun argument --cascade : la remontée ' +
        'ISTO (exigence → tactique → stratégie → intention) n\'est pas jugée, elle n\'est pas ' +
        'non plus supposée. Référentiel antérieur au champ : aucune migration n\'est due'
      : `${portent.length} exigence(s) portent un champ \`tactique\`, mais sans --cascade ni ` +
        'la tactique, ni sa stratégie, ni l\'intention ne sont vérifiées'))
} else {
  let cascade
  try {
    cascade = JSON.parse(readFileSync(cheminCascade, 'utf8'))
  } catch (e) {
    erreur(`cascade illisible ou non parsable : ${cheminCascade} (${e.code ?? e.message})`)
  }
  if (cascade?.format !== FORMAT_CASCADE) {
    constats.push(constat('T6', FAIL, cheminCascade,
      `format « ${cascade?.format ?? 'absent'} » au lieu de « ${FORMAT_CASCADE} » — gabarit : ` +
      'gabarits/CASCADE-ISTO.json du pilot'))
  } else {
    const tactiques = Array.isArray(cascade.tactiques) ? cascade.tactiques : []
    const strategies = new Map((Array.isArray(cascade.strategies) ? cascade.strategies : [])
      .map(s => [s?.id, s]))
    const parId = new Map(tactiques.map(t => [t?.id, t]))
    const intention = cascade.intention ?? {}
    const intentionTient = plein(intention.reformulation) &&
      (intention.citations ?? []).some(c => plein(c?.texte) && plein(c?.source))
    if (!intentionTient) {
      constats.push(constat('T6', FAIL, `${cheminCascade} (intention)`,
        'la cascade ne porte pas d\'intention citée (texte + source) et reformulée : aucune ' +
        'exigence ne peut y remonter'))
    }

    // Les exigences que la cascade cite, par tactique ACTIVE : c'est la cascade qui est la source.
    const citeesPar = new Map()
    for (const t of tactiques.filter(active)) {
      for (const id of Array.isArray(t?.exigences) ? t.exigences : []) {
        citeesPar.set(id, [...(citeesPar.get(id) ?? []), t.id])
      }
    }

    for (const [i, e] of ref.exigences.entries()) {
      if (malFormees.has(e)) continue
      const ou = ouExigence(e, i)
      const citantes = citeesPar.get(e?.id) ?? []
      let tactique = null
      if (plein(e?.tactique)) {
        const t = parId.get(e.tactique.trim())
        if (!t) {
          constats.push(constat('T6', FAIL, ou, `tactique ${e.tactique} inconnue de la cascade`))
          continue
        }
        if (!active(t)) {
          constats.push(constat('T6', FAIL, ou, `tactique ${t.id} retirée de la cascade — rupture ISTO`))
          continue
        }
        if (!citantes.includes(t.id)) {
          constats.push(constat('T6', FAIL, ou,
            `le champ \`tactique\` dit ${t.id}, mais la cascade ne cite pas ${e.id} sous ${t.id}` +
            (citantes.length ? ` (elle la cite sous ${citantes.join(', ')})` : '') +
            ' — les deux sens divergent ; la cascade est la source (INTENTION.md) : corriger ' +
            'l\'un ou l\'autre pour qu\'ils disent la même tactique'))
          continue
        }
        tactique = t
      }
      if (citantes.length > 1) {
        constats.push(constat('T6', FAIL, ou,
          `rattachée à ${citantes.length} tactiques actives (${citantes.join(', ')}) — une seule`))
        continue
      }
      if (!tactique) {
        if (citantes.length === 0) {
          constats.push(constat('T6', FAIL, ou,
            'aucune tactique active de la cascade ne cite cette exigence — opération orpheline'))
          continue
        }
        tactique = parId.get(citantes[0])
      }
      const s = strategies.get(tactique.strategie)
      if (!s) {
        constats.push(constat('T6', FAIL, ou,
          `${tactique.id} cite une stratégie inconnue (${tactique.strategie ?? 'aucune'}) — rupture ISTO`))
      } else if (!active(s)) {
        constats.push(constat('T6', FAIL, ou, `${tactique.id} sous ${s.id} retirée — rupture ISTO`))
      } else if (intentionTient) {
        constats.push(constat('T6', PASS, ou,
          `${e.id} → ${tactique.id} → ${s.id} → intention` +
          (plein(e?.tactique) ? ' (champ `tactique` conforme à la cascade)' : '')))
      }
    }

    // L'autre sens : la cascade ne cite aucune exigence absente du référentiel.
    const connues = new Set(ref.exigences.map(e => e?.id))
    const retirees = new Set(Array.isArray(ref.identifiants_retires) ? ref.identifiants_retires : [])
    for (const [id, ts] of citeesPar) {
      if (!connues.has(id)) {
        constats.push(constat('T6', FAIL, `${cheminCascade} (${ts.join(', ')})`,
          `la cascade cite ${id}, ${retirees.has(id) ? 'identifiant RETIRÉ du référentiel' : 'absente du référentiel'}`))
      }
    }
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
      'avant TF-0818 n\'a été migrée : sa provenance seule est jugée, et le verdict le dit.',
    'La PERTINENCE d\'un rattachement ISTO (T6) : qu\'une exigence serve réellement sa tactique, ' +
      'une tactique sa stratégie. T6 voit la chaîne d\'identifiants, pas le sens — et ne juge de ' +
      'la cascade que ce dont la remontée dépend (format, intention citée, tactique et stratégie ' +
      'actives) ; le reste (validation tracée de l\'intention, indicateurs, alternatives écartées, ' +
      'historique) relève de `oracle-cascade-isto.mjs` du pilot.',
    'Que l\'intention de la cascade soit celle d\'`ENTRANT.md` : T6 exige une intention citée ' +
      'et reformulée, jamais qu\'elle reprenne la section de l\'entrant.'
  ]
})
