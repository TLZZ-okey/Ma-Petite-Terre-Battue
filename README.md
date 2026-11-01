# Tennis Prono - Application de Pronostics de Tennis

Une application web inspirée de Mon Petit Prono, spécialement conçue pour les pronostics de tennis avec un thème Roland Garros.

## 🚀 Fonctionnalités

- **Matchs et Côtes** : Affichage des matchs à venir avec les côtes (odds) des joueurs
- **Pronostics** : Sélection du vainqueur et du nombre de sets
- **Système de Points** :
  - Côte du joueur si bon vainqueur
  - Double des points si bon vainqueur + bon nombre de sets
- **Classement** : Tableau des scores avec tous les joueurs de la ligue
- **Historique** : Conservation des pronostics passés
- **PWA** : Application progressive pour une expérience mobile optimisée
- **Thème Roland Garros** : Design avec les couleurs ocre, vert et blanc

## 🛠️ Stack Technique

- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de Données** : Firebase Firestore
- **Authentification** : Firebase Auth (email/mot de passe)
- **API Externe** : [Odds API](https://odds-api.io/) (gratuit, 100 requêtes/heure)
- **Déploiement** : Docker + Docker Compose

## 📦 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/ton-utilisateur/tennis-prono.git
cd tennis-prono
```

### 2. Configurer Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activer **Firestore** et **Authentication** (méthode email/mot de passe)
3. Récupérer les clés de configuration dans **Paramètres du projet > Vos applications > Ajouter une application web**
4. Créer un fichier `.env.local` à la racine du projet avec les variables d'environnement :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=ta_cle_api
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ton-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ton-projet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ton-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123
```

### 3. Configurer l'API Odds (Optionnel)

1. S'inscrire sur [Odds API](https://odds-api.io/) pour obtenir une clé API gratuite
2. Ajouter la clé dans le fichier `.env.local` :

```env
ODDS_API_KEY=ta_cle_api_odds
```

> **Note** : Si tu ne configures pas l'API, l'application utilisera des données de démonstration.

### 4. Installer les dépendances

```bash
npm install
```

### 5. Lancer l'application en développement

```bash
npm run dev
```

L'application sera accessible à l'adresse : [http://localhost:3000](http://localhost:3000)

## 🐳 Déploiement avec Docker

### 1. Construire l'image Docker

```bash
docker-compose build
```

### 2. Démarrer le conteneur

```bash
docker-compose up -d
```

L'application sera accessible à l'adresse : [http://localhost:3000](http://localhost:3000)

### 3. Arrêter le conteneur

```bash
docker-compose down
```

## 📂 Structure du Projet

```
tennis-prono/
├── app/                          # Pages et API Routes
│   ├── api/                      # Routes API
│   │   ├── auth/                 # Authentification
│   │   ├── matches/              # Matchs
│   │   ├── pronostics/           # Pronostics
│   │   └── users/                # Utilisateurs
│   ├── auth/                     # Pages d'authentification
│   ├── leaderboard/              # Classement
│   ├── matches/                  # Matchs
│   ├── pronostics/               # Mes pronostics
│   └── page.tsx                  # Page d'accueil
├── components/                   # Composants React
│   ├── Leaderboard.tsx           # Tableau des scores
│   ├── MatchCard.tsx             # Carte de match
│   ├── Navbar.tsx                # Barre de navigation
│   └── PronosticList.tsx         # Liste des pronostics
├── context/                      # Context React
│   └── AuthContext.tsx           # Contexte d'authentification
├── lib/                          # Bibliothèques
│   ├── firebase.ts               # Configuration Firebase
│   └── odds-api.ts               # Appels à l'API Odds
├── public/                       # Fichiers statiques
│   ├── icons/                    # Icônes PWA
│   └── manifest.json             # Manifest PWA
├── Dockerfile                    # Configuration Docker
├── docker-compose.yml            # Configuration Docker Compose
├── next.config.ts                # Configuration Next.js
├── tailwind.config.ts            # Configuration Tailwind CSS
└── package.json                  # Dépendances
```

## 🎨 Thème Roland Garros

L'application utilise les couleurs officielles de Roland Garros :

- **Ocre** (`#F5A623`) : Couleur principale, boutons, accents
- **Vert** (`#00A651`) : Couleur secondaire, boutons alternatifs
- **Blanc** (`#FFFFFF`) : Fond des cartes
- **Gris Clair** (`#F8F4E8`) : Fond de la page

## 📱 Fonctionnalités PWA

L'application est configurée comme une PWA (Progressive Web App) :

- Installation sur l'écran d'accueil (mobile/desktop)
- Mode hors ligne limité (cache des matchs)
- Icônes adaptées pour toutes les tailles d'écran

## 🔧 Configuration Avancée

### Rafraîchissement des Matchs

Par défaut, les matchs sont rafraîchis toutes les 5 minutes. Tu peux modifier cette fréquence dans `app/page.tsx` :

```typescript
// Rafraîchir toutes les X minutes
const interval = setInterval(() => {
  fetchMatches();
}, X * 60 * 1000);
```

### Ajouter des Matchs Manuellement

Tu peux ajouter des matchs manuellement via l'API :

```bash
curl -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -d '{
    "match": {
      "id": "match_1",
      "homeTeam": "Novak Djokovic",
      "awayTeam": "Carlos Alcaraz",
      "homeOdds": 1.80,
      "awayOdds": 2.10,
      "startTime": "2024-12-01T14:00:00Z",
      "tournament": "Roland Garros",
      "status": "upcoming"
    }
  }'
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvre une issue ou soumets une pull request pour toute amélioration.

## 📄 Licence

MIT
