---
titre: Patron de plateformes — front sur Workers (static assets), données et auth sur Supabase, déploiement par GitHub Actions
item: TF-2010 (part conception)
lu_le_global: 2026-10-28
sources:
  - id: S1
    url: https://developers.cloudflare.com/pages/
    lu_le: 2026-10-28
    maj_page: 2026-08-25
  - id: S2
    url: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
    lu_le: 2026-10-28
    maj_page: 2026-10-12
  - id: S3
    url: https://developers.cloudflare.com/workers/static-assets/
    lu_le: 2026-10-28
    maj_page: 2026-10-12
  - id: S4
    url: https://developers.cloudflare.com/workers/previews/
    lu_le: 2026-10-28
    maj_page: 2026-09-24
  - id: S5
    url: https://developers.cloudflare.com/workers/previews/configuration/
    lu_le: 2026-10-28
    maj_page: 2026-09-22
  - id: S6
    url: https://developers.cloudflare.com/workers/previews/compare-workflows/
    lu_le: 2026-10-28
    maj_page: 2026-09-22
  - id: S7
    url: https://developers.cloudflare.com/workers/previews/examples/
    lu_le: 2026-10-28
    maj_page: 2026-10-01
  - id: S8
    url: https://developers.cloudflare.com/workers/ci-cd/builds/
    lu_le: 2026-10-28
    maj_page: 2026-10-15
  - id: S9
    url: https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
    lu_le: 2026-10-28
    maj_page: 2026-10-01
  - id: S10
    url: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
    lu_le: 2026-10-28
    maj_page: 2026-09-22
  - id: S11
    url: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
    lu_le: 2026-10-28
    maj_page: 2026-10-18
  - id: S12
    url: https://developers.cloudflare.com/workers/configuration/environment-variables/
    lu_le: 2026-10-28
    maj_page: 2026-08-21
  - id: S13
    url: https://developers.cloudflare.com/workers/configuration/secrets/
    lu_le: 2026-10-28
    maj_page: 2026-10-15
  - id: S14
    url: https://developers.cloudflare.com/workers/wrangler/environments/
    lu_le: 2026-10-28
    maj_page: 2026-10-18
  - id: S15
    url: https://developers.cloudflare.com/workers/databases/third-party-integrations/supabase/
    lu_le: 2026-10-28
    maj_page: 2026-04-23
  - id: S16
    url: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/
    lu_le: 2026-10-28
    maj_page: 2026-04-21
  - id: S17
    url: https://developers.cloudflare.com/pages/configuration/preview-deployments/
    lu_le: 2026-10-28
    maj_page: 2026-10-12
  - id: S18
    url: https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/
    lu_le: 2026-10-28
    maj_page: 2026-09-22
  - id: S19
    url: https://supabase.com/docs/guides/auth/redirect-urls
    lu_le: 2026-10-28
  - id: S20
    url: https://supabase.com/docs/guides/api/api-keys
    lu_le: 2026-10-28
  - id: S21
    url: https://supabase.com/docs/guides/database/connecting-to-postgres
    lu_le: 2026-10-28
  - id: S22
    url: https://supabase.com/docs/guides/deployment/managing-environments
    lu_le: 2026-10-28
  - id: S23
    url: https://supabase.com/docs/guides/deployment/branching/github-integration
    lu_le: 2026-10-28
  - id: S24
    url: https://supabase.com/docs/guides/auth/server-side
    lu_le: 2026-10-28
  - id: S25
    url: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments
    lu_le: 2026-10-28
  - id: S26
    url: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
    lu_le: 2026-10-28
  - id: S27
    url: https://docs.github.com/en/actions/concepts/security/openid-connect
    lu_le: 2026-10-28
---

# Patron : front sur Workers, données et auth sur Supabase, déploiement par GitHub Actions

Ce patron dit à un run de conception quelles questions poser, et quels faits datés bornent les
réponses, quand le produit combine ces trois plateformes. Il ne dessine pas l'architecture : la
forge s'arrête au référentiel d'exigences, et le détail d'implémentation relève de l'étape C de la
SaaS Forge. Chaque réponse se range dans l'un des quatre lieux que la forge connaît : une
exigence du référentiel, un principe de `CONSTITUTION.md`, une hypothèse (statut épistémique) ou
un « hors de portée » de `ENTRANT.md`. Le déploiement lui-même (plans, enchaînement, rollback)
est outillé par forge-ops, hors de ce document.

