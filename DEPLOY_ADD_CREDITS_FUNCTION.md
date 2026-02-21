# 🚀 Redéployer l'Edge Function `add-credits`

## 🎯 Problème

L'erreur `"Auth session missing!"` signifie que l'Edge Function déployée sur Supabase **n'est pas à jour** avec le code local.

---

## ✅ Solution : Redéployer la fonction

### Étape 1 : Vérifier que Supabase CLI est installé

```bash
supabase --version
```

**Si pas installé :**
```bash
# macOS
brew install supabase/tap/supabase

# npm (alternative)
npm install -g supabase
```

---

### Étape 2 : Se connecter à Supabase

```bash
supabase login
```

Cela va ouvrir un navigateur pour t'authentifier.

---

### Étape 3 : Lier le projet

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
supabase link --project-ref qeheawdjlwlkhnwbhqcg
```

**Remplace `qeheawdjlwlkhnwbhqcg` par ton Project ID** (visible dans Supabase Dashboard → Settings → General)

---

### Étape 4 : Déployer la fonction

```bash
supabase functions deploy add-credits
```

**Résultat attendu :**
```
Deploying function add-credits...
✅ Deployed function add-credits
Function URL: https://qeheawdjlwlkhnwbhqcg.supabase.co/functions/v1/add-credits
```

---

### Étape 5 : Vérifier que c'est déployé

```bash
supabase functions list
```

Tu devrais voir `add-credits` avec un statut récent.

---

### Étape 6 : Tester l'app

1. **Redémarre l'app** : `npx expo start --clear`
2. **Crée une course marketplace**
3. **Résultat attendu** : Pas d'erreur "Auth session missing!" ✅

---

## 🔍 Debug : Logs de l'Edge Function

Pour voir les logs en temps réel :

```bash
supabase functions serve add-credits
```

Ou voir les logs de production :

```bash
supabase functions logs add-credits
```

---

## 🆘 Si ça ne marche toujours pas

### Vérification 1 : Service Role Key est configurée

Va sur Supabase Dashboard → Settings → API

Vérifie que tu as bien une **Service Role Key** (secret, ne jamais exposer).

---

### Vérification 2 : Variables d'environnement

L'Edge Function a besoin de :
- `SUPABASE_URL` (fourni automatiquement)
- `SUPABASE_SERVICE_ROLE_KEY` (fourni automatiquement)

Ces variables sont configurées automatiquement par Supabase.

---

### Vérification 3 : Tester manuellement l'Edge Function

```bash
# Récupère ton user token
# (tu peux le récupérer depuis les logs Metro ou AuthContext)

curl -X POST \
  https://qeheawdjlwlkhnwbhqcg.supabase.co/functions/v1/add-credits \
  -H "Authorization: Bearer ANON_KEY" \
  -H "x-user-token: USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "amount": 1,
    "reason": "PUBLISH_RIDE",
    "metadata": {}
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "transaction": {...},
  "newBalance": 10
}
```

---

## 📁 Fichiers de l'Edge Function

```
supabase/
└── functions/
    ├── _shared/
    │   └── cors.ts
    └── add-credits/
        └── index.ts
```

---

## 🎯 Résumé

| Commande | Action |
|----------|--------|
| `supabase login` | Se connecter à Supabase |
| `supabase link --project-ref XXX` | Lier le projet |
| `supabase functions deploy add-credits` | Déployer la fonction |
| `supabase functions logs add-credits` | Voir les logs |

---

**🚀 Exécute ces commandes maintenant pour déployer la fonction à jour !**

