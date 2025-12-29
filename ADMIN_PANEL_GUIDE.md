# 👨‍💼 Panel Admin - Guide d'utilisation

## 🎯 Vue d'ensemble

Panel admin intégré directement dans l'app mobile pour valider les vérifications VTC en un clic !

---

## 🚀 Installation (Étape unique)

### 1️⃣ Exécuter le script SQL dans Databricks

```sql
-- Ajouter la colonne is_admin
ALTER TABLE io_catalog.corail.users ADD COLUMNS (
  is_admin BOOLEAN
);

-- Mettre tous les utilisateurs à non-admin par défaut
UPDATE io_catalog.corail.users
SET is_admin = FALSE
WHERE is_admin IS NULL;

-- TE faire super admin
-- Remplace 'ton.email@example.com' par ton vrai email
UPDATE io_catalog.corail.users
SET is_admin = TRUE
WHERE email = 'ton.email@example.com';

-- Vérifier
SELECT email, full_name, is_admin FROM io_catalog.corail.users WHERE is_admin = TRUE;
```

---

## 📱 Utilisation dans l'app

### 1️⃣ Accéder au panel admin

1. **Ouvre l'app Corail**
2. **Va dans "Profil"** (dernier onglet en bas)
3. **Tu verras une nouvelle section** : **"Administration"** 🎉
4. **Clique sur "Panel Admin"**

### 2️⃣ Voir les demandes en attente

Dans le panel admin, tu verras :
- 📋 Liste de toutes les demandes en attente
- 👤 Nom, email, téléphone
- 🎫 Numéro de carte VTC
- 🏢 SIREN (9 chiffres)
- ⏱️ Temps d'attente

### 3️⃣ Valider une demande

1. **Vérifie les informations** :
   - Carte VTC valide ?
   - SIREN correspond à une entreprise VTC active ?
   
2. **Clique sur "Valider ✅"**

3. **Confirme**

4. **C'est tout ! 🎉**
   - L'utilisateur peut maintenant utiliser l'app
   - Son nom s'affiche correctement
   - Il a accès à toutes les fonctionnalités

### 4️⃣ Rejeter une demande

1. **Clique sur "Rejeter ❌"**

2. **Entre la raison du rejet** :
   - Ex: "Carte VTC expirée"
   - Ex: "SIREN invalide"
   - Ex: "Document illisible"

3. **Confirme**

4. **L'utilisateur reste en REJECTED**
   - Il peut resoumettre après correction

---

## ✨ Fonctionnalités

### ✅ Ce qui fonctionne

- ✅ Voir toutes les demandes en attente
- ✅ Valider en un clic
- ✅ Rejeter avec raison
- ✅ Mise à jour temps réel
- ✅ Pull-to-refresh
- ✅ Badge avec nombre de demandes
- ✅ Sécurisé (seuls les admins y accèdent)

### 🔄 Pull-to-refresh

**Tire vers le bas** pour rafraîchir la liste et voir les nouvelles demandes.

---

## 🎨 Interface

```
┌────────────────────────────────────┐
│  ← Panel Admin              [2]    │  ← Badge = Nb demandes
├────────────────────────────────────┤
│  ℹ️  Vérifications en attente       │
│  Valide ou rejette les demandes... │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │  JD  Jean Dupont      Il y a 2h│
│  │  jean.dupont@test.com         │
│  │                                │
│  │  📞 0612345678                 │
│  │  🎫 VTC-075-123456789          │
│  │  🏢 123456789                  │
│  │                                │
│  │  [Rejeter ❌]  [Valider ✅]    │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  MA  Marie Alain     Il y a 1j│
│  │  ...                          │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

---

## 🔐 Sécurité

### Qui peut accéder ?

**Uniquement les utilisateurs avec `is_admin = TRUE`**

- Le bouton "Panel Admin" n'apparaît QUE pour les admins
- L'API vérifie le flag `is_admin` avant de permettre les actions
- Impossible pour un utilisateur normal d'accéder au panel

### Comment ajouter un admin ?

Dans **Databricks SQL Editor** :

```sql
-- Faire quelqu'un admin
UPDATE io_catalog.corail.users
SET is_admin = TRUE
WHERE email = 'nouvel.admin@example.com';

