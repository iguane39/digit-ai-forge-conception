# Surface fonctionnelle — Portail de réservation de salles

> Fixture TF-0822, **sens rouge**, volet `SURFACE.md`. La section 3 EXISTE et n'est pas vide :
> ce n'est donc pas son absence qui est mesurée, mais le fait que les deux entrées d'
> `ecarts_surface_implicite` du référentiel voisin n'y figurent pas. P4 les nomme.

## 1. Origine

`ENTRANT.md` du 2026-09-05, section « Périmètre fonctionnel ».

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

L'export des réservations au format tableur a été vu et volontairement exclu du palier MVP :
aucun service demandeur ne l'a réclamé à ce jour, et le portail affiche déjà l'occupation à
l'écran.

## 4. Non énumérable

Le parc de salles réel — nombre, équipements, contraintes d'occupation — n'est pas énumérable
depuis ce cahier.
