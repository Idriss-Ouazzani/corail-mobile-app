# 📧 Configuration Resend.io SANS domaine custom (TEST)

Guide rapide pour tester l'envoi d'emails **MAINTENANT** sans avoir à acheter un domaine.

---

## 🎯 **OBJECTIF**

Tester l'envoi d'emails de devis en utilisant le domaine par défaut de Resend (`resend.dev`).

**⚠️ Pour la prod, il faudra configurer un domaine custom (`corail.app`). Voir `SETUP_RESEND_EMAIL.md`.**

---

## 📋 **ÉTAPE 1 : Créer le compte Resend.io (5 min)**

### 1.1 Inscription
1. Aller sur https://resend.com
2. Cliquer sur "Get Started" ou "Sign Up"
3. S'inscrire avec ton email perso ou pro
4. Vérifier l'email de confirmation

### 1.2 Vérifier le plan
- Tu devrais être sur le plan **FREE** (3000 emails/mois)
- ✅ Pas de carte bancaire requise

---

## 🔑 **ÉTAPE 2 : Créer l'API Key (2 min)**

### 2.1 Générer la clé

1. Dans Resend Dashboard → **API Keys**
2. Cliquer sur **Create API Key**
3. Name : `Corail App - Test`
4. Permission : **Full Access** (ou "Sending access")
5. Cliquer sur **Create**

### 2.2 Copier la clé

⚠️ **IMPORTANT** : La clé ne s'affichera **QU'UNE SEULE FOIS** !

```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copie-la immédiatement** dans un endroit sûr (Notes, 1Password, etc.).

### 2.3 Ajouter la clé dans Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner ton projet Corail
3. Aller dans **Settings** → **Edge Functions**
4. Cliquer sur **Manage secrets**
5. Ajouter un nouveau secret :
   - Name : `RESEND_API_KEY`
   - Value : `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (ta clé)
6. **Save**

---

## 🚀 **ÉTAPE 3 : Déployer l'Edge Function (5 min)**

### 3.1 Installer/Vérifier Supabase CLI

```bash
# Vérifier si installé
supabase --version

# Si pas installé, installer avec Homebrew (macOS)
brew install supabase/tap/supabase
```

### 3.2 Se connecter à Supabase

```bash
supabase login
```

### 3.3 Lier le projet

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
supabase link --project-ref <TON_PROJECT_REF>
```

**Trouver ton `project-ref` :**
- Va sur https://supabase.com/dashboard
- Sélectionne ton projet Corail
- Dans l'URL : `https://supabase.com/dashboard/project/<project-ref>`
- Exemple : `qeheawdjlwlkhnwbhqcg`

### 3.4 Déployer la fonction

```bash
supabase functions deploy send-quote-email --project-ref <TON_PROJECT_REF>
```

**Output attendu :**
```
Deploying Function send-quote-email
✅ Deployed Function send-quote-email in 2.3s
```

---

## 🧪 **ÉTAPE 4 : Tester l'envoi (5 min)**

### 4.1 Test depuis l'app mobile

1. Lance l'app Corail sur ton simulateur/appareil
2. Aller dans **Devis** → **Créer un devis**
3. Remplir :
   - Nom : Test Client
   - **Email : ton-email@gmail.com** ← TON EMAIL PERSO !
   - Téléphone : (laisse vide si tu veux tester email uniquement)
   - Adresse départ : Aéroport Toulouse-Blagnac
   - Adresse arrivée : Gare Matabiau
   - Prix : 50€
4. Cliquer sur **Créer le devis**
5. Cliquer sur **📧 Envoyer par email**

### 4.2 Vérifier la réception

- ✅ Tu devrais recevoir l'email dans **1-5 secondes**
- ⚠️ **Expéditeur : `Corail App <noreply@resend.dev>`** (domaine par défaut)
- ✅ Design brandé avec gradient violet/bleu
- ✅ Bouton "Consulter mon devis" cliquable

**⚠️ Si l'email n'arrive pas :**
- Vérifie les spams/promotions
- Vérifie les logs (voir ci-dessous)

---

## 📊 **ÉTAPE 5 : Vérifier les logs**

### Logs Supabase

1. Dashboard Supabase → **Edge Functions**
2. Cliquer sur `send-quote-email`
3. Onglet **Logs**
4. Tu devrais voir :
   ```
   📧 Envoi email devis: { clientEmail: '...', clientName: '...', ... }
   ✅ Email envoyé avec succès: { id: 're_...' }
   ```

### Logs Resend

1. Dashboard Resend → **Logs**
2. Tu devrais voir l'email envoyé
3. Status : **Delivered** ✅

---

## ⚠️ **LIMITATIONS DU DOMAINE PAR DÉFAUT**

### Ce qui fonctionne :
- ✅ Envoi d'emails fonctionnel
- ✅ Design HTML/CSS complet
- ✅ Tracking des ouvertures/clics
- ✅ 3000 emails/mois gratuits

### Ce qui ne fonctionne PAS :
- ❌ Expéditeur = `noreply@resend.dev` (pas `devis@corail.app`)
- ❌ Peut finir en spam plus facilement
- ❌ Pas professionnel pour la prod

**→ Pour la prod, configure un domaine custom avec `SETUP_RESEND_EMAIL.md`**

---

## 🎯 **PROCHAINE ÉTAPE : DOMAINE CUSTOM**

Quand tu seras prêt à lancer en prod :

### 1. Acheter un domaine

**Recommandations :**
- **Porkbun** : ~10-15€/an, DNS gratuit
- **Namecheap** : ~12-20€/an
- **Google Domains** : ~15€/an

**Domaines disponibles :**
- `corail.app` (~20€/an)
- `corail.co` (~15€/an)
- `getcorail.com` (~12€/an)

### 2. Configurer Resend avec le domaine

Suis le guide complet : **`SETUP_RESEND_EMAIL.md`**

Changements :
- Ajouter le domaine dans Resend
- Configurer 3 DNS records (SPF, DKIM, MX)
- Emails envoyés depuis : `devis@corail.app` ✅

---

## ✅ **CHECKLIST FINALE (TEST)**

- [ ] Compte Resend créé
- [ ] API Key créée et copiée
- [ ] Secret `RESEND_API_KEY` ajouté dans Supabase
- [ ] Edge Function déployée (`supabase functions deploy`)
- [ ] Test d'envoi réussi (email reçu)
- [ ] Expéditeur = `Corail App <noreply@resend.dev>`
- [ ] Design brandé visible dans l'email

---

## ❓ **TROUBLESHOOTING**

### ❌ "Invalid API key"
- Vérifie que la clé est bien dans Supabase secrets
- Vérifie qu'elle commence par `re_`
- Redéploie la fonction après avoir ajouté le secret

### ❌ "Failed to send email"
- Vérifie les logs Supabase (Dashboard → Edge Functions → Logs)
- Vérifie les logs Resend (Dashboard → Logs)
- Vérifie que tu n'as pas dépassé 3000 emails/mois

### ❌ Email non reçu
- Vérifie les spams/promotions
- Vérifie l'email du destinataire (pas de typo)
- Vérifie les logs Resend pour le statut de livraison

---

## 🎉 **C'EST PRÊT !**

Tu peux maintenant tester l'envoi d'emails de devis **sans avoir à acheter un domaine** ! 🚀

**Durée totale : 15-20 minutes**

Quand tu seras prêt pour la prod, achète le domaine et suis `SETUP_RESEND_EMAIL.md`.

