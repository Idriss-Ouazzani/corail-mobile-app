# 👨‍💼 Guide Admin - Validation des VTC Professionnels

## 🎯 Vue d'ensemble

En tant qu'admin, tu dois valider manuellement chaque demande de vérification VTC pour garantir que seuls les professionnels authentiques utilisent la plateforme.

---

## 📋 Processus de validation

### **1️⃣ Recevoir les demandes**

#### **Option actuelle : Vérification manuelle SQL**

Actuellement, il n'y a **pas de notification automatique**. Tu dois vérifier régulièrement s'il y a de nouvelles demandes.

**Ouvre Databricks SQL Editor** et exécute :

```sql
-- Voir toutes les demandes en attente
SELECT 
  email,
  full_name,
  phone,
  professional_card_number,
  siren,
  verification_submitted_at,
  DATEDIFF(CURRENT_TIMESTAMP(), verification_submitted_at) as jours_attente
FROM io_catalog.corail.v_pending_verifications
ORDER BY verification_submitted_at ASC;
```

**Tu verras** :
- Email du demandeur
- Nom complet
- Téléphone
- Numéro de carte professionnelle VTC
- Numéro SIREN (9 chiffres)
- Date de soumission
- Nombre de jours d'attente

---

### **2️⃣ Vérifier les informations**

Pour chaque demande, tu dois vérifier :

#### ✅ **Carte professionnelle VTC**
- Format : `VTC-XXX-XXXXXXXXX` (ex: `VTC-075-123456789`)
- Délivrée par la préfecture
- **Vérification** : Appeler la préfecture ou consulter le registre national

#### ✅ **Numéro SIREN**
- 9 chiffres (ex: `123456789`)
- **Vérification** : 
  - https://www.societe.com
  - https://www.infogreffe.fr
  - Vérifier que le SIREN correspond à une entreprise de transport VTC active

#### ✅ **Cohérence des données**
- Le nom sur la carte VTC doit correspondre au nom du compte
- Le SIREN doit être associé à une activité de transport VTC

---

### **3️⃣ Valider ou rejeter**

#### ✅ **Valider une demande** (si tout est OK)

Dans Databricks SQL Editor :

```sql
-- Remplace 'EMAIL_UTILISATEUR' par l'email réel
UPDATE io_catalog.corail.users
SET 
  verification_status = 'VERIFIED',
  verification_reviewed_at = CURRENT_TIMESTAMP(),
  verification_reviewed_by = 'ton-nom-admin'
WHERE email = 'EMAIL_UTILISATEUR';

-- Exemple :
-- WHERE email = 'jean.dupont@test.com';
```

**Résultat** :
- ✅ L'utilisateur reçoit un accès complet à l'app
- ✅ Il peut créer et prendre des courses
- ✅ Son nom s'affiche correctement partout

---

#### ❌ **Rejeter une demande** (si informations incorrectes)

```sql
-- Remplace 'EMAIL_UTILISATEUR' et le message de rejet
UPDATE io_catalog.corail.users
SET 
  verification_status = 'REJECTED',
  verification_reviewed_at = CURRENT_TIMESTAMP(),
  verification_reviewed_by = 'ton-nom-admin',
  verification_rejection_reason = 'Carte VTC expirée - Veuillez renouveler votre carte'
WHERE email = 'EMAIL_UTILISATEUR';
```

**Messages de rejet courants** :
- `"Carte VTC expirée - Veuillez renouveler votre carte"`
- `"Numéro SIREN invalide - Veuillez vérifier"`
- `"Carte VTC ne correspond pas au nom du compte"`
- `"Entreprise non active - Veuillez mettre à jour votre statut"`

**Résultat** :
- ❌ L'utilisateur reste en `REJECTED`
- 📧 (Future fonctionnalité) Il recevra un email avec la raison du rejet
- 🔄 Il peut resoumettre une nouvelle demande après correction

---

## 📊 Statistiques et suivi

### **Voir le nombre de demandes par statut**

```sql
SELECT 
  verification_status,
  COUNT(*) as nombre
FROM io_catalog.corail.users
GROUP BY verification_status;
```

### **Historique des validations récentes**

```sql
SELECT 
  email,
  full_name,
  verification_status,
  verification_reviewed_at,
  verification_reviewed_by,
  DATEDIFF(verification_reviewed_at, verification_submitted_at) as delai_jours
FROM io_catalog.corail.users
WHERE verification_reviewed_at IS NOT NULL
ORDER BY verification_reviewed_at DESC
LIMIT 20;
```

