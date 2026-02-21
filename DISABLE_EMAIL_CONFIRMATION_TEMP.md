# ⚡ SOLUTION TEMPORAIRE : Désactiver la confirmation d'email

## 🎯 Objectif
Permettre aux utilisateurs de s'inscrire et se connecter immédiatement sans confirmation d'email.

**⚠️ C'est une solution TEMPORAIRE pour le développement et les tests.**

---

## 📝 ÉTAPES DANS SUPABASE DASHBOARD

### 1. Désactiver "Confirm sign up"

1. Va dans **Authentication** → **Email** (menu de gauche)
2. Clique sur **"Confirm sign up"**
3. **Scroll tout en bas** de la page qui s'ouvre
4. **Désactive le toggle** (il doit devenir gris/OFF)
5. Clique sur **"Save changes"**

### 2. Vérification

Après avoir sauvegardé, essaie de créer un nouveau compte dans l'app :
- ✅ Tu devrais être **connecté immédiatement**
- ✅ Pas d'email de confirmation
- ✅ Accès direct à l'app

---

## 🔧 SOLUTION PERMANENTE : Custom SMTP

Pour la production, tu DOIS configurer un **SMTP personnalisé** :

### Option 1 : Gmail SMTP (gratuit jusqu'à 500 emails/jour)
- Host: `smtp.gmail.com`
- Port: `587`
- Username: `ton-email@gmail.com`
- Password: **App Password** (pas ton mot de passe Gmail !)
  - Va dans Gmail → Paramètres → Sécurité → Validation en 2 étapes (activer)
  - Puis : Mots de passe des applications → Créer → Copie le mot de passe

### Option 2 : Resend.io (RECOMMANDÉ pour la production)
- **100 emails/jour GRATUITS** (jusqu'à 3000/mois)
- **Domaine personnalisé** (emails@corail.com)
- **Meilleure délivrabilité** que Gmail
- Configuration simple :
  1. Crée un compte sur https://resend.com
  2. Obtiens ton API key
  3. Configure dans Supabase → Authentication → Email → SMTP Settings

### Option 3 : SendGrid, Mailgun, etc.
Plus complexe, mais très scalable.

---

## 📋 POUR CONFIGURER CUSTOM SMTP DANS SUPABASE

1. Va dans **Authentication** → **Email** (menu de gauche)
2. Clique sur **"SMTP Settings"** (onglet en haut)
3. Clique sur **"Set up SMTP"**
4. Remplis les champs :
   - **Sender email** : `noreply@corail.com` (ou ton domaine)
   - **Sender name** : `Corail`
   - **Host** : selon le service (ex: `smtp.gmail.com`)
   - **Port** : `587` (TLS) ou `465` (SSL)
   - **Username** : ton email ou API key
   - **Password** : mot de passe ou API key
5. **Test** l'envoi
6. Clique sur **"Save"**

---

## 🎯 RECOMMANDATION POUR TOI

**Pour l'instant (développement/beta) :**
1. ✅ **Désactive "Confirm sign up"** → Tu peux tester l'app tranquillement
2. ✅ Les users peuvent s'inscrire et se connecter immédiatement

**Avant le lancement (production) :**
1. 🔒 Configure **Resend.io** ou **Gmail SMTP**
2. 🔒 **Réactive "Confirm sign up"**
3. 🔒 Personnalise les templates d'email (déjà fait ✅)

---

## ⚡ ACTION IMMÉDIATE

**Désactive "Confirm sign up" maintenant** pour débloquer les tests, et on configurera le SMTP plus tard.

**Après ça, tu pourras :**
- ✅ Créer des comptes sans attendre d'email
- ✅ Tester les notifications (comme tu le demandais au début !)
- ✅ Avancer sur l'app

**Et quand tu seras prêt pour la prod, tu configureras Resend.io (super simple, j'ai déjà fait le guide dans `DOMAIN_EMAIL_SETUP_GUIDE.md`).**

