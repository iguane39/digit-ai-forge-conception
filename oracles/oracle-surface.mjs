// oracle-surface — couverture de la surface énumérée.
// Usage : node oracle-surface.mjs <EXIGENCES.json> [--seuil 95]
// CDC §7.3 — règles S1 à S3 ; S4 surface implicite SaaS (TF-0811) ; S5 surface implicite d'un
// registre, en avertissement (TF-1655). Écho amont du défaut fondateur de Forge Tests :
// tout élément inventorié et non couvert est NOMMÉ, jamais fondu dans un pourcentage.
//
// RC-1 (retour premier produit réel) : sous le seuil, un élément non couvert reste bloquant
// (FAIL). Au-dessus ou à l'égal du seuil, il reste NOMMÉ individuellement mais bascule en
// avertissement non bloquant (SANS_OBJET — seul statut non-PASS/FAIL du contrat, compté à
// part et toujours visible) : le seuil de S2 redevient opérant sans faire disparaître le nom
// de l'élément.

import {
  charger, constat, emettre, erreur, PASS, FAIL, SANS_OBJET, lexique, defautDEcart, AVANT, APRES
} from './_contrat.mjs'

const VERSION = '1.6.0'
const SEUIL_DEFAUT = 95 // CDC question ouverte (d) : 95 % en MVP, 100 % en V1

// S4 — la surface implicite : chaque candidat d'office est RETENU ou ÉCARTÉ explicitement.
//
// TF-0804 (première moitié) : la 404 est la page que PERSONNE ne conçoit — aucun gabarit ne la
// génère, aucune revue ne la voit, et un site multilingue a servi en production le 404 nu de
// son serveur de fichiers du 25/08 au 01/09/2026. C'est le profil type de la loi transverse
// n° 3 (« l'oubli n'existe pas »), et ce profil vaut pour TOUTE la liste close de la surface
// implicite (`enumere-la-surface/references/typologie-surface.md`) : aide, onboarding, compte,
// favicon, états vides, erreurs visibles, mentions légales, responsive, accessibilité, ses
// livrables légaux, la 404 — et depuis TF-0874 le lien public partageable et les comptes
// d'essai, depuis TF-1908 les traceurs et le consentement, la politique de confidentialité et
// l'aperçu de partage, depuis TF-2120 l'aide contextuelle de champ, le filtre et tri des listes et
// la garde de saisie. La règle ne juge pas la page servie — cela relève de la MEP
// (contrôle M-9) et de forge-tests — mais l'ÉNUMÉRATION : le candidat est-il entré dans la
// surface, là où l'oubli est encore réparable ?
//
// TF-0811 (seconde moitié) : S4 était un avertissement que rien n'obligeait à lire, pour une
// seule raison — `EXIGENCES.json` n'offrait AUCUN champ où porter l'écart explicite d'un
// candidat d'office. Un FAIL aurait alors accusé un référentiel dont l'écart est légitime
// (produit interne, routeur possédant déjà sa page d'erreur, API répondant en JSON), et un
// référentiel qui oublie le candidat n'était accusé par rien : l'oubli restait indiscernable
// de la décision. Le champ racine `ecarts_surface_implicite` comble ce trou, et S4 juge :
//
//   surface web + candidat présent à la surface           -> PASS
//   surface web + candidat absent + écart déclaré valide  -> PASS, message préfixé « [ÉCARTÉ] »
//   surface web + candidat absent + aucun écart valide    -> FAIL, le candidat NOMMÉ
//   aucune surface web                                    -> PASS motivé, le bloc n'est pas dû
//
// Le champ est FACULTATIF à la lecture : absent = aucun écart déclaré. Un référentiel antérieur
// à ce champ n'est donc jamais accusé d'un défaut de format — il est jugé sur la seule présence
// de ses candidats, exactement comme il l'aurait été.
const MARQUEURS_WEB = ['page', 'écran', 'site', 'web', 'url', 'route', 'portail', 'navigateur']
// TF-0799 — bornes Unicode obligatoires ici (`lexique`, contrat commun) : avec `\b`, « écran » (bord accentué) précédé
// d'une espace n'aurait JAMAIS été trouvé, et « route » se serait lu dans « routeur ».
const RE_WEB = lexique(MARQUEURS_WEB)

