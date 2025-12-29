# 🚀 Déploiement Backend sur Render.com

## ✅ Prérequis
- Compte Render.com (gratuit) : https://render.com
- GitHub repository à jour
- Personal Access Token Databricks
- Firebase service account JSON

---

## 📝 Étape 1 : Créer le service sur Render

1. Va sur https://render.com et connecte-toi
2. Clique sur **"New +"** → **"Web Service"**
3. Connecte ton compte GitHub et sélectionne le repo `Corail-mobileapp`
4. Configuration :
   - **Name** : `corail-backend`
   - **Region** : `Frankfurt (EU Central)`
   - **Branch** : `main`
   - **Root Directory** : `backend`
   - **Environment** : `Python 3`
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan** : `Free`

5. Clique sur **"Create Web Service"**

---

## 🔐 Étape 2 : Configurer les variables d'environnement

Dans le dashboard Render, va dans l'onglet **"Environment"** et ajoute :

### Variables Databricks :
```
DATABRICKS_HOST=dbc-xxxx.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/xxxxx
DATABRICKS_TOKEN=dapi1234567890abcdef
```

### Variables Catalog :
```
CATALOG=io_catalog
SCHEMA=corail
```

### Variable Firebase :
```
FIREBASE_SECRET={"type":"service_account","project_id":"corail-vtc",...}
```
⚠️ **Important** : Colle TOUT le contenu du fichier `firebase-key.json` sur une seule ligne !

---

## 🧪 Étape 3 : Vérifier le déploiement

1. Attends que le build soit terminé (~2-3 minutes)
2. Tu verras l'URL de ton backend : `https://corail-backend.onrender.com`
3. Teste : `https://corail-backend.onrender.com/health`
   - Tu devrais voir : `{"status":"healthy"}`

---

## 📱 Étape 4 : Mettre à jour l'app mobile

Dans `Corail-mobileapp/src/services/api.ts`, remplace :
```typescript
const API_BASE_URL = 'https://corail-app-317256275188044.aws.databricksapps.com/api/v1';
```

Par :
```typescript
const API_BASE_URL = 'https://corail-backend.onrender.com/api/v1';
```

---

## 🎉 C'est tout !

Ton architecture :
```
App Mobile → Render.com (FastAPI) → Databricks (Data)
```

## 🔧 Troubleshooting

### Le build échoue :
- Vérifie que `requirements.txt` est dans `backend/`
- Vérifie que **Root Directory** = `backend`

### 500 Internal Server Error :
- Vérifie les variables d'environnement dans Render
- Regarde les logs : Dashboard → "Logs" tab

### App mobile : 401 Unauthorized :
- Vérifie que `FIREBASE_SECRET` est bien configuré dans Render
- Regarde les logs backend pour voir les erreurs Firebase

---

## 💰 Limites Plan Gratuit Render

- ✅ 750 heures/mois (= toujours actif)
- ✅ SSL automatique
- ⚠️ Le service "s'endort" après 15 min d'inactivité
  - Premier appel = 30-50 secondes de démarrage
  - Appels suivants = instantanés

Pour éviter le "sleep" : upgrade vers plan payant ($7/mois) ou utilise un service de ping.


