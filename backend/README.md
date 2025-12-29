# 🔥 Corail Backend - FastAPI + Firebase + Databricks

Backend API pour l'application mobile Corail VTC.

## 🏗️ Architecture

```
Mobile App (React Native + Firebase SDK)
    ↓ Firebase ID Token
Backend FastAPI (Databricks Apps)
    ↓ Vérifie token + Query data
Databricks SQL Warehouse / Lakebase
```

---

## 📋 Prérequis

### 1. Firebase Project

1. Aller sur https://console.firebase.google.com
2. Créer un projet "Corail VTC"
3. Activer **Authentication** → Email/Password
4. Télécharger la clé de service :
   - Project Settings → Service Accounts
   - Generate new private key
   - Sauvegarder comme `firebase-key.json` dans `backend/`

### 2. Databricks SQL Warehouse

1. Créer un SQL Warehouse dans ton workspace
2. Noter le **HTTP Path** (ex: `/sql/1.0/warehouses/xxxxx`)
3. Créer un **Personal Access Token**
4. Créer le catalog et schema :

```sql
CREATE CATALOG IF NOT EXISTS io_catalog;
CREATE SCHEMA IF NOT EXISTS io_catalog.corail;
```

### 3. Tables Databricks

Créer les tables nécessaires :

```sql
USE CATALOG io_catalog;
USE SCHEMA corail;

-- Table des courses
CREATE TABLE IF NOT EXISTS rides (
    id STRING NOT NULL,
    creator_id STRING NOT NULL,
    picker_id STRING,
    pickup_address STRING NOT NULL,
    dropoff_address STRING NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    price_cents INT NOT NULL,
    status STRING NOT NULL,  -- PUBLISHED, CLAIMED, COMPLETED, CANCELLED
    visibility STRING NOT NULL,  -- PUBLIC, GROUP
    vehicle_type STRING,  -- STANDARD, PREMIUM, ELECTRIC, VAN, LUXURY
    distance_km FLOAT,
    duration_minutes INT,
    commission_enabled BOOLEAN DEFAULT true,
    group_id STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    completed_at TIMESTAMP,
    PRIMARY KEY (id)
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id STRING NOT NULL,  -- Firebase UID
    email STRING NOT NULL,
    full_name STRING,
    phone STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    is_subscribed BOOLEAN DEFAULT false,
    subscription_plan STRING,  -- FREE, PREMIUM, PLATINUM
    rating INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    PRIMARY KEY (id)
);

-- Table des groupes
CREATE TABLE IF NOT EXISTS groups (
    id STRING NOT NULL,
    name STRING NOT NULL,
    description STRING,
    owner_id STRING NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id)
);

-- Table des membres de groupes
CREATE TABLE IF NOT EXISTS group_members (
    group_id STRING NOT NULL,
    user_id STRING NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (group_id, user_id)
);
```

---

## 🚀 Installation locale

### 1. Installer les dépendances

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurer les variables d'environnement

Créer `.env` :

```bash
DATABRICKS_HOST=adb-xxxxx.azuredatabricks.net
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/xxxxx
DATABRICKS_TOKEN=dapixxxxx
CATALOG=io_catalog
SCHEMA=corail
FIREBASE_CREDENTIALS_PATH=./firebase-key.json
```

### 3. Lancer le serveur

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Accéder à :
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000

---

## ☁️ Déploiement sur Databricks Apps

### 1. Installer Databricks CLI

```bash
pip install databricks-cli
```

### 2. Configurer l'authentification

```bash
databricks configure --token
```

Entrer:
- Host: https://adb-xxxxx.azuredatabricks.net
- Token: dapi...

### 3. Préparer le déploiement

Créer `databricks.tfvars` :

```hcl
databricks_host = "adb-xxxxx.azuredatabricks.net"
http_path = "/sql/1.0/warehouses/xxxxx"
databricks_token = "dapixxxxx"
```

### 4. Déployer

```bash
cd backend
databricks bundle deploy
```

### 5. Obtenir l'URL de l'app

```bash
databricks bundle status
```

L'URL sera du type : `https://corail-api-xxxxx.databricksapps.com`

---

## 🔐 Authentification

### Flow d'authentification

1. **Mobile App** : User se connecte via Firebase
2. **Mobile App** : Récupère le Firebase ID Token
3. **Mobile App** : Envoie le token dans le header `Authorization: Bearer <token>`
4. **Backend** : Vérifie le token avec Firebase Admin SDK
5. **Backend** : Extrait le `user_id` (Firebase UID)
6. **Backend** : Execute les requêtes avec le `user_id`

### Exemple de requête

```bash
curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
     https://corail-api-xxxxx.databricksapps.com/api/v1/rides
```

---

## 📡 API Endpoints

### Public

- `GET /` - Health check
- `GET /api/v1/debug/config` - Debug config (dev only)

### Protected (nécessite Firebase token)

#### Rides

- `GET /api/v1/rides` - Liste des courses
  - Query params: `status`, `visibility`, `skip`, `limit`
- `GET /api/v1/rides/{ride_id}` - Détails d'une course
- `POST /api/v1/rides` - Créer une course
- `POST /api/v1/rides/{ride_id}/claim` - Prendre une course
- `GET /api/v1/my-rides` - Mes courses
  - Query param: `type=claimed|published`

---

## 🧪 Tests

### Test local sans Firebase

Le backend fonctionne en mode dev sans Firebase configuré (utilise `dev-user-001`).

### Test avec Firebase

```bash
# Obtenir un token de test
curl -X POST \
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"password123","returnSecureToken":true}'

# Utiliser le token
TOKEN="eyJhbGci..."
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/v1/rides
```

---

## 📝 Notes

### Sécurité

- ✅ Auth Firebase pour tous les endpoints protégés
- ✅ Tokens vérifiés côté serveur
- ✅ Databricks token stocké en variable d'env (jamais dans le code)
- ⚠️ CORS ouvert en dev - à restreindre en prod

### Performance

- Utiliser **Lakebase** pour de meilleures perfs qu'un SQL Warehouse standard
- Les connexions Databricks sont poolées automatiquement

### Monitoring

Databricks Apps fournit :
- Logs en temps réel
- Métriques de performance
- Auto-scaling

---

## 🐛 Troubleshooting

### Firebase init failed

- Vérifier que `firebase-key.json` existe
- Vérifier le format du JSON
- Le backend fonctionnera en mode dev sans Firebase

### Databricks connection failed

- Vérifier DATABRICKS_HOST (sans https://)
- Vérifier DATABRICKS_HTTP_PATH
- Vérifier que le token a les droits SQL

### CORS errors

- Ajouter l'origine de l'app mobile dans `ALLOWED_ORIGINS`

---

## 📚 Ressources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Databricks Apps](https://docs.databricks.com/en/apps/index.html)
- [Databricks SQL Connector](https://docs.databricks.com/en/dev-tools/python-sql-connector.html)