// La liste CLOSE de la surface implicite. Ordre et libellés repris à l'identique de
// `enumere-la-surface/references/typologie-surface.md`, section « Surface implicite SaaS » :
// cette table en est la transcription exécutable, elle ne l'étend pas. L'élargir est une
// décision (delta du référentiel de la forge), jamais une commodité.
// TF-0854 : cette correspondance est désormais VÉRIFIÉE — la recette confronte, dans les deux
// sens, chaque clé de cette table à la table close en prose (« Les clés de la liste close »),
// ordre compris. Jusqu'au 06/09/2026 elle était seulement AFFIRMÉE ici : un candidat ajouté
// d'un seul côté laissait l'oracle vert et le self-test vert, et personne ne le disait.
const SURFACE_IMPLICITE = [
  {
    cle: 'aide-utilisateur',
    libelle: 'Aide utilisateur',
    motifs: ['aide', "centre d'aide", 'help'],
    // TF-2120 : une « aide » réduite aux codes d'erreur ne satisfait plus le candidat. Retour de
    // Produit-86 (lot du 03/11/2026) : une page d'aide qui ne listait que les codes de refus avait
    // suffi. Un élément dont le libellé dit « codes d'erreur » sans nommer une autre facette de
    // l'aide (page, encart, champ, guide, FAQ…) est écarté de la présence ; l'écart reste possible.
    reduite: lexique(["codes? d['’]erreur", "codes? de refus", "codes? d['’]échec",
      "codes? d['’]anomalie", "codes? de retour", 'codes? http']),
    facettes: lexique(['aide de page', 'aide de la page', 'encarts?', 'par champ', 'de champ',
      'contextuelle', 'guide', 'tutoriel', 'faq', 'prise en main', 'pas à pas', "rôle de l['’]écran",
      'centre d[\'’]aide'])
  },
  {
    cle: 'onboarding',
    libelle: 'Onboarding / premier lancement',
    motifs: ['onboarding', 'premier lancement', 'première connexion', 'prise en main']
  },
  {
    cle: 'compte-utilisateur',
    libelle: 'Compte utilisateur',
    motifs: ['compte', 'profil utilisateur', 'mon compte']
  },
  {
    cle: 'favicon',
    libelle: 'Favicon',
    motifs: ['favicon', "icône d'onglet"]
  },
  {
    cle: 'etats-vides',
    libelle: 'États vides guidés',
    motifs: ['état vide', 'états vides', 'empty state']
  },
  {
    cle: 'erreurs-visibles',
    libelle: 'Gestion des erreurs visible',
    motifs: ['erreur', "message d'erreur", "messages d'erreur"]
  },
  {
    cle: 'mentions-legales',
    libelle: 'Mentions légales / pied de page',
    motifs: ['mentions légales', 'pied de page', 'footer', 'cgu', 'cgv']
  },
  {
    cle: 'responsive-mobile',
    libelle: 'Responsive mobile',
    motifs: ['responsive', 'mobile', 'adaptatif']
  },
  {
    cle: 'accessibilite-rgaa',
    libelle: 'Accessibilité RGAA — site public français',
    motifs: ['accessibilité', 'rgaa', 'wcag']
  },
  {
    cle: 'livrables-accessibilite',
    libelle: "Livrables légaux d'accessibilité",
    motifs: ['schéma pluriannuel', "plan d'action annuel", 'mécanisme de signalement',
      'voie de recours', "déclaration d'accessibilité"]
  },
  {
    cle: 'page-404',
    libelle: 'Page 404 par langue',
    motifs: ['404']
  },
  // TF-0874 — les deux candidats que la liste close n'avait pas, constatés par DEUX retours
  // humains successifs sur un même produit (lots 20260906b et 20260906c) : une énumération de
  // 58 éléments et 73 exigences toutes PASS n'avait proposé ni le partage du lien client depuis
  // l'administration, ni des comptes d'essai vides pour le commanditaire. Deux exigences ont dû
  // entrer en RUN DE VERSION (E-074, E-075) — c'est-à-dire après la MEP, au prix fort, alors que
  // la place de cet arbitrage est l'énumération. Profil identique à celui de la 404 (TF-0804) :
  // personne ne les conçoit, aucune revue ne les voit, et l'oubli reste indiscernable de la
  // décision tant que la liste ne les porte pas.
  {
    cle: 'lien-public-partageable',
    libelle: 'Lien public partageable (copie, QR)',
    motifs: ['lien public', 'lien partageable', 'lien de partage', 'partage du lien',
      'partager le lien', 'qr', 'code qr']
  },
  {
    cle: 'comptes-essai',
    libelle: "Comptes d'essai vides",
    motifs: ["compte d'essai", "comptes d'essai", 'compte de test', 'comptes de test',
      "compte d'évaluation", "comptes d'évaluation", 'bac à sable']
  },
  // TF-1908 — les trois candidats CONDITIONNELS que la liste close n'avait pas. L'étude
  // d'opportunité 20261019j (check-list avant mise en ligne) a comparé 24 éléments d'un site prêt
  // à lancer à l'existant de la Factory : 5 n'étaient couverts par rien, dont trois que le droit
  // ou le partage rendent dus et qu'aucun CDC ne cite. Profil de la 404 (TF-0804) : personne ne
  // les conçoit, aucune revue ne les voit. Chacun porte une condition d'applicabilité que S4
  // n'infère PAS (déclarée en `non_juge`) : un traceur non exempté de consentement, une donnée
  // personnelle collectée, une page publique. Un produit qui ne la remplit pas l'écarte en une
  // ligne, avec sa raison ; il ne l'oublie pas.
  {
    cle: 'traceurs-consentement',
    libelle: "Traceurs et consentement (mesure d'audience comprise)",
    motifs: ['traceur', 'consentement', 'cookie', "mesure d'audience", "analyse d'audience"]
  },
  {
    cle: 'politique-confidentialite',
    libelle: 'Politique de confidentialité',
    motifs: ['politique de confidentialité', 'confidentialité', 'vie privée', 'rgpd']
  },
  {
    cle: 'apercu-partage',
    libelle: 'Aperçu de partage',
    motifs: ['aperçu de partage', 'aperçu de lien', 'aperçu social', 'open graph',
      'carte de partage', 'image de partage']
  },
  // TF-2120 — les trois candidats que la liste close n'avait pas, constatés sur Produit-86 (lot
  // du 03/11/2026) : une page d'aide réduite aux codes de refus avait satisfait le candidat
  // « aide », et le produit n'offrait ni aide au niveau du champ, ni filtre et tri sur ses
  // listes, ni garde de saisie. Profil de la 404 (TF-0804) : personne ne les conçoit. Chacun porte
  // une condition d'applicabilité que S4 n'infère PAS (déclarée en `non_juge`) : un champ de
  // saisie non trivial, une liste de 8 éléments ou plus (le seuil de L4, `check_html.py` du skill
  // `digit-ai-page-html` de forge-agents : « filtre, tri et recherche obligatoires dès 8
  // lignes »), un formulaire de saisie. Un produit qui ne la remplit pas l'écarte en une ligne.
  {
    cle: 'aide-champ',
    libelle: 'Aide contextuelle de champ',
    motifs: ['aide de champ', 'aide contextuelle', 'aide par champ', 'aide à la saisie',
      'aide au champ', 'exemple de saisie', 'infobulle de champ', 'texte d[\'’]aide']
  },
  {
    cle: 'filtre-tri-listes',
    libelle: 'Filtre et tri des listes',
    motifs: ['filtre', 'filtrer', 'filtrage', 'tri', 'trier', 'tri des listes']
  },
  {
    cle: 'garde-saisie',
    libelle: 'Garde de saisie',
    motifs: ['garde de saisie', 'garde-saisie', 'validation de saisie', 'validation des saisies',
      'validation avant envoi', 'validation de formulaire', 'validation des champs',
      'contrôle de saisie', 'contrôle des saisies']
  }
]
for (const c of SURFACE_IMPLICITE) c.re = lexique(c.motifs)
const CLES_IMPLICITES = SURFACE_IMPLICITE.map(c => c.cle)
const EST_CLE = new Set(CLES_IMPLICITES)

