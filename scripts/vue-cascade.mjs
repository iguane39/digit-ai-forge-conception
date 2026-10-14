#!/usr/bin/env node
// scripts/vue-cascade.mjs — la vue lisible de la cascade ISTO d'un produit, dérivée de sa source et
// scellée comme les autres vues de `derive-les-vues` (TF-1686).
//
// LE FAIT. La règle T6 d'oracle-tracabilite (TF-1680) juge la remontée exigence → tactique →
// stratégie → intention contre la cascade ISTO du produit (`cascade/CASCADE.json`, format
// `pilot/cascade-isto@1`). Mais `derive-les-vues` ne dérivait aucune vue de cette cascade : le
// demandeur, qui ratifie l'intention, les effets et les moyens, n'avait rien de scellé à lire.
//
// CE QU'IL FAIT. Il lit la cascade et le référentiel, rejoue T6, et écrit `CASCADE.md` dans la
// forme en six parties de la famille `gd-cascade-produit` du pilot (Intention, Stratégie, Tactique,
// Opérationnel, Test rétro, Tenir la cascade à jour — `gabarits/documents/cascade-produit/` du
// pilot, dont le générateur `generer-vue-cascade.mjs` fixe la forme reprise ici). La forge n'en
// dépend pas à l'exécution : elle n'importe rien du pilot. Le test rétro porte donc le verdict de
// T6, que la forge sait rendre ; les mesures M1 à M4 restent celles d'`oracle-cascade-isto` du
// pilot, et la vue le dit.
//
// LE SCEAU. Comme toute vue de ce dépôt (skills/derive-les-vues/references/vues.md), l'en-tête
// porte l'empreinte de sa source et celle de son corps, plus celle du référentiel contre lequel le
// test rétro a été jugé — une vue de cascade a deux sources :
//   <!-- source: cascade/CASCADE.json -->
//   <!-- source-sha256: <cascade> -->       jugée par oracle-tracabilite T3
//   <!-- referentiel-sha256: <référentiel> -->  jugée par T3
//   <!-- corps-sha256: <corps> -->          jugée par T5
// Fins de ligne normalisées LF avant hachage (TF-0114). La vue ne porte aucune date de
// génération : deux générations d'une même source rendent le même octet.
//
// Ceci est un OUTIL, pas un oracle : il écrit un fichier. Sa recette est
// `scripts/vue-cascade.self-test.mjs`, sur des copies en répertoire temporaire.
//
// Usage :
//   node scripts/vue-cascade.mjs <EXIGENCES.json> [--cascade <CASCADE.json>] [--sortie <CASCADE.md>]
// Par défaut, la cascade est `cascade/CASCADE.json` et la vue `CASCADE.md`, à côté du référentiel
// (forge/etapes/conception/ chez le produit).
// Exit : 0 vue écrite (son test rétro peut dire FAIL : une rupture se rend, elle ne se tait pas) ·
//        2 aucune cascade, ou source illisible — aucune vue écrite.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'

const ICI = dirname(fileURLToPath(import.meta.url))
const ORACLE_TRACABILITE = join(ICI, '..', 'oracles', 'oracle-tracabilite.mjs')
export const CASCADE_VOISINE = join('cascade', 'CASCADE.json')
export const GABARIT = 'gd-cascade-produit'
export const VERSION_GABARIT = '1.0.0'

const normaliser = (texte) => String(texte).replace(/\r\n/g, '\n')
export const empreinte = (texte) => createHash('sha256').update(normaliser(texte), 'utf8').digest('hex')

/** Une cellule de tableau Markdown : ni barre verticale ni retour à la ligne. */
const cellule = (v) => (v === undefined || v === null || v === '' ? '—' : String(v)).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')
const liste = (v) => (Array.isArray(v) ? v : [])
const actif = (x) => (x?.statut ?? 'active') !== 'retiree'
const marqueRetrait = (x) => (actif(x) ? '' : ` *(retirée : ${cellule(x.motif_retrait || `remplacée par ${x.remplacee_par}`)})*`)

function valeurActuelle (va) {
  if (!va || typeof va !== 'object') return '—'
  if (va.non_mesuree) return `non mesurée : ${va.non_mesuree}`
  return `${va.valeur} — mesurée le ${va.mesuree_le}, ${va.source}`
}

