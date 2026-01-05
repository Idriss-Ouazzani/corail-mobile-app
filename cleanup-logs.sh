#!/bin/bash

echo "🧹 Nettoyage des logs de debug..."

cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# Retirer les logs de debug de App.tsx
sed -i '' '/🔑 setUserId appelé avec:/d' App.tsx
sed -i '' '/🔑 currentUserId est maintenant:/d' App.tsx

# Retirer les logs de debug de supabaseApi.ts
sed -i '' '/🔍 createQuote - currentUserId:/d' src/services/supabaseApi.ts
sed -i '' '/🔍 createQuote - quoteData:/d' src/services/supabaseApi.ts
sed -i '' '/🔍 listQuotes - currentUserId:/d' src/services/supabaseApi.ts
sed -i '' '/🔍 listQuotes - filters:/d' src/services/supabaseApi.ts

# Retirer les logs de debug de MyQuotesScreen.tsx
sed -i '' '/🔍 Chargement des devis.../d' src/screens/MyQuotesScreen.tsx
sed -i '' '/📦 Réponse listQuotes:/d' src/screens/MyQuotesScreen.tsx
sed -i '' '/📊 Nombre de devis:/d' src/screens/MyQuotesScreen.tsx
sed -i '' '/📝 Devis:/d' src/screens/MyQuotesScreen.tsx

echo "✅ Logs de debug nettoyés"
echo ""
echo "Les logs importants (erreurs, succès) sont conservés."

