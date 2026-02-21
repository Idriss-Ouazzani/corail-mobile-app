# 🌐 Guide Complet : Configuration Domaine + Email + Hébergement

**Objectif :** Avoir `corail.com` + emails `contact@corail.com` + hébergement web pro pour **9€/an**

**Durée totale :** ~1 heure

---

## 📋 Ce que tu vas avoir à la fin

✅ Domaine : `corail.com`  
✅ Emails : `contact@corail.com`, `noreply@corail.com`, etc.  
✅ Site web : `https://corail.com` (avec SSL)  
✅ Emails transactionnels : Pour Supabase Auth  
✅ Total : **9€/an**

---

## 🎯 Étape 1 : Acheter le domaine (10 min)

### 1.1 Vérifier la disponibilité

Va sur **https://porkbun.com** et cherche `corail.com`

Si pris, essaie :
- `corail.app` (16€/an mais moderne)
- `corailapp.com` (9€/an)
- `getcorail.com` (9€/an)

### 1.2 Acheter le domaine

1. **Ajoute au panier**
2. **Décocher** les options payantes :
   - ❌ Domain Privacy (déjà inclus gratuit chez Porkbun ✅)
   - ❌ Email forwarding (on utilisera Cloudflare gratuit)
3. **Créer un compte** Porkbun
4. **Payer** : ~9-12€ selon le domaine

✅ **Tu as maintenant ton domaine !**

---

## 🌩️ Étape 2 : Configurer Cloudflare (15 min)

Cloudflare va gérer :
- DNS (gratuit et rapide)
- Email routing (gratuit)
- Protection DDoS (gratuit)
- CDN (gratuit)

### 2.1 Créer un compte Cloudflare

1. Va sur **https://cloudflare.com**
2. **Sign up** (gratuit)
3. Confirme ton email

### 2.2 Ajouter ton domaine à Cloudflare

1. Clique sur **"Add a site"**
2. Entre `corail.com`
3. Choisis le plan **"Free"** (0€)
4. Clique sur **"Continue"**

### 2.3 Configurer les nameservers

Cloudflare va te donner 2 nameservers du genre :
```
liam.ns.cloudflare.com
maya.ns.cloudflare.com
```

**Retourne sur Porkbun :**

1. Va dans **"Domain Management"**
2. Clique sur `corail.com`
3. Trouve **"Authoritative Nameservers"**
4. Clique sur **"Update"**
5. Change vers **"Use other nameservers"**
6. Entre les 2 nameservers de Cloudflare
7. **Save**

⏰ **Attends 10-30 minutes** (propagation DNS)

Cloudflare te notifiera par email quand c'est actif.

✅ **Ton domaine est maintenant sur Cloudflare !**

---

## 📧 Étape 3 : Configurer les emails (15 min)

### 3.1 Activer Email Routing dans Cloudflare

1. Dans Cloudflare Dashboard, va dans **"Email"** → **"Email Routing"**
2. Clique sur **"Get started"**
3. Cloudflare va automatiquement configurer les MX records
4. Clique sur **"Enable Email Routing"**

### 3.2 Créer des adresses de redirection

1. Dans **"Destination addresses"**, clique sur **"Add destination"**
2. Entre ton Gmail : `mydrissouazzani@gmail.com`
3. **Vérifie ton Gmail** (email de confirmation de Cloudflare)
4. Clique sur le lien de confirmation

### 3.3 Créer les redirections

Clique sur **"Routing rules"** → **"Create address"** :

**Adresse 1 :**
- From : `contact@corail.com`
- To : `mydrissouazzani@gmail.com`

**Adresse 2 :**
- From : `noreply@corail.com`
- To : `mydrissouazzani@gmail.com`

**Adresse 3 :**
- From : `support@corail.com`
- To : `mydrissouazzani@gmail.com`

✅ **Tu reçois maintenant tous les emails @corail.com dans ton Gmail !**

### 3.4 Envoyer depuis Gmail en tant que @corail.com