function indicateur (ind) {
  if (!ind || typeof ind !== 'object') return cellule(ind)
  return `${ind.formule} ; dénominateur : ${ind.denominateur} ; lu : ${ind.source}`
}

/**
 * Le corps de la vue (tout ce qui suit le sceau). `t6` = les constats T6 d'oracle-tracabilite
 * rejoué à la génération ; `sources` = les chemins cités en tête, relatifs à la vue.
 */
export function rendreCorps (cascade, { t6 = [], sources = [] } = {}) {
  const c = cascade || {}
  const strategies = liste(c.strategies)
  const tactiques = liste(c.tactiques)
  const intention = c.intention || {}
  const v = intention.validation || {}
  const L = []
  L.push('---')
  L.push('role: cascade du produit — intention, stratégie, tactique, opérationnel, puis test rétro (references/INTENTION.md du pilot) ; vue dérivée, jamais éditée à la main')
  L.push(`sources_de_verite: [${sources.join(', ')}]`)
  L.push(`version: ${c.version ?? '—'}`)
  L.push(`verifie_le: ${c.date ?? '—'}`)
  L.push(`gabarit: ${GABARIT}`)
  L.push(`version_du_gabarit: ${VERSION_GABARIT}`)
  L.push('---', '')
  L.push(`# Cascade du produit — ${c.projet ?? '—'}`, '')
  L.push(`**Version ${c.version ?? '—'} du ${c.date ?? '—'} · statut : ${c.statut ?? '—'}.** Règle : ${c.regle ?? '—'}. ` +
    'Vue dérivée de la source de la cascade par `scripts/vue-cascade.mjs` de la forge Conception (forme de la famille ' +
    '`gd-cascade-produit`) et scellée : la modifier, c\'est modifier la source puis régénérer.', '')
  L.push('Ce document rattache chaque exigence du produit à un moyen choisi (une **tactique**), chaque moyen à un effet ' +
    'attendu (une **stratégie**), et chaque effet à ce que le demandeur cherche (l\'**intention**). Une **alternative ' +
    'écartée** est l\'autre moyen qu\'on aurait pu prendre ; un **indicateur** dit à quoi l\'on verra qu\'un effet est ' +
    'atteint ; une **rupture** est un maillon qui ne remonte pas au niveau du dessus.', '')

  // 1. Intention
  L.push('## Intention', '', 'Ce que le demandeur cherche, dans ses mots :', '')
  for (const cit of liste(intention.citations)) L.push(`> « ${cit.texte} »`, '>', `> — ${cit.source}`, '')
  L.push(`**Reformulation** : ${intention.reformulation ?? '—'}`, '')
  L.push(`**Validée** le ${v.date ?? '—'} par ${v.par ?? '—'} (${v.trace ?? '—'}).`, '')
  const parties = liste(c.parties_prenantes)
  if (parties.length) {
    L.push('| Partie prenante | Rôle | Ce qu\'elle cherche |', '|---|---|---|')
    for (const p of parties) L.push(`| ${cellule(p.id)} | ${cellule(p.role)} | ${cellule(p.intention)} |`)
    L.push('')
  }
  if (c.arbitrage) L.push(`**Arbitrage** : ${c.arbitrage}`, '')
  L.push('**Contraintes** : ' + (liste(c.contraintes).length
    ? liste(c.contraintes).map((x) => `${x.id} ${x.enonce} (${x.source})`).join(' ; ') : 'aucune, déclaré.'), '')
  L.push('**Non-objectifs** : ' + (liste(c.non_objectifs).length
    ? liste(c.non_objectifs).map((x) => `${x.id} ${x.enonce} (motif : ${x.motif})`).join(' ; ') : 'aucun, déclaré.'), '')

  // 2. Stratégie
  L.push('## Stratégie', '', 'Les effets que le produit doit produire. Le manque fonde chaque effet ; l\'indicateur dit comment on le verra, la cible ce qu\'on attend.', '')
  L.push('| Stratégie | Effet attendu | Manque qui le fonde | Indicateur | Valeur actuelle | Cible |', '|---|---|---|---|---|---|')
  for (const s of strategies) {
    L.push(`| **${cellule(s.id)}**${marqueRetrait(s)} | ${cellule(s.effet)} | ${cellule(s.manque)} | ${cellule(indicateur(s.indicateur))} | ${cellule(valeurActuelle(s.valeur_actuelle))} | ${cellule(s.cible)} |`)
  }
  L.push('')

  // 3. Tactique
  L.push('## Tactique', '', 'Mode de lecture : une ligne par moyen retenu, dans l\'ordre de la source ; la colonne « Alternative écartée » dit ce qu\'on n\'a pas pris et pourquoi, la dernière si ce pourquoi est écrit dans une source (« sourcée ») ou reconstruit par qui a rédigé la cascade (« reconstruite », à ratifier).', '')
  L.push('| Tactique | Stratégie | Moyen retenu | Alternative écartée, et pourquoi | Source | Statut |', '|---|---|---|---|---|---|')
  for (const t of tactiques) {
    L.push(`| **${cellule(t.id)}**${marqueRetrait(t)} | ${cellule(t.strategie)} | ${cellule(t.moyen)} | ${cellule(`${t.alternative_ecartee ?? '—'} — ${t.justification ?? '—'}`)} | ${cellule(t.source)} | ${cellule(t.statut_justification)} |`)
  }
  L.push('')

  // 4. Opérationnel
  L.push('## Opérationnel', '', 'Mode de lecture : une ligne par tactique ; la troisième colonne liste les exigences qui la réalisent, la dernière les autres éléments qui la mettent en œuvre.', '')
  L.push('| Tactique | Stratégie | Exigences | Autres éléments |', '|---|---|---|---|')
  for (const t of tactiques) {
    const autres = liste(t.autres_elements).map((e) => (typeof e === 'object' ? `${e.id} (${e.type}) ${e.libelle}` : String(e))).join(' ; ')
    L.push(`| **${cellule(t.id)}** | ${cellule(t.strategie)} | ${cellule(liste(t.exigences).join(', '))} | ${cellule(autres)} |`)
  }
  L.push('')

  // 5. Test rétro — le verdict de T6, rejoué à la génération ; jamais rédigé.
  const echecs = t6.filter((f) => f.statut === 'FAIL')
  const rattachees = t6.filter((f) => f.statut === 'PASS' && String(f.ou).startsWith('exigences['))
  L.push('## Test rétro', '')
  L.push(`Verdict de la règle T6 d'\`oracle-tracabilite\` (forge Conception) à la génération, jugé contre le référentiel : **${echecs.length ? 'FAIL' : 'PASS'}**, ${t6.length - echecs.length} constat(s) tenu(s) sur ${t6.length}.`, '')
  if (echecs.length) {
    L.push('Ruptures et manques, à corriger avant toute remise :', '')
    for (const f of echecs) L.push(`- ${cellule(f.ou)} : ${f.message}`)
    L.push('')
  }
  L.push(`- Rattachement : ${rattachees.length} exigence(s) remontent à l'intention par une seule tactique active et une stratégie active.`)
  L.push('- Mesures M1 à M4 (cibles à fixer, justifications reconstruites, exigences sans test, stratégies non mesurées) : non rejouées par cette forge, elles relèvent d\'`oracle-cascade-isto` du pilot (étape 4 ci-dessous).', '')

  // 6. Tenir la cascade à jour
  L.push('## Tenir la cascade à jour', '')
  L.push('1. Une exigence nouvelle cite sa tactique dans la source de la cascade, jamais dans cette vue.')
  L.push('2. Un changement déclare le plus haut niveau qu\'il touche (I, S, T ou O) par une entrée d\'historique, avec la décision qui l\'a voulu.')
  L.push('3. Un élément qui sort reste dans la source, marqué `retiree`, avec son motif ou son remplaçant.')
  L.push('4. Juger la remontée : `node oracles/run-oracles-conception.mjs <EXIGENCES.json>` (forge Conception, la cascade voisine est passée d\'office à T6) ; juger le reste de la source : `node <PILOT_ROOT>/oracles/oracle-cascade-isto.mjs <CASCADE.json> --exigences <EXIGENCES.json> --tests <dossier des tests>`.')
  L.push('5. Régénérer cette vue : `node scripts/vue-cascade.mjs <EXIGENCES.json>` (forge Conception), puis juger son sceau : `node oracles/oracle-tracabilite.mjs <EXIGENCES.json> --cascade <cascade/CASCADE.json> --vue <CASCADE.md>`.', '')
  L.push('| Version | Date | Niveau touché | Ce qui change | Décision |', '|---|---|---|---|---|')
  for (const h of liste(c.historique)) L.push(`| ${cellule(h.version)} | ${cellule(h.date)} | ${cellule(h.niveau)} | ${cellule(h.resume)} | ${cellule(h.decision)} |`)
  L.push('', `*Gabarit : ${GABARIT} · version du gabarit ${VERSION_GABARIT}*`, '')
  return L.join('\n')
}