**Quand le lire.** `ENTRANT.md` ou `RETRO-MODELE.md` (volets technique et services) nomme au moins
deux des trois plateformes, ou le dépôt à reprendre porte un fichier `wrangler.*`, un dossier
`supabase/` ou un dossier `.github/workflows/`. Les pages citées ont été lues le 28/10/2026 ; un
fait de ce document se relit à la page avant d'entrer dans une exigence : les pages citées portent
des dates de mise à jour échelonnées entre avril et octobre 2026 (la page Previews de Cloudflare
date du 24/09/2026).

**Lecture des sources.** `[Sn]` renvoie à l'entrée `Sn` du frontmatter : adresse, date de lecture,
et date de mise à jour affichée par la page quand elle en porte une. Un fait déduit par ce patron
de plusieurs pages, sans qu'aucune ne l'écrive, est dit « déduit » ; il figure aux hypothèses
non résolues tant qu'il n'a pas été rejoué.

## 1. Responsabilités de chaque plateforme

| Plateforme | Ce qu'elle porte | Ce qu'elle ne porte pas | Source |
|---|---|---|---|
| Cloudflare Workers avec static assets | sert les fichiers du dossier `assets` et exécute le code serveur d'un même déploiement ; un fichier correspondant à l'URL est servi sans invoquer le Worker, sauf `run_worker_first` | la base de données et les comptes utilisateurs | [S3] |
| Cloudflare Pages | voie existante : Cloudflare écrit « Start new projects with Workers » ; Pages n'est pas annoncé déprécié | les projets neufs | [S1][S2] |
| Workers Builds | construit et déploie à chaque poussée sur la branche de production ; une prévisualisation par autre branche si les constructions de prévisualisation sont activées | les migrations de base | [S8][S9] |
| Supabase | Postgres, Auth, clés d'API ; l'accès aux données d'un client navigateur est décidé par les règles Row Level Security (RLS) | l'hébergement du front | [S20] |
| GitHub Actions | exécute build, tests, `wrangler deploy` et les migrations Supabase ; porte les secrets de déploiement et la protection d'environnement | le runtime du produit | [S11][S22][S25] |

## 2. Variables d'environnement par plateforme

Noms seulement : aucune valeur n'entre dans un dépôt ni dans une exigence. Les noms sont ceux des
pages citées ; un produit peut en choisir d'autres, à condition de les déclarer une fois.

