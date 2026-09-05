// self-test — recette des oracles de la Forge Conception.
// Usage : node oracles/self-test.mjs
//
// Un oracle n'est admis que s'il prouve les deux sens :
//   la fixture verte PASSE (exit 0) et la fixture rouge ECHOUE (exit 1) sur CHAQUE regle.
// Un oracle qui ne fait jamais echouer sa fixture rouge ne juge rien.
//
// Sortie volontairement en ASCII : ce script tourne dans des consoles dont l'encodage
// n'est pas garanti (cf. journal Forge Tests du 04/08/2026, decodage cp1252).

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'

const ICI = dirname(fileURLToPath(import.meta.url))
const VERTE = join(ICI, 'fixtures', 'verte')
const ROUGE = join(ICI, 'fixtures', 'rouge')
const EARS_VERTE = join(ICI, 'fixtures', 'ears-verte', 'EXIGENCES.json')
const EARS_ROUGE = join(ICI, 'fixtures', 'ears-rouge', 'EXIGENCES.json')
const CONSTIT_VERTE = join(ICI, 'fixtures', 'constitution-verte', 'CONSTITUTION.md')
const CONSTIT_ROUGE = join(ICI, 'fixtures', 'constitution-rouge', 'CONSTITUTION.md')
// TF-0577 : fixture ISOLANTE — le MEME document que la verte, prive de sa SEULE section
// « Promesse ». La rouge generale declenche C1 a C4 ensemble et ne prouve pas que C4 discrimine.
const CONSTIT_SANS_PROMESSE = join(ICI, 'fixtures', 'constitution-sans-promesse', 'CONSTITUTION.md')
const DELTA_VERTE = join(ICI, 'fixtures', 'delta-verte')
const DELTA_ROUGE = join(ICI, 'fixtures', 'delta-rouge')
const RETROM_VERTE = join(ICI, 'fixtures', 'retro-modele-verte', 'RETRO-MODELE.md')
const RETROM_ROUGE = join(ICI, 'fixtures', 'retro-modele-rouge', 'RETRO-MODELE.md')
const VUESP_VERTE = join(ICI, 'fixtures', 'vues-profil-verte')
const VUESP_ROUGE = join(ICI, 'fixtures', 'vues-profil-rouge')
// TF-0811 : fixtures DEDIEES de S4 devenue jugeante. La rouge est le MEME referentiel que la
// verte, prive de sa seule 404 et de son champ d'ecarts -- fixture isolante, meme idiome que
// CONSTIT_SANS_PROMESSE : un seul FAIL possible, celui que la regle doit prouver.
const SURFIMP_VERTE = join(ICI, 'fixtures', 'surface-implicite-verte')
const SURFIMP_ROUGE = join(ICI, 'fixtures', 'surface-implicite-rouge')
// TF-0814 : fixtures DEDIEES d'E10. Meme idiome que SURFIMP ci-dessus -- la rouge est le MEME
// referentiel que la verte, prive de son seul champ d'ecarts : un seul FAIL possible, celui que
// la regle doit prouver.
const SOCLE_VERTE = join(ICI, 'fixtures', 'exigences-socle-verte')
const SOCLE_ROUGE = join(ICI, 'fixtures', 'exigences-socle-rouge')
// TF-0818 : fixtures DEDIEES de T5. Le MEME EXIGENCES.json et le MEME en-tete de sceau des
// deux cotes ; seule la vue change -- la rouge est la verte AMPUTEE de sa seule section
// « Exigences socle ecartees » (862 caracteres sur 2 649, un tiers du corps). T1 a T4 y
// restent verts, T3 compris : le seul FAIL possible est celui du corps altere. C'est la
// mesure du 05/09 rejouee, cette fois avec un juge.
const CORPS_VERTE = join(ICI, 'fixtures', 'corps-de-vue-verte')
const CORPS_ROUGE = join(ICI, 'fixtures', 'corps-de-vue-rouge')