// S5 — TF-1655 : la surface implicite d'un REGISTRE.
//
// Mesure du 12/10/2026 sur un produit réel : sur 219 exigences d'un hub qui tient le registre
// des projets d'une organisation, AUCUNE ne couvrait la lecture d'une même information pour tous
// les projets, la comparaison de projets, ni l'inventaire hiérarchique des ressources d'un projet
// avec leur architecture. Le commanditaire les a demandés après coup, et un run de version a dû
// ajouter 13 exigences (DELTA-0002). Profil identique à celui de la surface implicite SaaS : un
// registre se CONSULTE élément par élément dans l'entrant, et les usages qui traversent les
// éléments ne sont écrits par personne — l'oubli reste indiscernable de la décision.
//
// Même mécanique que S4 — chaque candidat est RETENU (présent à la surface) ou ÉCARTÉ dans
// `ecarts_surface_implicite`, avec ses propres clés —, deux différences assumées :
//   — la condition d'applicabilité est INFÉRÉE d'un lexique fermé sur les libellés des éléments
//     de type `objet` (un objet qui EST un registre, un inventaire, un catalogue…) ;
//   — la règle est NEUVE et opposable à tous les produits déjà cadrés : elle AVERTIT (SANS_OBJET,
//     exit inchangé), elle ne bloque pas — même idiome que C5 (TF-1564) et E11 (TF-1625).
// Ordre et libellés repris à l'identique de `enumere-la-surface/references/typologie-surface.md`,
// section « Les clés de la liste close d'un registre » ; la recette (branche TF-0854) confronte
// les deux tables dans les deux sens.
const MARQUEURS_REGISTRE = ['registre', 'inventaire', 'catalogue', 'portefeuille', 'répertoire',
  'annuaire', 'cartographie', 'parc']
