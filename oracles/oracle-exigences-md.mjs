// oracle-exigences-md — `EXIGENCES.md` jugé, et la CORRESPONDANCE entre un champ transcrit
// et la prose dont il est transcrit.
// Usage :
//   node oracle-exigences-md.mjs <EXIGENCES.md> [--referentiel <EXIGENCES.json>] [--surface <SURFACE.md>]
//
// Sans `--referentiel` ni `--surface`, l'oracle cherche les VOISINS du document jugé
// (`EXIGENCES.json` et `SURFACE.md`, dans le même dossier) : c'est ainsi que le runner
// `run-oracles-conception.mjs` l'invoque, avec un seul chemin à connaître.
//
// TF-0822 — POURQUOI CET ORACLE EXISTE.
//
// Deux champs racine du référentiel sont déclarés « transcrits de la prose et de nulle part
// ailleurs » : `ecarts_surface_implicite` <- section 3 de `SURFACE.md` (TF-0811),
// `ecarts_exigences_socle` <- section 7 d'`EXIGENCES.md` (TF-0814). Mesuré le 05/09/2026 : sur
// les onze oracles de la forge, ZÉRO ne prend `EXIGENCES.md` ou `SURFACE.md` en entrée. La
// règle de transcription n'était donc tenue par rien, et sa documentation le disait
// elle-même — « un écart écrit directement dans le JSON produit un référentiel qui passe
// l'oracle et une décision que personne n'a prise ».
//
// Mesure du 06/09/2026, avant cet oracle : un `EXIGENCES.json` portant un écart socle complet
// (motif, décideur, date) posé à côté d'un `EXIGENCES.md` d'une seule section, sans section 7,
// rendait `oracle-exigences` PASS, `oracle-surface` PASS, `oracle-claims` PASS, `oracle-ears`
// PASS, `oracle-tracabilite` PASS, et l'agrégé du runner PASS (exit 0). S4 et E10 prouvent que
// l'écart est ÉCRIT ; ils ne prouvent pas qu'il a été DÉCIDÉ.
//
// Le choix du porteur — un oracle NEUF plutôt que des règles versées dans `oracle-exigences` —
// tient à l'artefact jugé : `oracle-exigences` prend `EXIGENCES.json` en entrée et n'a jamais lu
// de Markdown ; l'artefact de celui-ci est un document de PROSE, comme `CONSTITUTION.md` a le
// sien. Un oracle, un artefact — et un `EXIGENCES.md` absent sort alors en 2 (l'oracle n'a pas
// pu juger), là où l'enfouir dans `oracle-exigences` aurait fait sortir en 2 un référentiel
// JSON parfaitement lisible.
//
//   P1  les sept sections du gabarit d'`EXIGENCES.md` sont présentes
//   P2  les sections 4 (Hypothèses) et 7 (Ce que le référentiel ne dit pas) sont NON VIDES
//   P3  chaque entrée d'`ecarts_exigences_socle` figure en section 7 d'`EXIGENCES.md`
//       (la clé ET le motif) — une entrée du JSON absente de la prose est un FAIL qui la NOMME
//   P4  chaque entrée d'`ecarts_surface_implicite` figure en section 3 de `SURFACE.md`
//       (la clé ET le motif), même règle, même verdict
//
// L'EXISTENCE du document n'est pas une règle jugée : comme `CONSTITUTION.md` et comme tout
// artefact de cette forge, un `EXIGENCES.md` introuvable sort en 2 (ERREUR), jamais en FAIL —
// la forge n'a pas jugé, elle n'a pas pu juger.
//
// AUCUNE MIGRATION N'EST DUE. Un référentiel ou une fixture antérieurs à ce contrôle se jugent
// sur la seule PRÉSENCE de la prose : `--referentiel` absent, ou champ d'écart absent, ou
// `SURFACE.md` absent -> SANS_OBJET motivé, jamais FAIL. Ce qui est refusé, c'est l'entrée de
// JSON qui n'a pas de prose — pas la prose qui n'a pas encore été écrite.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { constat, emettre, erreur, PASS, FAIL, SANS_OBJET } from './_contrat.mjs'

const VERSION = '1.0.0'

