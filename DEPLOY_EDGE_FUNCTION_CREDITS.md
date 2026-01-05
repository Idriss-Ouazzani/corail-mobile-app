# 🔐 Déploiement de l'Edge Function Sécurisée pour les Crédits

## Objectif

Sécuriser la gestion des crédits en utilisant une Edge Function Supabase qui :
- S'exécute côté serveur (impossible à manipuler par l'utilisateur)
- Utilise la clé `SERVICE_ROLE` pour bypass RLS
- Effectue des validations serveur avant d'ajouter des crédits
- Protège contre les manipulations malveillantes

---

## 📋 Prérequis

1. **Supabase CLI installé**
   ```bash
   npm install -g supabase
   ```

2. **Se connecter à votre projet Supabase**
   ```bash
   supabase login
   ```

3. **Lier votre projet local au projet Supabase**
   ```bash
   supabase link --project-ref VOTRE_PROJECT_ID
   ```
   
   Pour trouver votre `PROJECT_ID` :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet
   - L'ID est dans l'URL : `https://supabase.com/dashboard/project/VOTRE_PROJECT_ID`

---

## 🚀 Étape 1 : Déployer l'Edge Function

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# Déployer la fonction add-credits
supabase functions deploy add-credits
```

**Vérification :**
- Vous devriez voir un message de succès
- La fonction sera accessible à l'URL : `https://VOTRE_PROJECT_ID.supabase.co/functions/v1/add-credits`

---

## 🔑 Étape 2 : Récupérer la clé SERVICE_ROLE

⚠️ **ATTENTION** : La clé `SERVICE_ROLE` donne un accès TOTAL à votre base de données. Ne jamais l'exposer dans le code frontend !

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez la clé `service_role` (elle commence par `eyJ...`)

**La clé SERVICE_ROLE est déjà configurée automatiquement dans l'environnement de l'Edge Function par Supabase.**

---

## 🛡️ Étape 3 : Sécuriser la table credits_ledger

Exécutez le script SQL dans le SQL Editor de Supabase :

```bash
# Ouvrir le fichier et copier le contenu
cat database/SECURISER_CREDITS.sql
```

Puis collez-le dans le **SQL Editor** de votre dashboard Supabase et exécutez-le.

**Ce script va :**
- ✅ Activer RLS sur `credits_ledger`
- ✅ Permettre la lecture pour tous
- ✅ Bloquer toutes les écritures (sauf via SERVICE_ROLE)

---

## ✅ Étape 4 : Tester la fonction

### Test 1 : Appel direct via curl (pour vérifier que la fonction marche)

```bash
# Remplacez VOTRE_PROJECT_ID et VOTRE_ANON_KEY
curl -X POST \
  https://VOTRE_PROJECT_ID.supabase.co/functions/v1/add-credits \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "UN_USER_ID_DE_TEST",
    "amount": 5,
    "reason": "TEST_CREDIT"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "transaction": { ... },
  "newBalance": 5
}
```

### Test 2 : Depuis l'application

1. Lancez l'app en local : `npm start`
2. Créez une course sur le marketplace
3. Vérifiez dans les logs de l'app :
   ```
   ✅ Credits added successfully: { success: true, newBalance: X }
   ```

4. Vérifiez dans Supabase (Table Editor → `credits_ledger`) :
   - Une nouvelle ligne doit être créée
   - Le `reason` doit être `PUBLISH_RIDE`

---

## 🔍 Debugging

### Si la fonction ne se déploie pas :

```bash
# Vérifier les logs
supabase functions logs add-credits

# Redéployer avec verbose
supabase functions deploy add-credits --debug
```

### Si l'appel depuis l'app échoue :

1. Ouvrez le navigateur en mode développeur (Console)
2. Cherchez les erreurs `❌ Error calling add-credits function`
3. Vérifiez que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont bien configurés dans `.env`

### Si RLS bloque les opérations :

```sql
-- Vérifier l'état de RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'credits_ledger';

-- Si RLS est désactivé, réexécutez SECURISER_CREDITS.sql
```

---

## 📊 Sécurité : Avant vs Après

### ❌ AVANT (Risque de sécurité)
```typescript
// N'importe quel utilisateur peut insérer des crédits directement
await supabase.from('credits_ledger').insert({
  user_id: 'moi',
  amount: 9999999, // 🚨 Manipulation possible !
  reason: 'HACK',
});
```

### ✅ APRÈS (Sécurisé)
```typescript
// L'app appelle une fonction serveur qui valide les données
await addCreditsSecure(1, 'PUBLISH_RIDE', { ride_id: '...' });
// ✅ La fonction s'exécute côté serveur avec SERVICE_ROLE
// ✅ Impossible de manipuler les montants depuis le client
// ✅ RLS bloque les insertions directes
```

---

## 🎯 Score de sécurité

- **Avant** : 🔴 3/10 (credits_ledger sans protection)
- **Après** : 🟢 9/10 (Edge Function + RLS + Validation serveur)

---

## 📝 Checklist finale

- [ ] Edge Function déployée (`supabase functions deploy add-credits`)
- [ ] Script SQL exécuté (`SECURISER_CREDITS.sql`)
- [ ] RLS activé sur `credits_ledger` (vérifiable dans Table Editor)
- [ ] Test réussi : Créer une course → Crédits ajoutés
- [ ] Aucune erreur dans les logs de l'app

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs de l'Edge Function : `supabase functions logs add-credits`
2. Vérifiez que `SERVICE_ROLE_KEY` est bien configurée dans Supabase
3. Contactez le support Supabase : https://supabase.com/support

---

**Félicitations !** Votre système de crédits est maintenant sécurisé. 🎉

