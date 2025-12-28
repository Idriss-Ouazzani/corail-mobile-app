# 📧 Système d'Invitations aux Groupes

## 🎯 **Comment ça marche actuellement**

### **Version actuelle (Simple - Pas d'emails)**

```
1. Admin invite quelqu'un par email
   ↓
2. ✅ Invitation créée dans Databricks (status = PENDING)
   ↓
3. ❌ AUCUN email envoyé
   ↓
4. La personne invitée NE SAIT PAS qu'elle a été invitée
   ↓
5. Pour accepter, elle doit :
   - Créer un compte avec CET email exact
   - Aller dans "Mes Groupes"
   - Voir les invitations en attente
   - Cliquer "Accepter"
```

**⚠️ Limitation :** L'utilisateur ne reçoit aucune notification !

---

## ✅ **Ce qui fonctionne déjà**

1. ✅ **Création de groupes** → Sauvegardé dans Databricks
2. ✅ **Invitation par email** → Invitation créée en BDD (status = PENDING)
3. ✅ **Vérification des doublons** → Impossible d'inviter 2 fois la même personne
4. ✅ **Permissions** → Seuls les admins peuvent inviter
5. ✅ **Détection auto** → Si l'email existe déjà dans `users`, on lie directement le `user_id`

---

## 🚀 **Étapes suivantes : Ajouter les notifications**

### **Option 1 : Firebase Cloud Functions + SendGrid (Recommandé)**

**Avantages :**
- 🔥 Intégré à Firebase
- 📧 Emails transactionnels professionnels
- ⚡ Déclenché automatiquement
- 🔒 Sécurisé

**Comment ça marcherait :**

```javascript
// Firebase Cloud Function (backend/functions/index.js)
exports.onGroupInvitation = functions.firestore
  .document('group_invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    const invitation = snap.data();
    
    // Envoyer email via SendGrid
    await sendGrid.send({
      to: invitation.email,
      from: 'noreply@corail-vtc.com',
      subject: 'Invitation à rejoindre un groupe VTC',
      html: `
        <h2>Vous avez été invité(e) à rejoindre un groupe !</h2>
        <p>Groupe : ${invitation.groupName}</p>
        <p>Invité par : ${invitation.inviterName}</p>
        <a href="https://corail-app.com/accept-invite/${invitation.id}">
          Accepter l'invitation
        </a>
      `
    });
  });
```

**Coût :** SendGrid gratuit jusqu'à 100 emails/jour

---

### **Option 2 : Firebase Cloud Messaging (Push Notifications)**

**Pour les utilisateurs déjà inscrits dans l'app :**

```javascript
// Envoyer une notification push
await admin.messaging().send({
  token: userDeviceToken,
  notification: {
    title: '🎉 Nouvelle invitation',
    body: `${inviterName} vous invite à rejoindre ${groupName}`
  },
  data: {
    type: 'group_invitation',
    groupId: invitation.groupId,
    invitationId: invitation.id
  }
});
```

**Avantages :**
- ✅ Instantané
- ✅ Gratuit
- ✅ L'utilisateur voit l'invitation dans l'app

**Inconvénient :**
- ❌ Fonctionne seulement si l'utilisateur a déjà l'app installée

---

### **Option 3 : API Email externe (Resend, Mailgun, etc.)**

**Backend FastAPI envoie directement l'email :**

```python
# backend/app/main.py
import resend

@app.post("/api/v1/groups/{group_id}/invite")
async def invite_to_group(...):
    # ... créer l'invitation en BDD ...
    
    # Envoyer l'email
    resend.Emails.send({
        "from": "noreply@corail-vtc.com",
        "to": invitation.email,
        "subject": "Invitation groupe VTC",
        "html": f"""
            <h2>Vous avez été invité !</h2>
            <p>Groupe : {group_name}</p>
            <a href="https://corail-app.com/accept/{invitation_id}">
                Accepter
            </a>
        """
    })
```

**Coût :** Resend gratuit jusqu'à 3000 emails/mois

---

## 📱 **Interface utilisateur : Où voir les invitations ?**

### **1. Écran "Mes Groupes"**

```
┌─────────────────────────────────────┐
│ Mes Groupes                         │
├─────────────────────────────────────┤
│ 🔔 Invitations en attente (2)       │ ← NOUVEAU
│                                     │
│ ┌─────────────────────────────┐     │
│ │ ✈️ Spécialistes Aéroport    │     │
│ │ Invité par: Youssef Driss   │     │
│ │ [Accepter] [Refuser]        │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ ⭐ VTC Premium Toulouse      │     │
│ │ Invité par: Hassan Al Masri │     │
│ │ [Accepter] [Refuser]        │     │
│ └─────────────────────────────┘     │
├─────────────────────────────────────┤
│ 👥 Mes groupes actifs (1)           │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ 🚕 VTC Toulouse Centre       │     │
│ │ 3 membres • Admin           │     │
│ └─────────────────────────────┘     │
└─────────────────────────────────────┘
```

