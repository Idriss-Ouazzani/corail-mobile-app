# 🚀 INSTRUCTIONS DE DÉPLOIEMENT - Corail VTC

## 📦 Changements effectués

### ✅ 1. Système de vérification professionnelle VTC
- **Backend** : Endpoints API pour soumettre/valider vérifications
- **Mobile** : Écrans VerificationScreen et PendingVerificationScreen
- **SQL** : Script `add_verification_system.sql`
- **Documentation** : `VERIFICATION_SYSTEM_GUIDE.md`

### ✅ 2. Authentification Google
- **Firebase** : Méthode `signInWithGoogle()` ajoutée
- **Mobile** : Bouton "Continuer avec Google" élégant
- **UI** : Séparateur "OU" entre les méthodes de connexion
- **Documentation** : `GOOGLE_AUTH_SETUP.md`

### ✅ 3. Flux d'inscription intégré
- **LoginScreen** : Champ "Nom complet" ajouté à l'inscription
- **Backend** : Endpoint `POST /api/v1/users` pour créer utilisateur
- **App.tsx** : Redirection automatique selon statut de vérification
- **Affichage** : Nom réel de l'utilisateur partout dans l'app
- **Documentation** : `SIGNUP_FLOW.md`

---

## 🔧 ÉTAPES D'INSTALLATION

### 1️⃣ Installer les dépendances

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

npx expo install expo-auth-session expo-web-browser
```

---

### 2️⃣ Exécuter le script SQL dans Databricks

1. **Ouvre Databricks SQL Editor**
2. **Copie le contenu de** `backend/add_verification_system.sql`
3. **Exécute le script**
4. **Vérifie que les colonnes sont ajoutées** :

```sql
DESCRIBE io_catalog.corail.users;
-- Doit afficher : verification_status, professional_card_number, siren, etc.
```

---

### 3️⃣ Commit et Push vers GitHub

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

git add -A

git commit -m "🔵 Google Auth + ✅ Vérification VTC + 📝 Flux d'inscription complet

Flux d'inscription intégré:
- ✅ Champ 'Nom complet' ajouté dans LoginScreen (inscription)
- ✅ POST /api/v1/users - Création utilisateur Databricks après Firebase
- ✅ App.tsx vérifie le statut de vérification au démarrage
- ✅ Redirection automatique vers VerificationScreen si UNVERIFIED
- ✅ Redirection automatique vers PendingVerificationScreen si PENDING
- ✅ Affichage du vrai nom utilisateur dans toute l'app
- ✅ apiClient.createUser() et loadVerificationStatus()
- 📚 Documentation SIGNUP_FLOW.md

Authentification Google:
- ✅ signInWithGoogle() ajouté dans firebase.ts
- ✅ Bouton 'Continuer avec Google' dans LoginScreen
- ✅ Séparateur 'OU' élégant entre méthodes connexion
- ✅ Support web (signInWithPopup)
- ⚠️ Mobile nécessite expo-auth-session config
- 📚 Documentation GOOGLE_AUTH_SETUP.md

Système de vérification VTC:
Backend (FastAPI):
- ✅ POST /verification/submit - Soumettre vérification
- ✅ GET /verification/status - Statut utilisateur
- ✅ GET /admin/verification/pending - Liste admin
- ✅ POST /admin/verification/{id}/review - Valider/Rejeter
- ✅ Modèles User étendus (carte VTC, SIREN)
- ✅ Table verification_history
- ✅ Vue v_pending_verifications

Mobile (React Native):
- ✅ VerificationScreen - Formulaire professionnel
  - Nom, téléphone, carte VTC, SIREN
  - Validation et soumission
- ✅ PendingVerificationScreen - Attente élégante
  - Timeline du processus
  - FAQ intégrée
  - Délai estimé (24-48h)

États du compte:
🟡 UNVERIFIED → Profil incomplet
🟠 PENDING → En attente validation admin
🟢 VERIFIED → Validé, accès complet
🔴 REJECTED → Rejeté, peut resoumettre

Databricks:
- ✅ Script SQL add_verification_system.sql
- ✅ Colonnes vérification dans users
- ✅ Table verification_history
- ✅ Vue v_pending_verifications

Documentation:
📚 VERIFICATION_SYSTEM_GUIDE.md
📚 GOOGLE_AUTH_SETUP.md
📚 DEPLOY_INSTRUCTIONS.md

Prochaines étapes:
- [ ] Installer expo-auth-session expo-web-browser
- [ ] Tester Google Auth sur web
- [ ] Exécuter SQL script dans Databricks
- [ ] Intégrer écrans vérification dans App.tsx
- [ ] Panel admin de validation

Garantit sécurité et professionnalisme de la plateforme VTC ! 🚗🔒"

git push origin main
```