| Nom | Plateforme | Se pose dans | Exposé au navigateur | Source |
|---|---|---|---|---|
| `SUPABASE_URL` | Supabase, lu par le Worker ou le front | `vars` du fichier wrangler, ou variable de build ; Supabase dit de préfixer selon le framework (son exemple emploie `NEXT_PUBLIC_`) | oui, adresse publique du projet | [S20][S12] |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase | même place que l'URL ; la clé a la forme `sb_publishable_…` | oui, conçue pour l'être, sous réserve de RLS | [S20] |
| `SUPABASE_SECRET_KEY` | Supabase | secret du Worker (`wrangler secret put`), secret de base des prévisualisations (`wrangler preview base-config secret put`) ; jamais dans `vars` ni dans le dépôt | non : elle contourne la RLS et Supabase la refuse depuis un navigateur | [S20][S13][S5] |
| `HYPERDRIVE` (liaison, pas une variable) | Cloudflare | bloc `hyperdrive` du fichier wrangler avec l'identifiant de configuration ; la chaîne de connexion et son mot de passe restent dans la configuration Hyperdrive | non | [S16][S5] |
| `CLOUDFLARE_API_TOKEN` | Cloudflare, lu par Actions | secret GitHub, jamais dans le dépôt | non | [S11] |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare, lu par Actions | secret GitHub | non | [S11] |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID` | Supabase CLI, lus par Actions | secrets GitHub chiffrés ; le guide les décline en `PRODUCTION_PROJECT_ID`, `STAGING_PROJECT_ID` et leurs mots de passe | non | [S22] |
| `GITHUB_TOKEN` | GitHub | fourni automatiquement à chaque exécution | non | [S7] |
| `.dev.vars` (ou `.env`, jamais les deux) | poste local, lu par Wrangler | fichier non versionné, `.dev.vars*` et `.env*` au `.gitignore` ; `.dev.vars.<environnement>` pour chaque environnement | non | [S13][S12] |

Trois faits à garder en tête. Les variables de build de Workers Builds ne sont pas lisibles à
l'exécution, et les variables d'exécution se règlent ailleurs [S10]. Les `vars` et les secrets
d'un environnement Wrangler ne sont pas hérités du niveau supérieur [S14]. Cloudflare écrit
`SUPABASE_KEY` et parle de clé `anon` dans son exemple, alors que Supabase déprécie les clés
`anon` et `service_role` d'ici la fin 2026 : le patron suit Supabase, propriétaire des clés [S15][S20].

## 3. Prévisualisations et redirections d'authentification

Chaque voie de prévisualisation produit une forme d'URL que l'auth Supabase doit autoriser, sans
quoi la connexion renvoie vers une adresse refusée. Le motif est **déduit** de la forme de l'URL
(page Cloudflare) et des règles de joker (page Supabase) ; aucune page ne l'écrit pour Cloudflare.

| Voie | Forme d'URL | Motif à autoriser côté Supabase (déduit) | Source |
|---|---|---|---|
| Previews Workers, `workers.dev` | `<preview-name>-<worker-name>.<subdomain>.workers.dev` | `https://*-<worker-name>.<subdomain>.workers.dev/**` ; avec des prévisualisations nommées `pr-<n>` (nom de l'exemple Actions), `https://pr-*-<worker-name>.<subdomain>.workers.dev/**` est plus étroit | [S4][S7][S19] |
| Previews Workers, domaine personnalisé | `<preview-name>.app.example.com` | `https://*.app.example.com/**` | [S4][S19] |
| Pages, déploiement de prévisualisation | `<hash>.<project>.pages.dev`, hash aléatoire | `https://*.<project>.pages.dev/**` | [S17][S19] |
| Version URLs Workers | `<version-prefix>-<worker-name>.<subdomain>.workers.dev` | même motif que la première ligne ; Cloudflare déconseille cette voie pour tester une branche | [S18][S6][S19] |
| Poste local | adresse de développement | `http://localhost:3000/**` est l'exemple de Supabase ; le port est celui du produit | [S19] |

Règles de joker de Supabase : `*` couvre une suite de caractères hors séparateurs, `.` et `/`
étant les séparateurs ; `**` couvre toute suite de caractères. Supabase juge le joker `**` utile
au développement local et aux prévisualisations, et recommande l'adresse exacte du site en
production [S19]. L'URL du
site (Site URL) sert de redirection par défaut quand le code n'en précise pas, et alimente les
courriels de confirmation et de réinitialisation ; avec `redirectTo`, les gabarits de courriel
doivent lire `{{ .RedirectTo }}` au lieu de `{{ .SiteURL }}` [S19].

Les prévisualisations Workers ne reprennent pas les réglages de production : le bloc `previews`
du fichier wrangler porte leurs variables et leurs liaisons, qui doivent viser des ressources de
test, Hyperdrive compris [S5]. Elles sont publiques par défaut ; Cloudflare Access les protège
[S4]. Elles exigent Wrangler 4.135.0 ou plus [S4]. La limite est de 100 prévisualisations par
Worker en offre gratuite et 500 en offre payante : à la limite, la prévisualisation déployée le moins récemment est supprimée [S4].

## 4. Hyperdrive ou client Supabase

| Besoin | Choix | Fait | Source |
|---|---|---|---|
| Auth, stockage, temps réel ou toute fonction du client Supabase | `@supabase/supabase-js` avec l'URL et la clé | Cloudflare : « If you need access to all of the Supabase client functionality, use the Supabase client » | [S15] |
| SQL natif, pilote ou ORM, depuis le Worker | Hyperdrive, avec le pilote `pg` et le drapeau `nodejs_compat` | Hyperdrive fait la mise en route et le regroupement de connexions sur le réseau Cloudflare | [S15][S16] |
| Chaîne de connexion donnée à Hyperdrive | la chaîne de connexion **directe** | Cloudflare : utiliser la connexion directe plutôt que les chaînes poolées ; Supabase conseille pourtant le pooler en mode transaction pour les fonctions serverless | [S16][S21] |
| Prévisualisation avec Hyperdrive | une configuration Hyperdrive de test dans le bloc `previews` | les liaisons de données ne sont pas héritées de la production | [S5] |

