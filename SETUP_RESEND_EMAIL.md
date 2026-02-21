# 📧 Configuration Resend.io pour Corail App

Guide complet pour configurer l'envoi automatique d'emails de devis.

---

## 🎯 **OBJECTIF**

Permettre aux chauffeurs d'envoyer des devis VTC par email automatiquement avec :
- ✅ Branding "Corail App"
- ✅ Envoi depuis `devis@corail.app`
- ✅ Templates HTML professionnels
- ✅ Tracking des ouvertures
- ✅ **GRATUIT** jusqu'à 3000 emails/mois

---

## 📋 **ÉTAPE 1 : Créer le compte Resend.io (5 min)**

### 1.1 Inscription
1. Aller sur https://resend.com
2. Cliquer sur "Get Started" ou "Sign Up"
3. S'inscrire avec un email (utilise ton email perso ou pro)
4. Vérifier l'email de confirmation

### 1.2 Vérifier le plan
- Tu devrais être sur le plan **FREE** (3000 emails/mois)
- C'est suffisant pour la beta !

---

## 🌐 **ÉTAPE 2 : Configurer le domaine (15 min)**

### 2.1 Ajouter le domaine dans Resend

1. Dans Resend Dashboard → **Domains** → **Add Domain**
2. Entrer : `corail.app`
3. Cliquer sur **Add**

### 2.2 Récupérer les DNS records

Resend va te donner **3 records DNS** à ajouter :

| Type | Name | Value |
|------|------|-------|
| **TXT** | `@` ou `corail.app` | `v=spf1 include:_spf.resend.com ~all` |
| **TXT** | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3...` (longue clé) |
| **MX** | `@` ou `corail.app` | `feedback-smtp.resend.com` (priorité 10) |

**⚠️ IMPORTANT :** Note bien ces 3 records, tu vas les ajouter dans Cloudflare.

### 2.3 Ajouter les records DNS dans Cloudflare

1. Aller sur https://dash.cloudflare.com
2. Sélectionner le domaine `corail.app`
3. Aller dans **DNS** → **Records**
4. Ajouter les 3 records un par un :

#### Record 1 : SPF (TXT)
- Type : `TXT`
- Name : `@`
- Content : `v=spf1 include:_spf.resend.com ~all`
- TTL : Auto
- Proxy status : DNS only (nuage gris)
- **Save**

#### Record 2 : DKIM (TXT)
- Type : `TXT`
- Name : `resend._domainkey`
- Content : `p=MIGfMA0GCSqGSIb3...` (la longue clé fournie par Resend)
- TTL : Auto
- Proxy status : DNS only (nuage gris)
- **Save**

#### Record 3 : MX (Mail Exchange)
- Type : `MX`
- Name : `@`
- Mail server : `feedback-smtp.resend.com`
- Priority : `10`
- TTL : Auto
- **Save**

### 2.4 Vérifier la configuration

1. Retourner sur Resend Dashboard
2. Dans **Domains**, cliquer sur `corail.app`
3. Cliquer sur **Verify DNS Records**
4. ⏳ Attendre 1-5 minutes (propagation DNS)
5. ✅ Le statut devrait passer à **Verified**

**Si ça ne marche pas :**
- Attendre 10-15 minutes (propagation DNS peut être lente)
- Vérifier que tu as bien copié les valeurs EXACTES
- Vérifier que le Proxy est désactivé (nuage gris) dans Cloudflare

---

## 🔑 **ÉTAPE 3 : Créer l'API Key (2 min)**

### 3.1 Générer la clé

1. Dans Resend Dashboard → **API Keys**
2. Cliquer sur **Create API Key**
3. Name : `Corail App - Production`
4. Permission : **Full Access** (ou "Sending access" si disponible)
5. Cliquer sur **Create**

### 3.2 Copier la clé

⚠️ **IMPORTANT** : La clé ne s'affichera **QU'UNE SEULE FOIS** !

```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copie-la immédiatement** dans un endroit sûr (Notes, 1Password, etc.).