---

### 4️⃣ Vérifier le déploiement Render

Render va automatiquement redéployer le backend (attends 3-5 minutes).

**Vérifie que le backend est en ligne** :
```
https://corail-backend-6e5o.onrender.com/api/v1/health
```

---

### 5️⃣ Tester l'authentification Google

```bash
npm start

# Puis appuie sur 'w' pour ouvrir dans le navigateur web
```

1. **Clique sur "Continuer avec Google"**
2. **Une popup Google s'ouvre**
3. **Sélectionne ton compte Google**
4. **Tu es connecté ! 🎉**

⚠️ **Note** : Sur mobile Expo Go, Google Auth ne fonctionne pas sans configuration native. Utilise email/mot de passe pour tester sur mobile.

---

## 📊 Fichiers modifiés

### Backend
- `backend/app/main.py` - Endpoints vérification + POST /users
- `backend/app/database.py` - (inchangé)
- `backend/app/auth.py` - (inchangé)

### Mobile
- `App.tsx` - États vérification + Redirection conditionnelle + Affichage nom réel
- `src/services/firebase.ts` - signInWithGoogle()
- `src/services/api.ts` - createUser() + getVerificationStatus()
- `src/screens/LoginScreen.tsx` - Champ nom complet + Bouton Google
- `src/screens/VerificationScreen.tsx` - [NOUVEAU]
- `src/screens/PendingVerificationScreen.tsx` - [NOUVEAU]

### SQL
- `backend/add_verification_system.sql` - [NOUVEAU]

### Documentation
- `SIGNUP_FLOW.md` - [NOUVEAU]
- `VERIFICATION_SYSTEM_GUIDE.md` - [NOUVEAU]
- `GOOGLE_AUTH_SETUP.md` - [NOUVEAU]
- `DEPLOY_INSTRUCTIONS.md` - Mis à jour

---

## ✅ Checklist de déploiement

- [ ] **Dépendances installées** : `npx expo install expo-auth-session expo-web-browser`
- [ ] **Script SQL exécuté** : `add_verification_system.sql` dans Databricks
- [ ] **Vérifier colonnes ajoutées** : `DESCRIBE io_catalog.corail.users;`
- [ ] **Commit & Push** : `git push origin main`
- [ ] **Render redéployé** : Attendre 3-5 min
- [ ] **Backend en ligne** : Tester `/api/v1/health`
- [ ] **Google Auth testé** : Sur web (appuyer sur 'w')
- [ ] **Écrans vérification testés** : (Prochaine étape : intégration App.tsx)

---

## 🐛 Résolution de problèmes

### "expo-auth-session not found"
```bash
npx expo install expo-auth-session expo-web-browser
```

### "Table or column not found" (Databricks)
Exécute `backend/add_verification_system.sql` dans Databricks SQL Editor

### Google Auth ne fonctionne pas sur mobile
C'est normal avec Expo Go. Utilise email/mot de passe ou compile l'app en standalone.

### Backend 500 après déploiement
Vérifie que le script SQL a bien été exécuté. Les nouvelles colonnes doivent exister dans la table `users`.

---

## 🎉 Prochaines étapes

1. ✅ **Installer les dépendances** : `npx expo install expo-auth-session expo-web-browser`
2. ✅ **Exécuter le script SQL** : `backend/add_verification_system.sql` dans Databricks
3. ✅ **Commit & Push** : `git push origin main`
4. ⏳ **Tester le nouveau flux d'inscription** :
   - Créer un compte avec nom complet
   - Vérifier redirection vers VerificationScreen
   - Compléter le formulaire VTC
   - Vérifier écran PendingVerificationScreen
5. ⏳ **Tester validation admin** :
   - Valider manuellement dans Databricks
   - Recharger l'app
   - Vérifier accès complet avec nom réel affiché
6. ⏳ **Tester Google Auth** (sur web)
7. ⏳ **Créer le panel admin de validation**

---

**💪 Tout est prêt pour le déploiement ! Go ! 🚀**

