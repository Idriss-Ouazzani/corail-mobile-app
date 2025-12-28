# 🚀 Déploiement sur Databricks Apps

Guide pour déployer le backend Corail sur Databricks Apps depuis Git.

---

## 📋 Prérequis

1. ✅ Tables créées dans Databricks (`io_catalog.corail`)
2. ✅ SQL Warehouse actif
3. ✅ Personal Access Token créé
4. ✅ Secret Firebase créé dans Databricks

---

## 🔐 Configuration du Secret Firebase

### Secret déjà créé :
```
Scope: corail-firebase-app
Secret: secret-firebase
```

Le secret contient le JSON complet du fichier `firebase-key.json`.

---

## 🚀 Déploiement

### 1. Aller dans Apps

- Menu **Apps** → **Create App**

### 2. Configuration de base

```
Name: corail-backend
Description: Backend API pour Corail VTC avec Firebase Auth
```

### 3. Source Code

```
Source: Git repository
Repository URL: https://github.com/idrissouazzani-databricks/Corail-mobileapp.git
Branch: main
Path: backend/
```

### 4. Environment Variables

**Variables à configurer :**

```bash
# Databricks Connection
DATABRICKS_HOST=adb-1444828305810485.5.azuredatabricks.net
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/YOUR_WAREHOUSE_ID
DATABRICKS_TOKEN=YOUR_PERSONAL_ACCESS_TOKEN

# Catalog & Schema
CATALOG=io_catalog
SCHEMA=corail

# Firebase Secret (référence au secret Databricks)
FIREBASE_SECRET={{secrets/corail-firebase-app/secret-firebase}}
```

**⚠️ Important :** La syntaxe `{{secrets/scope/secret-name}}` permet de référencer un secret Databricks.

### 5. Command

```bash
pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 6. Deploy

- Clique **"Create App"**
- Attends 2-3 minutes ⏳

### 7. Vérifier le déploiement

Une fois déployé, teste les endpoints :

```bash
# Health check
curl https://corail-backend-xxxxx.databricksapps.com/

# Debug config (vérifier que Firebase est initialisé)
curl https://corail-backend-xxxxx.databricksapps.com/api/v1/debug/config
```

**Résultat attendu :**
```json
{
  "service": "Corail VTC API",
  "status": "running",
  "version": "1.0.0"
}
```

### 8. Récupérer l'URL

Copie l'URL de l'app (ex: `https://corail-backend-xxxxx.databricksapps.com`)

---

## 📱 Mettre à jour l'app mobile

Modifie `src/services/api.ts` :

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api/v1'
  : 'https://corail-backend-xxxxx.databricksapps.com/api/v1';  // ← TON URL ICI
```

Rebuild l'app :
```bash
npx expo start --clear
```

---

## 🧪 Tester l'API

### 1. Se connecter sur l'app mobile

```
Email: test@corail.com
Password: test123456
```

### 2. Créer une course

L'app va automatiquement envoyer une requête à ton backend avec le token Firebase.

### 3. Vérifier dans Databricks

```sql
USE CATALOG io_catalog;
USE SCHEMA corail;

-- Voir les nouvelles courses
SELECT * FROM rides ORDER BY created_at DESC LIMIT 10;
```

---

## 🐛 Troubleshooting

### "Firebase not initialized"

**Cause :** Le secret n'est pas correctement référencé.

**Solution :**
1. Vérifier que le secret existe : `databricks secrets list --scope corail-firebase-app`
2. Vérifier la syntaxe : `{{secrets/corail-firebase-app/secret-firebase}}`
3. Vérifier les logs de l'app

### "Cannot connect to Databricks"

**Cause :** Variables d'environnement incorrectes.

**Solution :**
1. Vérifier `DATABRICKS_HOST` (sans `https://`)
2. Vérifier `DATABRICKS_HTTP_PATH`
3. Vérifier que le token a les permissions SQL

### "401 Unauthorized"

**Cause :** Token Firebase invalide ou expiré.

**Solution :**
1. Se déconnecter/reconnecter dans l'app
2. Vérifier que Firebase Auth est activé dans Firebase Console

---

## 📊 Monitoring

### Logs de l'application

Dans Databricks Apps :
- **Apps** → **corail-backend** → **Logs**

### Métriques

- Requêtes par seconde
- Temps de réponse
- Erreurs

---

## 🔄 Mettre à jour l'app

1. Commit tes changements sur Git
2. Push vers `main`
3. Dans Databricks Apps → **corail-backend** → **Redeploy**

---

## 🎉 C'est prêt !

Ton backend est maintenant en production ! 🚀

**URL de l'API :** `https://corail-backend-xxxxx.databricksapps.com`

**Endpoints disponibles :**
- `GET /` - Health check
- `GET /api/v1/rides` - Liste des courses
- `POST /api/v1/rides` - Créer une course
- `POST /api/v1/rides/{id}/claim` - Prendre une course
- `GET /api/v1/my-rides` - Mes courses

**Documentation interactive :** `https://corail-backend-xxxxx.databricksapps.com/docs`

