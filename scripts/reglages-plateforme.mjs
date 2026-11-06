// scripts/reglages-plateforme.mjs — lit le registre des réglages sûrs par défaut du pilot et en tire,
// pour les plateformes d'un produit, les gabarits que `redige-les-exigences` écrit : une exigence
// vérifiable par réglage classé `defaut`, une question de conception par réglage classé `decision`.
// TF-2226 (D-178 (a) du 06/11/2026 : « réglage admissible appliqué à la création, vérifié à chaque
// livraison, exception décidée »). Étude : output/03-etudes/Digit-AI - Étude - Securite par defaut de
// bout en bout - 20261106a.md du pilot, sections 3.1 et 3.2 (point d'injection « cadrage »).
//
// Ceci est un OUTIL, pas un oracle : il LIT le registre, n'écrit aucun fichier et ne joue aucune
// commande du registre (cmd_appliquer, cmd_lire et cmd_retour sont des données, pas des ordres). Sa
// recette est `scripts/reglages-plateforme.self-test.mjs`, sur une COPIE du registre (jamais le
// fichier réel du pilot). Le registre est une donnée datée et sourcée (loi n° 4) : ce script n'en
// recopie aucune valeur, et le patron de plateformes non plus.
//
// Registre : `references/REGLAGES-SURS-PAR-DEFAUT.json` du pilot (TF-2225). Racine du pilot résolue
// comme pour les autres références du pilot : `--registre <chemin>`, sinon `$FORGE_ROOT/digit-ai-factory`,
// sinon `digit-ai-factory` à côté de ce dépôt. Registre introuvable ou illisible : exit 2, jamais un
// gabarit vide, parce qu'un « aucun réglage » rendu sur un registre absent ferait taire l'oubli.
//
// Usage :
//   node scripts/reglages-plateforme.mjs --plateformes Cloudflare,Supabase,GitHub [--registre <chemin>]
// Sortie : JSON sur stdout. Exit 0 = gabarits rendus ; exit 2 = registre ou argument inexploitable.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

export const VERSION = '1.0.0'
export const NOM_REGISTRE = 'REGLAGES-SURS-PAR-DEFAUT.json'
// Clés exactes d'une entrée (spécification : étude 20261106a, section 3.1).
export const CLES = ['plateforme', 'reglage', 'source_url', 'source_lue_le', 'criteres', 'cmd_appliquer',
  'cmd_lire', 'attendu', 'cmd_retour', 'classement']
export const CLASSEMENTS = ['defaut', 'decision']
// Les cinq critères d'admission au défaut (étude 20261106a : C1 source, C2 coût, C3 fonctionnement,
// C4 réversibilité, C5 vérifiabilité).
export const CRITERES = { c1: 'source', c2: 'coût', c3: 'fonctionnement', c4: 'réversibilité', c5: 'vérifiabilité' }

const ICI = dirname(fileURLToPath(import.meta.url))

/** Chemins candidats du registre, dans l'ordre où ils sont essayés. */
export function cheminsRegistre ({ registre, env = process.env, depot = join(ICI, '..') } = {}) {
  if (registre) return [resolve(registre)]
  const chemins = []
  if (env.FORGE_ROOT) chemins.push(join(env.FORGE_ROOT, 'digit-ai-factory', 'references', NOM_REGISTRE))
  chemins.push(join(depot, '..', 'digit-ai-factory', 'references', NOM_REGISTRE))
  return [...new Set(chemins.map(c => resolve(c)))]
}

/** Lit et valide le registre. Lève une Error au premier défaut, l'entrée nommée. */
export function lireRegistre (chemins) {
  const chemin = chemins.find(c => existsSync(c))
  if (!chemin) throw new Error(`registre introuvable, chemins essayés : ${chemins.join(' ; ')}`)
  let entrees
  try {
    entrees = JSON.parse(readFileSync(chemin, 'utf8'))
  } catch (e) {
    throw new Error(`registre non parsable : ${chemin} (${e.message})`)
  }
  if (!Array.isArray(entrees)) throw new Error(`registre non tableau : ${chemin}`)
  entrees.forEach((e, i) => {
    const nom = `entrée ${i} (${e?.reglage ?? 'sans réglage'})`
    for (const cle of CLES) if (e?.[cle] === undefined) throw new Error(`${nom} : clé absente : ${cle}`)
    if (!CLASSEMENTS.includes(e.classement)) throw new Error(`${nom} : classement « ${e.classement} » hors ${CLASSEMENTS.join(' | ')}`)
    for (const c of Object.keys(CRITERES)) {
      if (!e.criteres?.[c]?.verdict) throw new Error(`${nom} : critère ${c} sans verdict`)
    }
    // La règle de classement du registre : `defaut` seulement si c1 à c5 sont tenus. Une entrée qui la
    // viole n'engendre aucune exigence : le gabarit exigerait un réglage que le registre ne tient pas
    // pour admissible sans condition.
    const nonTenus = Object.keys(CRITERES).filter(c => e.criteres[c].verdict !== 'tenu')
    if (e.classement === 'defaut' && nonTenus.length > 0) {
      throw new Error(`${nom} : classé defaut alors que ${nonTenus.join(', ')} n'est pas tenu`)
    }
  })
  return { chemin, entrees }
}

