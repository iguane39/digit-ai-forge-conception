// oracle-etat — protocole machine de sortie des verbes de la Forge Conception.
// Usage : node oracle-etat.mjs <ETAT.json>
// TF-0014 (R-C3) : l'état « bloqué sous le seuil de suffisance » (questions posées, run
// suspendu) n'était distinguable de « produit » par aucun mécanisme — seulement par lecture
// humaine de ce qui existe sur le disque. ETAT.json est le marqueur : chaque verbe qui se
// termine, produit ou rend la main, en écrit un à côté de son artefact (ou de ses questions).
// Convention documentée au README, section « Invocation par un orchestrateur ».

import { basename, dirname } from 'node:path'
import { readdirSync } from 'node:fs'
import { charger, constat, emettre, PASS, FAIL, SANS_OBJET } from './_contrat.mjs'

const VERSION = '1.1.0'

const VERBES = ['qualifie-l-entrant', 'enumere-la-surface', 'redige-les-exigences', 'derive-les-vues']
const STATUTS = ['produit', 'bloque_question']
const CHAMPS_QUESTION = ['id', 'question', 'recommande', 'defaut']

const cible = process.argv[2]
const etat = charger(cible)
const constats = []

// EM1 — le statut est dans l'ensemble fermé des deux issues mécaniquement distinguables.
constats.push(STATUTS.includes(etat?.statut)
  ? constat('EM1', PASS, 'statut', `statut ${etat.statut}`)
  : constat('EM1', FAIL, 'statut',
    `statut absent ou hors ensemble fermé : ${JSON.stringify(etat?.statut)} — attendu ${STATUTS.join(' | ')}`))

// EM3 — le verbe émetteur est déclaré et reconnu : sans lui, ETAT.json ne trace rien.
constats.push(VERBES.includes(etat?.verbe)
  ? constat('EM3', PASS, 'verbe', `verbe ${etat.verbe}`)
  : constat('EM3', FAIL, 'verbe',
    `verbe absent ou inconnu : ${JSON.stringify(etat?.verbe)} — attendu l'un des 4 verbes : ${VERBES.join(', ')}`))

// EM2 — aucun signal contradictoire. Un artefact livré et une question encore ouverte ne
// cohabitent jamais dans le même ETAT.json : c'est exactement le manque R-C3 — sans ce
// contrôle, un « produit » qui traîne des questions et un « bloqué » qui a déjà écrit un
// artefact partiel restent mécaniquement identiques.
const artefacts = Array.isArray(etat?.artefacts) ? etat.artefacts : []
const questions = Array.isArray(etat?.questions) ? etat.questions : []
const problemes = []

if (artefacts.length > 0 && questions.length > 0) {
  problemes.push('artefacts non vide ET questions non vide — signaux contradictoires : l\'état ' +
    'bloqué et l\'état produit ne sont plus distinguables mécaniquement')
}
if (etat?.statut === 'produit' && artefacts.length === 0) {
  problemes.push('statut produit sans aucun artefact déclaré — rien d\'opposable livré')
}
if (etat?.statut === 'bloque_question' && questions.length === 0) {
  problemes.push('statut bloque_question sans aucune question déclarée — rien à trancher pour l\'humain')
}
for (const [i, q] of questions.entries()) {
  const manquants = CHAMPS_QUESTION.filter(c => typeof q?.[c] !== 'string' || q[c].trim() === '')
  if (manquants.length > 0) {
    problemes.push(`questions[${i}] mal formée — champs manquants ou vides : ${manquants.join(', ')}`)
  }
}

constats.push(problemes.length === 0
  ? constat('EM2', PASS, 'artefacts/questions', 'cohérence produit/bloqué respectée')
  : constat('EM2', FAIL, 'artefacts/questions', problemes.join(' ; ')))

// EM4 — le NOM du fichier dit qui l'a écrit (TF-1619, retour Produit-79 du 07/10/2026). Un ETAT.json
// ne porte qu'UN verbe ; quand les quatre verbes écrivent dans le même dossier d'étape, la session
// improvisait le nommage. Convention : `ETAT.json` quand un seul verbe écrit dans le dossier,
// `ETAT-<verbe>.json` (verbe = celui du champ `verbe`) quand plusieurs y écrivent. AVERTISSEMENT
// non bloquant (SANS_OBJET), règle neuve opposable à tous les produits : jamais un FAIL.
{
  const nom = basename(String(cible))
  const m = /^ETAT-(.+)\.json$/.exec(nom)
  let voisins = []
  try { voisins = readdirSync(dirname(String(cible))).filter(f => /^ETAT-.+\.json$/.test(f)) } catch { /* dossier illisible : aucun voisin vu */ }
  if (m) {
    constats.push(m[1] === etat?.verbe
      ? constat('EM4', PASS, 'nom du fichier', `${nom} porte le verbe ${etat.verbe}`)
      : constat('EM4', SANS_OBJET, 'nom du fichier',
        `avertissement non bloquant : ${nom} annonce le verbe « ${m[1]} » mais le champ verbe vaut ${JSON.stringify(etat?.verbe)} — ` +
        'le nom doit être ETAT-<verbe>.json avec le verbe du fichier'))
  } else if (nom === 'ETAT.json') {
    constats.push(voisins.length === 0
      ? constat('EM4', PASS, 'nom du fichier', 'ETAT.json, seul état du dossier')
      : constat('EM4', SANS_OBJET, 'nom du fichier',
        `avertissement non bloquant : ETAT.json coexiste avec ${voisins.join(', ')} dans le même dossier — ` +
        'plusieurs verbes écrivent ici : chacun écrit ETAT-<verbe>.json, ETAT.json est réservé au cas d\'un seul verbe'))
  } else {
    constats.push(constat('EM4', SANS_OBJET, 'nom du fichier',
      `avertissement non bloquant : nom ${JSON.stringify(nom)} hors convention — attendu ETAT.json (un seul verbe) ou ETAT-<verbe>.json (plusieurs verbes dans le dossier)`))
  }
}

emettre({
  oracle: 'oracle-etat',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La pertinence des questions posées — EM2 vérifie la forme (les 4 champs), jamais que la ' +
      'question est la bonne ou que le défaut appliqué est raisonnable.',
    'L\'écriture effective du fichier par chaque verbe — cet oracle juge un ETAT.json fourni, ' +
      'jamais qu\'un verbe donné en a réellement produit un.'
  ]
})
