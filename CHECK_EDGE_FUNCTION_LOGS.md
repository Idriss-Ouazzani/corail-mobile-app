# 🔍 Vérifier les logs de l'Edge Function `add-credits`

## 📋 Étapes pour diagnostiquer l'erreur

### 1. Vérifier les logs dans le Dashboard Supabase

1. Va sur https://supabase.com/dashboard/project/qeheawdjlwlkhnwbhqcg/functions
2. Clique sur **add-credits**
3. Ouvre l'onglet **Logs**
4. Cherche les erreurs récentes

### 2. Vérifier que les secrets sont configurés

L'Edge Function `add-credits` a besoin de ces variables :
- `SUPABASE_URL` (automatique)
- `SUPABASE_SERVICE_ROLE_KEY` (à configurer)

**Pour vérifier les secrets :**
```bash
npx supabase secrets list
```

**Si `SUPABASE_SERVICE_ROLE_KEY` est manquant, le configurer :**
```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="ta-cle-service-role-ici"
```

**Où trouver la SERVICE_ROLE_KEY :**
1. Va sur https://supabase.com/dashboard/project/qeheawdjlwlkhnwbhqcg/settings/api
2. Copie la clé **service_role (secret)**
3. Configure-la avec la commande ci-dessus

### 3. Tester manuellement l'Edge Function

```bash
curl -X POST \
  'https://qeheawdjlwlkhnwbhqcg.supabase.co/functions/v1/add-credits' \
  -H 'Authorization: Bearer TON_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "db5f396a-4c75-4792-a6ab-7f071d394bfd",
    "amount": -1,
    "reason": "CLAIM_RIDE",
    "metadata": {
      "ride_id": "ride-c787863c",
      "description": "Prise de course marketplace"
    }
  }'
```

### 4. Vérifier que la table credits_ledger existe

```sql
SELECT * FROM credits_ledger WHERE user_id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd' ORDER BY created_at DESC LIMIT 5;
```

## 🔧 Erreurs possibles

1. **404 User not found** → L'utilisateur n'existe pas dans `public.users`
2. **500 Failed to add credits** → Erreur d'insertion dans `credits_ledger` (contraintes, colonnes manquantes)
3. **500 Internal server error** → SERVICE_ROLE_KEY manquante ou invalide
4. **401 Unauthorized** → ANON_KEY invalide dans l'app

## ✅ Solution la plus probable

L'Edge Function fonctionne maintenant qu'elle est redéployée. Si l'erreur persiste, c'est que:
- La `SERVICE_ROLE_KEY` n'est pas configurée
- La table `credits_ledger` a un problème de structure