const sansAccent = (t) => String(t).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** Le gabarit d'exigence d'un réglage classé defaut. Reste à écrire : id, besoin, cotation. */
export function gabaritExigence (e) {
  return {
    reglage: e.reglage,
    plateforme: e.plateforme,
    enonce: `Le produit applique sur ${e.plateforme} le réglage « ${e.reglage} ».`,
    // Le critère renvoie à l'entrée du registre sans en recopier la valeur : l'attendu est une donnée
    // datée du pilot (loi n° 4), il ne se fige pas dans chaque référentiel. `cmd_lire` et `attendu`
    // restent rendus à côté, pour EXIGENCES.md et pour l'audit. Recopier la valeur serait aussi
    // refusé par `oracle-exigences` E8 sur le réglage Always Use HTTPS, dont l'attendu littéral est
    // « on » (lu comme pronom indéfini) : refus rapporté, pas contourné en retouchant l'oracle.
    critere: `La commande de lecture du réglage « ${e.reglage} », telle que l'entrée du registre ${NOM_REGISTRE} la donne, retourne la valeur attendue par cette même entrée.`,
    palier: 'MVP',
    statut_epistemique: {
      nature: 'fait constaté',
      source: `${e.source_url}, lue le ${e.source_lue_le} (registre ${NOM_REGISTRE} du pilot)`
    },
    surface: [],
    hors_surface: `réglage de la plateforme ${e.plateforme} : configuration du compte ou du projet, aucun élément de surface fonctionnelle`,
    cmd_lire: e.cmd_lire,
    attendu: e.attendu,
    a_completer: ['id', 'besoin', 'cotation']
  }
}

/** Le gabarit de question d'un réglage classé decision : deux options, le coût lu aux critères. */
export function gabaritQuestion (e) {
  const couts = Object.keys(CRITERES)
    .filter(c => e.criteres[c].verdict !== 'tenu')
    .map(c => `${c} ${CRITERES[c]} (${e.criteres[c].verdict}) : ${e.criteres[c].preuve}`)
  return {
    reglage: e.reglage,
    plateforme: e.plateforme,
    question: `Le produit applique-t-il sur ${e.plateforme} le réglage « ${e.reglage} » ?`,
    options: [
      {
        lettre: 'a',
        libelle: 'appliquer le réglage',
        cout: couts.length > 0 ? couts : ['aucun critère en défaut au registre']
      },
      {
        lettre: 'b',
        libelle: 'écarter le réglage',
        cout: ["l'exposition reste celle d'origine de la plateforme ; l'écart est décidé par un humain et référencé (D-N, entrée de ledger ou citation datée), jamais un écart nu"]
      }
    ],
    recommandee: null,
    defaut_applique: 'b',
    hypothese: `réglage « ${e.reglage} » non appliqué faute de décision ; l'écart reste ouvert et nommé jusqu'à la réponse`,
    a_completer: ['recommandee'],
    source: `${e.source_url}, lue le ${e.source_lue_le}`
  }
}

/** Gabarits pour une liste de plateformes. Une plateforme sans entrée est NOMMÉE, jamais passée sous silence. */
export function gabarits (entrees, plateformes) {
  const voulues = plateformes.map(p => sansAccent(p).trim()).filter(Boolean)
  const retenues = entrees.filter(e => voulues.includes(sansAccent(e.plateforme).trim()))
  const connues = new Set(retenues.map(e => sansAccent(e.plateforme).trim()))
  return {
    exigences: retenues.filter(e => e.classement === 'defaut').map(gabaritExigence),
    questions: retenues.filter(e => e.classement === 'decision').map(gabaritQuestion),
    plateformes_sans_entree: plateformes.filter(p => !connues.has(sansAccent(p).trim()))
  }
}

function principal (argv) {
  const lire = (nom) => { const i = argv.indexOf(nom); return i === -1 ? undefined : argv[i + 1] }
  const plateformes = (lire('--plateformes') ?? '').split(',').map(p => p.trim()).filter(Boolean)
  if (plateformes.length === 0) {
    process.stderr.write('reglages-plateforme.mjs: --plateformes obligatoire (ex. Cloudflare,Supabase,GitHub)\n')
    return 2
  }
  let registre
  try {
    registre = lireRegistre(cheminsRegistre({ registre: lire('--registre') }))
  } catch (e) {
    process.stderr.write(`reglages-plateforme.mjs: ${e.message}\n`)
    return 2
  }
  const sortie = {
    outil: 'reglages-plateforme',
    version: VERSION,
    registre: registre.chemin,
    entrees_lues: registre.entrees.length,
    plateformes,
    ...gabarits(registre.entrees, plateformes)
  }
  process.stdout.write(JSON.stringify(sortie, null, 2) + '\n')
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(principal(process.argv.slice(2)))
}