const ORACLES = [
  {
    fichier: 'oracle-exigences.mjs',
    regles: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9'],
    args: (dossier) => [join(dossier, 'EXIGENCES.json')]
  },
  {
    // TF-0814 : E10 SEULE, sur ses fixtures dediees. La rouge est le MEME referentiel que la
    // verte, prive de son SEUL champ `ecarts_exigences_socle` : E1 a E9 y restent verts, et le
    // seul FAIL possible est celui d'une exigence socle candidate ni retenue ni ecartee.
    // Elle n'est pas dans l'entree E1-E9 ci-dessus parce que les fixtures VERTE/ROUGE partagees
    // ne portent aucune des trois candidates : E10 y jugerait sur trois ecarts declares, pas
    // sur la presence d'une exigence.
    fichier: 'oracle-exigences.mjs',
    regles: ['E10'],
    args: (dossier) => [join(dossier === VERTE ? SOCLE_VERTE : SOCLE_ROUGE, 'EXIGENCES.json')]
  },
  {
    fichier: 'oracle-tracabilite.mjs',
    regles: ['T1', 'T2', 'T3', 'T4'],
    args: (dossier) => [join(dossier, 'EXIGENCES.json'), '--vue', join(dossier, 'CADRAGE-DESIGN.md')]
  },
  {
    // TF-0818 : T5 SEULE, sur ses fixtures dediees. T5 n'est pas dans l'entree T1-T4 ci-dessus,
    // et ce n'est pas un oubli : les vues des fixtures VERTE/ROUGE partagees ont ete scellees
    // avant TF-0818, aucune n'a ete migree, T5 y rend donc un SANS_OBJET motive et n'y jugerait
    // rien. Ici la verte et la rouge portent le MEME en-tete de sceau et le MEME referentiel ;
    // seul le corps de la vue differe. Une fixture rouge qui echouerait aussi sur T3 ne
    // prouverait pas que T5 attrape ce que T3 laisse passer.
    fichier: 'oracle-tracabilite.mjs',
    regles: ['T5'],
    args: (dossier) => [join(CORPS_VERTE, 'EXIGENCES.json'), '--vue',
      join(dossier === VERTE ? CORPS_VERTE : CORPS_ROUGE, 'CADRAGE-DESIGN.md')]
  },
  {
    // TF-0070 : la verte passe au seuil PAR DEFAUT (S-06 couvert par E-008, palier V2) —
    // un operateur qui la joue via le registre central lit desormais le meme verdict que
    // ce self-test. La branche « ratio >= seuil -> avertissement nomme » (RC-1) est prouvee
    // a part, sur la fixture dediee seuil-rc1 (voir bloc apres la boucle).
    // TF-0811 : S4 (la surface implicite, candidat par candidat) n'est pas dans CETTE liste,
    // et ce n'est pas un oubli -- les fixtures VERTE/ROUGE partagees n'enumerent aucun point
    // d'entree web, donc S4 y rend un PASS motive et n'y jugerait rien. Elle a ses fixtures
    // DEDIEES (entree suivante) et ses six etats en branche : voir la branche TF-0811.
    fichier: 'oracle-surface.mjs',
    regles: ['S1', 'S2', 'S3'],
    args: (dossier) => [join(dossier, 'EXIGENCES.json')]
  },
  {
    // TF-0811 : S4 SEULE, sur ses fixtures dediees. La rouge est le MEME referentiel que la
    // verte, prive de sa seule page 404 et de son champ d'ecarts : S1, S2 et S3 y restent
    // verts, et le seul FAIL possible est celui d'un candidat d'office ni retenu ni ecarte.
    // Une fixture rouge qui echouerait partout ne prouverait pas que S4 discrimine.
    fichier: 'oracle-surface.mjs',
    regles: ['S4'],
    args: (dossier) => [join(dossier === VERTE ? SURFIMP_VERTE : SURFIMP_ROUGE, 'EXIGENCES.json')]
  },
  {
    fichier: 'oracle-claims.mjs',
    regles: ['A1'],
    args: (dossier) => [join(dossier, 'EXIGENCES.json')]
  },
  {
    // TF-0014 (R-C3) : distingue mécaniquement l'état « bloqué sous le seuil » de « produit ».
    fichier: 'oracle-etat.mjs',
    regles: ['EM1', 'EM2', 'EM3'],
    args: (dossier) => [join(dossier, 'ETAT.json')]
  },
  {
    // TF-0101 (1/3) : scoring EARS par patron strict + ambiguïté lexicale. Fixtures dédiées
    // (pas VERTE/ROUGE partagées) : dossier reçu en paramètre mais ignoré au profit du fichier
    // propre à cet oracle, distingué par égalité de référence sur la constante VERTE/ROUGE.
    fichier: 'oracle-ears.mjs',
    // TF-0376 (18/08) : EA4/EA5 — deux SUJETS que le rédacteur oublie, pas deux règles de
    // forme. Les fixtures portent les DEUX sens : la verte répond aux quatre questions de
    // chaque sujet (sans quoi EA4/EA5 n'y rendraient que des SANS_OBJET et la branche PASS ne
    // serait jouée par rien), la rouge porte les énoncés du cahier Approval mot pour mot.
    // TF-0570 (24/08) : EA6 — MÊME PATRON, appliqué aux REFUS. La verte porte la
    // contrepartie observable d'un rejet (message, geste, cause distinguée) ; la rouge porte
    // les quatre refus du cahier Approval §09 mot pour mot, muets sur ce que l'écran montre.
    // TF-0576 (24/08) : EA7 — troisieme instance du meme patron, appliquee a une DEPENDANCE
    // EXTERNE. La verte declare l'indisponibilite ET le sort du geste ; la rouge porte le contrat
    // a deux issues qui n'avait nulle part ou ranger « l'analyse n'a pas eu lieu ».
    // TF-0592 (24/08) : EA8 — QUATRIEME instance, appliquee a l'identite DELEGUEE. La contrepartie
    // manquante y est la TESTABILITE : comment teste-t-on ce que ce choix rend intestable ? La
    // rouge est l'exigence EA-907 elle-meme — une seule phrase de cahier (« SSO via Microsoft
    // Entra ID / OIDC ») qui plante EA5 ET EA8, comme c'est arrive. La verte a du GRANDIR : son
    // exigence d'authentification nommait OIDC, donc EA8 s'y reveille aussi, et sans les quatre
    // reponses la verte aurait mis en echec une exigence CONFORME.
    // TF-0603 (24/08) : EA9 — CINQUIEME instance, appliquee a une demande de STRATEGIE DE TESTS.
    // La contrepartie manquante y est le PERIMETRE et le critere de completude : « sur quoi, et a
    // quoi reconnait-on que c'est fait ? ». La rouge porte la demande telle qu'elle a ete recue,
    // tenue pour honoree alors que la moitie du produit n'etait pas testee. La verte a du etre
    // ecrite de toutes pieces — aucune exigence du jeu ne parlait de tests — et sa REDACTION est
    // contrainte : le mot « refus » reveille EA6, l'interaction est declaree au non_juge.
    regles: ['EA1', 'EA2', 'EA3', 'EA4', 'EA5', 'EA6', 'EA7', 'EA8', 'EA9'],
    args: (dossier) => [dossier === VERTE ? EARS_VERTE : EARS_ROUGE]
  },
  {
    // TF-0101 (2/3) : contrôle d'existence (exit 2 s'il est absent, comme tout autre oracle de
    // cette forge) et de format de CONSTITUTION.md. Fixtures dédiées, comme oracle-ears.
    fichier: 'oracle-constitution.mjs',
    regles: ['C1', 'C2', 'C3', 'C4'],
    args: (dossier) => [dossier === VERTE ? CONSTIT_VERTE : CONSTIT_ROUGE]
  },
  {
    // TF-0577 (25/08) : C4 SEULE. La fixture rouge generale declenche C1, C2, C3 et C4
    // ensemble et ne prouve donc pas que C4 discrimine ; celle-ci est le MEME document que la
    // verte, prive de sa seule section « Promesse ».
    fichier: 'oracle-constitution.mjs',
    regles: ['C4'],
    args: (dossier) => [dossier === VERTE ? CONSTIT_VERTE : CONSTIT_SANS_PROMESSE]
  },
  {
    // TF-0101 (3/3) : format d'un delta de référentiel (cycle propose/apply/archive façon
    // OpenSpec), confronté à un référentiel cible via --referentiel. Fixtures dédiées.
    fichier: 'oracle-delta.mjs',
    regles: ['D1', 'D2', 'D3', 'D4', 'D5'],
    args: (dossier) => {
      const d = dossier === VERTE ? DELTA_VERTE : DELTA_ROUGE
      return [join(d, 'DELTA.json'), '--referentiel', join(d, 'EXIGENCES.json')]
    }
  },
  {
    // GO du 19/08 (etude 20260819a du pilot) : mode retro-modele du verbe 1 — un modele
    // d'un projet existant sans ancres ni confrontation rejouee est une paraphrase.
    // Fixtures dediees, comme oracle-ears.
    fichier: 'oracle-retro-modele.mjs',
    regles: ['RM1', 'RM2', 'RM3', 'RM4', 'RM5'],
    args: (dossier) => [dossier === VERTE ? RETROM_VERTE : RETROM_ROUGE]
  },
  {
    // GO du 19/08 (etude 20260819b du pilot) : vues par profil derivees du retro-modele —
    // scellees par empreinte (peremption), chaque affirmation ancree [RM-xxx]. Fixtures dediees.
    fichier: 'oracle-vues-profil.mjs',
    regles: ['VP1', 'VP2', 'VP3', 'VP4'],
    args: (dossier) => {
      const d = dossier === VERTE ? VUESP_VERTE : VUESP_ROUGE
      return [join(d, 'VUE-PO.md'), '--modele', join(d, 'RETRO-MODELE.md')]
    }
  }
]

function lancer (fichier, args) {
  const r = spawnSync(process.execPath, [join(ICI, fichier), ...args], {
    encoding: 'utf8', // jamais de decodage par defaut de la plateforme
    windowsHide: true
  })
  if (r.error) return { code: 2, rapport: null, brut: String(r.error) }
  let rapport = null
  try { rapport = JSON.parse(r.stdout) } catch { /* laisse a null */ }
  return { code: r.status, rapport, brut: r.stdout + r.stderr }
}

