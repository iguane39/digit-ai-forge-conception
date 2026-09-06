# Surface fonctionnelle — Portail de réservation de salles

> Fixture TF-0822, **sens vert** : la section 3 porte les deux entrées d'
> `ecarts_surface_implicite` du référentiel voisin, clé et motif. `oracle-exigences-md` P4 y
> rend PASS.

## 1. Origine

`ENTRANT.md` du 2026-09-05, section « Périmètre fonctionnel ». Énumération faite avant toute
rédaction d'exigence, pour que ce qui n'est pas couvert soit un manque nommé.

## 2. Tableau

| id | type | libellé | d'où il vient |
|---|---|---|---|
| S-01 | point-entree | Page d'accueil du portail | entrant §2 |
| S-02 | point-entree | Aide utilisateur | surface implicite (retenu) |
| S-03 | parcours | Onboarding de première connexion | surface implicite (retenu) |
| S-04 | objet | Compte utilisateur | entrant §3 |
| S-05 | objet | Favicon du portail | surface implicite (retenu) |
| S-06 | parcours | États vides guidés | surface implicite (retenu) |
| S-07 | regle | Gestion des erreurs visible | surface implicite (retenu) |
| S-08 | point-entree | Mentions légales | surface implicite (retenu) |
| S-09 | regle | Responsive mobile | surface implicite (retenu) |
| S-10 | objet | Salle réservable | entrant §2 |
| S-11 | point-entree | Page 404 par langue | surface implicite (retenu) |

## 3. Écartés

Deux candidats d'office de la **surface implicite** ont été vus et volontairement exclus. Ces
deux lignes sont transcrites telles quelles dans le champ `ecarts_surface_implicite` du
référentiel — la prose est ici la source, le champ en est la copie.

| clé | motif | décidé par | date |
|---|---|---|---|
| `accessibilite-rgaa` | portail interne à l'entreprise, accessible par authentification seule : il n'entre pas dans le champ du site public français où le RGAA 4.1 est une obligation légale | le commanditaire du produit | 2026-09-05 |
| `livrables-accessibilite` | corollaire de l'écart précédent : sans obligation RGAA, ni schéma pluriannuel ni déclaration d'accessibilité ne sont dus, et aucun n'est produit pour la forme | le commanditaire du produit | 2026-09-05 |

## 4. Non énumérable

L'entrant ne décrit pas le parc de salles réel : le nombre de salles, leurs équipements et
leurs contraintes d'occupation ne sont pas énumérables depuis ce cahier. Repris de
`ENTRANT.md` §4.
