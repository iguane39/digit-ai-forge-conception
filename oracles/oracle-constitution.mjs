// oracle-constitution — contrôle d'existence et de format de CONSTITUTION.md.
// Usage : node oracle-constitution.mjs <CONSTITUTION.md>
// TF-0101 (2/3) — écart à l'état de l'art 2026 : pas d'équivalent du `constitution.md` de
// GitHub Spec Kit dans cette forge. Les invariants non négociables d'un projet (ce qu'aucune
// exigence, aucun palier, aucune reformulation n'a le droit de trahir) ne sont séparés
// nulle part d'EXIGENCES.json — qui, lui, change à chaque itération de palier.
//
// Séparation qui fonde ce fichier : EXIGENCES.json décrit CE QUE le produit fait, versionné à
// chaque itération. CONSTITUTION.md décrit CE QUI NE CHANGE PAS — contraintes de conformité,
// principes d'architecture non négociables, garde-fous transverses — versionné par ratification
// explicite (`version` semver dans son en-tête), pas par cycle produit.
//
// L'« existence » du fichier n'est pas une règle jugée : comme pour tout autre oracle de cette
// forge, un artefact introuvable sort en 2 (ERREUR, cf. _contrat.mjs), jamais en FAIL — la forge
// n'a pas jugé, elle n'a pas pu juger. Ici, c'est le FORMAT du fichier présent qui est jugé.

import { readFileSync } from 'node:fs'
import { constat, emettre, erreur, PASS, FAIL } from './_contrat.mjs'

const VERSION = '1.0.0'

const SEMVER = /^\d+\.\d+\.\d+$/
const RE_TITRE_PRINCIPES = /^#{1,6}\s*Principes non n[ée]gociables\s*$/i
const RE_TITRE_PROMESSE = /^#{1,6}\s*Promesse\s*$/i
const RE_TITRE = /^#{1,6}\s/
const RE_PUCE = /^\s*(?:[-*]|\d+[.)])\s+(.+)$/
const PLACEHOLDERS = /^(todo|à compl[ée]ter|a completer|\.\.\.|tbd|xxx)$/i

/**
 * Analyse tolérante du frontmatter `--- clé: valeur ... ---`. Ne lève jamais : les défauts de
 * forme sont remontés en résultat, jugés ensuite par C1 — un oracle ne juge jamais en levant.
 */
function analyserFrontmatter (brut) {
  const lignes = brut.split(/\r\n|\n/)
  const debutOk = lignes[0]?.trim() === '---'
  let fin = -1
  if (debutOk) {
    for (let i = 1; i < lignes.length; i++) {
      if (lignes[i].trim() === '---') { fin = i; break }
    }
  }
  const finOk = fin !== -1
  const champs = {}
  const lignesInvalides = []
  if (debutOk && finOk) {
    for (let i = 1; i < fin; i++) {
      const ligne = lignes[i]
      if (ligne.trim() === '') continue
      const sep = ligne.indexOf(':')
      if (sep === -1 || ligne.slice(0, sep).trim() === '') {
        lignesInvalides.push(ligne)
        continue
      }
      champs[ligne.slice(0, sep).trim()] = ligne.slice(sep + 1).trim()
    }
  }
  const corps = finOk ? lignes.slice(fin + 1).join('\n') : brut
  return { debutOk, finOk, champs, lignesInvalides, corps }
}

/** Puces non vides et non placeholder sous la section « Principes non négociables ». */
function extrairePrincipes (corps) {
  const lignes = corps.split(/\r\n|\n/)
  let dansSection = false
  const puces = []
  for (const ligne of lignes) {
    if (RE_TITRE_PRINCIPES.test(ligne.trim())) { dansSection = true; continue }
    if (dansSection && RE_TITRE.test(ligne.trim())) break // section suivante : on s'arrête
    if (!dansSection) continue
    const m = ligne.match(RE_PUCE)
    if (m) puces.push(m[1].trim())
  }
  return { sectionTrouvee: dansSection, puces }
}

const cible = process.argv[2]
if (!cible) erreur('argument manquant : chemin de CONSTITUTION.md')
let brut
try {
  brut = readFileSync(cible, 'utf8')
} catch (e) {
  erreur(`CONSTITUTION.md introuvable ou illisible : ${cible} (${e.code ?? e.message})`)
}

const constats = []
const fm = analyserFrontmatter(brut)

// C1 — frontmatter présent, délimité, chaque ligne interne est une paire `clé: valeur`.
if (!fm.debutOk) {
  constats.push(constat('C1', FAIL, 'frontmatter', 'le fichier ne commence pas par un bloc --- ... --- '))
} else if (!fm.finOk) {
  constats.push(constat('C1', FAIL, 'frontmatter', 'délimiteur de fermeture --- du frontmatter introuvable'))
} else if (fm.lignesInvalides.length > 0) {
  constats.push(constat('C1', FAIL, 'frontmatter',
    `ligne(s) sans paire clé: valeur : ${fm.lignesInvalides.map(l => JSON.stringify(l.trim())).join(', ')}`))
} else {
  constats.push(constat('C1', PASS, 'frontmatter', `bien formé, ${Object.keys(fm.champs).length} champ(s)`))
}