const NL = String.fromCharCode(10)

let echecs = 0
const lignes = []

for (const o of ORACLES) {
  // --- sens 1 : la fixture verte passe ---
  const v = lancer(o.fichier, o.args(VERTE))
  if (v.code === 0) {
    lignes.push(`  [OK]   verte  exit 0`)
  } else {
    echecs++
    const fails = (v.rapport?.constats ?? []).filter(c => c.statut === 'FAIL')
    lignes.push(`  [FAIL] verte  exit ${v.code} -- attendu 0`)
    for (const f of fails.slice(0, 8)) lignes.push(`         ${f.regle} @ ${f.ou} : ${f.message}`)
    if (!v.rapport) lignes.push(`         sortie brute : ${v.brut.slice(0, 400)}`)
  }

  // --- sens 2 : la fixture rouge echoue, et sur chaque regle ---
  const r = lancer(o.fichier, o.args(ROUGE))
  if (r.code !== 1) {
    echecs++
    lignes.push(`  [FAIL] rouge  exit ${r.code} -- attendu 1`)
    if (!r.rapport) lignes.push(`         sortie brute : ${r.brut.slice(0, 400)}`)
  } else {
    const enEchec = new Set((r.rapport?.constats ?? [])
      .filter(c => c.statut === 'FAIL').map(c => c.regle))
    const muettes = o.regles.filter(x => !enEchec.has(x))
    if (muettes.length === 0) {
      lignes.push(`  [OK]   rouge  exit 1, ${o.regles.length}/${o.regles.length} regles en echec`)
    } else {
      echecs++
      lignes.push(`  [FAIL] rouge  regles jamais declenchees : ${muettes.join(', ')}`)
    }
  }

  // --- non_juge declare : exigence du standard quality-oracles ---
  const nj = v.rapport?.non_juge ?? r.rapport?.non_juge
  if (!Array.isArray(nj) || nj.length === 0) {
    echecs++
    lignes.push(`  [FAIL] non_juge absent ou vide`)
  }

  lignes.unshift('') // separation, remise en ordre juste apres
  const bloc = lignes.splice(0)
  console.log(`${o.fichier}${bloc.join('\n')}`)
}

// --- branche D5 d'oracle-delta : un lot de retour d'usage ENTIÈREMENT instruit (TF-0374) ---
// La fixture verte partagée est un delta ORDINAIRE : D5 y vaut SANS_OBJET, ce qui est juste et
// déjà couvert. Le sens PASS de D5 a donc besoin de son propre banc — sans lui, la règle ne
// serait jouée qu'à l'échec, et un D5 qui échouerait TOUJOURS passerait ce self-test. C'est le
// défaut trouvé trois fois le 18/08 (R-11 bis, I2 du pilot, et ici) : un contrôle neuf, vert,
// joué par personne. On exige aussi que les QUATRE causes racines soient représentées : la
// quatrième (`evolution-de-doctrine`) est la raison d'être de l'ensemble fermé.
{
  const d = join(ICI, 'fixtures', 'delta-prose-verte')
  const prose = lancer('oracle-delta.mjs',
    [join(d, 'DELTA.json'), '--referentiel', join(d, 'EXIGENCES.json')])
  const d5 = (prose.rapport?.constats ?? []).filter(c => c.regle === 'D5')
  const causes = new Set(
    (JSON.parse(readFileSync(join(d, 'DELTA.json'), 'utf8')).operations ?? [])
      .map(o => o.cause_racine))
  const tousPass = d5.length > 0 && d5.every(c => c.statut === 'PASS')
  if (prose.code === 0 && tousPass && causes.size === 4) {
    console.log(`oracle-delta.mjs (branche D5, fixture delta-prose-verte)${NL}  [OK]   exit 0, ` +
      `${d5.length} constats D5 PASS, les 4 causes racines représentées`)
  } else {
    echecs++
    console.log(`oracle-delta.mjs (branche D5)${NL}  [FAIL] exit ${prose.code} (attendu 0), ` +
      `D5 tous PASS : ${tousPass}, causes distinctes : ${causes.size} (attendu 4)`)
  }
}

// --- branche RC-1 d'oracle-surface : au-dessus du seuil, S1 avertit sans bloquer ---
// Fixture dediee seuil-rc1 (4/5 = 80 %, --seuil 80) : exit 0 exige, ET l'element non
// couvert doit rester NOMME en SANS_OBJET — un avertissement fondu dans la masse ne
// prouverait rien.
{
  const rc1 = lancer('oracle-surface.mjs',
    [join(ICI, 'fixtures', 'seuil-rc1', 'EXIGENCES.json'), '--seuil', '80'])
  const nomme = (rc1.rapport?.constats ?? [])
    .some(c => c.regle === 'S1' && c.statut === 'SANS_OBJET' && String(c.ou).includes('S-05'))
  if (rc1.code === 0 && nomme) {
    console.log('oracle-surface.mjs (branche RC-1, fixture seuil-rc1)\n  [OK]   80 % >= seuil 80 : exit 0, S-05 nomme en SANS_OBJET')
  } else {
    echecs++
    console.log(`oracle-surface.mjs (branche RC-1)\n  [FAIL] exit ${rc1.code} (attendu 0), S-05 nomme : ${nomme}`)
  }
}