// --- Le gabarit, transcrit de sa source ------------------------------------
//
// `redige-les-exigences/references/schema-referentiel.md`, section « Gabarit de
// `EXIGENCES.md` ». Cette table en est la transcription exécutable ; elle ne l'étend pas —
// et depuis TF-0854 la recette le VÉRIFIE dans les deux sens, ordre compris, au lieu de le
// croire sur parole : cette table-ci a été écrite par le lot même qui refermait le trou de la
// transcription d'un champ, et rien ne la reliait à sa source.
// L'ordre est celui du gabarit ; le NUMÉRO écrit dans le titre n'est pas exigé (« ## Origine »
// vaut « ## 1. Origine »), parce que ce qui est dû est la section, pas sa décoration.
const SECTIONS_EXIGENCES_MD = [
  { rang: 1, titre: 'Origine', non_vide: false },
  { rang: 2, titre: 'Besoins', non_vide: false },
  { rang: 3, titre: 'Exigences par palier', non_vide: false },
  { rang: 4, titre: 'Hypothèses', non_vide: true },
  { rang: 5, titre: 'Couverture de surface', non_vide: false },
  { rang: 6, titre: 'Relevé des oracles', non_vide: false },
  { rang: 7, titre: 'Ce que le référentiel ne dit pas', non_vide: true }
]

// `enumere-la-surface/references/typologie-surface.md`, section « Gabarit de `SURFACE.md` » :
// seule la section 3 est lue ici, et c'est délibéré — le lot qui a commandé ce contrôle ne
// demande aucune règle de gabarit sur `SURFACE.md`, seulement la correspondance de l'écart.
const SECTION_ECARTES_SURFACE = 'Écartés'

// --- Lecture d'un document de prose ----------------------------------------

