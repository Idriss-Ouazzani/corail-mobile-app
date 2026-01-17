#!/bin/bash

# Script pour déployer la page de suppression de compte
# Usage: ./deploy-delete-account.sh

echo "🚀 Déploiement de la page de suppression de compte..."

# Clone le repo si pas déjà cloné
if [ ! -d "delete-account-page" ]; then
    echo "📥 Clonage du repo..."
    git clone https://github.com/Idriss-Ouazzani/delete-account-page.git
fi

cd delete-account-page

# Crée le dossier public s'il n'existe pas
mkdir -p public

# Copie le fichier HTML
echo "📄 Copie du fichier HTML..."
cp ../delete-account.html public/index.html

# Crée le fichier index.ts dans src
echo "⚙️  Création du fichier index.ts..."
cat > src/index.ts << 'EOF'
import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Servir les fichiers statiques depuis le dossier public
app.use(express.static('public'));

// Route pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Route catch-all pour servir index.html sur toutes les routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
EOF

# Vérifie que express est dans package.json
if ! grep -q '"express"' package.json; then
    echo "📦 Ajout d'express dans package.json..."
    # Ajoute express dans les dépendances
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!pkg.dependencies) pkg.dependencies = {};
    pkg.dependencies.express = '^4.18.2';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
fi

# Commit et push
echo "💾 Commit des changements..."
git add .
git commit -m "Add delete account page" || echo "Pas de changements à committer"
git push

echo "✅ Déploiement terminé ! Vercel devrait redéployer automatiquement."
echo "🌐 URL: https://delete-account-page-drab.vercel.app"