1. Ouvre **Gmail** → **Paramètres** (roue crantée) → **Voir tous les paramètres**
2. Va dans l'onglet **"Comptes et importation"**
3. Clique sur **"Ajouter une autre adresse e-mail"**
4. Entre :
   - Nom : `Corail`
   - Email : `contact@corail.com`
   - ❌ Décocher "Traiter comme un alias"
5. **Étape suivante**
6. **Serveur SMTP :** (on va utiliser Gmail)
   - Serveur SMTP : `smtp.gmail.com`
   - Port : `587`
   - Nom d'utilisateur : `mydrissouazzani@gmail.com`
   - Mot de passe : **Mot de passe d'application** (voir ci-dessous)

**Créer un mot de passe d'application Gmail :**
1. Va sur **https://myaccount.google.com/apppasswords**
2. Si 2FA pas activé → Active-le d'abord
3. Crée un mot de passe d'application :
   - App : "Mail"
   - Appareil : "Autre" → "Corail"
4. **Copie le mot de passe** généré
5. Utilise-le dans Gmail SMTP

7. **Ajouter le compte**
8. **Vérifie** (Gmail t'envoie un code à `contact@corail.com`)
9. Récupère le code dans ton Gmail (via Cloudflare routing)
10. Entre le code

✅ **Tu peux maintenant envoyer des emails depuis `contact@corail.com` !**

---

## 🔐 Étape 4 : Configurer Resend.io pour emails transactionnels (10 min)

Resend.io va envoyer les emails de confirmation Supabase depuis `noreply@corail.com`

### 4.1 Créer un compte Resend

1. Va sur **https://resend.com**
2. **Sign up** (gratuit)
3. Confirme ton email

### 4.2 Ajouter ton domaine

1. Dans Resend, va dans **"Domains"**
2. Clique sur **"Add Domain"**
3. Entre `corail.com`
4. Resend va te donner des **DNS records** à ajouter

### 4.3 Ajouter les DNS records dans Cloudflare

Retourne sur **Cloudflare** → **DNS** → **Records**

Ajoute les records donnés par Resend (exemple) :

**Record 1 : SPF**
- Type : `TXT`
- Name : `@`
- Content : `v=spf1 include:_spf.resend.com ~all`

**Record 2 : DKIM**
- Type : `TXT`
- Name : `resend._domainkey`
- Content : `[clé donnée par Resend]`

**Record 3 : DMARC**
- Type : `TXT`
- Name : `_dmarc`
- Content : `v=DMARC1; p=none;`

Clique sur **"Save"** pour chaque record.

### 4.4 Vérifier dans Resend

Retourne sur Resend et clique sur **"Verify Domain"**

⏰ Ça peut prendre 5-10 minutes

✅ **Status : Verified** 🎉

### 4.5 Créer une API Key

1. Va dans **"API Keys"**
2. Clique sur **"Create API Key"**
3. Nom : `Supabase Auth`
4. Permission : `Sending access`
5. **Copie la clé** : `re_XXXXXXXXXXXXXXX`

✅ **Tu peux maintenant envoyer des emails transactionnels !**

---

## 🌐 Étape 5 : Héberger le site web sur Vercel (10 min)

### 5.1 Préparer le site

Dans ton projet Corail, la page `public/confirm-email.html` existe déjà.

Crée un fichier `vercel.json` à la racine :

```json
{
  "rewrites": [
    { "source": "/confirm-email", "destination": "/public/confirm-email.html" }
  ]
}
```

### 5.2 Déployer sur Vercel

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# Installer Vercel CLI (si pas déjà fait)
npm install -g vercel

# Déployer
vercel

# Suivre les prompts :
# - Set up and deploy? Yes
# - Which scope? [ton compte]
# - Link to existing project? No
# - Project name? corail-app
# - Directory? ./
# - Override settings? No

# Une fois déployé, tu auras une URL :
# https://corail-app.vercel.app
```

### 5.3 Ajouter le domaine custom

1. Dans Vercel Dashboard, va dans **"Settings"** → **"Domains"**
2. Ajoute `corail.com` et `www.corail.com`
3. Vercel va te donner des **DNS records**

### 5.4 Ajouter les DNS records dans Cloudflare

Retourne sur **Cloudflare** → **DNS** → **Records**

**Record 1 : Domaine principal**
- Type : `CNAME`
- Name : `@`
- Target : `cname.vercel-dns.com`
- Proxy status : **Proxied** (nuage orange)

**Record 2 : www**
- Type : `CNAME`
- Name : `www`
- Target : `cname.vercel-dns.com`
- Proxy status : **Proxied**

**Save**

⏰ Attends 5-10 minutes

✅ **Ton site est en ligne sur `https://corail.com` !**

---

## 🔗 Étape 6 : Configurer Supabase avec Resend (10 min)

### 6.1 Configurer SMTP dans Supabase

**Supabase Dashboard → Project Settings → Auth → SMTP Settings :**

1. **Enable Custom SMTP** : ✅ ON
2. **Sender email** : `noreply@corail.com`
3. **Sender name** : `Corail`
4. **Host** : `smtp.resend.com`
5. **Port** : `465` (ou `587` pour TLS)
6. **Username** : `resend`
7. **Password** : Ta clé API Resend `re_XXXXXXX`
8. **Save**

### 6.2 Mettre à jour les URLs de redirection

**Authentication → URL Configuration :**

- **Site URL** : `https://corail.com/confirm-email`
- **Redirect URLs** :
  ```
  https://corail.com/**
  http://localhost:8081/**
  exp://localhost:19000/**
  ```

### 6.3 Mettre à jour les templates email

**Authentication → Email Templates → Confirm signup :**

Le template que tu as déjà créé va maintenant envoyer depuis `noreply@corail.com` ! 🎉

✅ **Les emails d'authentification seront envoyés depuis ton domaine !**

---

## ✅ Vérification finale

### Checklist complète

- [ ] ✅ Domaine acheté sur Porkbun
- [ ] ✅ Nameservers pointent vers Cloudflare
- [ ] ✅ Email Routing actif dans Cloudflare
- [ ] ✅ Tu reçois les emails @corail.com dans ton Gmail
- [ ] ✅ Tu peux envoyer depuis Gmail en tant que @corail.com
- [ ] ✅ Resend configuré et vérifié
- [ ] ✅ Site déployé sur Vercel
- [ ] ✅ `corail.com` accessible en HTTPS
- [ ] ✅ Supabase SMTP configuré avec Resend
- [ ] ✅ Email de confirmation fonctionne

---

## 🧪 Tester l'email de confirmation

1. **Supprime ton compte** dans Supabase (Authentication → Users)
2. **Inscris-toi** dans l'app
3. **Tu reçois l'email** depuis `noreply@corail.com` ✅
4. **Clique sur le lien**
5. Tu arrives sur `https://corail.com/confirm-email`
6. **Connexion automatique** ! 🎉

---

## 💰 Récapitulatif des coûts

| Service | Coût | Renouvellement |
|---------|------|----------------|
| **Domaine (Porkbun)** | 9€/an | 9€/an (stable) |
| **Cloudflare** | Gratuit | Gratuit |
| **Resend** | Gratuit | Gratuit (3k emails/mois) |
| **Vercel** | Gratuit | Gratuit |
| **TOTAL** | **9€/an** | **9€/an** |

---

## 📞 Support

Si tu bloques à une étape :
- Cloudflare : https://community.cloudflare.com
- Resend : https://resend.com/docs
- Vercel : https://vercel.com/docs

Ou demande-moi ! 😊

---

## 🚀 Prochaines étapes (plus tard)

Une fois que tout fonctionne, tu pourras :
- Ajouter des analytics (Plausible/Umami gratuits)
- Configurer un blog (si besoin)
- Ajouter plus d'emails (@corail.com)
- Upgrader vers Google Workspace (quand rentable)

**Bonne chance ! 🎉**

