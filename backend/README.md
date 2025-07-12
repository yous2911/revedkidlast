# RevEd Kids Backend

Backend pour l'application éducative RevEd Kids, développé avec Node.js, Express, TypeScript et PostgreSQL.

## 🚀 Fonctionnalités

- **Authentification sécurisée** pour les élèves et parents
- **Gestion des exercices pédagogiques** avec recommandations intelligentes
- **Suivi de progression** détaillé pour chaque élève
- **Analytics et statistiques** de performance
- **API RESTful** complète et documentée
- **Sécurité renforcée** avec validation, rate limiting et sanitization
- **Base de données optimisée** avec Sequelize ORM
- **Cache Redis intelligent** avec fallback mémoire
- **Monitoring de performance** en temps réel
- **Optimisations pour 200+ élèves simultanés**

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 13.0
- Redis (optionnel, pour le cache)

## 🛠️ Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd revedkidslast/backend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'environnement**
   ```bash
   cp env.example .env
   # Éditer le fichier .env avec vos configurations
   ```

4. **Configurer la base de données**
   ```bash
   # Créer la base de données PostgreSQL
   createdb reved_kids
   
   # Ou utiliser psql
   psql -U postgres
   CREATE DATABASE reved_kids;
   ```

5. **Compiler TypeScript**
   ```bash
   npm run build
   ```

## 🚀 Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm run build
npm start
```

Le serveur sera accessible sur `http://localhost:3000`

## 📊 Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion élève
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/verify/:eleveId` - Vérification élève
- `GET /api/auth/health` - Health check auth

### Élèves
- `GET /api/eleves/:id` - Informations élève
- `GET /api/eleves/:id/exercices-recommandes` - Exercices recommandés
- `POST /api/eleves/:id/exercices/tentative` - Soumettre tentative
- `GET /api/eleves/:id/progression` - Progression élève
- `GET /api/eleves/:id/sessions` - Sessions et analytics

### Monitoring & Performance
- `GET /api/monitoring/health` - Statut général du système
- `GET /api/monitoring/metrics` - Métriques de performance complètes
- `GET /api/monitoring/system` - Métriques système (CPU, mémoire)
- `GET /api/monitoring/cache` - Statistiques du cache
- `GET /api/monitoring/alerts` - Alertes de performance
- `DELETE /api/monitoring/cache` - Vider le cache

### Système
- `GET /` - Informations API
- `GET /api/health` - Health check global

## 🗄️ Structure de la base de données

### Tables principales
- `eleves` - Informations des élèves
- `exercices_pedagogiques` - Exercices disponibles
- `modules_pedagogiques` - Modules d'apprentissage
- `progressions_eleves` - Progression par élève
- `sessions_eleves` - Sessions d'apprentissage
- `revisions_programmees` - Révisions espacées

## 🔧 Configuration

### Variables d'environnement importantes

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=reved_kids

# Sécurité
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Application
NODE_ENV=development
PORT=3000
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

## 📝 Scripts disponibles

- `npm run dev` - Démarrage en mode développement
- `npm run build` - Compilation TypeScript
- `npm start` - Démarrage en production
- `npm test` - Lancement des tests
- `npm run test:performance` - Tests de performance
- `npm run lint` - Vérification du code
- `npm run lint:fix` - Correction automatique du code
- `npm run db:migrate` - Migration de la base de données
- `npm run db:seed` - Peuplement de la base de données
- `npm run db:indexes` - Application des index de performance
- `npm run monitor` - Vérifier la santé du système
- `npm run cache:stats` - Statistiques du cache
- `npm run cache:clear` - Vider le cache

## 🔒 Sécurité

- **Rate limiting** sur toutes les routes
- **Validation** stricte des entrées
- **Sanitization** des données
- **Headers de sécurité** (Helmet)
- **CORS** configuré
- **Gestion d'erreurs** centralisée

## 📈 Monitoring & Performance

- **Health checks** automatiques
- **Logging** structuré
- **Métriques** de performance en temps réel
- **Gestion d'erreurs** robuste
- **Cache Redis** avec statistiques
- **Alertes automatiques** de performance
- **Tests de charge** automatisés
- **Optimisations** pour 200+ élèves simultanés

> 📖 Voir [PERFORMANCE.md](./PERFORMANCE.md) pour les détails des optimisations

## 🚀 Déploiement

### Docker (recommandé)
```bash
docker build -t reved-kids-backend .
docker run -p 3000:3000 reved-kids-backend
```

### Manuel
```bash
npm run build
NODE_ENV=production npm start
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

## 🔄 Changelog

### Version 1.0.0
- ✅ API complète pour la gestion des élèves
- ✅ Système d'authentification sécurisé
- ✅ Gestion des exercices et recommandations
- ✅ Suivi de progression et analytics
- ✅ Base de données optimisée
- ✅ Sécurité renforcée 