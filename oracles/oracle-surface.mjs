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

import { charger, constat, emettre, erreur, PASS, FAIL, SANS_OBJET } from './_contrat.mjs'

const VERSION = '1.0.0'
const SEUIL_DEFAUT = 95 // CDC question ouverte (d) : 95 % en MVP, 100 % en V1

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

emettre({
  oracle: 'oracle-surface',
  version: VERSION,
  cible,
  constats,
  non_juge: [
    'La complétude de l\'inventaire de surface lui-même. On ne peut pas prouver mécaniquement ' +
      'qu\'un inventaire tiré d\'un entrant textuel n\'a rien oublié. Le ratio mesure la ' +
      'couverture de ce qui a été énuméré, jamais de ce qui existe.'
  ]
})