### 3.3 Ajouter la clé dans Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner ton projet Corail
3. Aller dans **Settings** → **Edge Functions**
4. Cliquer sur **Manage secrets**
5. Ajouter un nouveau secret :
   - Name : `RESEND_API_KEY`
   - Value : `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (ta clé)
6. **Save**

---

## 🧪 **ÉTAPE 4 : Tester l'envoi (après déploiement de l'Edge Function)**

### 4.1 Test depuis l'app

1. Ouvrir l'app Corail
2. Aller dans **Devis** → **Créer un devis**
3. Remplir :
   - Nom : Test Client
   - **Email : ton-email@gmail.com** ← TON EMAIL !
   - Adresse départ/arrivée
   - Prix : 50€
4. Cliquer sur **Créer le devis**
5. Cliquer sur **📧 Envoyer par email**

### 4.2 Vérifier la réception

- ✅ Tu devrais recevoir l'email dans **1-5 secondes**
- ✅ Expéditeur : `Corail App <devis@corail.app>`
- ✅ Design brandé avec logo Corail (si configuré)
- ✅ Bouton "Consulter mon devis" cliquable

### 4.3 Vérifier les logs Resend

1. Dans Resend Dashboard → **Logs**
2. Tu devrais voir l'email envoyé
3. Status : **Delivered** ✅
4. Tu peux voir :
   - Date/heure d'envoi
   - Statut de livraison
   - Ouvertures (si le client ouvre l'email)
   - Clics (si le client clique sur le lien)

---

## 📊 **MONITORING**

### Suivre ta consommation

1. Resend Dashboard → **Usage**
2. Tu verras :
   - Nombre d'emails envoyés ce mois
   - Quota restant (3000 - envoyés)
   - Taux de livraison

### Limites du plan FREE

- ✅ **3000 emails/mois**
- ✅ Domaine custom
- ✅ Tracking illimité
- ✅ Support par email

**Si tu dépasses 3000/mois :**
- Passer au plan Pro ($20/mois = 50,000 emails)
- Ou attendre le mois prochain

---

## ❓ **TROUBLESHOOTING**

### ❌ "Domain not verified"
- Attendre 15-30 minutes (propagation DNS)
- Vérifier les DNS records dans Cloudflare
- Désactiver le proxy Cloudflare (nuage gris)

### ❌ "Invalid API key"
- Vérifier que la clé commence par `re_`
- Vérifier qu'elle est bien dans Supabase secrets
- Redéployer l'Edge Function après avoir ajouté le secret

### ❌ Email non reçu
- Vérifier les spams/promotions
- Vérifier les logs Resend (Dashboard → Logs)
- Vérifier l'email du destinataire (pas de typo)

### ❌ "Failed to send email"
- Vérifier que l'Edge Function est déployée
- Vérifier les logs Supabase (Dashboard → Edge Functions → Logs)
- Vérifier que `RESEND_API_KEY` est bien configuré

---

## ✅ **CHECKLIST FINALE**

Avant de considérer la config terminée :

- [ ] Compte Resend créé et vérifié
- [ ] Domaine `corail.app` ajouté dans Resend
- [ ] 3 DNS records ajoutés dans Cloudflare (SPF, DKIM, MX)
- [ ] Domaine vérifié dans Resend (statut "Verified")
- [ ] API Key créée et copiée
- [ ] API Key ajoutée dans Supabase secrets (`RESEND_API_KEY`)
- [ ] Edge Function déployée (`send-quote-email`)
- [ ] Test d'envoi réussi (email reçu)
- [ ] Email affiché avec le bon expéditeur (`devis@corail.app`)

---

## 🎉 **TU ES PRÊT !**

Une fois cette configuration terminée, les chauffeurs pourront envoyer des devis par email en 1 clic avec un rendu professionnel ! 🚀

**Durée totale estimée : 30-45 minutes** (incluant l'attente de propagation DNS)