const RE_TITRE = /^(#{1,6})\s+(.*)$/
const RE_DIACRITIQUES = /[̀-ͯ]/g
const RE_APOSTROPHES = /[‘’ʼ`]/g
const RE_TIRETS = /[‐-―−]/g

/**
 * Normalise un texte pour la COMPARAISON, jamais pour l'affichage : minuscules, diacritiques
 * retirées, apostrophes et tirets unifiés, espaces réduits à un seul.
 *
 * Les diacritiques sont retirées à dessein. Ce que P3 et P4 cherchent, c'est une décision
 * écrite en prose ; un « é » rendu « e » dans l'un des deux supports est une variation de
 * saisie, pas une décision différente. Exiger l'accent ferait échouer une transcription
 * honnête et pousserait à recopier la prose depuis le JSON — l'inverse exact du sens de la
 * règle. Une REFORMULATION, elle, ne correspond toujours pas : c'est ce que la règle veut.
 */
function normaliser (texte) {
  return String(texte ?? '')
    .normalize('NFD').replace(RE_DIACRITIQUES, '')
    .replace(RE_APOSTROPHES, "'")
    .replace(RE_TIRETS, '-')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Découpe un document en sections de titre. CHAQUE titre ouvre une section — le titre 1 du
 * document comme ses sous-titres —, et le corps d'une section court jusqu'au titre suivant de
 * niveau ÉGAL OU SUPÉRIEUR. Un sous-titre appartient donc au corps de la section qui le
 * contient, tout en restant lui-même une section : une section 7 dont tout le contenu vit sous
 * des sous-titres n'est pas vide, et le titre 1 du document n'avale pas les sept sections du
 * gabarit qui le suivent.
 */
function sections (brut) {
  const lignes = brut.split(/\r\n|\n/)
  const titres = []
  for (const [i, ligne] of lignes.entries()) {
    const m = ligne.match(RE_TITRE)
    if (m) titres.push({ i, niveau: m[1].length, brut: m[2].trim() })
  }
  return titres.map((t, k) => {
    let fin = lignes.length
    for (let j = k + 1; j < titres.length; j++) {
      if (titres[j].niveau <= t.niveau) { fin = titres[j].i; break }
    }
    const libelle = t.brut.replace(/^\d+\s*[.)]\s*/, '').replace(/\s*[:.]\s*$/, '')
    return {
      niveau: t.niveau,
      libelle,
      cle: normaliser(libelle),
      texte: lignes.slice(t.i + 1, fin).join('\n').trim()
    }
  })
}

/** La section dont le titre normalisé vaut celui attendu. Rend `null` si elle n'y est pas. */
const sectionDe = (liste, titre) => liste.find(s => s.cle === normaliser(titre)) ?? null

// --- Arguments --------------------------------------------------------------

const argv = process.argv.slice(2)
const cible = argv.find(a => !a.startsWith('--'))
if (!cible) erreur('argument manquant : chemin d\'`EXIGENCES.md`')

const valeurDe = (drapeau) => {
  const i = argv.indexOf(drapeau)
  return i !== -1 ? argv[i + 1] : undefined
}
const voisin = (nom) => join(dirname(cible), nom)
const cheminReferentiel = valeurDe('--referentiel') ?? voisin('EXIGENCES.json')
const cheminSurface = valeurDe('--surface') ?? voisin('SURFACE.md')

let brut
try {
  brut = readFileSync(cible, 'utf8')
} catch (e) {
  erreur(`EXIGENCES.md introuvable ou illisible : ${cible} (${e.code ?? e.message})`)
}

const constats = []
const sectionsMd = sections(brut)
const gabarit = SECTIONS_EXIGENCES_MD.map(s => ({ ...s, section: sectionDe(sectionsMd, s.titre) }))

// --- P1 : les sept sections du gabarit sont présentes -----------------------

const absentes = gabarit.filter(s => s.section === null)
constats.push(absentes.length === 0
  ? constat('P1', PASS, cible,
    `les ${SECTIONS_EXIGENCES_MD.length} sections du gabarit sont présentes`)
  : constat('P1', FAIL, cible,
    `section(s) du gabarit absente(s) : ${absentes.map(s => `${s.rang}. ${s.titre}`).join(' · ')} ` +
    '— gabarit de `redige-les-exigences/references/schema-referentiel.md`, section ' +
    '« Gabarit de `EXIGENCES.md` »'))

// --- P2 : les sections 4 et 7 sont non vides --------------------------------

for (const s of gabarit.filter(s => s.non_vide)) {
  const ou = `${cible} § ${s.rang}`
  if (s.section === null) {
    constats.push(constat('P2', FAIL, ou,
      `section « ${s.titre} » absente : le gabarit la donne obligatoire ET non vide`))
  } else if (s.section.texte === '') {
    constats.push(constat('P2', FAIL, ou,
      `section « ${s.titre} » présente mais VIDE. Elle est obligatoire et non vide : sans ` +
      'elle, un référentiel se lit comme un produit déjà conçu aux trois quarts'))
  } else {
    constats.push(constat('P2', PASS, ou,
      `section « ${s.titre} » non vide (${s.section.texte.length} caractères)`))
  }
}

// --- P3 et P4 : la CORRESPONDANCE entre le champ transcrit et sa prose ------
//
// Un écart CORRESPOND quand la prose de sa section porte, l'une et l'autre, sa clé
// (`element`) et son `motif`. La clé seule ne suffirait pas : une entrée pourrait être
// réécrite dans le JSON avec un autre motif que celui décidé, et la correspondance dirait
// encore oui. Le motif seul ne suffirait pas non plus : rien ne rattacherait la phrase à la
// candidate qu'elle écarte.

let referentiel = null
let referentielLu = false
try {
  referentiel = JSON.parse(readFileSync(cheminReferentiel, 'utf8'))
  referentielLu = true
} catch { /* absent ou illisible : déclaré en SANS_OBJET juste après, jamais en FAIL */ }

let sectionsSurface = null
try {
  sectionsSurface = sections(readFileSync(cheminSurface, 'utf8'))
} catch { /* SURFACE.md absent : SANS_OBJET motivé */ }

const CORRESPONDANCES = [
  {
    regle: 'P3',
    champ: 'ecarts_exigences_socle',
    document: 'EXIGENCES.md',
    chemin: cible,
    titre: 'Ce que le référentiel ne dit pas',
    rang: 7,
    sections: sectionsMd
  },
  {
    regle: 'P4',
    champ: 'ecarts_surface_implicite',
    document: 'SURFACE.md',
    chemin: cheminSurface,
    titre: SECTION_ECARTES_SURFACE,
    rang: 3,
    sections: sectionsSurface
  }
]

for (const r of CORRESPONDANCES) {
  if (!referentielLu) {
    constats.push(constat(r.regle, SANS_OBJET, cheminReferentiel,
      `référentiel absent ou illisible : la correspondance de \`${r.champ}\` avec la section ` +
      `${r.rang} de \`${r.document}\` n'est pas calculable. Aucune migration n'est due — un ` +
      'document de prose sans référentiel voisin se juge sur sa seule prose'))
    continue
  }
  const entrees = referentiel?.[r.champ]
  if (entrees === undefined) {
    constats.push(constat(r.regle, SANS_OBJET, `${cheminReferentiel} (${r.champ})`,
      'champ absent du référentiel : aucun écart transcrit, rien à faire correspondre ' +
      '(référentiel antérieur au champ — sa prose seule le juge)'))
    continue
  }
  if (!Array.isArray(entrees)) {
    constats.push(constat(r.regle, FAIL, `${cheminReferentiel} (${r.champ})`,
      'champ présent mais non tableau — attendu [{ element, motif, decide_par, date }]'))
    continue
  }
  if (entrees.length === 0) {
    constats.push(constat(r.regle, PASS, `${cheminReferentiel} (${r.champ})`,
      'champ présent et vide : aucun écart transcrit, aucune prose due'))
    continue
  }
  if (r.sections === null) {
    constats.push(constat(r.regle, SANS_OBJET, r.chemin,
      `\`${r.document}\` absent ou illisible à côté du document jugé : les ${entrees.length} ` +
      `entrée(s) de \`${r.champ}\` ne sont confrontables à aucune prose. Le document est à ` +
      'fournir (`--surface`), il n\'est pas accusé absent'))
    continue
  }
  const section = sectionDe(r.sections, r.titre)
  if (section === null) {
    constats.push(constat(r.regle, FAIL, `${r.chemin} § ${r.rang}`,
      `section ${r.rang} « ${r.titre} » absente, alors que \`${r.champ}\` porte ` +
      `${entrees.length} entrée(s) : un écart transcrit d'une prose qui n'existe pas est un ` +
      'écart que personne n\'a décidé'))
    continue
  }
  const prose = normaliser(section.texte)
  for (const [i, e] of entrees.entries()) {
    const cle = typeof e?.element === 'string' ? e.element.trim() : ''
    const motif = typeof e?.motif === 'string' ? e.motif.trim() : ''
    const ou = `${r.champ}[${i}]${cle ? ` (${cle})` : ''}`
    const manque = []
    if (cle === '' || !prose.includes(normaliser(cle))) manque.push('sa clé `element`')
    if (motif === '' || !prose.includes(normaliser(motif))) manque.push('son `motif`')
    constats.push(manque.length === 0
      ? constat(r.regle, PASS, ou,
        `transcrit de la section ${r.rang} de \`${r.document}\` : la clé et le motif y figurent`)
      : constat(r.regle, FAIL, ou,
        `entrée de \`${r.champ}\` absente de la section ${r.rang} « ${r.titre} » de ` +
        `\`${r.document}\` : ${manque.join(' et ')} ne s'y ` +
        `${manque.length > 1 ? 'trouvent' : 'trouve'} pas. Le champ est TRANSCRIT de la prose ` +
        'et de nulle part ailleurs — un écart écrit directement dans le JSON produit un ' +
        'référentiel qui passe l\'oracle et une décision que personne n\'a prise. Motif ' +
        `attendu en prose : « ${motif || '(vide)'} »`))
  }
}

