# 🔄 Forcer le rechargement de l'app

## ⚠️ Les modifications ne sont pas prises en compte

Si tu vois toujours l'erreur `Edge Function returned a non-2xx status code`, c'est que l'app utilise encore l'**ancien code**.

## 🚀 Solutions pour recharger l'app

### Option 1 : Recharger dans Metro (Recommandé)

Dans le terminal Metro, appuie sur :
- **`r`** = Reload
- **`R`** = Full Reload (plus agressif)

### Option 2 : Kill + Relance

1. **Ferme complètement l'app** (swipe vers le haut)
2. **Relance depuis Xcode** ou l'icône

### Option 3 : Clear cache Metro

```bash
# Dans le terminal Metro
npx react-native start --reset-cache
```

Puis relance l'app.

## ✅ Vérification

Après le rechargement, si tu essayes de :
- **Publier une course** → devrait fonctionner (type = `'PUBLISH_RIDE'`)
- **Prendre une course** → devrait fonctionner (type = `'CLAIM_RIDE'`)
- **Terminer une course** → devrait fonctionner (type = `'COMPLETE_RIDE_BONUS'`)

## 🔍 Si l'erreur persiste

Teste manuellement l'Edge Function avec curl pour voir l'erreur exacte :

```bash
curl -X POST \
  'https://qeheawdjlwlkhnwbhqcg.supabase.co/functions/v1/add-credits' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "db5f396a-4c75-4792-a6ab-7f071d394bfd",
    "amount": 1,
    "reason": "PUBLISH_RIDE",
    "metadata": {
      "ride_id": "ride-test-123",
      "description": "Test publication"
    }
  }'
```

Si ça marche en curl mais pas dans l'app → c'est un problème de cache de l'app.

