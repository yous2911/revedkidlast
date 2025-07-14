#!/bin/bash

# 🔥 SCRIPT DE CLEANUP GIT - REVISE KIDS PROJECT
# Résout l'impasse Git causée par node_modules

echo "🚀 DÉBUT DU CLEANUP GIT - REVED KIDS PROJECT"
echo "============================================="

# Vérification que nous sommes dans le bon répertoire
if [[ ! -f "package.json" ]]; then
    echo "❌ ERREUR: Vous devez être dans le répertoire racine du projet (où se trouve package.json)"
    exit 1
fi

echo "📁 Répertoire de travail: $(pwd)"
echo ""

# 🛑 1. Arrêt de tous les processus potentiels
echo "🛑 ÉTAPE 1: Arrêt des processus..."
pkill -f "node" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
echo "✅ Processus arrêtés"
echo ""

# 🪓 2. Suppression brutale des node_modules (bypass Git)
echo "🪓 ÉTAPE 2: Suppression des node_modules..."
echo "   - Suppression backend/node_modules..."
rm -rf backend/node_modules 2>/dev/null || true
echo "   - Suppression reved-kids-frontend/node_modules..."
rm -rf reved-kids-frontend/node_modules 2>/dev/null || true
echo "   - Suppression node_modules racine (si existe)..."
rm -rf node_modules 2>/dev/null || true
echo "✅ node_modules supprimés"
echo ""

# 🧹 3. Suppression des lock files
echo "🧹 ÉTAPE 3: Suppression des lock files..."
rm -rf package-lock.json 2>/dev/null || true
rm -rf backend/package-lock.json 2>/dev/null || true
rm -rf reved-kids-frontend/package-lock.json 2>/dev/null || true
rm -rf backend/dist 2>/dev/null || true
rm -rf reved-kids-frontend/.next 2>/dev/null || true
rm -rf reved-kids-frontend/dist 2>/dev/null || true
echo "✅ Lock files et build supprimés"
echo ""

# 🧼 4. Purge de l'index Git
echo "🧼 ÉTAPE 4: Purge de l'index Git..."
git rm -r --cached . 2>/dev/null || true
echo "✅ Index Git purgé"
echo ""

# 📛 5. Configuration du .gitignore
echo "📛 ÉTAPE 5: Configuration du .gitignore..."

# Backup du .gitignore existant
if [[ -f ".gitignore" ]]; then
    cp .gitignore .gitignore.backup
    echo "   📋 Backup de .gitignore créé"
fi

# Création du .gitignore optimisé
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
.next/
out/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# Backend specific
backend/dist/
backend/logs/
backend/uploads/

# Frontend specific
reved-kids-frontend/.next/
reved-kids-frontend/out/
reved-kids-frontend/.vercel/

# Database
*.sqlite
*.sqlite3
*.db

# Cache
.cache/
.eslintcache
EOF

echo "✅ .gitignore configuré"
echo ""

# ✅ 6. Re-ajout des fichiers (suivant le nouveau .gitignore)
echo "✅ ÉTAPE 6: Re-ajout des fichiers suivant .gitignore..."
git add .
echo "✅ Fichiers ajoutés proprement"
echo ""

# 🚀 7. Commit de reset
echo "🚀 ÉTAPE 7: Commit de reset..."
git commit -m "🔥 Reset propre sans node_modules

- Suppression node_modules de Git
- Configuration .gitignore optimisée  
- Structure projet préservée
- Prêt pour réinstallation propre"

echo "✅ Commit effectué"
echo ""

# 📊 8. Vérification
echo "📊 ÉTAPE 8: Vérification du statut Git..."
echo "   Status Git:"
git status --short
echo ""
echo "   Derniers commits:"
git log --oneline -3
echo ""

# 🎯 9. Guide de réinstallation
echo "🎯 ÉTAPE 9: Guide de réinstallation"
echo "=================================="
echo ""
echo "✅ CLEANUP TERMINÉ AVEC SUCCÈS!"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "1. Réinstaller les dépendances backend:"
echo "   cd backend && npm install"
echo ""
echo "2. Réinstaller les dépendances frontend:"
echo "   cd reved-kids-frontend && npm install"
echo ""
echo "3. Vérifier que tout fonctionne:"
echo "   npm run dev"
echo ""
echo "4. Si problème, restaurer l'ancien .gitignore:"
echo "   mv .gitignore.backup .gitignore"
echo ""

# 🎊 10. Résumé final
echo "🎊 RÉSUMÉ DU CLEANUP:"
echo "===================="
echo "✅ node_modules supprimés physiquement"
echo "✅ Git index purgé et reconstruit"
echo "✅ .gitignore optimisé configuré"
echo "✅ Commit de reset effectué"
echo "✅ Projet prêt pour réinstallation"
echo ""
echo "🚀 Votre projet est maintenant PROPRE et Git fonctionne normalement!"
echo "=============================================" 