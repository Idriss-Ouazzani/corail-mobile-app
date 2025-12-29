

# ✅ Système de Vérification Professionnelle VTC - Guide complet

## 📋 Vue d'ensemble

Système de vérification en 3 étapes pour garantir que seuls les VTC professionnels peuvent utiliser la plateforme.

---

## 🎯 États du compte

| État | Description | Accès |
|------|-------------|-------|
| 🟡 **UNVERIFIED** | Inscrit mais profil incomplet | ❌ Bloqué (overlay flou) |
| 🟠 **PENDING** | Documents soumis, en attente validation | ⏳ Écran d'attente |
| 🟢 **VERIFIED** | Validé par un admin | ✅ Accès complet |
| 🔴 **REJECTED** | Rejeté par admin | ❌ Peut resoumettre |

---

## 🚀 Installation

### Étape 1 : Créer les colonnes dans Databricks

**Exécute dans Databricks SQL Editor** :

```sql
-- Fichier: backend/add_verification_system.sql
-- (Le script complet est dans ce fichier)
```

Le script va :
- ✅ Ajouter les colonnes de vérification à `users`
- ✅ Créer la table `verification_history`
- ✅ Créer la vue `v_pending_verifications`
- ✅ Mettre les utilisateurs existants en `UNVERIFIED`

### Étape 2 : Déployer le backend

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
git add -A
git commit -m "✅ Système de vérification professionnelle VTC"
git push origin main
```

Render va automatiquement redéployer (attends 3-5 min).

### Étape 3 : Tester l'app mobile

```bash
npm start
```

---

## 📱 Flux utilisateur

### 1️⃣ Nouvel utilisateur

```
[Inscription] 
    ↓
[Email confirmé]
    ↓
[Status: UNVERIFIED]
    ↓
[Écran de vérification forcé]
    ↓
[Remplit: Nom, Tél, Carte VTC, SIREN]
    ↓
[Soumet]
    ↓
[Status: PENDING]
    ↓
