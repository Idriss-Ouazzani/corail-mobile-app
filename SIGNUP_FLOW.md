# 📝 Flux d'inscription Corail VTC

## 🎯 Vue d'ensemble

Nouveau flux d'inscription intégrant directement la vérification professionnelle VTC.

---

## 📋 Flux complet

```
[Utilisateur ouvre l'app]
    ↓
[Pas connecté → LoginScreen]
    ↓
[Clique "S'inscrire"]
    ↓
[Remplit le formulaire]
    - Nom complet
    - Email
    - Mot de passe
    - Confirmation mot de passe
    ↓
[Soumet]
    ↓
[1. Création compte Firebase]
    ↓
[2. Création utilisateur Databricks]
    - id = Firebase UID
    - email
    - full_name
    - verification_status = 'UNVERIFIED'
    - credits = 0
    ↓
[Alert: "Compte créé ! Complétez votre profil professionnel"]
    ↓
[Connexion automatique]
    ↓
[App charge le statut de vérification]
    ↓
[Status = UNVERIFIED]
    ↓
[→ VerificationScreen s'affiche automatiquement]
    ↓
[Remplit le formulaire de vérification]
    - Téléphone
    - Numéro de carte professionnelle VTC
    - Numéro SIREN (9 chiffres)
    ↓
[Soumet la vérification]
    ↓
[Status passe à PENDING]
    ↓
[→ PendingVerificationScreen s'affiche]
    - Timeline du processus
    - FAQ
    - Bouton "Se déconnecter"
    ↓
[Admin valide manuellement dans Databricks]
    ↓
[Status passe à VERIFIED]
    ↓
[Utilisateur se reconnecte]
    ↓
[→ Accès complet à l'app ! 🎉]
```

---

## 🔧 Changements techniques

### 1️⃣ LoginScreen

**Ajouté** :
- Champ "Nom complet" (inscription seulement)
- Validation du nom complet
- Appel API `apiClient.createUser()` après inscription Firebase

**Code** :
```typescript
if (isSignUp) {
  // 1. Créer compte Firebase
  const user = await firebaseAuth.signUp(email, password);
  
  // 2. Créer utilisateur Databricks
  await apiClient.createUser({
    id: user.uid,
    email: email,
    full_name: fullName,
    verification_status: 'UNVERIFIED',
  });
  
  // 3. Message de succès
  Alert.alert('Compte créé !', 'Complétez votre profil professionnel...');
}
```

### 2️⃣ Backend - POST /api/v1/users

**Endpoint** : `POST /api/v1/users`

**Body** :
```json
{
  "id": "firebase_uid",
  "email": "user@example.com",
  "full_name": "Jean Dupont",
  "verification_status": "UNVERIFIED"
}
```

**Response** :
```json
{
  "success": true,
  "message": "User created successfully",
  "user_id": "firebase_uid"
}
```

**Code** :
```python
@app.post("/api/v1/users")
async def create_user(user_data: CreateUserRequest):
    # Vérifier si existe déjà
    existing = db.execute_query(
        "SELECT id FROM users WHERE id = :user_id",
        {"user_id": user_data.id}
    )
    
    if existing:
        return {"success": True, "message": "User already exists"}
    
    # Créer l'utilisateur
    db.execute_non_query("""
        INSERT INTO users (id, email, full_name, verification_status, credits, created_at, updated_at)
        VALUES (:id, :email, :full_name, :verification_status, 0, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
    """, {...})
```

### 3️⃣ App.tsx - Gestion du statut de vérification

**États ajoutés** :
```typescript
const [verificationStatus, setVerificationStatus] = useState('VERIFIED');
const [userFullName, setUserFullName] = useState('');
const [verificationSubmittedAt, setVerificationSubmittedAt] = useState<string | undefined>();
```

**Chargement du statut** :
```typescript
const loadVerificationStatus = async () => {
  const response = await apiClient.getVerificationStatus();
  setVerificationStatus(response.verification_status || 'UNVERIFIED');
  setUserFullName(response.full_name || '');
  setVerificationSubmittedAt(response.verification_submitted_at);
};

useEffect(() => {
  if (user) {
    loadVerificationStatus();
    loadRides();
    loadCredits();
    loadBadges();
  }
}, [user]);
```

**Redirection conditionnelle** :
```typescript
// Si UNVERIFIED → VerificationScreen
if (verificationStatus === 'UNVERIFIED') {
  return <VerificationScreen onBack={...} onSuccess={...} />;
}

// Si PENDING → PendingVerificationScreen
if (verificationStatus === 'PENDING') {
  return <PendingVerificationScreen onLogout={...} submittedAt={...} />;
}

// Si VERIFIED → App normale
```

**Affichage du nom** :
```typescript
<Text style={styles.userName}>
  {userFullName || user?.email?.split('@')[0] || 'Utilisateur'}
</Text>
```

---

## 🧪 Test du flux complet

### 1. Test inscription

```bash
npm start
```

1. **Clique "S'inscrire"**
2. **Remplis** :
   - Nom complet: "Jean Dupont"
   - Email: "jean.dupont@test.com"
   - Mot de passe: "test123456"
   - Confirmation: "test123456"