const RE_REGISTRE = lexique(MARQUEURS_REGISTRE)
const SURFACE_REGISTRE = [
  {
    cle: 'vue-transverse',
    libelle: 'Vue transverse',
    motifs: ['vue transverse', 'inventaire transverse', 'lecture transverse', 'vue consolidée',
      "vue d'ensemble", 'tous les projets', 'tous les éléments', 'multi-projets']
  },
  {
    cle: 'comparaison',
    libelle: "Comparaison d'éléments",
    motifs: ['comparaison', 'comparer', 'compare', 'comparatif', 'côte à côte']
  },
  {
    cle: 'inventaire-hierarchique',
    libelle: 'Inventaire hiérarchique',
    motifs: ['inventaire hiérarchique', 'hiérarchie', 'hiérarchique', 'arborescence',
      'architecture']
  }
]
for (const c of SURFACE_REGISTRE) c.re = lexique(c.motifs)
const CLES_REGISTRE = SURFACE_REGISTRE.map(c => c.cle)
const EST_CLE_REGISTRE = new Set(CLES_REGISTRE)

// TF-2119 — QUI décide d'un écart de surface implicite. Fait (lot de Produit-86 du 03/11/2026) :
// l'onboarding a été écarté avec `decide_par` « la session de build », S4 a rendu PASS, et le
// porteur juge cet écart contraire à la loi n° 3 : la surface implicite s'écarte explicitement,
// par DÉCISION HUMAINE. Le contrat commun (`defautDEcart`) exige un `decide_par` non vide, rien de
// plus : « la session de build » le remplit. Deux conditions s'ajoutent ici, propres à la
// surface (le contrat commun reste inchangé pour `ecarts_exigences_socle`, E10) :
//   1. `decide_par` ne désigne ni une session, ni un agent, ni un build, ni une IA, un script, un
//      pipeline… (lexique fermé) ;
//   2. `decide_par` porte une décision humaine RÉFÉRENCÉE, sous l'une de ces trois formes :
//      un identifiant de décision (D-N), une entrée de ledger (« ledger » suivi d'un numéro, ou
//      « seq N »), une citation humaine DATÉE (texte entre guillemets d'au moins 10 caractères
//      et une date AAAA-MM-JJ ou JJ/MM/AAAA, dans `decide_par`).
// La FORME de la référence est jugée, jamais son existence : une référence inventée passe
// (déclaré en `non_juge`). Un nom d'humain seul (« le commanditaire du produit ») ne suffit plus.
const RE_DESIGNE_UNE_MACHINE = lexique(['session', 'agent', 'build', 'ia', 'claude', 'assistant',
  'modèle', 'pipeline', 'script', 'bot', 'orchestrateur', 'automatique', 'automatiquement'])
