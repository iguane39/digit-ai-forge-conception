// scripts/reglages-plateforme.self-test.mjs — recette de scripts/reglages-plateforme.mjs (l'OUTIL, pas
// un oracle). TF-2226. Elle opère sur une COPIE du registre (oracles/fixtures/reglages-surs-par-defaut/),
// jamais sur le fichier réel du pilot, et ses altérations s'écrivent dans le répertoire temporaire du
// système : aucun fichier n'est laissé dans le dépôt. Les deux sens sont joués : un registre sain rend
// une exigence par réglage classé defaut et une question par réglage classé decision, un registre
// absent, altéré ou contradictoire rend exit 2 en nommant l'entrée ; les gabarits rendus passent les
// oracles de la forge une fois leurs champs complétés (le remède prescrit est joué).
// Usage : node scripts/reglages-plateforme.self-test.mjs

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { cheminsRegistre } from './reglages-plateforme.mjs'

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = join(ICI, '..')
const OUTIL = join(ICI, 'reglages-plateforme.mjs')
const REGISTRE = join(RACINE, 'oracles', 'fixtures', 'reglages-surs-par-defaut', 'REGLAGES-SURS-PAR-DEFAUT.json')
const VERTE = join(RACINE, 'oracles', 'fixtures', 'verte', 'EXIGENCES.json')
const TROIS = 'Cloudflare,Supabase,GitHub'

let echecs = 0
function verifier (libelle, condition, detail) {
  if (condition) {
    console.log(`  [OK]   ${libelle}`)
  } else {
    echecs++
    console.log(`  [FAIL] ${libelle}`)
    if (detail) console.log(`         ${detail}`)
  }
}

function jouer (args, env = {}) {
  const r = spawnSync(process.execPath, [OUTIL, ...args], {
    encoding: 'utf8', windowsHide: true, env: { ...process.env, ...env }
  })
  let sortie = null
  try { sortie = JSON.parse(r.stdout) } catch { /* sortie vide ou non JSON */ }
  return { code: r.status, sortie, erreur: r.stderr }
}

function oracle (nom, fichier) {
  const r = spawnSync(process.execPath, [join(RACINE, 'oracles', nom), fichier], { encoding: 'utf8', windowsHide: true })
  let rapport = null
  try { rapport = JSON.parse(r.stdout) } catch { /* laisse a null */ }
  return { code: r.status, fails: (rapport?.constats ?? []).filter(c => c.statut === 'FAIL') }
}

