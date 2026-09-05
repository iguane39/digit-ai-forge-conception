// oracle-surface — couverture de la surface énumérée.
// Usage : node oracle-surface.mjs <EXIGENCES.json> [--seuil 95]
// CDC §7.3 — règles S1 à S3. Écho amont du défaut fondateur de Forge Tests :
// tout élément inventorié et non couvert est NOMMÉ, jamais fondu dans un pourcentage.
//
// RC-1 (retour premier produit réel) : sous le seuil, un élément non couvert reste bloquant
// (FAIL). Au-dessus ou à l'égal du seuil, il reste NOMMÉ individuellement mais bascule en
// avertissement non bloquant (SANS_OBJET — seul statut non-PASS/FAIL du contrat, compté à
// part et toujours visible) : le seuil de S2 redevient opérant sans faire disparaître le nom
// de l'élément.

import { charger, constat, emettre, erreur, PASS, FAIL, SANS_OBJET, AVANT, APRES } from './_contrat.mjs'

const VERSION = '1.2.0'
const SEUIL_DEFAUT = 95 // CDC question ouverte (d) : 95 % en MVP, 100 % en V1

// S4 — la surface implicite : chaque candidat d'office est RETENU ou ÉCARTÉ explicitement.
//
// TF-0804 (première moitié) : la 404 est la page que PERSONNE ne conçoit — aucun gabarit ne la
// génère, aucune revue ne la voit, et un site multilingue a servi en production le 404 nu de
// son serveur de fichiers du 25/08 au 01/09/2026. C'est le profil type de la loi transverse
// n° 3 (« l'oubli n'existe pas »), et ce profil vaut pour TOUTE la liste close de la surface
// implicite (`enumere-la-surface/references/typologie-surface.md`) : aide, onboarding, compte,
// favicon, états vides, erreurs visibles, mentions légales, responsive, accessibilité, ses
// livrables légaux, et la 404. La règle ne juge pas la page servie — cela relève de la MEP
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
// TF-0799 — bornes Unicode obligatoires ici : avec `\b`, « écran » (bord accentué) précédé
// d'une espace n'aurait JAMAIS été trouvé, et « route » se serait lu dans « routeur ».
const lexique = (motifs) => new RegExp(`${AVANT}(${motifs.join('|')})s?${APRES}`, 'iu')
const RE_WEB = lexique(MARQUEURS_WEB)

// La liste CLOSE de la surface implicite. Ordre et libellés repris à l'identique de
// `enumere-la-surface/references/typologie-surface.md`, section « Surface implicite SaaS » :
// cette table en est la transcription exécutable, elle ne l'étend pas. L'élargir est une
// décision (delta du référentiel de la forge), jamais une commodité.
const SURFACE_IMPLICITE = [
  {
    cle: 'aide-utilisateur',
    libelle: 'Aide utilisateur',
    motifs: ['aide', "centre d'aide", 'help']
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
  }
]
for (const c of SURFACE_IMPLICITE) c.re = lexique(c.motifs)
const CLES_IMPLICITES = SURFACE_IMPLICITE.map(c => c.cle)
const EST_CLE = new Set(CLES_IMPLICITES)

const MOTIF_MINIMUM = 20 // caractères : plus court, ce n'est pas une raison, c'est un mot
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Ce qui manque à un écart pour tenir. Chaîne vide = l'écart tient. */
function defautDeLEcart (e) {
  const texte = (v) => (typeof v === 'string' ? v.trim() : '')
  if (!e || typeof e !== 'object' || Array.isArray(e)) return 'entrée non objet'
  if (!EST_CLE.has(texte(e.element))) {
    return `\`element\` « ${texte(e.element) || '(vide)'} » hors de la liste close ` +
      `(${CLES_IMPLICITES.join(', ')})`
  }
  if (texte(e.motif).length < MOTIF_MINIMUM) {
    return `\`motif\` de ${texte(e.motif).length} caractère(s), minimum ${MOTIF_MINIMUM} — ` +
      'un écart sans raison écrite est un oubli déguisé'
  }
  if (texte(e.decide_par) === '') {
    return '`decide_par` absent ou vide — un écart est décidé par quelqu\'un'
  }
  if (!RE_DATE.test(texte(e.date))) return '`date` absente ou hors format AAAA-MM-JJ'
  return ''
}

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
      const presents = tous.filter(s => c.re.test(`${s?.libelle ?? ''}`))
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
        constats.push(constat('S4', FAIL, `surface[] (${c.cle})`,
          `« ${c.libelle} » : candidat d'office de la surface implicite, absent de la surface ` +
          `énumérée et sans écart déclaré — ${contexte}. À retenir (un élément de surface, ` +
          'puis une exigence qui le couvre), ou à écarter EXPLICITEMENT en section 3 de ' +
          '`SURFACE.md`, transcrite dans `ecarts_surface_implicite` ' +
          '{ element, motif, decide_par, date }. La loi transverse n° 3 ne connaît pas ' +
          'l\'absence par omission.'))
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
    'Les conditions d\'applicabilité qu\'un candidat porte au-delà de la surface web — ' +
      '« site public français » pour l\'accessibilité RGAA et ses livrables légaux notamment. ' +
      'S4 ne les infère pas : le candidat est retenu ou écarté avec son motif, comme les autres.',
    'Le contenu de la 404 elle-même — gabarit, statut HTTP conservé, `noindex`, préfixe de ' +
      'langue : les cinq critères de P-2 se vérifient sur la page servie (MEP, contrôle M-9 ; ' +
      'contrôle exécutable chez forge-tests), jamais sur un référentiel d\'exigences.'
  ]
})