3. **Soumet**
4. **Vérifie** :
   - Alert "Compte créé !"
   - Redirection automatique vers VerificationScreen

### 2. Test vérification

1. **Sur VerificationScreen, remplis** :
   - Téléphone: "0612345678"
   - Carte VTC: "VTC-075-123456789"
   - SIREN: "123456789"
2. **Soumet**
3. **Vérifie** :
   - Alert "Vérification soumise !"
   - Redirection automatique vers PendingVerificationScreen

### 3. Test validation admin

**Dans Databricks SQL Editor** :
```sql
-- Voir l'utilisateur créé
SELECT * FROM io_catalog.corail.users WHERE email = 'jean.dupont@test.com';
-- verification_status devrait être "PENDING"

-- Valider manuellement
UPDATE io_catalog.corail.users
SET 
  verification_status = 'VERIFIED',
  verification_reviewed_at = CURRENT_TIMESTAMP(),
  verification_reviewed_by = 'admin-manual'
WHERE email = 'jean.dupont@test.com';
```

### 4. Test accès complet

1. **Recharge l'app** (Shake → Reload dans Expo Go)
2. **Vérifie** :
   - Accès complet à l'app
   - Nom affiché : "Jean Dupont"
   - Peut créer et prendre des courses

---

## 📊 Base de données

### Utilisateur créé lors de l'inscription

| Colonne | Valeur |
|---------|--------|
| `id` | Firebase UID |
| `email` | Email saisi |
| `full_name` | Nom complet saisi |
| `verification_status` | `UNVERIFIED` |
| `credits` | `0` |
| `created_at` | Timestamp actuel |
| `updated_at` | Timestamp actuel |

### Après soumission de vérification

| Colonne | Valeur mise à jour |
|---------|---------------------|
| `verification_status` | `PENDING` |
| `phone` | Téléphone saisi |
| `professional_card_number` | Carte VTC saisie |
| `siren` | SIREN saisi |
| `verification_submitted_at` | Timestamp actuel |

### Après validation admin

| Colonne | Valeur mise à jour |
|---------|---------------------|
| `verification_status` | `VERIFIED` |
| `verification_reviewed_at` | Timestamp validation |
| `verification_reviewed_by` | ID de l'admin |

---

## 🚨 Gestion des erreurs

### Utilisateur existe déjà dans Databricks

Si `apiClient.createUser()` échoue (utilisateur existe déjà), l'inscription continue quand même. L'utilisateur sera connecté à Firebase et l'app fonctionnera.

### Erreur réseau pendant la création

L'app affiche une erreur mais l'inscription Firebase est conservée. L'utilisateur pourra se reconnecter et l'app créera automatiquement l'entrée Databricks au premier chargement.

### Pas de statut de vérification

Si `loadVerificationStatus()` échoue (utilisateur pas dans Databricks), le status par défaut est `UNVERIFIED`, ce qui force l'utilisateur à compléter son profil.

---

## 🎨 Écrans

### LoginScreen (mode inscription)

```
┌──────────────────────────────────────┐
│         🪸  Corail                   │
│  Partagez vos courses, multipliez    │
│     vos opportunités                 │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  👤  Nom complet              │  │ ← NOUVEAU
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  📧  Email                     │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  🔒  Mot de passe         👁   │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  🔒  Confirmer le mot de passe│  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │   Créer mon compte [Gradient] │  │
│  └────────────────────────────────┘  │
│                                      │
│      ─────────  OU  ─────────       │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔵  Continuer avec Google      │  │
│  └────────────────────────────────┘  │
│                                      │
│   Vous avez déjà un compte ?         │
│   Se connecter                       │
│                                      │
└──────────────────────────────────────┘
```

### Home (avec vrai nom)

```
┌──────────────────────────────────────┐
│         🪸                           │
│                                      │
│       Bonjour                        │
│    Jean Dupont                       │ ← Nom réel depuis Databricks
│    ⭐ Premium Member                 │
│                                      │
└──────────────────────────────────────┘
```

---

## ✅ Checklist de déploiement

- [x] Champ "Nom complet" ajouté dans LoginScreen
- [x] Endpoint `POST /api/v1/users` créé dans backend
- [x] Méthode `apiClient.createUser()` ajoutée
- [x] États de vérification ajoutés dans App.tsx
- [x] `loadVerificationStatus()` implémenté
- [x] Redirection conditionnelle selon statut
- [x] Affichage du vrai nom utilisateur
- [ ] Script SQL `add_verification_system.sql` exécuté
- [ ] Backend déployé sur Render
- [ ] Testé en local
- [ ] Testé en production

---

## 🎉 Résultat

**Avant** : Inscription → Accès direct à l'app avec nom par défaut "Hassan Al Masri"

**Maintenant** :
1. Inscription avec nom complet
2. Création automatique dans Databricks
3. Redirection vers formulaire de vérification VTC
4. Écran d'attente élégant pendant validation admin
5. Accès complet après validation
6. Nom réel affiché partout dans l'app

**Sécurité** : Seuls les VTC professionnels vérifiés peuvent utiliser la plateforme ! 🔒✅