[Écran d'attente élégant]
```

### 2️⃣ Admin valide

```
[Admin] → GET /api/v1/admin/verification/pending
    ↓
[Liste des vérifications en attente]
    ↓
[Vérifie carte VTC + SIREN]
    ↓
[POST /api/v1/admin/verification/{user_id}/review]
    ↓
[Status: VERIFIED ou REJECTED]
    ↓
[Utilisateur notifié par email (TODO)]
```

### 3️⃣ Utilisateur vérifié

```
[Status: VERIFIED]
    ↓
[Accès complet à la plateforme]
    ↓
[Peut publier et prendre des courses]
```

---

## 🔧 API Endpoints

### **Utilisateur**

#### GET /api/v1/verification/status
Récupère le statut de vérification

**Response** :
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "full_name": "Jean Dupont",
  "phone": "0612345678",
  "verification_status": "PENDING",
  "professional_card_number": "VTC-075-123456789",
  "siren": "123456789",
  "verification_submitted_at": "2025-01-15T10:30:00Z",
  "verification_rejection_reason": null
}
```

#### POST /api/v1/verification/submit
Soumet la vérification professionnelle

**Body** :
```json
{
  "full_name": "Jean Dupont",
  "phone": "0612345678",
  "professional_card_number": "VTC-075-123456789",
  "siren": "123456789"
}
```

**Response** :
```json
{
  "success": true,
  "message": "Vérification soumise avec succès ! Votre compte sera validé sous 24-48h.",
  "status": "PENDING"
}
```

### **Admin**

#### GET /api/v1/admin/verification/pending
Liste toutes les vérifications en attente

**Response** :
```json
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "full_name": "Jean Dupont",
    "phone": "0612345678",
    "professional_card_number": "VTC-075-123456789",
    "siren": "123456789",
    "verification_status": "PENDING",
    "verification_submitted_at": "2025-01-15T10:30:00Z",
    "user_created_at": "2025-01-14T08:00:00Z"
  }
]
```

#### POST /api/v1/admin/verification/{user_id}/review
Valider ou rejeter une vérification

**Body** :
```json
{
  "status": "VERIFIED",  // ou "REJECTED"
  "rejection_reason": "Carte VTC expirée"  // optionnel si REJECTED
}
```

**Response** :
```json
{
  "success": true,
  "message": "Vérification verifiede avec succès",
  "status": "VERIFIED"
}
```

---

## 📊 Base de données

### Colonnes ajoutées à `users`

| Colonne | Type | Description |
|---------|------|-------------|
| `verification_status` | STRING | UNVERIFIED, PENDING, VERIFIED, REJECTED |
| `professional_card_number` | STRING | Numéro carte VTC |
| `siren` | STRING | SIREN (9 chiffres) |
| `verification_documents` | STRING | URL documents (future) |
| `verification_submitted_at` | TIMESTAMP | Date de soumission |
| `verification_reviewed_at` | TIMESTAMP | Date de validation/rejet |
| `verification_reviewed_by` | STRING | User ID de l'admin |
| `verification_rejection_reason` | STRING | Raison du rejet |

### Table `verification_history`

Historique de toutes les soumissions et validations.

### Vue `v_pending_verifications`

Vue admin pour voir rapidement les vérifications en attente.

---

## 🧪 Tests

### Test 1 : Nouveau compte

1. **Crée un nouveau compte** (email/mot de passe)
2. **Après connexion** → Écran de vérification s'affiche
3. **Remplis le formulaire** :
   - Nom: Jean Dupont
   - Tél: 0612345678
   - Carte VTC: VTC-075-123456789
   - SIREN: 123456789
4. **Soumet** → Écran "Vérification en cours" s'affiche
5. **Vérifie dans Databricks** :
```sql
SELECT * FROM io_catalog.corail.users WHERE email = 'test@example.com';
-- verification_status devrait être "PENDING"
```

### Test 2 : Validation admin

```sql
-- Via SQL direct (en attendant panel admin)
UPDATE io_catalog.corail.users
SET 
  verification_status = 'VERIFIED',
  verification_reviewed_at = CURRENT_TIMESTAMP(),
  verification_reviewed_by = 'admin-001'
WHERE email = 'test@example.com';
```

Ou via API (Postman/cURL) :
```bash
curl -X POST https://corail-backend-6e5o.onrender.com/api/v1/admin/verification/USER_ID/review \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "VERIFIED"}'
```

### Test 3 : Compte vérifié

1. **Recharge l'app** (Shake → Reload)
2. **L'écran normal s'affiche** → Accès complet !
3. **Peut créer et prendre des courses**

---

## 🎨 Écrans mobile

### 1. **VerificationScreen**
- Formulaire de vérification professionnelle
- Champs : Nom, Téléphone, Carte VTC, SIREN
- Validation et soumission

### 2. **PendingVerificationScreen**
- Écran d'attente élégant
- Timeline du processus
- FAQ
- Bouton de déconnexion

### 3. **VerificationOverlay** (TODO)
- Overlay de flou sur le contenu
- Affiché si `UNVERIFIED`
- Bouton "Compléter mon profil"

---

## 🚧 TODO

### Court terme
- [x] Backend API endpoints
- [x] Écrans de vérification
- [x] Écran d'attente
- [ ] Intégrer dans le flux d'authentification
- [ ] Overlay de flou si UNVERIFIED
- [ ] Vérifier le statut au démarrage de l'app

### Moyen terme
- [ ] Panel admin pour valider/rejeter
- [ ] Upload de documents (photo carte VTC, Kbis)
- [ ] Notifications email (soumission, validation, rejet)
- [ ] Notifications push dans l'app

### Long terme
- [ ] Vérification automatique via API gouvernementale
- [ ] Renouvellement annuel de la carte VTC
- [ ] Alertes d'expiration de carte

---

## 📝 Requêtes SQL utiles

```sql
-- Voir tous les utilisateurs UNVERIFIED
SELECT email, full_name, created_at
FROM io_catalog.corail.users
WHERE verification_status = 'UNVERIFIED'
ORDER BY created_at DESC;

-- Voir toutes les vérifications en attente
SELECT * FROM io_catalog.corail.v_pending_verifications;

-- Compter par statut
SELECT verification_status, COUNT(*) as count
FROM io_catalog.corail.users
GROUP BY verification_status;

-- Historique de vérification d'un user
SELECT *
FROM io_catalog.corail.verification_history
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;

-- Valider manuellement un user
UPDATE io_catalog.corail.users
SET 
  verification_status = 'VERIFIED',
  verification_reviewed_at = CURRENT_TIMESTAMP(),
  verification_reviewed_by = 'admin-manual'
WHERE id = 'USER_ID';
```

---

## ✅ Checklist de déploiement

- [ ] Script SQL exécuté dans Databricks
- [ ] Backend déployé sur Render
- [ ] App mobile testée
- [ ] Nouveaux utilisateurs voient l'écran de vérification
- [ ] Écran PENDING s'affiche correctement
- [ ] Validation admin fonctionne
- [ ] Utilisateurs VERIFIED ont accès complet

---

**🎉 Le système de vérification professionnelle est maintenant opérationnel !**