-- Retirer les droits admin
UPDATE io_catalog.corail.users
SET is_admin = FALSE
WHERE email = 'ancien.admin@example.com';

-- Voir tous les admins
SELECT email, full_name, is_admin, created_at
FROM io_catalog.corail.users
WHERE is_admin = TRUE;
```

---

## 📊 Statistiques

### Voir les stats

Pour l'instant, c'est dans le badge du panel admin.

**Futures fonctionnalités** :
- Nombre de vérifications cette semaine
- Délai moyen de traitement
- Taux de validation/rejet

---

## 🐛 Résolution de problèmes

### Le bouton "Panel Admin" n'apparaît pas

**Causes possibles** :
1. Tu n'es pas admin → Exécute le script SQL pour te faire admin
2. L'app n'a pas rechargé le statut → Déconnecte/Reconnecte
3. Le backend n'a pas été redéployé → Attends 5 minutes après le push

**Solution** :
```sql
-- Vérifier ton statut admin
SELECT email, is_admin FROM io_catalog.corail.users WHERE email = 'ton.email@example.com';

-- Si is_admin = FALSE ou NULL, exécute :
UPDATE io_catalog.corail.users SET is_admin = TRUE WHERE email = 'ton.email@example.com';
```

Puis dans l'app :
1. **Déconnexion**
2. **Reconnexion**
3. **Le bouton doit apparaître ! 🎉**

---

### Erreur "Admin privileges required"

**Cause** : Le backend a détecté que tu n'es pas admin.

**Solution** :
```sql
UPDATE io_catalog.corail.users SET is_admin = TRUE WHERE email = 'ton.email@example.com';
```

---

### Liste vide mais tu sais qu'il y a des demandes

**Solution** : Pull-to-refresh (tire vers le bas)

Si toujours vide :
```sql
-- Vérifier qu'il y a bien des demandes PENDING
SELECT * FROM io_catalog.corail.users WHERE verification_status = 'PENDING';
```

---

## 🎯 Workflow complet

```
[Nouvel utilisateur s'inscrit]
    ↓
[Remplit son nom, email, mot de passe]
    ↓
[Redirigé vers VerificationScreen]
    ↓
[Remplit carte VTC + SIREN]
    ↓
[Status = PENDING]
    ↓
[TOI en tant qu'admin]
    ↓
[Ouvre l'app → Profil → Panel Admin]
    ↓
[Vois la nouvelle demande avec badge [1]]
    ↓
[Vérifies les infos]
    ↓
[Clique "Valider ✅"]
    ↓
[Status = VERIFIED]
    ↓
[Utilisateur peut utiliser l'app ! 🎉]
```

---

## 🚀 Prochaines améliorations

### Court terme
- [ ] Notifications push quand nouvelle demande
- [ ] Statistiques dans le panel
- [ ] Historique des validations/rejets

### Moyen terme
- [ ] Upload de photos (carte VTC, Kbis)
- [ ] Chat avec l'utilisateur depuis le panel
- [ ] Validation par QR code

### Long terme
- [ ] IA pour vérifier automatiquement les SIRENs
- [ ] API gouvernementale pour valider les cartes VTC
- [ ] Dashboard web admin complet

---

## ✅ Résumé

**Pour utiliser le panel admin** :
1. ✅ Exécute le script SQL une fois (te faire admin)
2. ✅ Ouvre l'app → Profil → Panel Admin
3. ✅ Valide/Rejette en un clic
4. ✅ Les utilisateurs peuvent utiliser l'app immédiatement !

**Plus besoin de commandes SQL compliquées ! Tout se fait dans l'app ! 🎉**

---

**Fichier SQL complet** : `backend/add_admin_role.sql`