### **2. Notification Badge**

```
Bottom Navigation:
[Home] [Marketplace] [+] [MyRides] [Profile 🔴2]
                                              ↑
                                        Badge rouge
                                        = 2 invitations
```

---

## 🛠️ **Implémentation complète**

### **Backend (Déjà fait ✅)**
- ✅ Table `groups`
- ✅ Table `group_members` avec `status = PENDING`
- ✅ Endpoint `POST /api/v1/groups` (créer groupe)
- ✅ Endpoint `POST /api/v1/groups/{id}/invite` (inviter)
- ✅ Endpoint `GET /api/v1/groups` (liste mes groupes)

### **Frontend Mobile (À faire)**
- [ ] Endpoint `GET /api/v1/groups/invitations` (mes invitations)
- [ ] Endpoint `POST /api/v1/groups/invitations/{id}/accept` (accepter)
- [ ] Endpoint `POST /api/v1/groups/invitations/{id}/reject` (refuser)
- [ ] UI : Section "Invitations en attente" dans GroupsScreen
- [ ] Badge de notification sur l'onglet Profil

### **Notifications (À faire)**
- [ ] Configurer Firebase Cloud Functions
- [ ] Intégrer SendGrid ou Resend
- [ ] Créer template d'email
- [ ] Tester l'envoi d'email
- [ ] Ajouter Firebase Cloud Messaging (notifications push)

---

## 🔄 **Workflow complet avec emails**

### **Scénario idéal :**

```
1. Admin (Hassan) invite nouveau.chauffeur@example.com
   ↓
2. ✅ Invitation créée en BDD (status = PENDING)
   ↓
3. 📧 Email envoyé automatiquement :
   "Vous avez été invité à rejoindre VTC Premium Toulouse"
   [Accepter l'invitation] ← Lien vers l'app
   ↓
4a. L'utilisateur N'A PAS l'app :
    → Clic sur le lien
    → Télécharge l'app
    → S'inscrit avec nouveau.chauffeur@example.com
    → L'app détecte automatiquement l'invitation
    → Affiche "Accepter l'invitation à VTC Premium ?"
    
4b. L'utilisateur A DÉJÀ l'app :
    → Reçoit notification push
    → Ouvre l'app
    → Va dans "Mes Groupes"
    → Voit "Invitations en attente (1)"
    → Clique "Accepter"
    ↓
5. ✅ status = ACTIVE
   ↓
6. 🎉 L'utilisateur voit le groupe dans "Mes groupes actifs"
```

---

## 💰 **Coûts estimés**

| Service | Plan Gratuit | Plan Payant |
|---------|--------------|-------------|
| **SendGrid** | 100 emails/jour | $15/mois (40k emails) |
| **Resend** | 3000 emails/mois | $20/mois (50k emails) |
| **Firebase Cloud Messaging** | Gratuit | Gratuit |
| **Firebase Cloud Functions** | 2M invocations/mois | $0.40/M après |

**Pour commencer : GRATUIT ! 🎉**

---

## 🚦 **Prochaines étapes**

### **Phase 1 : Groupes fonctionnels (✅ FAIT)**
- ✅ Tables Databricks
- ✅ Endpoints backend
- ✅ UI création de groupe

### **Phase 2 : Invitations simples (📍 EN COURS)**
- [ ] Afficher invitations en attente dans l'app
- [ ] Boutons Accepter/Refuser
- [ ] Endpoints backend pour accepter/refuser

### **Phase 3 : Notifications (🔮 FUTUR)**
- [ ] Configurer Firebase Cloud Functions
- [ ] Intégrer SendGrid/Resend
- [ ] Envoyer emails automatiquement
- [ ] Notifications push

---

## 📝 **Notes importantes**

**⚠️ Sans système d'email :**
- L'utilisateur invité ne sait pas qu'il a été invité
- Il doit créer un compte avec **exactement le même email**
- Il doit aller dans "Mes Groupes" et accepter manuellement

**✅ Avec système d'email :**
- L'utilisateur reçoit un email instantanément
- Il clique sur le lien
- L'app ouvre automatiquement l'invitation
- 1 clic pour accepter !

---

🎊 **Pour l'instant, concentrons-nous sur Phase 2 : faire fonctionner les invitations dans l'app, puis on ajoutera les emails !**

