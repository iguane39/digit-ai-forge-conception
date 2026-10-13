// oracle-cadrage-metier — format de CADRAGE-METIER.md, le modèle du métier d'un produit.
// Usage : node oracle-cadrage-metier.mjs <CADRAGE-METIER.md>
// TF-1564 (retour Produit-12 du 01/10/2026, RC-6 ; décidé le 13/10/2026) : le référentiel de
// conception produisait les exigences et la surface, jamais le MODÈLE DU MÉTIER. Mesuré chez un
// produit : 290 dates de bail sur 298 tirées de la date de modification des fichiers, 113 dates
// d'entrée sur 161 fausses, 71 quittances sur 93 classées pièces de candidature par une règle qui
// comparait ces dates. Aucun artefact ne portait les processus, le vocabulaire, ni les faits qui
// doivent rester vrais avec leur source de vérité.
//
// Ce fichier porte DEUX des trois pièces du volet : la carte des processus (section « Processus »)
// et le glossaire (section « Glossaire »). La troisième, les invariants du métier avec source de
// vérité, fenêtre de validité et exceptions, vit dans CONSTITUTION.md (règle C5 d'oracle-constitution),
// là où la forge range ce qui ne change que par ratification.
//
// Règle NEUVE opposable à tous les produits : le volet n'est DÛ qu'au niveau Complexe, et
// l'artefact absent sort en 2 (NON_JUGE chez l'agrégateur), jamais en FAIL. Une fois le fichier
// écrit, son format est jugé : un cadrage métier à moitié rempli est pire que son absence, il
// donne l'illusion d'un modèle.

import { readFileSync } from 'node:fs'
import { constat, emettre, erreur, PASS, FAIL } from './_contrat.mjs'

const VERSION = '1.0.0'

const RE_TITRE = /^#{1,6}\s/
const RE_PROCESSUS = /^#{1,6}\s*Processus\s*$/i
const RE_GLOSSAIRE = /^#{1,6}\s*Glossaire\s*$/i
const RE_PUCE = /^\s*(?:[-*]|\d+[.)])\s+(.+)$/
const PLACEHOLDERS = /^(todo|à compl[ée]ter|a completer|\.\.\.|tbd|xxx|n\/a)$/i
const COLONNES_GLOSSAIRE = ['terme', 'définition']

const cible = process.argv[2]
if (!cible) erreur('argument manquant : chemin de CADRAGE-METIER.md')
let brut
try {
  brut = readFileSync(cible, 'utf8')
} catch (e) {
  erreur(`CADRAGE-METIER.md introuvable ou illisible : ${cible} (${e.code ?? e.message})`)
}

/** Les lignes d'une section, du titre (exclu) au titre suivant (exclu). null si absente. */
function section (lignes, reTitre) {
  const debut = lignes.findIndex(l => reTitre.test(l.trim()))
  if (debut === -1) return null
  const corps = []
  for (let i = debut + 1; i < lignes.length; i++) {
    if (RE_TITRE.test(lignes[i].trim())) break
    corps.push(lignes[i])
  }
  return corps
}

const cellules = (ligne) => ligne.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
const estSeparateur = (ligne) => /^\|?[\s:|-]+\|?$/.test(ligne.trim()) && ligne.includes('-')

const lignes = brut.split(/\r\n|\n/)
const proc = section(lignes, RE_PROCESSUS)
const glos = section(lignes, RE_GLOSSAIRE)
const constats = []

// CM1 — les deux sections existent. Un modèle du métier sans l'une des deux est un modèle borgne.
const manquantes = [['Processus', proc], ['Glossaire', glos]].filter(([, s]) => s === null).map(([n]) => n)
constats.push(manquantes.length === 0
  ? constat('CM1', PASS, 'sections', 'sections « Processus » et « Glossaire » présentes')
  : constat('CM1', FAIL, 'sections', `section(s) absente(s) : ${manquantes.map(n => `« ## ${n} »`).join(', ')}`))

// CM2 — la carte des processus compte au moins un processus exploitable : une puce « nom : ce qui
// se passe, entre qui », ni vide ni placeholder. Le nom seul ne dit rien du métier.
if (proc !== null) {
  const puces = proc.map(l => l.match(RE_PUCE)).filter(Boolean).map(m => m[1].trim())
  const valides = puces.filter(p => !PLACEHOLDERS.test(p) && /^[^:]{2,}:\s*\S.{9,}/.test(p))
  constats.push(valides.length > 0
    ? constat('CM2', PASS, 'Processus', `${valides.length} processus décrit(s)`)
    : constat('CM2', FAIL, 'Processus',
      `aucun processus exploitable (${puces.length} puce(s)) — attendu « - nom : ce qui se passe, entre qui » ` +
      'avec au moins dix caractères de description'))
}

// CM3 — le glossaire est un tableau « Terme | Définition [| …] » d'au moins une ligne, dont chaque
// définition est écrite, et dont les termes sont uniques (deux définitions pour un terme, c'est
// le défaut que le glossaire existe pour empêcher).
if (glos !== null) {
  const lignesTableau = glos.filter(l => l.trim().startsWith('|'))
  const entete = lignesTableau[0] ? cellules(lignesTableau[0]).map(c => c.toLowerCase()) : []
  const enteteOk = COLONNES_GLOSSAIRE.every((c, i) => entete[i] === c)
  const rangs = lignesTableau.slice(1).filter(l => !estSeparateur(l)).map(cellules)
  const problemes = []
  if (!enteteOk) {
    problemes.push(`en-tête attendu « Terme | Définition », obtenu ${JSON.stringify(entete.join(' | '))}`)
  }
  if (rangs.length === 0) problemes.push('aucun terme défini')
  const vus = new Set()
  for (const [i, r] of rangs.entries()) {
    const terme = (r[0] ?? '').toLowerCase()
    if (!r[0] || PLACEHOLDERS.test(r[0])) problemes.push(`ligne ${i + 1} : terme vide`)
    else if (!r[1] || PLACEHOLDERS.test(r[1])) problemes.push(`terme « ${r[0]} » : définition vide ou placeholder`)
    if (terme && vus.has(terme)) problemes.push(`terme « ${r[0]} » défini deux fois`)
    vus.add(terme)
  }
  constats.push(problemes.length === 0
    ? constat('CM3', PASS, 'Glossaire', `${rangs.length} terme(s) défini(s), uniques`)
    : constat('CM3', FAIL, 'Glossaire', problemes.join(' ; ')))
}

emettre({
  oracle: 'oracle-cadrage-metier',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La JUSTESSE du modèle : CM2 et CM3 vérifient qu\'un processus et un terme sont écrits et ' +
      'lisibles, jamais qu\'ils décrivent le métier réel du client — cela se valide avec lui.',
    'La COMPLÉTUDE de la carte des processus : aucun contrôle ne sait quel processus manque.',
    'Les INVARIANTS du métier (source de vérité, fenêtre de validité, exceptions) : ils vivent ' +
      'dans CONSTITUTION.md et sont jugés par oracle-constitution C5.',
    'Leur traduction en CONTRÔLE EXÉCUTABLE chez le produit : c\'est un livrable du produit, ' +
      'rejoué par ses propres tests, pas par la forge de conception.'
  ]
})
