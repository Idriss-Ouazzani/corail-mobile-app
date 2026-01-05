#!/bin/bash

echo "🧹 Nettoyage complet d'Expo..."

# 1. Tuer tous les processus Expo/Metro
pkill -f "expo" || true
pkill -f "metro" || true
echo "✅ Processus arrêtés"

# 2. Supprimer tous les caches
rm -rf .expo
rm -rf node_modules/.cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-map-*
echo "✅ Caches supprimés"

# 3. Attendre un peu
sleep 2

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "Maintenant, lancez :"
echo "npm start -- --clear"