## 5. Déploiement par GitHub Actions

| Voie | Ce qu'elle fait | À savoir | Source |
|---|---|---|---|
| Actions et `cloudflare/wrangler-action` | exécute `wrangler deploy` à la poussée sur `main` | jeton d'API créé avec le droit « Edit Cloudflare Workers », limité au seul compte de déploiement ; le jeton et l'identifiant de compte vivent en secrets | [S11] |
| Workers Builds | construit et déploie à chaque poussée depuis le dépôt connecté | le nom du Worker du tableau de bord doit égaler le `name` du fichier wrangler, sinon la construction échoue | [S8] |
| Actions et Supabase CLI | applique les migrations de `supabase/migrations` au projet lié | trois secrets, un projet de staging distinct du projet de production, jeton limité aux projets visés | [S22] |
| Intégration GitHub de Supabase | crée une branche Supabase par branche Git et déploie les migrations en production si l'option est active | les migrations de la branche viennent du dépôt ; les données de production ne sont pas clonées | [S23] |
| Environnement GitHub protégé | un travail qui référence l'environnement attend l'accord des relecteurs requis, et n'accède pas aux secrets de l'environnement avant | un travail non approuvé sous 30 jours échoue | [S25] |
| Pull request venue d'un fork | GitHub ne transmet pas les secrets, sauf `GITHUB_TOKEN` | l'exemple Cloudflare vérifie que le dépôt de la tête de la pull request est le dépôt lui-même avant d'exposer le jeton | [S26][S7] |

Enchaînement proposé par ce patron (décision du patron, à valider par le run) : projets Supabase
et clés ; migrations sur le projet de staging ; prévisualisation du Worker visant ce staging ;
accord humain sur l'environnement protégé ; migrations sur le projet de production ; déploiement
du Worker de production. Le guide Supabase applique les migrations au staging avant la
production [S22]. Les migrations avant le code supposent un schéma compatible avec l'ancienne
version du Worker pendant l'intervalle : c'est une exigence à écrire, pas un acquis.

Le code et le schéma suivent deux voies distinctes, et chaque objet n'en a qu'une. En migrant de
Pages vers Workers Builds, Cloudflare fait désactiver les déploiements automatiques de Pages
[S2] : deux voies actives sur un même objet se doubleraient.

## 6. Questions de conception à trancher

Chaque question a un défaut, qui s'applique en l'absence de réponse et se marque comme hypothèse
dans le référentiel.