emettre({
  oracle: 'oracle-exigences-md',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La PERTINENCE du contenu d\'une section : P1 et P2 vérifient qu\'elle est là et qu\'elle ' +
      'porte du texte, jamais que ce texte dit quelque chose. Une section 7 remplie d\'une ' +
      'phrase creuse passe — c\'est une revue humaine, et le gabarit la rend au moins visible.',
    'La VALIDITÉ d\'un écart : motif d\'au moins 20 caractères, décideur, date, clé de la liste ' +
      'close restent jugés par `oracle-exigences` E10 et `oracle-surface` S4. Ici, seule la ' +
      'CORRESPONDANCE avec la prose est en cause — les deux contrôles sont complémentaires, ' +
      'aucun ne remplace l\'autre.',
    'Le sens INVERSE de la correspondance : une décision écrite en prose et jamais transcrite ' +
      'dans le référentiel n\'est pas détectée. Ce serait un autre contrôle, sur un autre ' +
      'défaut — celui-ci refuse le JSON sans prose, pas la prose sans JSON.',
    'Tout AUTRE document de prose de la forge (`ENTRANT.md`, `CONSTITUTION.md`, les vues ' +
      'dérivées) : seuls `EXIGENCES.md` et `SURFACE.md` sont les sources déclarées d\'un champ ' +
      'transcrit, et une règle sur un document dont aucun champ ne dérive n\'aurait rien à ' +
      'vérifier.',
    'L\'ORTHOGRAPHE exacte d\'une transcription : la comparaison retire les diacritiques et ' +
      'unifie apostrophes, tirets et espaces. Un motif recopié à l\'accent près et un motif ' +
      'recopié sans accent sont tenus pour la même décision.'
  ]
})