### **Délai moyen de traitement**

```sql
SELECT 
  AVG(DATEDIFF(verification_reviewed_at, verification_submitted_at)) as delai_moyen_jours
FROM io_catalog.corail.users
WHERE verification_reviewed_at IS NOT NULL;
```

---

## 🚀 Options futures

### **Court terme (1-2 semaines)**

#### **📧 Notifications email**
- Email automatique à l'admin quand une nouvelle demande arrive
- Email à l'utilisateur quand sa demande est validée/rejetée

**À implémenter** :
- Service email (SendGrid, Mailgun, AWS SES)
- Webhook qui se déclenche sur `INSERT` dans `users` avec status `PENDING`

---

### **Moyen terme (1 mois)**

#### **🐍 Script Python pour validation**

Créer un script Python simple :

```python
# admin_tool.py
import databricks.sql
import os

def list_pending():
    """Affiche toutes les demandes en attente"""
    # Connect to Databricks
    # Execute query
    # Display results
    pass

def approve(user_id):
    """Valider un utilisateur"""
    # UPDATE verification_status = 'VERIFIED'
    pass

def reject(user_id, reason):
    """Rejeter un utilisateur"""
    # UPDATE verification_status = 'REJECTED'
    pass

if __name__ == "__main__":
    # CLI simple
    print("1. Voir les demandes en attente")
    print("2. Valider un utilisateur")
    print("3. Rejeter un utilisateur")
    choice = input("Choix : ")
```

**Usage** :
```bash
python admin_tool.py
```

---

### **Long terme (2-3 mois)**

#### **🎨 Panel Admin Web (React)**

Interface admin complète avec :
- ✅ Dashboard des demandes en attente
- ✅ Recherche et filtres
- ✅ Validation/Rejet en un clic
- ✅ Historique des actions
- ✅ Statistiques en temps réel
- ✅ Upload de documents justificatifs
- ✅ Chat avec les utilisateurs

**Technologies** :
- Frontend : React + TypeScript + Tailwind
- Backend : Déjà prêt (FastAPI endpoints)
- Authentification : Firebase Admin

**Routes backend déjà disponibles** :
```
GET  /api/v1/admin/verification/pending
POST /api/v1/admin/verification/{user_id}/review
```

---

## 🔐 Sécurité

### **Qui peut valider ?**

Pour l'instant, **toute personne avec accès à Databricks** peut valider.

**Recommandations** :
1. **Court terme** : Limiter l'accès Databricks aux admins uniquement
2. **Moyen terme** : Créer un rôle "Admin" dans la table `users` avec `is_admin: BOOLEAN`
3. **Long terme** : Authentification admin séparée avec permissions granulaires

### **Audit trail**

Toutes les actions sont enregistrées dans `verification_history` :
```sql
SELECT * FROM io_catalog.corail.verification_history
ORDER BY created_at DESC;
```

---

## 📝 Checklist de validation

Pour chaque demande :

- [ ] Vérifier le numéro de carte VTC sur le registre national
- [ ] Vérifier le SIREN sur infogreffe.fr ou societe.com
- [ ] Vérifier que l'entreprise est active
- [ ] Vérifier la cohérence nom/prénom
- [ ] Vérifier que l'activité est bien "Transport VTC"
- [ ] Si tout est OK → **VALIDER**
- [ ] Si problème → **REJETER avec raison claire**

---

## 🎯 Temps de traitement recommandé

- **Objectif** : 24-48h ouvrées
- **Maximum acceptable** : 5 jours ouvrés
- **Urgent** : Si > 5 jours, prioriser

---

## 📞 Support

Si tu as besoin d'aide :
1. Consulter `VERIFICATION_SYSTEM_GUIDE.md`
2. Vérifier les logs backend
3. Contacter le développeur

---

## ✅ Résumé rapide

### **Chaque jour/semaine, fais ça :**

1. **Ouvre Databricks SQL Editor**
2. **Exécute** :
   ```sql
   SELECT * FROM io_catalog.corail.v_pending_verifications;
   ```
3. **Pour chaque demande** :
   - Vérifie carte VTC + SIREN
   - Si OK → `UPDATE ... SET verification_status = 'VERIFIED'`
   - Si problème → `UPDATE ... SET verification_status = 'REJECTED', verification_rejection_reason = '...'`
4. **L'utilisateur peut maintenant accéder à l'app !**

---

**Script SQL complet disponible dans** : `backend/admin_validation.sql`

**🎉 C'est tout ! Simple et efficace pour démarrer !**


