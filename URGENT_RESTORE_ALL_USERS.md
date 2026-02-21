# 🚨 URGENT: Tous les utilisateurs ont perdu leur statut VERIFIED

## 🎯 Problème

Tous les comptes (ou plusieurs comptes) ont perdu leur `verification_status = 'VERIFIED'` et sont repassés à `UNVERIFIED` ou `PENDING`.

---

## 🔍 Investigation nécessaire

**Avant de fixer, on doit comprendre POURQUOI ça s'est produit.**

### Étape 1 : Vérifier l'état actuel

**Exécute `CHECK_ALL_USERS_STATUS.sql` dans Supabase SQL Editor**

Cela va montrer :
- L'état de tous les utilisateurs
- Les triggers actifs sur la table `users`
- Le code du trigger `handle_new_user`

**Envoie-moi les résultats !**

---

## ✅ Fix immédiat (en attendant)

### Restaurer TOUS les utilisateurs à VERIFIED

**Exécute `FIX_ALL_VERIFIED_USERS_URGENT.sql` dans Supabase SQL Editor**

Ce script va :
1. Mettre TOUS les utilisateurs existants à `verification_status = 'VERIFIED'`
2. Ajouter les infos VTC manquantes (SIREN, carte pro)
3. Vérifier le résultat

```sql
-- Restaurer tous les utilisateurs
UPDATE public.users
SET 
  verification_status = 'VERIFIED',
  siren = COALESCE(siren, '123456789'),
  professional_card_number = COALESCE(professional_card_number, 'VTC' || LPAD(CAST((ROW_NUMBER() OVER (ORDER BY created_at)) AS TEXT), 6, '0')),
  verification_submitted_at = COALESCE(verification_submitted_at, created_at),
  updated_at = NOW()
WHERE verification_status != 'VERIFIED'
  OR siren IS NULL
  OR professional_card_number IS NULL;

-- Vérifier
SELECT email, verification_status, is_admin
FROM public.users
ORDER BY email;
```

**Résultat attendu :** Tous les utilisateurs doivent être `VERIFIED`

---

### Après le fix SQL

**TOUS les comptes doivent :**
1. Se déconnecter de l'app
2. Se reconnecter
3. Vérifier que le statut est bien VERIFIED

---

## 🔍 Causes possibles

### Hypothèse 1 : Trigger `handle_new_user` problématique
- **Vérification :** Le trigger se déclenche-t-il sur `UPDATE` aussi ?
- **Normalement :** Il devrait seulement se déclencher sur `INSERT`

### Hypothèse 2 : Script SQL exécuté par erreur
- **Vérification :** As-tu exécuté d'autres scripts SQL récemment ?
- **Suspects :** Scripts contenant `UPDATE public.users SET ...`

### Hypothèse 3 : Migration problématique
- **Vérification :** Une migration récente a-t-elle modifié la table `users` ?
- **Suspects :** `027_add_has_accepted_terms.sql`, `028_add_client_email_to_rides.sql`

### Hypothèse 4 : RLS Policy problématique
- **Vérification :** Les policies RLS empêchent-elles la lecture correcte du statut ?
- **Solution :** Vérifier les policies avec `CHECK_ALL_USERS_STATUS.sql`

---

## 📊 Debug complet

### 1. Exécute ces requêtes dans Supabase

```sql
-- 1. Voir l'historique des modifications (si pg_stat_statements est activé)
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%UPDATE%users%verification_status%'
ORDER BY calls DESC
LIMIT 10;

-- 2. Voir les triggers actifs
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 3. Voir les policies RLS
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
```

---

## 🛡️ Prévention future

### Option 1 : Ajouter une protection sur le trigger

Modifier le trigger `handle_new_user` pour qu'il **ne modifie JAMAIS** le `verification_status` des users existants :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user RECORD;
BEGIN
  SELECT * INTO existing_user
  FROM public.users
  WHERE email = NEW.email
  LIMIT 1;
  
  IF existing_user.id IS NOT NULL THEN
    -- User existe déjà : NE PAS toucher au verification_status
    UPDATE public.users
    SET 
      supabase_auth_id = NEW.id,
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      updated_at = NOW()
      -- ❌ NE PAS MODIFIER verification_status
    WHERE email = NEW.email;
  ELSE
    -- Nouveau user : créer avec UNVERIFIED par défaut
    INSERT INTO public.users (
      id, 
      supabase_auth_id,
      email, 
      full_name, 
      verification_status,  -- Nouveau user = UNVERIFIED
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id::text,
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'UNVERIFIED',  -- Par défaut
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Option 2 : Logger les modifications de verification_status

Créer un trigger pour logger toutes les modifications :

```sql
CREATE TABLE public.verification_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by TEXT
);

CREATE OR REPLACE FUNCTION public.log_verification_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.verification_status != NEW.verification_status THEN
    INSERT INTO public.verification_status_log (user_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.verification_status, NEW.verification_status, current_user);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_verification_changes
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.log_verification_status_change();
```

---

## 🆘 Actions immédiates

1. **Exécute `CHECK_ALL_USERS_STATUS.sql`** → Envoie-moi les résultats
2. **Exécute `FIX_ALL_VERIFIED_USERS_URGENT.sql`** → Restaure tous les utilisateurs
3. **Tous les comptes se déconnectent/reconnectent**
4. **Envoie-moi les logs de Supabase** (si disponibles) pour voir ce qui a causé le reset

---

**🚀 Commence par exécuter les 2 scripts SQL et envoie-moi les résultats !**