const RE_DECISION_ID = new RegExp(`${AVANT}D-\\d+${APRES}`, 'u')
const RE_LEDGER = new RegExp(`ledger[^\\n]{0,60}?\\d|${AVANT}seq\\.?\\s*[:#]?\\s*\\d+`, 'iu')
const RE_CITATION = /[«"“][^»"”]{10,}[»"”]/u
const RE_DATE_CITEE = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/

function defautDuDecideur (decidePar) {
  const t = typeof decidePar === 'string' ? decidePar.trim() : ''
  if (t === '') return '' // l'absence est déjà nommée par le contrat commun
  if (RE_DESIGNE_UNE_MACHINE.test(t)) {
    return `\`decide_par\` « ${t} » désigne une session, un agent ou un build : un écart de ` +
      'surface implicite est une décision humaine (loi n° 3, « l\'oubli n\'existe pas »). ' +
      'Nommer l\'humain qui a décidé, avec sa décision référencée (identifiant D-N, entrée de ' +
      'ledger, ou citation humaine datée)'
  }
  const reference = RE_DECISION_ID.test(t) || RE_LEDGER.test(t) ||
    (RE_CITATION.test(t) && RE_DATE_CITEE.test(t))
  if (!reference) {
    return `\`decide_par\` « ${t} » ne porte aucune décision humaine référencée : ajouter un ` +
      'identifiant de décision (D-N), une entrée de ledger (« ledger seq N »), ou une citation ' +
      'humaine datée (« … » et une date AAAA-MM-JJ) — un nom seul n\'atteste pas la décision'
  }
  return ''
}

/**
 * Ce qui manque à un écart pour tenir. Chaîne vide = l'écart tient — contrat commun, puis les
 * deux conditions du décideur (TF-2119). `cles` : la liste close visée (S4 ou S5).
 */
const defautDeLEcart = (e, cles = CLES_IMPLICITES) =>
  defautDEcart(e, cles) || defautDuDecideur(e?.decide_par)

const cible = process.argv[2]
let seuil = SEUIL_DEFAUT
const iSeuil = process.argv.indexOf('--seuil')
if (iSeuil !== -1) {
  const v = Number(process.argv[iSeuil + 1])
  if (!Number.isFinite(v) || v < 0 || v > 100) erreur('--seuil attend un nombre entre 0 et 100')
  seuil = v
}

const ref = charger(cible)
if (!Array.isArray(ref.exigences)) erreur('champ `exigences` absent ou non tableau')
const surface = Array.isArray(ref.surface) ? ref.surface : null

const constats = []

if (surface === null || surface.length === 0) {
  // Un entrant peut n'avoir aucune surface énumérable (idée pure). Déclaré, jamais PASS par défaut.
  constats.push(constat('S1', SANS_OBJET, 'surface[]',
    'aucune surface énumérée — S1 et S2 sans objet. Vérifier que l\'entrant le justifie ' +
    '(une idée pure n\'a pas de surface ; un dépôt existant en a toujours une)'))
  constats.push(constat('S2', SANS_OBJET, 'surface[]', 'ratio non calculable sans surface'))
} else {
  const connus = new Set(surface.map(s => s?.id))
  const couverts = new Set()
  for (const e of ref.exigences) {
    for (const s of e?.surface ?? []) if (connus.has(s)) couverts.add(s)
  }

  // Ratio calculé avant S1 : le statut de chaque élément non couvert en dépend (RC-1).
  const ratio = (couverts.size / surface.length) * 100
  const arrondi = Math.round(ratio * 10) / 10
  const seuilAtteint = ratio >= seuil
  const nonCouverts = surface.filter(s => !couverts.has(s?.id)).map(s => s?.id)

  // S1 — chaque élément non couvert est nommé, un constat par élément. Bloquant (FAIL) sous
  // le seuil ; avertissement non bloquant (SANS_OBJET) au-dessus ou à l'égal — jamais fondu
  // dans le ratio, jamais silencieux.
  for (const [i, s] of surface.entries()) {
    const ou = s?.id ? `surface[${i}] (${s.id})` : `surface[${i}]`
    const libelle = s?.libelle ? ` — ${s.libelle}` : ''
    if (couverts.has(s?.id)) {
      constats.push(constat('S1', PASS, ou, `couvert${libelle}`))
    } else if (seuilAtteint) {
      constats.push(constat('S1', SANS_OBJET, ou,
        `élément de surface sans aucune exigence${libelle} — avertissement non bloquant : ` +
        `couverture globale ${arrondi} % ≥ seuil ${seuil} %`))
    } else {
      constats.push(constat('S1', FAIL, ou, `élément de surface sans aucune exigence${libelle}`))
    }
  }

  // S2 — le ratio, publié avec la liste, jamais à sa place.
  constats.push(seuilAtteint
    ? constat('S2', PASS, 'surface[]',
      `couverture ${arrondi} % (${couverts.size}/${surface.length}), seuil ${seuil} %` +
      (nonCouverts.length ? ` — non couverts (avertissement) : ${nonCouverts.join(', ')}` : ''))
    : constat('S2', FAIL, 'surface[]',
      `couverture ${arrondi} % (${couverts.size}/${surface.length}) sous le seuil ${seuil} % ` +
      `— non couverts : ${nonCouverts.join(', ')}`))
}

// S3 — toute exigence pointe une surface valide, ou déclare pourquoi elle n'en a pas.
const connus = new Set((surface ?? []).map(s => s?.id))
for (const [i, e] of ref.exigences.entries()) {
  const ou = e?.id ? `exigences[${i}] (${e.id})` : `exigences[${i}]`
  const liens = Array.isArray(e?.surface) ? e.surface : []
  const horsSurface = typeof e?.hors_surface === 'string' && e.hors_surface.trim() !== ''
  if (liens.length === 0) {
    constats.push(horsSurface
      ? constat('S3', PASS, ou, `hors surface, raison déclarée : ${e.hors_surface}`)
      : constat('S3', FAIL, ou,
        'aucun lien de surface et aucune raison `hors_surface` : le trou est silencieux'))
    continue
  }
  const inconnus = liens.filter(s => !connus.has(s))
  constats.push(inconnus.length === 0
    ? constat('S3', PASS, ou, `${liens.length} lien(s) de surface valide(s)`)
    : constat('S3', FAIL, ou, `éléments de surface inconnus : ${inconnus.join(', ')}`))
}

// S4 — la surface implicite, candidat par candidat.
{
  const tous = surface ?? []

  // 4.1 — les écarts déclarés, indexés par candidat. Un écart qui ne désigne aucun candidat de
  // la liste close ne protège rien : il est nommé pour lui-même, jamais silencieux.
  const brut = ref.ecarts_surface_implicite
  const ecarts = new Map()
  if (brut !== undefined && !Array.isArray(brut)) {
    constats.push(constat('S4', FAIL, 'ecarts_surface_implicite',
      'champ présent mais non tableau — attendu [{ element, motif, decide_par, date }]'))
  } else {
    for (const [i, e] of (brut ?? []).entries()) {
      const cle = typeof e?.element === 'string' ? e.element.trim() : ''
      // TF-1655 : un écart d'un candidat de registre est jugé par S5, jamais accusé ici.
      if (EST_CLE_REGISTRE.has(cle)) continue
      const defaut = defautDeLEcart(e)
      if (!EST_CLE.has(cle)) {
        constats.push(constat('S4', FAIL, `ecarts_surface_implicite[${i}]`,
          `écart rattaché à aucun candidat de la surface implicite : ${defaut}`))
        continue
      }
      // Le premier écart valide d'un candidat gagne ; un doublon invalide ne l'annule pas.
      if (ecarts.get(cle)?.defaut !== '') ecarts.set(cle, { indice: i, ecart: e, defaut })
    }
  }

  // 4.2 — condition d'applicabilité : le bloc n'est dû que si le produit a une surface web
  // (typologie-surface.md, « dès que l'entrant vise une application web/SaaS à utilisateur
  // final » ; P-2 exclut lui-même l'application sans surface web).
  const pointsWeb = tous.filter(s =>
    s?.type === 'point-entree' && RE_WEB.test(`${s?.libelle ?? ''}`))

  if (pointsWeb.length === 0) {
    constats.push(constat('S4', PASS, 'surface[]',
      'aucun point d\'entrée web énuméré : la surface implicite (dont la 404 par langue) ' +
      'n\'est pas due — typologie-surface.md, « hors périmètre déclaré d\'un coup » ; P-2, ' +
      'exclusion « application sans surface web »'))
  } else {
    const contexte = `${pointsWeb.length} point(s) d'entrée web (${pointsWeb.map(s => s.id).join(', ')})`
    for (const c of SURFACE_IMPLICITE) {
      const lus = tous.filter(s => c.re.test(`${s?.libelle ?? ''}`))
      // TF-2120 : un élément qui ne dit que « codes d'erreur » ne tient pas lieu d'aide.
      const reduits = c.reduite
        ? lus.filter(s => c.reduite.test(`${s?.libelle ?? ''}`) && !c.facettes.test(`${s?.libelle ?? ''}`))
        : []
      const presents = lus.filter(s => !reduits.includes(s))
      const ecart = ecarts.get(c.cle)
      if (presents.length > 0) {
        constats.push(constat('S4', PASS, `surface[] (${presents.map(s => s.id).join(', ')})`,
          `« ${c.libelle} » figure à la surface énumérée — ${contexte}`))
      } else if (ecart && ecart.defaut === '') {
        constats.push(constat('S4', PASS, `ecarts_surface_implicite[${ecart.indice}] (${c.cle})`,
          `[ÉCARTÉ] « ${c.libelle} » — ${String(ecart.ecart.motif).trim()} ` +
          `(décidé par ${String(ecart.ecart.decide_par).trim()}, ` +
          `le ${String(ecart.ecart.date).trim()})`))
      } else if (ecart) {
        constats.push(constat('S4', FAIL, `ecarts_surface_implicite[${ecart.indice}] (${c.cle})`,
          `« ${c.libelle} » absent de la surface, et son écart ne tient pas : ${ecart.defaut}`))
      } else {
        const reduite = reduits.length > 0
          ? ` La seule aide énumérée (${reduits.map(s => s.id).join(', ')}) est réduite aux codes ` +
            "d'erreur : elle ne tient pas lieu d'aide utilisateur (page, encarts, aide par champ)."
          : ''
        constats.push(constat('S4', FAIL, `surface[] (${c.cle})`,
          `« ${c.libelle} » : candidat d'office de la surface implicite, absent de la surface ` +
          `énumérée et sans écart déclaré — ${contexte}.${reduite} À retenir (un élément de surface, ` +
          'puis une exigence qui le couvre), ou à écarter EXPLICITEMENT en section 3 de ' +
          '`SURFACE.md`, transcrite dans `ecarts_surface_implicite` ' +
          '{ element, motif, decide_par, date } — decide_par nomme l\'humain ET sa décision ' +
          'référencée (D-N, entrée de ledger, citation datée). La loi transverse n° 3 ne connaît pas ' +
          'l\'absence par omission.'))
      }
    }
  }
}

// S5 — la surface implicite d'un registre, candidat par candidat (TF-1655). Avertissement :
// un candidat ni retenu ni écarté est NOMMÉ en SANS_OBJET, l'exit ne change pas.
{
  const tous = surface ?? []
  const brut = Array.isArray(ref.ecarts_surface_implicite) ? ref.ecarts_surface_implicite : []
  const ecarts = new Map()
  for (const [i, e] of brut.entries()) {
    const cle = typeof e?.element === 'string' ? e.element.trim() : ''
    if (!EST_CLE_REGISTRE.has(cle)) continue
    const defaut = defautDeLEcart(e, CLES_REGISTRE)
    if (ecarts.get(cle)?.defaut !== '') ecarts.set(cle, { indice: i, ecart: e, defaut })
  }

  const registres = tous.filter(s => s?.type === 'objet' && RE_REGISTRE.test(`${s?.libelle ?? ''}`))
  if (registres.length === 0) {
    constats.push(constat('S5', PASS, 'surface[]',
      'aucun objet énuméré n\'est un registre, un inventaire ou un catalogue : la surface ' +
      'implicite d\'un registre (vue transverse, comparaison, inventaire hiérarchique) n\'est ' +
      'pas due — typologie-surface.md, « Surface implicite d\'un registre »'))
  } else {
    const contexte = `${registres.length} objet(s) registre (${registres.map(s => s.id).join(', ')})`
    for (const c of SURFACE_REGISTRE) {
      const presents = tous.filter(s => c.re.test(`${s?.libelle ?? ''}`))
      const ecart = ecarts.get(c.cle)
      if (presents.length > 0) {
        constats.push(constat('S5', PASS, `surface[] (${presents.map(s => s.id).join(', ')})`,
          `« ${c.libelle} » figure à la surface énumérée — ${contexte}`))
      } else if (ecart && ecart.defaut === '') {
        constats.push(constat('S5', PASS, `ecarts_surface_implicite[${ecart.indice}] (${c.cle})`,
          `[ÉCARTÉ] « ${c.libelle} » — ${String(ecart.ecart.motif).trim()} ` +
          `(décidé par ${String(ecart.ecart.decide_par).trim()}, ` +
          `le ${String(ecart.ecart.date).trim()})`))
      } else if (ecart) {
        constats.push(constat('S5', SANS_OBJET, `ecarts_surface_implicite[${ecart.indice}] (${c.cle})`,
          `avertissement non bloquant — « ${c.libelle} » absent de la surface, et son écart ne ` +
          `tient pas : ${ecart.defaut}`))
      } else {
        constats.push(constat('S5', SANS_OBJET, `surface[] (${c.cle})`,
          `avertissement non bloquant — « ${c.libelle} » : candidat d'office de la surface ` +
          `implicite d'un registre, absent de la surface énumérée et sans écart déclaré — ` +
          `${contexte}. À retenir (un élément de surface, puis une exigence qui le couvre), ou ` +
          'à écarter EXPLICITEMENT en section 3 de `SURFACE.md`, transcrite dans ' +
          '`ecarts_surface_implicite` { element, motif, decide_par, date }'))
      }
    }
  }
}

emettre({
  oracle: 'oracle-surface',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La complétude de l\'inventaire de surface lui-même. On ne peut pas prouver mécaniquement ' +
      'qu\'un inventaire tiré d\'un entrant textuel n\'a rien oublié. Le ratio mesure la ' +
      'couverture de ce qui a été énuméré, jamais de ce qui existe.',
    'Le caractère web du produit, que S4 INFÈRE d\'un lexique fermé sur les libellés de type ' +
      '`point-entree` : une surface web énumérée sans aucun de ces mots reste invisible pour ' +
      'S4, et un point d\'entrée non web qui les emploie réveille le bloc pour rien. Le second ' +
      'cas se solde par des écarts déclarés, jamais par un refus sans issue.',
    'La PRÉSENCE d\'un candidat de la surface implicite, elle aussi inférée d\'un lexique fermé ' +
      'sur les libellés : un élément nommé « Compte rendu » satisfait le candidat « Compte ' +
      'utilisateur » sans qu\'aucun compte n\'existe. L\'inférence est volontairement ' +
      'permissive — elle peut taire un candidat, jamais en inventer un.',
    'La PERTINENCE du motif d\'un écart. S4 exige qu\'il soit écrit, daté et signé ; il ne juge ' +
      'ni sa véracité ni sa suffisance — un écart est opposable parce qu\'écrit, pas parce ' +
      'que vrai.',
    'L\'EXISTENCE et l\'AUTHENTICITÉ de la décision humaine qu\'un écart référence (TF-2119). S4 ' +
      'juge la FORME de `decide_par` : aucune désignation d\'une session, d\'un agent ou d\'un ' +
      'build (lexique fermé : une machine nommée autrement, un agent déguisé en prénom, passe), ' +
      'et une référence de forme valide — D-N, « ledger » suivi d\'un numéro, citation entre ' +
      'guillemets avec une date. Un D-N inventé, une entrée de ledger qui n\'existe pas, une ' +
      'citation que l\'humain n\'a jamais écrite passent ; seule une relecture contre le ' +
      'registre des décisions du pilot les attrape. Un écart qui nomme l\'humain ET une machine ' +
      '(« décidé par le porteur, appliqué par la session ») est refusé : le nom de la machine ' +
      'sort de `decide_par`.',
    'La condition d\'applicabilité des trois candidats de TF-2120 : « un champ de saisie non ' +
      'trivial » (aide contextuelle de champ), « une liste de 8 éléments ou plus » (filtre et ' +
      'tri des listes — le seuil de L4, `check_html.py` du skill `digit-ai-page-html`), « un ' +
      'formulaire de saisie » (garde de saisie). S4 ne les infère pas : un produit qui ne la ' +
      'remplit pas écarte le candidat en une ligne, avec sa raison. Le critère vérifiable de ' +
      'chacun vit dans l\'exigence qui retient le candidat (`typologie-surface.md`), jamais dans ' +
      'ce juge. De même, la REDUCTION d\'une aide aux codes d\'erreur est inférée du libellé ' +
      '(lexique fermé sur « codes d\'erreur », « codes de refus »…, levée par une autre facette ' +
      'nommée : page, encart, champ, guide, FAQ) : une page d\'aide à l\'intitulé neutre qui ne ' +
      'contiendrait que ces codes reste invisible.',
    'Les conditions d\'applicabilité qu\'un candidat porte au-delà de la surface web — ' +
      '« site public français » pour l\'accessibilité RGAA et ses livrables légaux, ' +
      '« produit multi-tenant » pour le lien public partageable et les comptes d\'essai ' +
      '(TF-0874). S4 ne les infère pas : le candidat est retenu ou écarté avec son motif, ' +
      'comme les autres — un produit mono-tenant écarte les deux en deux lignes, et c\'est ' +
      'moins cher que de rendre l\'omission indiscernable de la décision. De même (TF-1908) ' +
      'pour « le produit pose un traceur non exempté de consentement » (traceurs et ' +
      'consentement), « le produit collecte une donnée personnelle » (politique de ' +
      'confidentialité) et « le produit a une page publique » (aperçu de partage) : un produit ' +
      'qui ne remplit pas la condition écarte le candidat en une ligne avec sa raison. La base ' +
      'légale de la politique de confidentialité n\'a pas été relue à Légifrance par l\'étude ' +
      'qui fonde ces candidats ; seul le consentement est sourcé (CNIL, 12/12/2024).',
    'Le contenu de la 404 elle-même — gabarit, statut HTTP conservé, `noindex`, préfixe de ' +
      'langue : les cinq critères de P-2 se vérifient sur la page servie (MEP, contrôle M-9 ; ' +
      'contrôle exécutable chez forge-tests), jamais sur un référentiel d\'exigences.',
    'La nature de REGISTRE du produit (S5, TF-1655), inférée d\'un lexique fermé sur les ' +
      'libellés de type `objet` (registre, inventaire, catalogue, portefeuille, répertoire, ' +
      'annuaire, cartographie, parc) : un registre nommé autrement reste invisible pour S5, et ' +
      'un objet qui emploie ces mots sans être un registre réveille le bloc pour rien — ce ' +
      'second cas se solde par trois écarts déclarés. S5 avertit sans bloquer : règle neuve, ' +
      'opposable à des référentiels déjà scellés.'
  ]
})
