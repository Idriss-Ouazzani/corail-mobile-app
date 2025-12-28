# 🚀 Démarrage Rapide - Corail VTC

## ✅ Ce qui est prêt :

- ✅ Backend FastAPI avec Firebase Auth
- ✅ App mobile React Native + Expo
- ✅ Écran de connexion/inscription
- ✅ Intégration Firebase complète
- ✅ API client avec tokens automatiques

---

## 🔥 Lancer l'app maintenant (5 min)

### 1. **Installer Firebase**

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npm install
```

### 2. **Activer Authentication dans Firebase**

1. Va sur https://console.firebase.google.com
2. Clique sur ton projet "Corail VTC"
3. Menu **Build** → **Authentication**
4. Clique **"Get Started"**
5. Activer **Email/Password**
6. Cliquer sur l'onglet **Users**
7. **Add user** :
   - Email: `test@corail.com`
   - Password: `test123456`
8. Créer

### 3. **Lancer l'app**

```bash
npx expo start
```

Scanner le QR code avec Expo Go et te connecter avec :
- **Email** : `test@corail.com`
- **Password** : `test123456`

🎉 **Ça marche !**

---

## 🔐 Ce qui fonctionne maintenant :

### Dans l'app mobile :

- ✅ Connexion / Inscription
- ✅ Persistance de la session
- ✅ Déconnexion (Profil → Déconnexion)
- ✅ Toutes les fonctionnalités Corail (Marketplace, Mes Courses, etc.)
- ✅ Token Firebase envoyé automatiquement à chaque requête API

### Backend :

- ✅ Vérifie les tokens Firebase
- ✅ Extrait le user_id automatiquement
- ✅ Routes protégées par authentification
- ❌ **Pas encore déployé** (en local seulement)

---

## 🎯 Prochaines étapes

### Pour avoir un backend fonctionnel :

#### **Option A : Databricks Apps (Recommandé)** 🚀

1. **Créer les tables dans Databricks**
   - Ouvrir SQL Editor
   - Copier/coller `backend/setup_tables.sql`
   - Exécuter

2. **Télécharger la clé Firebase Admin**
   - Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Sauvegarder dans `backend/firebase-key.json`

3. **Déployer sur Databricks Apps**
   - Suivre le guide : [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

4. **Mettre à jour l'URL dans l'app**
   ```typescript
   // src/services/api.ts (ligne 143)
   const API_BASE_URL = __DEV__ 
     ? 'http://localhost:8000/api/v1'
     : 'https://corail-api-xxxxx.databricksapps.com/api/v1'; // ← Ton URL
   ```

#### **Option B : Test local (rapide)** 💻

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Mobile
cd ..
npx expo start
```

⚠️ **Note** : Pour tester en local, ton téléphone et ton laptop doivent être sur le même WiFi.

---

## 📝 Créer un utilisateur de test

### Via Firebase Console :

1. https://console.firebase.google.com
2. Authentication → Users → Add user
3. Email + Password
4. Create

### Via l'app :

1. Lancer l'app
2. Cliquer "S'inscrire"
3. Remplir email + password
4. Créer le compte

---

## 🐛 Troubleshooting

### "Cannot find module 'firebase'"

```bash
npm install
```

### "Firebase: Error (auth/invalid-email)"

- Vérifier que l'email est valide
- Vérifier que Authentication est activée dans Firebase Console

### "Network request failed"

- Vérifier que le backend tourne
- Si local : vérifier que le téléphone est sur le même WiFi
- Si prod : vérifier l'URL dans `api.ts`

### "Firebase: Error (auth/user-not-found)"

- Créer un utilisateur dans Firebase Console
- Ou utiliser "S'inscrire" dans l'app

---

## 📚 Documentation complète

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Setup Firebase détaillé
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Déploiement complet
- [backend/README.md](./backend/README.md) - Documentation backend

---

## 🎉 Félicitations !

Ton app Corail VTC est prête ! 🚗💨

**Prochaines étapes suggérées :**
1. Déployer le backend sur Databricks Apps
2. Tester les fonctionnalités (créer course, claim, etc.)
3. Ajouter plus d'utilisateurs de test
4. Build natif avec `eas build` (optionnel)

---

**Questions ? Besoin d'aide ?**
Consulte les guides complets ou pose tes questions ! 🔥

