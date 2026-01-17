# ⚡ Démarrage Rapide - Edge Functions (5 minutes)

Guide ultra-rapide pour déployer les notifications push automatiques.

---

## 🚀 Étape 1 : Déployer (2 min)

```bash
# Se placer dans le projet
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# Exécuter le script de déploiement
./deploy-edge-functions.sh
```

**Lors de l'exécution :**
1. Entrez votre **Project ID** Supabase (trouvable dans Dashboard > Settings > General)
2. Authentifiez-vous si demandé (navigateur s'ouvre)
3. Attendez le déploiement ✅

---

## 🔑 Étape 2 : Configurer les secrets (1 min)

### Via Dashboard Supabase (recommandé)

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Cliquez sur **Edge Functions** (dans le menu)
3. Sélectionnez **send-push**
4. Onglet **Secrets**
5. Ajoutez 2 secrets :

| Nom | Valeur | Où trouver |
|-----|--------|------------|
| `SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` | Remplacez [PROJECT_ID] |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` | Dashboard > Settings > API > service_role |

⚠️ **Important** : Ne partagez JAMAIS votre `service_role` key !

---

## 🔧 Étape 3 : Activer les triggers SQL (2 min)

### 3.1 Configurer l'Anon Key

Dans **SQL Editor** de Supabase, exécutez :

```sql
ALTER DATABASE postgres 
SET app.settings.supabase_anon_key = 'YOUR_ANON_KEY_HERE';
```

💡 Trouvez votre Anon Key : Dashboard > Settings > API > anon public

### 3.2 Activer l'extension pg_net

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 3.3 Mettre à jour le Project ID

1. Ouvrez `database/ACTIVATE_NOTIFICATION_TRIGGERS.sql`
2. Ligne 52 : Remplacez `YOUR_PROJECT_ID` par votre vrai ID
3. Sauvegardez

### 3.4 Exécuter le script

Copiez **tout le contenu** de `database/ACTIVATE_NOTIFICATION_TRIGGERS.sql` dans le SQL Editor et exécutez.

✅ Vous devriez voir : "Success. No rows returned"

---

## 🧪 Étape 4 : Tester (30 sec)

### Test rapide via curl

```bash
# Récupérer un token test depuis votre base
# Dans SQL Editor :
SELECT push_token FROM push_tokens WHERE is_active = true LIMIT 1;

# Puis tester (remplacez les valeurs) :
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tokens": ["ExponentPushToken[xxx]"],
    "title": "Test 🎉",
    "body": "Ça marche !"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0
}
```

✅ **Si vous voyez cette réponse, c'est bon !**

---

## 🎯 Étape 5 : Test end-to-end (1 min)

1. Ouvrez l'app mobile sur 2 appareils (User A et User B)
2. User A publie une course sur le marketplace
3. User B prend la course
4. ✅ User A reçoit instantanément : "🎉 Course prise !"

**Si ça marche pas :**
- Vérifiez les logs : Dashboard > Edge Functions > send-push > Logs
- Vérifiez que pg_net est activé : `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
- Relisez les étapes ci-dessus

---

## 📋 Checklist de vérification

- [ ] Script `deploy-edge-functions.sh` exécuté sans erreur
- [ ] Secrets configurés dans Dashboard (SUPABASE_URL + SERVICE_ROLE_KEY)
- [ ] Anon Key configurée (`ALTER DATABASE`)
- [ ] Extension pg_net activée
- [ ] Project ID mis à jour dans `ACTIVATE_NOTIFICATION_TRIGGERS.sql`
- [ ] Script SQL exécuté sans erreur
- [ ] Test curl réussi ({"success": true})
- [ ] Test end-to-end réussi (notification reçue sur mobile)

---

## 🐛 Problèmes courants

### "Function not found"
```bash
supabase functions deploy send-push
```

### "Extension pg_net not found"
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Notifications ne partent pas
1. Vérifiez les logs : `supabase functions logs send-push`
2. Vérifiez les secrets dans Dashboard
3. Vérifiez que les triggers sont actifs :
```sql
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname LIKE '%notify%';
```

### "Authorization error"
- Vérifiez que vous utilisez bien l'**Anon Key** (pas la Service Role Key)
- Vérifiez le header : `Authorization: Bearer YOUR_ANON_KEY`

---

## 🎉 C'est tout !

Votre système de notifications est maintenant **100% automatique** !

**Ce qui se passe maintenant :**
- Quand une course est prise → notification automatique au créateur
- Quand une course est terminée → notification automatique
- Quand un utilisateur est invité → notification automatique
- **Même si l'app est fermée** → les notifications partent quand même !

---

## 📚 Pour aller plus loin

- **Documentation complète** : `EDGE_FUNCTION_DEPLOYMENT.md`
- **Architecture détaillée** : `EDGE_FUNCTIONS_README.md`
- **Tests avancés** : `supabase/functions/send-push/test.sh`
- **Monitoring** : `supabase functions logs send-push --follow`

---

**Besoin d'aide ?** Consultez `EDGE_FUNCTION_DEPLOYMENT.md` pour le guide détaillé.



