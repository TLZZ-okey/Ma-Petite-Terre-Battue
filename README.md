# 🎾 Ma Petite Terre Battue

Application web (PWA) de pronostics tennis entre amis, inspirée de *Mon Petit Prono*, aux couleurs de Roland-Garros
(vert profond, terre battue, blanc des lignes, jaune de la balle).

## Règles du jeu

| Pronostic | Points |
| --- | --- |
| Mauvais vainqueur | 0 |
| Bon vainqueur | la **cote** du vainqueur (cote 1,85 → 1,85 pt) |
| Bon vainqueur **et** nombre de sets exact | **2 × la cote** du vainqueur (1,85 → 3,70 pts) |

- Le pronostic du vainqueur est obligatoire, celui du nombre de sets est optionnel (2 ou 3 sets, ou 3/4/5 en Grand Chelem masculin).
- On peut modifier ou retirer son prono jusqu'au début du match ; ensuite il est verrouillé.
- Classement : points, puis nombre de sets exacts, puis nombre de bons vainqueurs.

## Version 1 (actuelle) : 100 % locale

- **Pas d'API externe** : un générateur déterministe (`lib/mock/generator.ts`) produit un programme de matchs fictif
  (tournois ATP/WTA, joueurs, cotes, horaires) pour chaque jour. Les résultats sont simulés une fois l'heure du match passée,
  pondérés par les cotes.
- **Pas d'e-mail** : comptes locaux pseudo + mot de passe (haché SHA-256 salé). Comptes et pronos sont stockés dans le
  `localStorage` du navigateur — tous les joueurs d'un même appareil partagent le classement.
- **Outils de démo** (page Profil) : avancer l'horloge de l'app, terminer les matchs en cours ou simuler tous les résultats
  du jour pour voir les points tomber.
- **PWA** : manifeste, icônes, service worker (installable sur l'écran d'accueil, pages consultables hors ligne).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4 (thème défini dans `app/globals.css`)
- Vitest pour les tests unitaires
- Aucune dépendance runtime en dehors de Next/React

## Lancer le projet

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # tests unitaires (règles de points, générateur, comptes, classement)
npm run typecheck
npm run build && npm start   # version de production (le service worker n'est actif qu'en production)
```

Avec Docker : `docker compose up --build`.

> Pour installer la PWA sur un téléphone, il faut servir l'app en HTTPS (ou via `localhost`) : par exemple
> `npx next dev --experimental-https`, ou un tunnel HTTPS.

## Architecture

```
app/
  connexion/            connexion / création de compte local
  (app)/matchs/         programme du jour, cotes, saisie des pronos
  (app)/pronos/         mes pronos (à venir, terminés) + statistiques
  (app)/classement/     podium et classement
  (app)/profil/         profil, règles, outils de démo, déconnexion
  manifest.ts           manifeste PWA
components/             UI (MatchCard, AppShell, DayPicker…) et AppProvider (session, horloge, données)
lib/
  types.ts              modèle de données
  scoring.ts            calcul des points
  game.ts               validation des pronos, statistiques, classement
  auth.ts               comptes locaux
  providers/            source des matchs et des cotes   ← à remplacer par l'API
  repository/           stockage utilisateurs + pronos   ← à remplacer par la base de données
  mock/, data/          générateur de matchs fictifs, joueurs, tournois
public/sw.js            service worker
tests/                  tests Vitest
```

## Prochaines étapes prévues

1. **API de cotes** : implémenter un nouveau `MatchProvider` (`lib/providers/types.ts`) qui interroge une API de
   cotes/résultats côté serveur (route handler Next.js, clé API dans `.env.local`) — l'interface ne change pas.
2. **Base de données** : implémenter `Repository` (`lib/repository/types.ts`) au-dessus d'une base (par ex. PostgreSQL
   ou SQLite via Prisma/Drizzle) exposée par des route handlers, avec une authentification serveur (sessions/cookies).
3. Ligues privées entre amis, notifications push avant les matchs.

## Aperçu

| Connexion | Matchs | Mes pronos | Classement |
| --- | --- | --- | --- |
| ![](docs/screenshots/connexion.png) | ![](docs/screenshots/matchs.png) | ![](docs/screenshots/pronos.png) | ![](docs/screenshots/classement.png) |
