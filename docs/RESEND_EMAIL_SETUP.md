# Emails Resend : faire fonctionner l'envoi

## Envoi fiable : Database Webhook (recommandé)

Pour que l'email « réservation acceptée » parte **toujours** (même si l'app ne peut pas appeler l'Edge Function), configure un **Database Webhook** Supabase. L'email est alors envoyé côté serveur dès qu'une ligne est insérée dans `personal_rides` (source = Page Pro).

### 1. Secret pour le webhook

L'Edge Function a besoin de lire le chauffeur depuis la table `users`. Ajoute le secret :

1. **Supabase** → **Project Settings** → **Edge Functions** → **Secrets**
2. Ajoute (si pas déjà fait) :
   - **Name :** `SERVICE_ROLE_KEY`
   - **Value :** ta clé Service Role (Project Settings → API → clé `service_role`, bouton Reveal)

*(Supabase n’accepte pas les noms de secrets commençant par `SUPABASE_`, d’où `SERVICE_ROLE_KEY`. `SUPABASE_URL` est déjà fourni aux Edge Functions.)*

### 2. Créer le webhook

1. **Supabase** → **Database** → **Webhooks** (ou **Integrations** → **Webhooks** selon l'interface)
2. **Create a new hook**
3. **Table :** `personal_rides`
4. **Events :** cocher **Insert**
5. **Type :** HTTP Request
6. **URL :**  
   `https://<TON_PROJECT_REF>.supabase.co/functions/v1/send-booking-accepted-email`  
   (remplace `<TON_PROJECT_REF>` par l'ID de ton projet Supabase, visible dans l'URL du dashboard)
7. **HTTP method :** POST
8. Enregistre le webhook.

Après ça, à chaque création d'une course « Page Pro » (`personal_rides` avec `source = 'DIRECT_CLIENT'` et `client_email` renseigné), Supabase enverra le payload à l'Edge Function qui enverra l'email au client. Les logs apparaîtront dans **Edge Functions** → **send-booking-accepted-email** → **Logs**.

### Test rapide (sans refaire une vraie résa)

**Option A – Invoke manuel**  
Supabase → **Edge Functions** → **send-booking-accepted-email** → **Invoke**. Dans le body JSON, colle par exemple :

```json
{
  "clientEmail": "ton-email@exemple.com",
  "clientName": "Test",
  "driverName": "Chauffeur Test",
  "driverPhone": "0612345678",
  "scheduledAt": "2025-02-15T14:00:00.000Z",
  "pickupAddress": "Paris Gare de Lyon",
  "dropoffAddress": "Aéroport CDG",
  "priceCents": 8500
}
```

Clique sur **Invoke**. Tu devrais recevoir l’email et voir les logs. Ça vérifie Resend + fonction sans passer par le site ni l’app.

**Option B – Test du webhook**  
Une fois le webhook créé : **Table Editor** → **personal_rides** → **Insert row** avec `source = DIRECT_CLIENT`, `client_email` = ton email, `driver_id` = un UUID existant dans `users`, plus les champs requis (adresses, `scheduled_at`, etc.). La sauvegarde déclenche le webhook → envoi de l’email.

---

## Pourquoi « ça ne marche que sur mon mail perso » ?

Sans **domaine vérifié** dans Resend, l'envoi est souvent limité :
- Soit Resend n'accepte d'envoyer qu'à l'adresse du compte (ton email perso),
- Soit l'expéditeur par défaut `onboarding@resend.dev` a des restrictions.

**Solution :** ajouter et **vérifier ton domaine** (ex. `getcorail.com`) dans Resend. Ensuite tu peux envoyer à n'importe quelle adresse depuis n'importe quelle adresse @ ce domaine (ex. `contact@getcorail.com`).

---

## Étapes dans Resend

1. **Resend Dashboard** → **Domains** → **Add Domain**
2. Saisis `getcorail.com` (ou le domaine que tu utilises pour le site).
3. Resend te donne **3 enregistrements DNS** à créer chez ton hébergeur de domaine :
   - **SPF** (TXT)
   - **DKIM** (TXT) 
   - **MX** (optionnel pour les bounces)
4. Ajoute ces enregistrements dans la zone DNS du domaine (où tu gères getcorail.com).
5. Dans Resend, clique sur **Verify**. Après vérification, tu peux envoyer depuis `*@getcorail.com`.

---

## Configurer l'expéditeur dans Supabase

Une fois le domaine vérifié dans Resend :

1. Supabase → **Edge Functions** → **Secrets**
2. Ajoute (ou modifie) :
   - **Name :** `RESEND_FROM_EMAIL`
   - **Value :** `GetCorail <contact@getcorail.com>`  
     (toute adresse @getcorail.com est utilisable si le domaine est vérifié dans Resend)

Les prochains emails (réservation acceptée, devis) partiront de cette adresse et pourront être envoyés à n'importe quel destinataire.

---

## Vérifier que la fonction est bien appelée

- **Logs Supabase** : Edge Functions → `send-booking-accepted-email` → **Logs**.  
  Tu dois voir au moins : `[send-booking-accepted-email] Invocation reçue`.
- **Console app (Metro)** : quand un chauffeur accepte une demande avec un email client, tu dois voir soit `📧 Envoi email réservation acceptée vers: xxx`, soit `📧 Pas d'email client sur la demande`.

Si les logs Supabase restent vides alors que tu vois le log « Envoi email… » dans l'app, l'appel vers Supabase échoue (réseau, URL du projet, etc.).

---

## Email de rappel 24h avant la course

Une **Edge Function** `send-booking-reminder-email` envoie au client un email de rappel 24h avant la course (même style que la confirmation).

**Côté Resend.io : rien à faire.** Même clé et même expéditeur que la confirmation.

**Pour tout configurer (cron inclus) en 6 étapes :** → **[RAPPEL_24H_ETAPES.md](./RAPPEL_24H_ETAPES.md)**
