# 🚀 Guide de Déploiement Corail VTC

Guide complet pour déployer Corail : Backend FastAPI + Firebase Auth + App Mobile

---

## 📋 Vue d'ensemble

```
┌─────────────────────┐
│  Mobile App         │
│  React Native       │
│  + Firebase SDK     │
└──────────┬──────────┘
           │ Firebase ID Token
           ↓
┌─────────────────────┐
│  Backend FastAPI    │
│  Databricks Apps    │
│  + Firebase Admin   │
└──────────┬──────────┘
           │ SQL Queries
           ↓
┌─────────────────────┐
│  Databricks         │
│  SQL Warehouse      │
│  Catalog: io_catalog│
│  Schema: corail     │
└─────────────────────┘
```

---

## ⚡ Déploiement Rapide (30 min)

### 1️⃣ Firebase (5 min)

```bash
# 1. Créer projet Firebase
# https://console.firebase.google.com → "Add project" → "Corail VTC"

# 2. Activer Authentication
# Build → Authentication → Email/Password

# 3. Télécharger les clés
# Service Accounts → Generate new private key → firebase-key.json

# 4. Créer utilisateur de test
# Authentication → Users → Add user
# Email: test@corail.com
# Password: test123456
```

📖 Guide détaillé : [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

---

### 2️⃣ Databricks (10 min)

```sql
-- 1. Créer catalog et schema
CREATE CATALOG IF NOT EXISTS io_catalog;
CREATE SCHEMA IF NOT EXISTS io_catalog.corail;

-- 2. Créer les tables
-- Copier/coller le contenu de backend/setup_tables.sql dans SQL Editor
```

```bash
# 3. Noter les infos de connexion
DATABRICKS_HOST=adb-xxxxx.azuredatabricks.net
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/xxxxx
DATABRICKS_TOKEN=dapixxxxx  # Personal Access Token
```

📖 Script SQL complet : [backend/setup_tables.sql](./backend/setup_tables.sql)

---

### 3️⃣ Backend Databricks Apps (10 min)

```bash
# 1. Aller dans le dossier backend
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp/backend

# 2. Copier firebase-key.json ici
cp ~/Downloads/firebase-key.json ./

# 3. Créer fichier .env
cat > .env << 'EOF'
DATABRICKS_HOST=adb-xxxxx.azuredatabricks.net
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/xxxxx
DATABRICKS_TOKEN=dapixxxxx
CATALOG=io_catalog
SCHEMA=corail
FIREBASE_CREDENTIALS_PATH=./firebase-key.json
EOF

# 4. Test local (optionnel)
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Accéder à http://localhost:8000/docs pour tester
```

#### Déployer sur Databricks Apps

**Option A : Via UI (recommandé)**

1. Aller dans ton workspace Databricks
2. Apps → Create App
3. Source : Upload folder → sélectionner `/backend/`
4. Environment variables :
   - `DATABRICKS_HOST`
   - `DATABRICKS_HTTP_PATH`
   - `DATABRICKS_TOKEN`
   - `CATALOG=io_catalog`
   - `SCHEMA=corail`
   - Upload `firebase-key.json` comme secret
5. Command : `uvicorn app.main:app --host 0.0.0.0 --port 8000`
6. Deploy → Attendre 2-3 min
7. Copier l'URL : `https://corail-api-xxxxx.databricksapps.com`

**Option B : Via CLI**

```bash
# Installer Databricks CLI
pip install databricks-cli

# Configurer
databricks configure --token

# Déployer
databricks bundle deploy
```

📖 Guide détaillé : [backend/README.md](./backend/README.md)

---

### 4️⃣ App Mobile (5 min)

```bash
# 1. Installer Firebase SDK
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npm install firebase

# 2. Créer src/services/firebase.ts
# Copier le code depuis FIREBASE_SETUP.md

# 3. Mettre à jour src/services/api.ts
# Remplacer l'URL du backend par celle de Databricks Apps
const baseUrl = 'https://corail-api-xxxxx.databricksapps.com/api/v1';

# 4. Tester
npx expo start

# Se connecter avec test@corail.com / test123456
```

📖 Guide détaillé : [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

---

## ✅ Checklist de déploiement

### Firebase
- [ ] Projet créé
- [ ] Authentication activée (Email/Password)
- [ ] User de test créé
- [ ] `firebase-key.json` téléchargé
- [ ] Config Firebase copiée pour l'app mobile

### Databricks
- [ ] Catalog `io_catalog` créé
- [ ] Schema `corail` créé
- [ ] Tables créées (rides, users, groups, group_members)
- [ ] Données de test insérées
- [ ] SQL Warehouse HTTP Path noté
- [ ] Personal Access Token créé

### Backend
- [ ] Code backend créé
- [ ] `firebase-key.json` placé dans `/backend/`
- [ ] Variables d'environnement configurées
- [ ] Test local OK (http://localhost:8000/docs)
- [ ] Déployé sur Databricks Apps
- [ ] URL de prod notée

### Mobile App
- [ ] Firebase SDK installé
- [ ] `firebase.ts` créé avec config
- [ ] `api.ts` mis à jour avec URL prod
- [ ] Écran de login créé
- [ ] Test avec Expo Go OK

---

## 🧪 Test du déploiement

### 1. Test Backend

```bash
# Health check
curl https://corail-api-xxxxx.databricksapps.com/

# Test sans auth (doit retourner 401)
curl https://corail-api-xxxxx.databricksapps.com/api/v1/rides

# Login pour obtenir un token
curl -X POST \
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@corail.com","password":"test123456","returnSecureToken":true}'

# Copier le idToken

# Test avec auth
TOKEN="eyJhbGci..."
curl -H "Authorization: Bearer $TOKEN" \
     https://corail-api-xxxxx.databricksapps.com/api/v1/rides
```

### 2. Test Mobile App

1. `npx expo start`
2. Scanner le QR code avec Expo Go
3. Se connecter avec `test@corail.com` / `test123456`
4. Vérifier que :
   - Les courses s'affichent
   - On peut créer une course
   - On peut claim une course
   - On voit "Mes Courses"

---

## 🐛 Troubleshooting

### Backend ne démarre pas

```bash
# Vérifier les logs Databricks Apps
databricks apps logs corail-api

# Vérifier la config
curl https://corail-api-xxxxx.databricksapps.com/api/v1/debug/config
```

### Firebase 401 Unauthorized

```bash
# Vérifier que firebase-key.json est bien déployé
# Vérifier que le token est bien envoyé dans le header
# Vérifier que le token n'est pas expiré (durée 1h)
```

### Databricks connection failed

```bash
# Vérifier les variables d'environnement
# Vérifier que le SQL Warehouse est démarré
# Vérifier les permissions sur le catalog/schema
```

### App mobile ne se connecte pas

```bash
# Vérifier que l'URL du backend est correcte dans api.ts
# Vérifier que Firebase config est correcte dans firebase.ts
# Vérifier les logs : npx expo start --clear
```

---

## 📊 Architecture de sécurité

```
┌────────────────────────────────────────────────────────┐
│ Mobile App                                             │
│                                                        │
│  1. User login → Firebase Auth                        │
│  2. Firebase renvoie ID Token (JWT)                   │
│  3. App stocke le token                               │
│  4. Chaque API call → Header: "Authorization: Bearer" │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓ HTTPS + Bearer Token
┌────────────────────────────────────────────────────────┐
│ Backend FastAPI (Databricks Apps)                     │
│                                                        │
│  5. Reçoit le token dans Authorization header         │
│  6. Vérifie le token avec Firebase Admin SDK          │
│  7. Extrait user_id (Firebase UID)                    │
│  8. Execute query avec user_id                        │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓ SQL Query
┌────────────────────────────────────────────────────────┐
│ Databricks SQL Warehouse                              │
│                                                        │
│  9. Retourne les données                              │
│ 10. Backend filtre par user_id si nécessaire          │
│ 11. Backend renvoie JSON à l'app                      │
└────────────────────────────────────────────────────────┘
```

**Points clés :**
- ✅ Aucun mot de passe stocké côté app
- ✅ Token vérifié côté serveur (pas de confiance client)
- ✅ Token expire après 1h (renouvellement auto)
- ✅ HTTPS partout
- ✅ user_id jamais exposé côté client

---

## 💰 Coûts estimés

### Firebase (Plan Spark - Gratuit)
- ✅ 50,000 authentifications/mois : **Gratuit**
- ✅ Pour Corail : largement suffisant

### Databricks
- 💵 SQL Warehouse : ~$0.22/DBU
- 💵 Serverless SQL : ~$0.70/DBU (plus rapide, auto-scale)
- 📊 Estimation : 100€-300€/mois pour ~10K users

**Optimisations :**
- Utiliser Serverless SQL (pas de cluster idle)
- Activer auto-stop après 10 min
- Utiliser Lakebase pour API publique (plus économique)

---

## 🎯 Next Steps

### Fonctionnalités manquantes
- [ ] Reset password
- [ ] Email verification
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Pagination des résultats
- [ ] Recherche/filtres avancés
- [ ] Paiements (Stripe/PayPal)
- [ ] Chat in-app (optionnel)

### Améliorations
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring (Sentry, Datadog)
- [ ] Rate limiting
- [ ] Caching (Redis)
- [ ] Tests unitaires/intégration

### Déploiement app mobile
- [ ] EAS Build (Expo)
- [ ] Publier sur App Store (iOS)
- [ ] Publier sur Play Store (Android)

---

## 📚 Ressources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Databricks Apps](https://docs.databricks.com/en/apps/)
- [Expo Docs](https://docs.expo.dev/)
- [React Native Firebase](https://rnfirebase.io/)

---

## 🆘 Support

En cas de problème :
1. Vérifier les logs backend : Databricks Apps → Logs
2. Vérifier les logs mobile : `npx expo start --clear`
3. Tester les endpoints : https://corail-api.databricksapps.com/docs

---

**🎉 Félicitations ! Ton app Corail VTC est déployée ! 🚗💨**

