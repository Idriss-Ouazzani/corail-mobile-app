#!/bin/bash

echo "🔧 Fix des permissions macOS pour node_modules..."
echo ""

cd "$(dirname "$0")"

echo "1️⃣ Arrêt de tous les processus Node/Expo..."
pkill -f "node"
pkill -f "expo"
sleep 2

echo "2️⃣ Suppression de node_modules..."
rm -rf node_modules

echo "3️⃣ Nettoyage des caches..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf ~/.expo
npm cache clean --force

echo "4️⃣ Réinstallation des dépendances..."
npm install

echo ""
echo "✅ Terminé ! Vous pouvez maintenant lancer : npm start"