| N° | Question | Réponses possibles | Défaut si pas de réponse | Se range en | Fait qui l'impose |
|---|---|---|---|---|---|
| Q1 | Le produit est-il neuf ou déjà sur Pages ? | neuf ; existant, à garder ou à migrer | neuf : Workers ; existant : migration décidée à part | exigence ou hors de portée | [S1][S2] |
| Q2 | Les serveurs de noms du domaine sont-ils chez Cloudflare ? | oui ; non | non : adresse `workers.dev` tant que la zone n'est pas migrée, ou Pages conservé | contrainte de `CONSTITUTION.md` | Workers n'accepte pas un domaine dont les serveurs de noms ne sont pas chez Cloudflare [S2] |
| Q3 | Où vit la logique serveur ? | aucun Worker, front et client Supabase seuls ; Worker sur les chemins d'API ; Worker devant toutes les requêtes (`run_worker_first`) | aucun Worker tant qu'une exigence n'en demande pas | exigence | [S3] |
| Q4 | Où vit la session d'authentification ? | stockage du navigateur ; cookies côté serveur avec `@supabase/ssr` | navigateur sans rendu serveur | exigence et hypothèse | Supabase stocke la session en cookies pour le rendu serveur ; le paquet `@supabase/ssr` était en bêta à la lecture [S24] |
| Q5 | Comment le code lit-il la base ? | client Supabase ; Hyperdrive | client Supabase ; Hyperdrive si SQL natif ou ORM | exigence | [S15][S16] |
| Q6 | Quelles clés d'API ? | publiable et secrète ; héritées `anon` et `service_role` | publiable et secrète ; héritées seulement sur un existant | exigence | `anon` et `service_role` sont dépréciées d'ici la fin 2026 [S20] |
| Q7 | Qui décide de l'accès aux données ? | RLS sur chaque table | RLS activée sur chaque table avant le déploiement ; clé secrète absente du navigateur | exigence, critère binaire | [S20] |
| Q8 | Combien d'environnements, et quel projet Supabase chaque prévisualisation vise-t-elle ? | production et staging ; branches Supabase | production et staging ; toute prévisualisation vise le staging | exigence et contrainte | le guide de Supabase demande un projet de staging distinct ; Cloudflare demande des ressources de test pour les prévisualisations [S22][S5] |
| Q9 | Quelle voie de prévisualisation ? | Previews ; Version URLs ; environnements Wrangler ; Pages | Previews | exigence | Cloudflare : « Previews are the recommended way to test changes before production » [S6] |
| Q10 | Qui voit les prévisualisations ? | publiques ; derrière Cloudflare Access | Access sur domaine personnalisé ; `workers.dev` porte un en-tête `noindex` | exigence | publiques par défaut [S4][S17] |
| Q11 | Quels motifs de redirection l'auth autorise-t-elle, sur quel projet ? | adresse exacte en production ; joker pour les prévisualisations | joker sur le seul projet de staging, adresse exacte en production | exigence, critère binaire | [S19] |
| Q12 | Qui déploie le front ? | Actions ; Workers Builds | Actions, si le même workflow porte aussi les migrations | contrainte | Cloudflare fait désactiver les déploiements automatiques de Pages quand Workers Builds prend le relais [S2] ; un Worker connecté à Builds doit porter le `name` du fichier wrangler [S8] |
| Q13 | Qui déploie le schéma ? | Actions et Supabase CLI ; intégration GitHub de Supabase | Actions et Supabase CLI | contrainte | [S22][S23] |
| Q14 | Où se pose l'accord humain sur la production ? | environnement GitHub protégé avec relecteurs requis | environnement `production` à relecteurs requis | exigence | [S25] |
| Q15 | Avec quelle identité le workflow déploie-t-il ? | jeton d'API à portée réduite en secret ; OIDC | jeton à portée réduite en secret d'environnement | exigence et hypothèse | GitHub documente OIDC pour les clouds qui le prennent en charge ; la page Cloudflare lue n'en parle pas [S27][S11] |
| Q16 | Où se fixent les valeurs publiques connues à la construction ? | variable de build ; variable d'exécution | variable d'exécution, sauf besoin de les figer dans le paquet | exigence | les variables de build ne sont pas lisibles à l'exécution [S10] |
| Q17 | Qui supprime les prévisualisations d'une pull request fermée ? | `wrangler preview delete` à la fermeture ; la suppression automatique à la limite | suppression à la fermeture | exigence | [S4][S7] |

## 7. Hypothèses non résolues

- Les motifs de redirection du paragraphe 3 sont déduits ; aucun n'a été rejoué sur un projet
  Supabase de test. À rejouer avant de les inscrire comme critère d'acceptation [S19][S4].
- Hyperdrive reçoit la chaîne de connexion directe, qui est en IPv6 sur l'offre gratuite de
  Supabase ; la page Hyperdrive lue ne dit rien de la version d'IP. Question ouverte [S16][S21].
- La disponibilité des relecteurs requis par offre GitHub et par type de dépôt n'a pas été lue.
  Elle décide de Q14 sur un dépôt privé [S25].
- Le statut de `@supabase/ssr` (bêta à la lecture) et la version minimale de Wrangler pour les
  Previews (4.135.0) changent vite : relire les deux pages avant de les figer [S24][S4].
- La page Cloudflare d'intégration de Supabase date d'avril 2026 et nomme la clé `anon` ; elle
  précède peut-être la bascule vers les clés publiables [S15][S20].
- Le branching de Supabase n'a été lu que dans sa page d'intégration GitHub ; son statut (bêta ou
  disponible) n'est pas établi ici [S23].