// C2 — `version` présente, semver strict X.Y.Z. Une constitution qui ne se versionne pas ne
// permet à personne de dire si un projet aval est encore aligné avec elle.
constats.push(SEMVER.test(fm.champs.version ?? '')
  ? constat('C2', PASS, 'frontmatter.version', `version ${fm.champs.version}`)
  : constat('C2', FAIL, 'frontmatter.version',
    `absente ou non conforme au semver strict X.Y.Z : ${JSON.stringify(fm.champs.version ?? null)}`))

// C3 — au moins un principe non négociable exploitable (non vide, non placeholder).
const { sectionTrouvee, puces } = extrairePrincipes(fm.corps)
const principesValides = puces.filter(p => p !== '' && !PLACEHOLDERS.test(p))
if (!sectionTrouvee) {
  constats.push(constat('C3', FAIL, 'corps', 'section "## Principes non négociables" absente'))
} else if (principesValides.length === 0) {
  constats.push(constat('C3', FAIL, 'corps',
    `section présente mais aucun principe exploitable (${puces.length} puce(s), toutes vides ou placeholder)`))
} else {
  constats.push(constat('C3', PASS, 'corps', `${principesValides.length} principe(s) non négociable(s) déclaré(s)`))
}

// C4 — LA PROMESSE AU CLIENT (TF-0577, lot Produit-02 20260824).
//
// Le fait fondateur : la une d'un site promettait « votre produit, livré avec ses preuves » — un
// visiteur en déduit une LIVRAISON. Les six services vendus, produits par le MÊME RUN, disaient
// tout autre chose : « nous évaluons VOTRE chaîne », « VOS ÉQUIPES apprennent », « à la fin vos
// équipes exécutent SANS NOUS ». Aucun des six ne disait « nous construisons votre produit ».
//
// Ce qui rend le défaut structurel et non accidentel : la liste fermée des six services était une
// DÉCISION HUMAINE DATÉE, consignée et opposable. La promesse, elle, n'était opposable à rien —
// elle s'est décidée par défaut, en rédigeant un titre, c'est-à-dire au plus bas niveau de la
// chaîne. Deux affirmations du même run se contredisaient, et une seule avait un porteur.
//
// La promesse rejoint donc CONSTITUTION.md, dont c'est exactement la nature : ce qui ne change
// que par ratification explicite. Une phrase, dans les mots du CLIENT — ce qu'il gagne et ce
// qu'il n'a plus à faire — jamais dans ceux du produit.
const extrairePromesse = (corps) => {
  const lignes = corps.split(/\r?\n/)
  const debut = lignes.findIndex(l => RE_TITRE_PROMESSE.test(l))
  if (debut === -1) return { sectionTrouvee: false, texte: '' }
  const suite = []
  for (let i = debut + 1; i < lignes.length; i++) {
    if (RE_TITRE.test(lignes[i])) break
    suite.push(lignes[i])
  }
  return { sectionTrouvee: true, texte: suite.join(' ').replace(/\s+/g, ' ').trim() }
}

const promesse = extrairePromesse(fm.corps)
if (!promesse.sectionTrouvee) {
  constats.push(constat('C4', FAIL, 'corps',
    'section "## Promesse" absente — ce que le produit promet a son client se DECIDE et se ratifie, ' +
    'sinon il se decide par defaut en redigeant un titre, au plus bas niveau de la chaine (TF-0577)'))
} else if (promesse.texte === '' || PLACEHOLDERS.test(promesse.texte)) {
  constats.push(constat('C4', FAIL, 'corps',
    'section "## Promesse" presente mais vide ou placeholder — une promesse non ecrite n\'est ' +
    'opposable a rien, et c\'est precisement ce qui a laisse une une contredire son offre'))
} else if (promesse.texte.length > 400) {
  constats.push(constat('C4', FAIL, 'corps',
    `promesse de ${promesse.texte.length} caracteres — UNE PHRASE est demandee. Au-dela, ce n'est ` +
    'plus une promesse opposable mais une description, et une description ne se contredit pas : ' +
    'elle se nuance, ce qui est exactement le contraire de ce qu\'on veut ici'))
} else {
  constats.push(constat('C4', PASS, 'corps', `promesse ratifiee, ${promesse.texte.length} caracteres`))
}

emettre({
  oracle: 'oracle-constitution',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La pertinence des principes déclarés — C3 vérifie qu\'un principe est là et lisible, pas ' +
      'qu\'il est réellement non négociable ou correctement scopé.',
    'La cohérence entre la constitution et le contenu réel d\'EXIGENCES.json — aucun croisement ' +
      'mécanique entre les deux fichiers n\'est fait par cet oracle, contrairement à ce que fait ' +
      'oracle-tracabilite entre EXIGENCES.json et ses vues.',
    'Que la promesse soit ECRITE DANS LES MOTS DU CLIENT et non du produit : C4 verifie qu\'elle existe, qu\'elle est ratifiee et qu\'elle tient en une phrase, jamais qu\'elle parle du gain du client plutot que des moyens du fournisseur. Ce jugement se fait a la lecture, par un humain — et selon TF-0577 lui-meme, un controle n\'a pas besoin d\'etre automatique pour etre opposable, il a besoin d\'EXISTER et d\'avoir un porteur.',
    'La COHERENCE entre cette promesse et ce que la page d\'accueil affiche : c\'est le retour jumeau vers forge-design (TF-0578), qui met la une, la liste des services et ce champ cote a cote.',
    'Le respect effectif des principes par le produit livré — c\'est un contrôle de forme du ' +
      'document, pas un audit de conformité du code ou de l\'infrastructure.'
  ]
})
