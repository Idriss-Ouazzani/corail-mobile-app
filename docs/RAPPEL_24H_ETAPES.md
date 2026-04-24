# Rappel email client 24h avant — Étapes simples

Suivre ces étapes **dans l’ordre**. Une fois terminé, les clients recevront automatiquement un email de rappel 24h avant leur course.

---

## Étape 1 : Appliquer les migrations

Dans ton projet (terminal à la racine du repo) :

```bash
npx supabase db push
```

Ou, si tu appliques les migrations à la main : exécute au minimum les migrations **072** et **073** dans l’ordre (SQL Editor Supabase ou `supabase migration up`).

---

## Étape 2 : Déployer la fonction d’envoi du rappel

```bash
npx supabase functions deploy send-booking-reminder-email
```

Les secrets déjà configurés pour les autres emails (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SERVICE_ROLE_KEY`) sont utilisés aussi pour ce rappel. Rien à ajouter côté Resend.

---

## Étape 3 : Créer un secret pour le cron

1. Va dans **Supabase** → **Project Settings** → **Edge Functions** → **Secrets**.
2. Clique sur **Add new secret**.
3. **Name :** `CRON_SECRET`
4. **Value :** invente une chaîne secrète (ex. un long mot de passe), par ex. `MonMotDePasseCron24hSecret123`.
5. Enregistre.

Tu en auras besoin à l’étape 5.

---

## Étape 4 : Activer les extensions (si besoin)

1. **Supabase** → **Database** → **Extensions**.
2. Cherche **pg_cron** → active-la si ce n’est pas déjà fait.
3. Cherche **pg_net** → active-la si ce n’est pas déjà fait.

Si tu ne les vois pas, elles sont peut-être déjà activées par défaut. Passe à l’étape 5.

---

## Étape 5 : Mettre les infos du cron dans le Vault

1. **Supabase** → **SQL Editor** → **New query**.
2. Remplace dans le script ci-dessous :
   - `TON_PROJECT_REF` par l’ID de ton projet Supabase (dans l’URL du dashboard : `https://app.supabase.com/project/TON_PROJECT_REF`).
   - `TA_CHAINE_CRON_SECRET` par **exactement** la même valeur que le secret `CRON_SECRET` créé à l’étape 3.
3. Exécute la requête.

```sql
-- À exécuter une seule fois. Remplace TON_PROJECT_REF et TA_CHAINE_CRON_SECRET.
SELECT vault.create_secret(
  'https://TON_PROJECT_REF.supabase.co',
  'reminder_cron_project_url'
);
SELECT vault.create_secret(
  'TA_CHAINE_CRON_SECRET',
  'reminder_cron_secret'
);
```

Exemple si ton projet est `abcdefgh` et ton secret `MonSecret123` :

```sql
SELECT vault.create_secret(
  'https://abcdefgh.supabase.co',
  'reminder_cron_project_url'
);
SELECT vault.create_secret(
  'MonSecret123',
  'reminder_cron_secret'
);
```

---

## Étape 6 : Vérifier que le job cron est bien créé

1. **Supabase** → **Database** → **Cron Jobs** (ou **Integrations** → **Cron** selon l’interface).
2. Tu dois voir un job du type **send-booking-reminder-24h-daily**, qui tourne **tous les jours à 8h00 UTC** (9h Paris en hiver).

Si le job n’apparaît pas, exécute à la main la migration **073** (le fichier `073_cron_reminder_24h.sql`) dans le SQL Editor **après** avoir fait l’étape 5.

---

## Résumé

| Étape | Action |
|-------|--------|
| 1 | `npx supabase db push` (migrations 072 + 073) |
| 2 | `npx supabase functions deploy send-booking-reminder-email` |
| 3 | Créer le secret **CRON_SECRET** dans Edge Functions → Secrets |
| 4 | Activer **pg_cron** et **pg_net** dans Database → Extensions |
| 5 | Exécuter les 2 `vault.create_secret` dans SQL Editor (avec ton project ref et ton CRON_SECRET) |
| 6 | Vérifier que le job cron « send-booking-reminder-24h-daily » existe |

Ensuite, rien à faire : chaque jour à 8h UTC, le job appellera la fonction qui enverra les rappels pour les courses dans ~24h.

---

## Test manuel (optionnel)

Pour envoyer un rappel de test à ton propre email :

1. **Supabase** → **Edge Functions** → **send-booking-reminder-email** → **Invoke**.
2. Body (remplace l’email) :

```json
{
  "clientEmail": "ton-email@exemple.com",
  "clientName": "Toi",
  "driverName": "Chauffeur Test",
  "driverPhone": "0612345678",
  "scheduledAt": "2025-03-01T14:00:00.000Z",
  "pickupAddress": "Paris Gare de Lyon",
  "dropoffAddress": "Aéroport CDG",
  "priceCents": 8500
}
```

3. Clique sur **Invoke**. Tu devrais recevoir l’email de rappel.
