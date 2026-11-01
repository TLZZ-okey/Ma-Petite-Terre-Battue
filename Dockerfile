# Dockerfile pour l'application Tennis Prono
# Basé sur Node.js 20 (LTS)

# Étape 1: Construction
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier tous les fichiers de l'application
COPY . .

# Construire l'application
RUN npm run build

# Étape 2: Production
FROM node:20-alpine AS runner

# Définir le répertoire de travail
WORKDIR /app

# Copier les dépendances de production
COPY --from=builder /app/package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --only=production

# Copier les fichiers de construction depuis le builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Variables d'environnement
ENV NODE_ENV production
ENV PORT 3000

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