// --- branche TF-0114 : T3 ignore un CRLF/LF a contenu identique, mais juge toujours un
// contenu reellement different. Fixture ephemere (comme scripts/delta.self-test.mjs) :
// prouve la normalisation sans dependre du core.autocrlf du poste qui execute ce test.
{
  const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-tf0114-'))
  try {
    const objetFixture = {
      projet: 'Fixture TF-0114 (CRLF/LF)',
      besoins: [{ id: 'B-01', enonce: 'Besoin factice pour le self-test T3.' }],
      exigences: [{
        id: 'E-001',
        besoin: 'B-01',
        enonce: 'Exigence factice pour le self-test T3.',
        critere: 'Critere non vide.',
        statut_epistemique: { nature: 'fait constaté', source: 'fixture TF-0114' }
      }]
    }
    const contenuLF = JSON.stringify(objetFixture, null, 2) + '\n'
    const contenuCRLF = contenuLF.replace(/\n/g, '\r\n') // meme contenu, autres octets

    const exigencesLF = join(tmp, 'EXIGENCES-lf.json')
    const exigencesCRLF = join(tmp, 'EXIGENCES-crlf.json')
    writeFileSync(exigencesLF, contenuLF)
    writeFileSync(exigencesCRLF, contenuCRLF)

    // empreinte calculee comme l'oracle desormais la calcule : sur le contenu normalise LF
    const empreinte = createHash('sha256').update(contenuLF, 'utf8').digest('hex')
    const vueAlignee = join(tmp, 'VUE-alignee.md')
    writeFileSync(vueAlignee,
      `<!-- source: EXIGENCES.json -->\n<!-- source-sha256: ${empreinte} -->\n\n# Vue fixture TF-0114\n`)

    // empreinte volontairement fausse : un contenu REELLEMENT different, pas une variante d'EOL
    const vueDivergente = join(tmp, 'VUE-divergente.md')
    writeFileSync(vueDivergente,
      `<!-- source: EXIGENCES.json -->\n<!-- source-sha256: ${'0'.repeat(64)} -->\n\n# Vue fixture TF-0114\n`)

    const surLF = lancer('oracle-tracabilite.mjs', [exigencesLF, '--vue', vueAlignee])
    const surCRLF = lancer('oracle-tracabilite.mjs', [exigencesCRLF, '--vue', vueAlignee])
    const surDivergent = lancer('oracle-tracabilite.mjs', [exigencesLF, '--vue', vueDivergente])

    const t3 = (r, statut) => (r.rapport?.constats ?? []).some(c => c.regle === 'T3' && c.statut === statut)
    const ok = surLF.code === 0 && t3(surLF, 'PASS') &&
      surCRLF.code === 0 && t3(surCRLF, 'PASS') &&
      surDivergent.code === 1 && t3(surDivergent, 'FAIL')

    if (ok) {
      console.log('oracle-tracabilite.mjs (branche TF-0114, fixture CRLF/LF ephemere)\n' +
        '  [OK]   LF exit 0 et CRLF (meme contenu) exit 0 -- meme empreinte, T3 ne voit pas de difference\n' +
        '  [OK]   contenu reellement different -- T3 FAIL (la regle juge toujours)')
    } else {
      echecs++
      console.log('oracle-tracabilite.mjs (branche TF-0114)\n' +
        `  [FAIL] LF exit ${surLF.code} (attendu 0) | CRLF exit ${surCRLF.code} (attendu 0) | ` +
        `divergent exit ${surDivergent.code} (attendu 1)`)
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

// --- branche TF-0255 : le runner agrege route CONSTITUTION.md/DELTA.json/ETAT.json vers leurs
// VRAIS voisins (pas EXIGENCES.json) -- juste apres le seul verbe "rediger les exigences", ces
// trois fichiers n'existent pas encore et doivent sortir NON_JUGE (motif : voisin absent),
// jamais FAIL. Fixture ephemere : dossier ne contenant QUE EXIGENCES.json, comme un run reel
// qui vient de terminer ce seul verbe. --seulement exclut oracle-ears (fixtures dediees, non
// partagees avec VERTE/ROUGE -- cf. commentaire plus haut) pour ne mesurer que le defaut vise.
{
  const SEULEMENT = 'exigences,tracabilite,surface,claims,constitution,delta,etat'
  const RUNNER = join(ICI, 'run-oracles-conception.mjs')
  const lancerRunner = (exigences) => {
    const r = spawnSync(process.execPath,
      [RUNNER, exigences, `--seulement=${SEULEMENT}`],
      { encoding: 'utf8', windowsHide: true })
    let rapport = null
    try { rapport = JSON.parse(r.stdout) } catch { /* laisse a null */ }
    return { code: r.status, rapport, brut: r.stdout + r.stderr }
  }
  const verdictDe = (rapport, nom) => rapport?.oracles?.find(o => o.oracle === nom)?.verdict

  const tmpVert = mkdtempSync(join(tmpdir(), 'forge-conception-tf0255-vert-'))
  const tmpRouge = mkdtempSync(join(tmpdir(), 'forge-conception-tf0255-rouge-'))
  try {
    // Seul EXIGENCES.json est depose -- CONSTITUTION.md, DELTA.json, ETAT.json n'existent pas.
    writeFileSync(join(tmpVert, 'EXIGENCES.json'),
      readFileSync(join(VERTE, 'EXIGENCES.json'), 'utf8'))
    writeFileSync(join(tmpRouge, 'EXIGENCES.json'),
      readFileSync(join(ROUGE, 'EXIGENCES.json'), 'utf8'))

    // VERT attendu : les oracles applicables a EXIGENCES.json sont tous PASS -> agrege PASS
    // (exit 0), et les 3 transverses sont NON_JUGE motive (voisin absent), jamais FAIL.
    const v = lancerRunner(join(tmpVert, 'EXIGENCES.json'))
    const vertOk = v.code === 0 && v.rapport?.verdict === 'PASS' &&
      ['oracle-constitution', 'oracle-delta', 'oracle-etat'].every(n => verdictDe(v.rapport, n) === 'NON_JUGE')

    // ROUGE attendu : un vrai defaut d'un oracle applicable (fixture ROUGE partagee) reste
    // un FAIL agrege -- les transverses NON_JUGE ne masquent jamais un echec reel.
    const r = lancerRunner(join(tmpRouge, 'EXIGENCES.json'))
    const rougeOk = r.code === 1 && r.rapport?.verdict === 'FAIL' &&
      ['oracle-constitution', 'oracle-delta', 'oracle-etat'].every(n => verdictDe(r.rapport, n) === 'NON_JUGE')

    if (vertOk && rougeOk) {
      console.log('run-oracles-conception.mjs (branche TF-0255, fixtures ephemeres)\n' +
        '  [OK]   vert  -- voisins absents : NON_JUGE motive, applicables PASS -> agrege PASS (exit 0)\n' +
        '  [OK]   rouge -- voisins absents : NON_JUGE motive, un applicable FAIL -> agrege FAIL (exit 1)')
    } else {
      echecs++
      console.log('run-oracles-conception.mjs (branche TF-0255)\n' +
        `  [FAIL] vert exit ${v.code} verdict ${v.rapport?.verdict} (attendu 0/PASS) | ` +
        `rouge exit ${r.code} verdict ${r.rapport?.verdict} (attendu 1/FAIL)`)
      if (!vertOk) console.log(`         verte brute : ${v.brut.slice(0, 300)}`)
      if (!rougeOk) console.log(`         rouge brute : ${r.brut.slice(0, 300)}`)
    }
  } finally {
    rmSync(tmpVert, { recursive: true, force: true })
    rmSync(tmpRouge, { recursive: true, force: true })
  }
}

// --- branche TF-0799 : frontieres de mot Unicode dans les gardes lexicales ---------------
// `\b` est ASCII dans le moteur de Node : un accent y vaut frontiere de mot. Le defaut a DEUX
// sens, et une fixture ne prouve jamais que le sien -- les deux sont donc joues ici :
//   (a) FAUX POSITIF -- la garde se declenchait a l'INTERIEUR d'un mot accentue (« elle » lu
//       dans « reelle ») : le critere juste doit desormais PASSER, et le pronom NU doit
//       continuer d'echouer (sans quoi on aurait juste eteint la regle) ;
//   (b) FAUX NEGATIF -- un motif au bord accentue n'atteignait jamais sa forme accentuee
//       (« ca », « celle-la », « de qualite », « 10 EUR », « Siege… ») : la garde doit
//       desormais parler la ou elle etait muette.
// Fixtures ephemeres derivees de la VERTE partagee (comme TF-0114) : une seule exigence
// change, tout le reste du referentiel est celui qui passe deja -- ce qui isole la mesure.
{
  const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-tf0799-'))
  try {
    const base = JSON.parse(readFileSync(join(VERTE, 'EXIGENCES.json'), 'utf8'))
    const juger = (nom, { enonce, critere }) => {
      const ref = JSON.parse(JSON.stringify(base))
      const cible = ref.exigences.find(e => e.id === 'E-001')
      if (enonce !== undefined) cible.enonce = enonce
      if (critere !== undefined) cible.critere = critere
      const chemin = join(tmp, `EXIGENCES-${nom}.json`)
      writeFileSync(chemin, JSON.stringify(ref, null, 2) + '\n')
      const r = lancer('oracle-exigences.mjs', [chemin])
      const surE001 = (r.rapport?.constats ?? []).filter(c => String(c.ou).includes('E-001'))
      return {
        code: r.code,
        statut: (regle) => surE001.find(c => c.regle === regle)?.statut,
        message: (regle) => surE001.find(c => c.regle === regle)?.message ?? '',
        brut: r.brut
      }
    }

    // (a) le mot accentue n'est plus decoupe : « reelle » ne contient plus le pronom « elle »
    const sensA = juger('sens-a-vrai-negatif', {
      enonce: "Le salarié consulte les exemples issus de l'arborescence réelle.",
      critere: "La liste des exemples issus de l'arborescence réelle est affichée."
    })
    // (a bis) temoin : le pronom NU echoue toujours -- la garde n'a pas ete eteinte
    const sensATemoin = juger('sens-a-temoin', {
      critere: 'Elle est affichée dans la liste des demandes.'
    })
    // (b1) E8 : les pronoms au bord accentue sont enfin atteints
    const sensB1 = juger('sens-b-pronoms-accentues', {
      critere: 'Ça est enregistré, et celle-là est enregistrée aussi.'
    })
    // (b2) E4 : le terme subjectif au bord accentue est enfin attrape
    const sensB2 = juger('sens-b-liste-noire-accentuee', {
      critere: 'La demande enregistrée est de qualité.'
    })
    // (b3) E3 : une unite qui n'est pas un caractere de mot ferme enfin le motif chiffre
    const sensB3 = juger('sens-b-unite-symbole', {
      critere: 'Le montant retenu vaut 10 €.'
    })
    // (b4) E7 : « Siege… » n'est plus lu comme la conditionnelle « si »
    const sensB4 = juger('sens-b-tete-accentuee', {
      enonce: 'Siège du salarié affiché à côté du nom dans la liste.'
    })

    const cas = [
      ['(a) E8 -- le mot accentue n\'est plus decoupe : PASS sur « r[e]elle »',
        sensA.code === 0 && sensA.statut('E8') === 'PASS'],
      ['(a) E8 -- temoin : le pronom NU echoue toujours (FAIL nommant le pronom)',
        sensATemoin.code === 1 && sensATemoin.statut('E8') === 'FAIL' &&
        sensATemoin.message('E8').includes('elle')],
      ['(b) E8 -- pronoms au bord accentue enfin atteints (« [c]a », « celle-l[a] »)',
        sensB1.statut('E8') === 'FAIL' && sensB1.message('E8').includes('ça') &&
        sensB1.message('E8').includes('celle-là')],
      ['(b) E4 -- terme subjectif au bord accentue enfin attrape (« de qualit[e] »)',
        sensB2.statut('E4') === 'FAIL' && sensB2.message('E4').includes('de qualité')],
      ['(b) E3 -- unite symbole enfin reconnue comme chiffre (« 10 EUR »)',
        sensB3.code === 0 && sensB3.statut('E3') === 'PASS' &&
        sensB3.message('E3').includes('chiffré')],
      ['(b) E7 -- « Si[e]ge… » n\'est plus lu comme la conditionnelle « si »',
        sensB4.code === 0 && sensB4.statut('E7') === 'PASS']
    ]
    const ko = cas.filter(([, ok]) => !ok)
    console.log('oracle-exigences.mjs (branche TF-0799, fixtures ephemeres, 2 sens)')
    for (const [libelle, ok] of cas) console.log(`  [${ok ? 'OK' : 'FAIL'}]   ${libelle}`)
    console.log(`  ${cas.length} cas comptes : ${cas.length - ko.length} tenus, ${ko.length} en echec`)
    if (ko.length > 0) echecs++
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

// --- branche TF-0811 : S4 juge, et l'ecart explicite a un lieu ou s'ecrire ---------------
// TF-0804 avait pose S4 en avertissement NON BLOQUANT, pour une seule raison : EXIGENCES.json
// n'offrait aucun champ ou porter l'ecart explicite d'un candidat d'office -- un FAIL aurait
// accuse un referentiel dont l'ecart est legitime, et l'oubli restait indiscernable de la
// decision. Le champ racine `ecarts_surface_implicite` comble ce trou ; la regle devient
// jugeante, ce qui oblige a prouver QUATRE etats plus les DEUX facons dont un ecart ne tient
// pas. Sans ces temoins, S4 redeviendrait une regle qui ne discrimine rien :
//   1. surface web + candidat present, AUCUN champ d'ecart   -> PASS (referentiel anterieur)
//   2. surface web + candidat absent + ecart valide          -> PASS, message « [ECARTE] »
//   3. surface web + candidat absent + aucun ecart           -> FAIL, le candidat NOMME
//   4. aucune surface web                                    -> PASS motive, un seul constat
//   5. ecart au motif trop court (< 20 caracteres)           -> FAIL (temoin : le motif est lu)
//   6. ecart designant un element hors de la liste close     -> FAIL (temoin : la cle est lue)
// Le candidat mis en jeu est la 404 : tous les autres candidats de la liste close sont
// enumeres dans la fixture, ce qui ISOLE la mesure sur un seul d'entre eux.
// Fixtures ephemeres, comme TF-0114 et TF-0799.
{
  const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-tf0811-'))
  try {
    const BASE = [
      { id: 'S-01', type: 'point-entree', libelle: "Page d'accueil du site" },
      { id: 'S-02', type: 'point-entree', libelle: 'Aide utilisateur' },
      { id: 'S-03', type: 'parcours', libelle: 'Onboarding de première connexion' },
      { id: 'S-04', type: 'objet', libelle: 'Compte utilisateur' },
      { id: 'S-05', type: 'objet', libelle: 'Favicon' },
      { id: 'S-06', type: 'parcours', libelle: 'États vides guidés' },
      { id: 'S-07', type: 'regle', libelle: 'Gestion des erreurs visible' },
      { id: 'S-08', type: 'point-entree', libelle: 'Mentions légales' },
      { id: 'S-09', type: 'regle', libelle: 'Responsive mobile' },
      { id: 'S-10', type: 'regle', libelle: 'Accessibilité RGAA' },
      { id: 'S-11', type: 'objet', libelle: "Déclaration d'accessibilité" }
    ]
    const PAGE_404 = { id: 'S-12', type: 'point-entree', libelle: 'Page 404 par langue' }
    const LOT_NUIT = { id: 'S-01', type: 'point-entree', libelle: 'Import de nuit du fichier fournisseur' }
    const ECART_VALIDE = {
      element: 'page-404',
      motif: 'le routeur de la plateforme possede deja sa page d\'erreur par langue : c\'est lui qui la sert, pas le produit',
      decide_par: 'le commanditaire du produit',
      date: '2026-09-05'
    }

    const referentiel = (surface, ecarts) => {
      const ref = {
        projet: 'Fixture TF-0811 (surface implicite : l\'ecart explicite)',
        besoins: [{ id: 'B-01', enonce: 'Un visiteur doit atteindre le produit depuis le web.' }],
        surface,
        exigences: surface.map((s, i) => ({
          id: `E-${String(i + 1).padStart(3, '0')}`,
          besoin: 'B-01',
          enonce: `Le produit sert ${s.libelle}.`,
          critere: 'La ressource est affichee.',
          palier: 'MVP',
          statut_epistemique: { nature: 'fait constaté', source: 'fixture TF-0811' },
          surface: [s.id],
          cotation: { impact: 3, confiance: 3, effort: 2 }
        }))
      }
      if (ecarts !== undefined) ref.ecarts_surface_implicite = ecarts
      return ref
    }

    const jouer = (nom, ref) => {
      const chemin = join(tmp, `EXIGENCES-${nom}.json`)
      writeFileSync(chemin, JSON.stringify(ref, null, 2) + NL)
      const r = lancer('oracle-surface.mjs', [chemin])
      const s4 = (r.rapport?.constats ?? []).filter(c => c.regle === 'S4')
      return {
        code: r.code,
        s4,
        fails: s4.filter(c => c.statut === 'FAIL'),
        sur: (fragment) => s4.find(c => `${c.ou} ${c.message}`.includes(fragment))
      }
    }

    const complet = jouer('1-candidat-present', referentiel([...BASE, PAGE_404]))
    const ecarte = jouer('2-ecart-valide', referentiel(BASE, [ECART_VALIDE]))
    const oubli = jouer('3-aucun-ecart', referentiel(BASE))
    const sansWeb = jouer('4-sans-surface-web', referentiel([LOT_NUIT]))
    const motifCourt = jouer('5-motif-trop-court',
      referentiel(BASE, [{ ...ECART_VALIDE, motif: 'pas utile' }]))
    const cleInconnue = jouer('6-element-hors-liste',
      referentiel(BASE, [{ ...ECART_VALIDE, element: 'page-quatre-cent-quatre' }]))

    // Le sceau de la vue derivee : la fixture VERTE dediee porte son CADRAGE-DESIGN.md
    // regenere, champ `ecarts_surface_implicite` compris. Une vue qui ne porterait pas le
    // champ neuf serait indetectable ici -- c'est T3, sur l'empreinte de la source, qui le dit.
    const sceau = lancer('oracle-tracabilite.mjs',
      [join(SURFIMP_VERTE, 'EXIGENCES.json'), '--vue', join(SURFIMP_VERTE, 'CADRAGE-DESIGN.md')])
    const t3 = (sceau.rapport?.constats ?? []).find(c => c.regle === 'T3')
    const vueCadrage = readFileSync(join(SURFIMP_VERTE, 'CADRAGE-DESIGN.md'), 'utf8')

    const cas = [
      ['1. candidat present, aucun champ d\'ecart -> PASS (referentiel anterieur au champ)',
        complet.code === 0 && complet.fails.length === 0 && complet.s4.length === 11],
      ['2. candidat absent + ecart valide -> PASS imprime « [ECARTE] »',
        ecarte.code === 0 && ecarte.fails.length === 0 &&
        (ecarte.sur('page-404')?.message ?? '').includes('[ÉCARTÉ]')],
      ['3. candidat absent + aucun ecart -> FAIL, le candidat NOMME',
        oubli.code === 1 && oubli.fails.length === 1 &&
        oubli.fails[0].message.includes('Page 404 par langue')],
      ['4. aucune surface web -> PASS motive, un seul constat S4',
        sansWeb.code === 0 && sansWeb.s4.length === 1 &&
        sansWeb.s4[0].message.includes('n\'est pas due')],
      ['5. ecart au motif trop court -> FAIL nommant `motif`',
        motifCourt.code === 1 && motifCourt.fails.length === 1 &&
        motifCourt.fails[0].message.includes('motif')],
      ['6. ecart hors liste close -> FAIL sur l\'ecart ET sur le candidat reste nu',
        cleInconnue.code === 1 && cleInconnue.fails.length === 2],
      ['7. vue derivee regeneree sur la fixture verte : T3 PASS et le champ y figure',
        sceau.code === 0 && t3?.statut === 'PASS' &&
        vueCadrage.includes('ecarts_surface_implicite') &&
        vueCadrage.includes('accessibilite-rgaa')]
    ]
    const ko = cas.filter(([, ok]) => !ok)
    console.log('oracle-surface.mjs (branche TF-0811, fixtures ephemeres, 4 etats + 2 temoins)')
    for (const [libelle, ok] of cas) console.log(`  [${ok ? 'OK' : 'FAIL'}]   ${libelle}`)
    console.log(`  ${cas.length} cas comptes : ${cas.length - ko.length} tenus, ${ko.length} en echec`)
    if (ko.length > 0) {
      echecs++
      console.log(`         exits obtenus : 1=${complet.code} 2=${ecarte.code} 3=${oubli.code} ` +
        `4=${sansWeb.code} 5=${motifCourt.code} 6=${cleInconnue.code} 7=${sceau.code}`)
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}


// --- branche TF-0814 : E10 juge, et l'ecart d'une exigence socle a un lieu ou s'ecrire -----
// Le schema du referentiel propose d'office TROIS exigences socle candidates -- donnees de
// demonstration invisibles en production, donnees volatiles editables/datees/sourcees, effet
// observable de tout element interactif -- avec la meme regle que la surface implicite : chacune
// est RETENUE ou ECARTEE explicitement. L'ecart ne vivait qu'en prose, section 7 d'EXIGENCES.md,
// qu'aucun des onze oracles ne prend en entree : une candidate oubliee et une candidate ecartee
// en connaissance de cause produisaient le MEME referentiel. Le champ racine
// `ecarts_exigences_socle` comble ce trou ; E10 juge, ce qui oblige a prouver TROIS etats plus
// les TROIS facons dont un ecart ne tient pas :
//   1. les trois candidates portees, AUCUN champ d'ecart    -> PASS (referentiel anterieur)
//   2. candidate absente + ecart valide                     -> PASS, message « [ECARTE] »
//   3. candidate absente + aucun ecart                      -> FAIL, la candidate NOMMEE
//   4. ecart au motif trop court (< 20 caracteres)          -> FAIL (temoin : le motif est lu)
//   5. ecart designant une cle hors de la liste close       -> FAIL (temoin : la cle est lue)
//   6. ecart a la date hors format AAAA-MM-JJ               -> FAIL (temoin : la date est lue)
// Il n'y a pas de quatrieme ETAT : contrairement a S4, aucune condition d'applicabilite n'est
// inferee -- un produit sans donnee de production ou sans element interactif ECRIT son ecart.
// La candidate mise en jeu est celle des donnees de demonstration : les deux autres restent
// portees par une exigence, ce qui ISOLE la mesure sur une seule d'entre elles.
// Fixtures ephemeres, comme TF-0114, TF-0799 et TF-0811.
{
  const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-tf0814-'))
  try {
    const CANDIDATES = {
      demonstration: {
        surface: { id: 'S-01', type: 'regle', libelle: 'Jeu de demonstration' },
        enonce: 'Le jeu de démonstration reste invisible hors de son environnement dédié.',
        critere: "En l'absence du drapeau d'environnement dédié, aucune donnée de démonstration n'est affichée."
      },
      volatiles: {
        surface: { id: 'S-02', type: 'objet', libelle: 'Catalogue des formations' },
        enonce: 'Le catalogue des formations est édité en base, sans livraison de code.',
        critere: 'La date de mise à jour et la source de chaque fiche du catalogue sont présentes, chacune non vide.'
      },
      effet: {
        surface: { id: 'S-03', type: 'parcours', libelle: 'Inscription a une session' },
        enonce: 'Chaque élément interactif du produit produit un effet observable.',
        critere: "Un message de confirmation est affiché après l'envoi du formulaire d'inscription."
      }
    }
    const ECART_VALIDE = {
      element: 'donnees-demonstration',
      motif: "le produit n'embarque aucun jeu de demonstration : la recette se fait sur un extrait anonymise depose hors du binaire livre",
      decide_par: 'le commanditaire du produit',
      date: '2026-09-05'
    }

    // Le referentiel se construit DEPUIS les candidates retenues : retirer une candidate retire
    // aussi son element de surface, sans quoi E9 (couverture d'ensemble) echouerait pour une
    // raison etrangere a ce qu'on mesure.
    const referentiel = (cles, ecarts) => {
      const retenues = cles.map(c => CANDIDATES[c])
      const ref = {
        projet: 'Fixture TF-0814 (exigences socle candidates)',
        besoins: [{ id: 'B-01', enonce: 'Le produit doit tenir les trois lois transverses du socle.' }],
        surface: retenues.map(c => c.surface),
        exigences: retenues.map((c, i) => ({
          id: `E-${String(i + 1).padStart(3, '0')}`,
          besoin: 'B-01',
          enonce: c.enonce,
          critere: c.critere,
          palier: 'MVP',
          statut_epistemique: { nature: 'fait constaté', source: 'fixture TF-0814' },
          surface: [c.surface.id],
          cotation: { impact: 3, confiance: 3, effort: 2 }
        }))
      }
      if (ecarts !== undefined) ref.ecarts_exigences_socle = ecarts
      return ref
    }

    const jouer = (nom, ref) => {
      const chemin = join(tmp, `EXIGENCES-${nom}.json`)
      writeFileSync(chemin, JSON.stringify(ref, null, 2) + NL)
      const r = lancer('oracle-exigences.mjs', [chemin])
      const constats = r.rapport?.constats ?? []
      const e10 = constats.filter(c => c.regle === 'E10')
      return {
        code: r.code,
        e10,
        fails: e10.filter(c => c.statut === 'FAIL'),
        autresFails: constats.filter(c => c.statut === 'FAIL' && c.regle !== 'E10'),
        sur: (fragment) => e10.find(c => `${c.ou} ${c.message}`.includes(fragment))
      }
    }

    const TOUTES = ['demonstration', 'volatiles', 'effet']
    const SANS_DEMO = ['volatiles', 'effet']
    const completes = jouer('1-trois-candidates', referentiel(TOUTES))
    const ecartee = jouer('2-ecart-valide', referentiel(SANS_DEMO, [ECART_VALIDE]))
    const oubli = jouer('3-aucun-ecart', referentiel(SANS_DEMO))
    const motifCourt = jouer('4-motif-trop-court',
      referentiel(SANS_DEMO, [{ ...ECART_VALIDE, motif: 'pas utile' }]))
    const cleInconnue = jouer('5-cle-hors-liste',
      referentiel(SANS_DEMO, [{ ...ECART_VALIDE, element: 'donnees-de-demo' }]))
    const dateInvalide = jouer('6-date-hors-format',
      referentiel(SANS_DEMO, [{ ...ECART_VALIDE, date: '05/09/2026' }]))

    // Le sceau de la vue derivee : la fixture VERTE dediee porte son CADRAGE-DESIGN.md
    // regenere, section « Exigences socle ecartees » comprise. Une vue qui ne porterait pas le
    // champ neuf serait indetectable ici -- c'est T3, sur l'empreinte de la source, qui le dit.
    const sceau = lancer('oracle-tracabilite.mjs',
      [join(SOCLE_VERTE, 'EXIGENCES.json'), '--vue', join(SOCLE_VERTE, 'CADRAGE-DESIGN.md')])
    const t3 = (sceau.rapport?.constats ?? []).find(c => c.regle === 'T3')
    const vueCadrage = readFileSync(join(SOCLE_VERTE, 'CADRAGE-DESIGN.md'), 'utf8')

    const cas = [
      ["1. les trois candidates portees, aucun champ d'ecart -> PASS (referentiel anterieur)",
        completes.code === 0 && completes.fails.length === 0 && completes.e10.length === 3],
      ['2. candidate absente + ecart valide -> PASS imprime « [ECARTE] »',
        ecartee.code === 0 && ecartee.fails.length === 0 &&
        (ecartee.sur('donnees-demonstration')?.message ?? '').includes('[ÉCARTÉ]')],
      ['3. candidate absente + aucun ecart -> FAIL, la candidate NOMMEE',
        oubli.code === 1 && oubli.fails.length === 1 && oubli.autresFails.length === 0 &&
        oubli.fails[0].message.includes('Données de démonstration invisibles en production')],
      ['4. ecart au motif trop court -> FAIL nommant `motif`',
        motifCourt.code === 1 && motifCourt.fails.length === 1 &&
        motifCourt.fails[0].message.includes('motif')],
      ["5. ecart hors liste close -> FAIL sur l'ecart ET sur la candidate restee nue",
        cleInconnue.code === 1 && cleInconnue.fails.length === 2],
      ['6. ecart a la date hors format -> FAIL nommant `date`',
        dateInvalide.code === 1 && dateInvalide.fails.length === 1 &&
        dateInvalide.fails[0].message.includes('date')],
      ['7. vue derivee regeneree sur la fixture verte : T3 PASS et le champ y figure',
        sceau.code === 0 && t3?.statut === 'PASS' &&
        vueCadrage.includes('ecarts_exigences_socle') &&
        vueCadrage.includes('donnees-demonstration')]
    ]
    const ko = cas.filter(([, ok]) => !ok)
    console.log('oracle-exigences.mjs (branche TF-0814, fixtures ephemeres, 3 etats + 3 temoins)')
    for (const [libelle, ok] of cas) console.log(`  [${ok ? 'OK' : 'FAIL'}]   ${libelle}`)
    console.log(`  ${cas.length} cas comptes : ${cas.length - ko.length} tenus, ${ko.length} en echec`)
    if (ko.length > 0) {
      echecs++
      console.log(`         exits obtenus : 1=${completes.code} 2=${ecartee.code} 3=${oubli.code} ` +
        `4=${motifCourt.code} 5=${cleInconnue.code} 6=${dateInvalide.code} 7=${sceau.code}`)
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

// --- branche TF-0818 : le sceau prouvait la provenance, jamais le contenu -----------------
// T3 compare l'empreinte que la vue PORTE a celle de sa SOURCE : elle dit d'ou vient la vue,
// jamais ce qu'elle contient. Mesure du 05/09/2026 : la section « Surface implicite ecartee »
// retiree d'un CADRAGE-DESIGN.md -- en-tete laisse intact -- et T3 rendait PASS, verdict
// global PASS, exit 0 ; deux ecarts opposables disparaissaient sans juge. La vue porte donc
// desormais AUSSI l'empreinte de son propre corps, et T5 la recalcule. Six etats a prouver :
//   1. vue intacte                                        -> PASS (T3 et T5)
//   2. vue amputee, en-tete intact                        -> FAIL « corps de la vue altere »,
//                                                            T3 restant PASS (T5 seule voit)
//   3. LA MESURE D'AVANT : amputee ET sans corps-sha256   -> PASS, mais T5 le DIT en SANS_OBJET
//   4. un seul mot change dans le corps                   -> FAIL (temoin : pas que l'amputation)
//   5. la meme vue amputee, RESCELLEE sur son corps       -> PASS (le controle est calculable,
//                                                            le sceau ne se hache pas lui-meme)
//   6. la phrase citee de `vues.md` y est encore, mot pour mot (une citation qui derive de sa
//      source est une transcription sans correspondance -- le defaut que ce lot ne doit pas creer)
// Fixtures ephemeres pour 3, 4 et 5 ; fixtures dediees versionnees pour 1 et 2.
{
  const tmp = mkdtempSync(join(tmpdir(), 'forge-conception-tf0818-'))
  try {
    const CIBLE = join(CORPS_VERTE, 'EXIGENCES.json')
    const RE_SCEAU = /<!--\s*corps-sha256:\s*[0-9a-f]{64}\s*-->[^\S\r\n]*\r?\n/i
    const vueIntacte = readFileSync(join(CORPS_VERTE, 'CADRAGE-DESIGN.md'), 'utf8')
      .replace(/\r\n/g, NL)
    const vueAmputee = readFileSync(join(CORPS_ROUGE, 'CADRAGE-DESIGN.md'), 'utf8')
      .replace(/\r\n/g, NL)

    // Chaque cas dans son propre dossier, la vue gardant son NOM reel : le rappel des sections
    // attendues est indexe sur le nom de fichier de la vue, et un `2-amputee.md` ne le
    // declencherait pas -- le self-test jugerait alors un message que personne ne recoit.
    const jouer = (nom, texte) => {
      const dossier = join(tmp, nom)
      mkdirSync(dossier)
      const chemin = join(dossier, 'CADRAGE-DESIGN.md')
      writeFileSync(chemin, texte)
      const r = lancer('oracle-tracabilite.mjs', [CIBLE, '--vue', chemin])
      const de = (regle) => (r.rapport?.constats ?? []).find(c => c.regle === regle)
      return { code: r.code, t3: de('T3'), t5: de('T5') }
    }

    const intacte = jouer('1-intacte', vueIntacte)
    const amputee = jouer('2-amputee', vueAmputee)
    // 3. la mesure d'avant correctif, rejouee : meme amputation, mais vue NON MIGREE
    const avant = jouer('3-avant-correctif', vueAmputee.replace(RE_SCEAU, ''))
    // 4. un seul mot du corps change -- l'amputation n'est pas le seul cas
    const unMot = jouer('4-un-mot-change',
      vueIntacte.replace('le commanditaire du produit', 'le commanditaire du produiT'))
    // 5. la vue amputee RESCELLEE sur son propre corps : le controle est calculable
    const corpsAmpute = vueAmputee.slice(vueAmputee.match(RE_SCEAU)[0].length +
      vueAmputee.match(RE_SCEAU).index)
    const rescellee = jouer('5-rescellee', vueAmputee.replace(RE_SCEAU,
      `<!-- corps-sha256: ${createHash('sha256').update(corpsAmpute, 'utf8').digest('hex')} -->${NL}`))

    // 6. la citation embarquee dans le message d'echec est-elle encore celle du contrat ?
    const citee = (amputee.t5?.message ?? '').match(/: "([^"]+)"/)?.[1] ?? ''
    const contrat = readFileSync(
      join(ICI, '..', 'skills', 'derive-les-vues', 'references', 'vues.md'), 'utf8')
      .replace(/\*/g, '').replace(/\s+/g, ' ')
    const citationTenue = citee.length > 60 && contrat.includes(citee.replace(/\s+/g, ' '))

    const cas = [
      ['1. vue intacte -> PASS, T3 et T5 verts',
        intacte.code === 0 && intacte.t3?.statut === 'PASS' && intacte.t5?.statut === 'PASS'],
      ['2. vue amputee, en-tete intact -> FAIL « corps de la vue altere », T3 restant PASS',
        amputee.code === 1 && amputee.t3?.statut === 'PASS' &&
        amputee.t5?.statut === 'FAIL' && amputee.t5.message.includes('corps de la vue altéré')],
      ['3. la mesure d\'avant : amputee sans corps-sha256 -> PASS, mais T5 le DIT (SANS_OBJET)',
        avant.code === 0 && avant.t3?.statut === 'PASS' &&
        avant.t5?.statut === 'SANS_OBJET' && avant.t5.message.includes('corps-sha256')],
      ['4. un seul mot change dans le corps -> FAIL (temoin : pas que l\'amputation)',
        unMot.code === 1 && unMot.t5?.statut === 'FAIL'],
      ['5. la meme vue amputee, RESCELLEE sur son corps -> PASS (le sceau ne se hache pas lui-meme)',
        rescellee.code === 0 && rescellee.t5?.statut === 'PASS'],
      ['6. la phrase citee dans le FAIL est encore celle de `vues.md`, mot pour mot',
        citationTenue]
    ]
    const ko = cas.filter(([, ok]) => !ok)
    console.log('oracle-tracabilite.mjs (branche TF-0818, fixtures dediees + ephemeres, 5 etats + 1 temoin)')
    for (const [libelle, ok] of cas) console.log(`  [${ok ? 'OK' : 'FAIL'}]   ${libelle}`)
    console.log(`  ${cas.length} cas comptes : ${cas.length - ko.length} tenus, ${ko.length} en echec`)
    if (ko.length > 0) {
      echecs++
      console.log(`         exits obtenus : 1=${intacte.code} 2=${amputee.code} 3=${avant.code} ` +
        `4=${unMot.code} 5=${rescellee.code} ; citation retrouvee : ${citationTenue}`)
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

console.log('')
console.log(`${ORACLES.length} oracles, ${ORACLES.reduce((n, o) => n + o.regles.length, 0)} regles.`)
console.log(echecs === 0 ? 'SELF-TEST VERT' : `SELF-TEST ROUGE -- ${echecs} anomalie(s)`)
process.exit(echecs === 0 ? 0 : 1)
