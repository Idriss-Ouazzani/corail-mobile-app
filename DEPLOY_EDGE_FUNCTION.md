# 🚀 Déployer l'Edge Function `send-quote-email`

Ce guide explique comment déployer la fonction Supabase Edge Function pour l'envoi automatique d'emails de devis via Resend.io.

---

## 📋 **PRÉ-REQUIS**

Avant de déployer, assure-toi que :

1. ✅ **Supabase CLI est installé**
   ```bash
   # Vérifier si installé
   supabase --version
   
   # Si pas installé, installer avec Homebrew (macOS)
   brew install supabase/tap/supabase
   ```

2. ✅ **Tu es connecté à ton projet Supabase**
   ```bash
   supabase login
   ```

3. ✅ **Le dossier du projet est lié à Supabase**
   ```bash
   cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
   supabase link --project-ref <TON_PROJECT_REF>
   ```
   
   **Trouver ton `project-ref` :**
   - Va sur https://supabase.com/dashboard
   - Sélectionne ton projet Corail
   - Dans l'URL, tu verras : `https://supabase.com/dashboard/project/<project-ref>`
   - Copie le `project-ref` (exemple: `qeheawdjlwlkhnwbhqcg`)

4. ✅ **Resend.io est configuré** (voir `SETUP_RESEND_EMAIL.md`)

---

## 🔑 **ÉTAPE 1 : Configurer le secret RESEND_API_KEY**

L'Edge Function a besoin de la clé API Resend pour fonctionner.

### Option A : Via le Dashboard Supabase (RECOMMANDÉ)

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet Corail
3. Va dans **Settings** → **Edge Functions**
4. Clique sur **Manage secrets**
5. Ajoute un nouveau secret :
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (ta clé Resend)
6. **Save**

### Option B : Via la CLI

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --project-ref <TON_PROJECT_REF>
```

---

## 🚀 **ÉTAPE 2 : Déployer l'Edge Function**

### 2.1 Vérifier que la fonction existe

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
ls -la supabase/functions/send-quote-email/
```

Tu devrais voir :
- `index.ts` (le code de la fonction)
- `deno.json` (la config Deno)

### 2.2 Déployer la fonction

```bash
supabase functions deploy send-quote-email --project-ref <TON_PROJECT_REF>
```

**Exemple :**
```bash
supabase functions deploy send-quote-email --project-ref qeheawdjlwlkhnwbhqcg
```

**Output attendu :**
```
Deploying Function send-quote-email (project ref: qeheawdjlwlkhnwbhqcg)
Bundling send-quote-email
Deploying send-quote-email (version: xxxx-xxxx-xxxx)
✅ Deployed Function send-quote-email in 2.3s
```

### 2.3 Vérifier le déploiement

```bash
supabase functions list --project-ref <TON_PROJECT_REF>
```

Tu devrais voir :
```
┌──────────────────┬───────┬──────────┬────────────────────┐
│ NAME             │ VER   │ STATUS   │ CREATED            │
├──────────────────┼───────┼──────────┼────────────────────┤
│ send-quote-email │ 1     │ ACTIVE   │ 2026-01-26 10:30   │
└──────────────────┴───────┴──────────┴────────────────────┘
```

---

## 🧪 **ÉTAPE 3 : Tester la fonction**

### 3.1 Test via cURL (optionnel)

```bash
curl -i --location --request POST 'https://<TON_PROJECT_REF>.supabase.co/functions/v1/send-quote-email' \
  --header 'Authorization: Bearer <TON_ANON_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "clientEmail": "ton-email@gmail.com",
    "clientName": "Test Client",
    "quoteUrl": "https://corail.vercel.app/q/test123",
    "price": "50",
    "date": "26/01",
    "time": "14h30",
    "pickupAddress": "Aéroport Toulouse-Blagnac",
    "dropoffAddress": "Gare Matabiau"
  }'
```

**Trouver ton `ANON_KEY` :**
- Dashboard Supabase → Settings → API
- Copie `anon` / `public` key

### 3.2 Test via l'app mobile (RECOMMANDÉ)

1. Lance l'app Corail sur ton simulateur/appareil
2. Va dans **Devis** → **Créer un devis**
3. Remplis le formulaire :
   - Nom : Test Client
   - **Email : ton-email@gmail.com** ← TON EMAIL !
   - Téléphone : (laisse vide ou remplis)
   - Adresse départ/arrivée
   - Prix : 50€
4. Clique sur **Créer le devis**
5. Clique sur **📧 Envoyer par email**

**Résultat attendu :**
- Toast "✅ Email envoyé !"
- Email reçu dans 1-5 secondes
- Expéditeur : `Corail App <devis@corail.app>`

---

## 📊 **ÉTAPE 4 : Vérifier les logs**

### Logs Supabase

1. Dashboard Supabase → **Edge Functions**
2. Clique sur `send-quote-email`
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
4. Clique dessus pour voir :
   - Heure d'envoi
   - Destinataire
   - Statut de livraison

---

## ❌ **TROUBLESHOOTING**

### ❌ "Invalid API key" ou "API key not configured"

**Cause :** Le secret `RESEND_API_KEY` n'est pas configuré ou incorrect.

**Solution :**
1. Vérifie que la clé est bien ajoutée dans Supabase secrets
2. Vérifie qu'elle commence par `re_`
3. Redéploie la fonction après avoir ajouté le secret :
   ```bash
   supabase functions deploy send-quote-email --project-ref <TON_PROJECT_REF>
   ```

### ❌ "Failed to send email"

**Cause :** Problème avec Resend (domaine non vérifié, quota dépassé, etc.).

**Solution :**
1. Vérifie que ton domaine est vérifié dans Resend Dashboard
2. Vérifie que tu n'as pas dépassé 3000 emails/mois (plan FREE)
3. Regarde les logs Resend pour plus de détails

### ❌ "Function not found"

**Cause :** La fonction n'est pas déployée ou le nom est incorrect.

**Solution :**
1. Liste les fonctions déployées :
   ```bash
   supabase functions list --project-ref <TON_PROJECT_REF>
   ```
2. Redéploie si nécessaire :
   ```bash
   supabase functions deploy send-quote-email --project-ref <TON_PROJECT_REF>
   ```

### ❌ Email non reçu

**Cause :** Email dans spam, mauvais destinataire, ou quota Resend dépassé.

**Solution :**
1. Vérifie les spams/promotions
2. Vérifie l'email du destinataire (pas de typo)
3. Vérifie les logs Resend Dashboard
4. Vérifie que tu n'as pas dépassé 3000 emails/mois

---

## ✅ **CHECKLIST FINALE**

Avant de considérer le déploiement terminé :

- [ ] Supabase CLI installé et connecté
- [ ] Projet lié avec `supabase link`
- [ ] Secret `RESEND_API_KEY` configuré
- [ ] Edge Function déployée (`supabase functions deploy`)
- [ ] Fonction visible dans `supabase functions list`
- [ ] Test d'envoi réussi (email reçu)
- [ ] Logs Supabase et Resend vérifiés

---

## 🎉 **C'EST PRÊT !**

Une fois toutes ces étapes complétées, les chauffeurs pourront envoyer des devis par email en 1 clic avec un rendu professionnel brandé Corail App ! 🚀

**Durée totale estimée : 10-15 minutes**

