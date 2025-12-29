# 🔍 DEBUG - Panel Admin Invisible

## Problème
Le panel admin ne s'affiche pas dans l'onglet Profil malgré `is_admin = TRUE` dans Databricks.

## Étapes de debug

### 1️⃣ Vérifier dans Databricks (IMPORTANT !)

Exécutez cette requête dans Databricks SQL Editor :

```sql
-- Vérifier votre utilisateur avec votre Firebase UID
SELECT 
  id,
  email,
  full_name,
  is_admin,
  verification_status,
  created_at
FROM io_catalog.corail.users
WHERE email = 'mydrissouazzani@gmail.com';
```

**Résultat attendu** :
- `is_admin` doit être **`true`** (pas `NULL`, pas `false`)
- `id` doit être votre **Firebase UID** (ex: `NgnzMvZvqkhTw636aYvcoD3EtSD2`)

**Si `is_admin` est `NULL` ou `false`**, exécutez :

```sql
UPDATE io_catalog.corail.users
SET is_admin = TRUE
WHERE email = 'mydrissouazzani@gmail.com';

-- Vérifier
SELECT id, email, full_name, is_admin 
FROM io_catalog.corail.users
WHERE email = 'mydrissouazzani@gmail.com';
```

### 2️⃣ Tester l'API directement

Dans votre navigateur ou avec `curl`, testez l'endpoint :

```bash
# Remplacez YOUR_FIREBASE_UID par votre UID Firebase
curl https://corail-backend.onrender.com/api/v1/verification/status \
  -H "X-User-ID: YOUR_FIREBASE_UID"
```

**Réponse attendue** :
```json
{
  "id": "YOUR_FIREBASE_UID",
  "email": "mydrissouazzani@gmail.com",
  "full_name": "Idriss Ouazzani",
  "is_admin": true,
  "verification_status": "VERIFIED"
}
```

**⚠️ Si `is_admin: false` ou absent** : Le problème vient de Databricks ou du backend.

### 3️⃣ Vérifier les logs dans l'app mobile

1. **Déconnectez-vous** de l'app
2. **Reconnectez-vous** avec `mydrissouazzani@gmail.com`
3. **Ouvrez la console Expo** et cherchez ces logs :

```
🔄 Chargement statut de vérification...
📦 Réponse complète: { ... }
🔍 response.is_admin RAW: true
🔍 Type de response.is_admin: boolean
👨‍💼 isAdmin state FINAL: true
```

4. **Allez dans l'onglet Profil** et cherchez :

```
🎨 renderProfile() - isAdmin: true
🎨 renderProfile() - Type: boolean
```

### 4️⃣ Utiliser le bouton de DEBUG dans le Profil

Dans l'onglet **Profil**, vous devriez voir une **box rouge "DEBUG INFO"** qui affiche :
- `isAdmin state: true` (ou false)
- `Type: boolean`
- `Email: mydrissouazzani@gmail.com`

**Cliquez sur "🔄 Recharger statut"** et vérifiez les logs.

## Problèmes courants

### ❌ `is_admin` est `NULL` dans Databricks
**Solution** : La colonne n'a pas été ajoutée ou mise à jour. Exécutez `backend/add_admin_role.sql`.

### ❌ Plusieurs utilisateurs avec le même email
**Solution** : 
```sql
-- Supprimer les doublons (sauf celui avec Firebase UID)
DELETE FROM io_catalog.corail.users
WHERE email = 'mydrissouazzani@gmail.com'
AND id != 'VOTRE_FIREBASE_UID';
```

### ❌ L'API renvoie `is_admin: false` alors que Databricks dit `true`
**Solution** : 
- Vérifiez que vous utilisez le bon `id` (Firebase UID, pas email)
- Redéployez le backend sur Render si vous avez modifié le code

### ❌ `isAdmin` est `false` dans l'app malgré API correcte
**Solution** : 
- Déconnectez-vous complètement
- Tuez l'app (fermez complètement)
- Relancez et reconnectez-vous

## Après le debug

Une fois que le Panel Admin apparaît, **supprimez la box DEBUG** du code :
- Fichier : `App.tsx`
- Recherchez : `🚨 DEBUG INFO - À SUPPRIMER APRÈS TEST`
- Supprimez tout le bloc `<View style={[styles.section, { backgroundColor: 'rgba(239, 68, 68, 0.1)'...`

---

## Contact

Si rien ne fonctionne après ces étapes, envoyez-moi :
1. Screenshot de la requête Databricks (`SELECT ... WHERE email = 'mydrissouazzani@gmail.com'`)
2. Logs de la console Expo (section `🔄 Chargement statut de vérification...`)
3. Screenshot du DEBUG INFO dans le Profil