const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-tf2226-'))
try {
  const entrees = JSON.parse(readFileSync(REGISTRE, 'utf8'))
  const defaut = entrees.filter(e => e.classement === 'defaut')
  const decision = entrees.filter(e => e.classement === 'decision')
  const ecrire = (nom, donnees) => {
    const chemin = join(tmp, nom)
    writeFileSync(chemin, JSON.stringify(donnees, null, 2))
    return chemin
  }

  console.log('reglages-plateforme.mjs (TF-2226, gabarits tires du registre des reglages surs par defaut)')

  // 1. Le registre de la copie : une exigence par defaut, une question par decision.
  const tout = jouer(['--plateformes', TROIS, '--registre', REGISTRE])
  verifier(`1. exit 0 ; ${defaut.length} reglage(s) defaut -> ${defaut.length} exigence(s) ; ${decision.length} decision -> ${decision.length} question(s)`,
    tout.code === 0 && tout.sortie?.exigences.length === defaut.length && tout.sortie?.questions.length === decision.length,
    JSON.stringify({ code: tout.code, e: tout.sortie?.exigences.length, q: tout.sortie?.questions.length, erreur: tout.erreur }))

  // 2. Le filtre par plateforme, et la plateforme sans entree NOMMEE.
  const cf = jouer(['--plateformes', 'Cloudflare', '--registre', REGISTRE])
  const attendusCf = defaut.filter(e => e.plateforme === 'Cloudflare').length
  verifier(`2. Cloudflare seul -> ${attendusCf} exigence(s), aucune question`,
    cf.code === 0 && cf.sortie.exigences.length === attendusCf && cf.sortie.questions.length === 0 &&
    cf.sortie.exigences.every(e => e.plateforme === 'Cloudflare'))
  const azure = jouer(['--plateformes', 'Azure', '--registre', REGISTRE])
  verifier('3. plateforme sans entree (Azure) -> aucun gabarit, et elle est NOMMEE',
    azure.code === 0 && azure.sortie.exigences.length === 0 && azure.sortie.questions.length === 0 &&
    azure.sortie.plateformes_sans_entree.join() === 'Azure')

  // 3. L'exigence : l'attendu du registre mot pour mot, la source datee, hors surface motivee.
  const e0 = tout.sortie.exigences[0]
  const r0 = defaut.find(e => e.reglage === e0.reglage)
  verifier('4. exigence : critere = lecture du reglage, renvoi a l\'entree du registre ; attendu et cmd_lire rendus mot pour mot a cote ; source = adresse + date de lecture',
    e0.critere.includes(`« ${r0.reglage} »`) && e0.critere.includes('retourne la valeur attendue') &&
    !e0.critere.includes(`« ${r0.attendu} »`) && e0.attendu === r0.attendu &&
    e0.statut_epistemique.nature === 'fait constaté' &&
    e0.statut_epistemique.source.includes(r0.source_url) && e0.statut_epistemique.source.includes(r0.source_lue_le) &&
    e0.hors_surface.length >= 20 && e0.cmd_lire === r0.cmd_lire)

  // 4. La question : deux options, le cout lu aux criteres non tenus, defaut = ne pas appliquer.
  const mfa = tout.sortie.questions.find(q => q.reglage.includes('MFA'))
  const rMfa = decision.find(e => e.reglage.includes('MFA'))
  verifier('5. question : options a/b, cout de a = criteres non tenus du registre (c2, c4, c5), defaut b, aucune recommandation inventee',
    mfa !== undefined && mfa.options.map(o => o.lettre).join() === 'a,b' &&
    ['c2', 'c4', 'c5'].every(c => mfa.options[0].cout.some(t => t.startsWith(c) && t.includes(rMfa.criteres[c].preuve))) &&
    mfa.defaut_applique === 'b' && mfa.recommandee === null && mfa.hypothese.includes('non appliqué'))

  // 5. Rouge : registre absent, argument absent.
  const absent = jouer(['--plateformes', TROIS, '--registre', join(tmp, 'nexiste-pas.json')])
  verifier('6. rouge : registre absent -> exit 2, sortie vide, chemin nomme (jamais « aucun reglage »)',
    absent.code === 2 && absent.sortie === null && absent.erreur.includes('nexiste-pas.json'))
  const sansArg = jouer(['--registre', REGISTRE])
  verifier('7. rouge : --plateformes absent -> exit 2', sansArg.code === 2 && sansArg.sortie === null)

  // 6. Rouge : registre altere, l'entree nommee.
  const clone = () => JSON.parse(JSON.stringify(entrees))
  const sansAttendu = clone(); delete sansAttendu[0].attendu
  const r6 = jouer(['--plateformes', TROIS, '--registre', ecrire('sans-attendu.json', sansAttendu)])
  verifier('8. rouge : entree sans `attendu` -> exit 2 qui nomme la cle et le reglage',
    r6.code === 2 && r6.erreur.includes('attendu') && r6.erreur.includes(entrees[0].reglage.slice(0, 20)), r6.erreur)
  const defautCoute = clone(); defautCoute.find(e => e.classement === 'defaut').criteres.c2.verdict = 'echoue'
  const r7 = jouer(['--plateformes', TROIS, '--registre', ecrire('defaut-qui-coute.json', defautCoute)])
  verifier('9. rouge : entree classee defaut dont c2 echoue -> exit 2 (la regle du registre est tenue ici aussi)',
    r7.code === 2 && r7.erreur.includes('c2') && r7.erreur.includes('defaut'), r7.erreur)
  const classe = clone(); classe[0].classement = 'recommande'
  const r8 = jouer(['--plateformes', TROIS, '--registre', ecrire('classement.json', classe)])
  verifier('10. rouge : classement hors defaut | decision -> exit 2', r8.code === 2 && r8.erreur.includes('classement'), r8.erreur)

  // 7. La racine du pilot : FORGE_ROOT d'abord, puis le voisin du depot.
  const chemins = cheminsRegistre({ env: { FORGE_ROOT: 'C:\\racine-x' }, depot: 'C:\\dev\\digit-ai-forge-conception' })
  verifier('11. racine du pilot : $FORGE_ROOT d\'abord, puis digit-ai-factory a cote du depot',
    chemins.length === 2 && chemins[0].includes('racine-x') && chemins[1].includes('digit-ai-factory') &&
    chemins.every(c => c.endsWith('REGLAGES-SURS-PAR-DEFAUT.json')))

  // 8. Le remede prescrit est joue : les gabarits, completes, passent les oracles de la forge.
  const base = JSON.parse(readFileSync(VERTE, 'utf8'))
  const gabarits = tout.sortie.exigences.map((g, i) => ({
    id: `E-${String(900 + i)}`,
    besoin: 'B-01',
    enonce: g.enonce,
    critere: g.critere,
    palier: g.palier,
    statut_epistemique: g.statut_epistemique,
    surface: g.surface,
    hors_surface: g.hors_surface,
    cotation: { impact: 4, confiance: 4, effort: 1 }
  }))
  const complet = { ...base, exigences: [...base.exigences, ...gabarits] }
  const fichier = ecrire('EXIGENCES-avec-reglages.json', complet)
  const verdicts = ['oracle-exigences.mjs', 'oracle-ears.mjs', 'oracle-claims.mjs', 'oracle-surface.mjs'].map(n => [n, oracle(n, fichier)])
  verifier(`12. remede joue : ${gabarits.length} exigence(s) tirees du registre, completees (id, besoin, cotation), passent exigences, ears, claims et surface`,
    verdicts.every(([, v]) => v.code === 0),
    verdicts.filter(([, v]) => v.code !== 0).map(([n, v]) => `${n} exit ${v.code} : ${v.fails.slice(0, 2).map(f => `${f.regle} ${f.ou} ${f.message}`).join(' | ')}`).join(' || '))
  // Temoin d'isolation : le meme referentiel SANS les gabarits passait deja, donc le vert vient d'eux.
  const nu = oracle('oracle-exigences.mjs', ecrire('EXIGENCES-nu.json', base))
  verifier('13. temoin : le referentiel de depart (sans les gabarits) passe oracle-exigences', nu.code === 0)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

console.log(echecs === 0 ? 'SELF-TEST VERT' : `SELF-TEST ROUGE -- ${echecs} anomalie(s)`)
process.exit(echecs === 0 ? 0 : 1)