/** Le sceau : le corps d'abord, son empreinte ensuite, l'en-tête en dernier (vues.md). */
export function sceller (corps, { source, texteCascade, texteReferentiel }) {
  return [
    `<!-- source: ${source} -->`,
    `<!-- source-sha256: ${empreinte(texteCascade)} -->`,
    `<!-- referentiel-sha256: ${empreinte(texteReferentiel)} -->`,
    `<!-- corps-sha256: ${empreinte(corps)} -->`,
    ''
  ].join('\n') + corps
}

/**
 * Lit la cascade et le référentiel, rejoue T6, rend `{ vue, t6 }`. Lève une erreur portant
 * `code: 2` si la cascade manque ou si une source est illisible.
 */
export function deriver (cheminExigences, { cascade = null, sortie = null } = {}) {
  const ici = dirname(resolve(cheminExigences))
  const cheminCascade = cascade ?? join(ici, CASCADE_VOISINE)
  const cheminSortie = sortie ?? join(ici, 'CASCADE.md')
  const refus = (message) => Object.assign(new Error(message), { code: 2 })
  if (!existsSync(cheminCascade)) throw refus(`aucune cascade à dériver : ${cheminCascade} absent`)
  let texteCascade, texteReferentiel, objet
  try {
    texteReferentiel = readFileSync(cheminExigences, 'utf8')
    texteCascade = readFileSync(cheminCascade, 'utf8')
    objet = JSON.parse(texteCascade)
  } catch (e) { throw refus(`source illisible : ${e.message}`) }
  const r = spawnSync(process.execPath, [ORACLE_TRACABILITE, cheminExigences, '--cascade', cheminCascade],
    { encoding: 'utf8', windowsHide: true })
  let rapport = null
  try { rapport = JSON.parse(r.stdout) } catch { /* laisse à null */ }
  if (r.status === 2 || !rapport) throw refus(`oracle-tracabilite n'a pas pu juger : ${(rapport?.message ?? r.stderr ?? '').toString().slice(0, 200)}`)
  const t6 = (rapport.constats ?? []).filter((f) => f.regle === 'T6')
  const rel = (p) => relative(dirname(resolve(cheminSortie)), resolve(p)).split('\\').join('/')
  const corps = rendreCorps(objet, { t6, sources: [rel(cheminCascade), rel(cheminExigences)] })
  return { vue: sceller(corps, { source: rel(cheminCascade), texteCascade, texteReferentiel }), t6, sortie: cheminSortie }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const opt = (nom) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : null }
  const cible = args[0]
  if (!cible || cible.startsWith('--') || !existsSync(cible)) {
    process.stderr.write('vue-cascade.mjs: usage : node scripts/vue-cascade.mjs <EXIGENCES.json> [--cascade <CASCADE.json>] [--sortie <CASCADE.md>]\n')
    process.exit(2)
  }
  try {
    const { vue, t6, sortie } = deriver(cible, { cascade: opt('--cascade'), sortie: opt('--sortie') })
    writeFileSync(sortie, vue, 'utf8')
    const ko = t6.filter((f) => f.statut === 'FAIL').length
    console.log(`vue écrite : ${sortie} — test rétro T6 ${ko ? `FAIL (${ko} rupture(s) rendue(s) dans la vue)` : 'PASS'}`)
    process.exit(0)
  } catch (e) {
    process.stderr.write(`vue-cascade.mjs: ${e.message}\n`)
    process.exit(e.code === 2 ? 2 : 1)
  }
}
