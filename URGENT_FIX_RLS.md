# 🔥 URGENT : Fix lecture publique des devis

## ❌ Problème identifié

Quand vous ouvrez le lien du devis, vous avez une erreur 404.

**Cause :** Row Level Security (RLS) bloque la lecture publique des devis.

```
❌ Erreur Supabase: {
  code: 'PGRST116',
  message: 'Cannot coerce the result to a single JSON object',
  details: 'The result contains 0 rows'
}
```

La page web utilise la clé `anon` (anonyme), mais nos policies RLS actuelles ne permettent pas de lire les devis avec une clé anonyme.

---

## ✅ Solution (1 minute)

### Exécuter le script SQL dans Supabase

1. **Allez sur** https://supabase.com/dashboard
2. **Sélectionnez** votre projet **Corail**
3. Cliquez sur **SQL Editor** 🗃️ (menu de gauche)
4. Cliquez sur **New query** ➕
5. **Copiez et collez** le script ci-dessous :

```sql
-- Permettre la lecture publique des devis via token
CREATE POLICY "Public can view quotes by token" 
  ON public.quotes 
  FOR SELECT 
  USING (true);
```

6. Cliquez sur **Run** ▶️
7. Vous devriez voir : ✅ **Success. No rows returned**

---

## 🧪 Tester après correction

1. Créez un **nouveau devis** dans l'app
2. Copiez le lien
3. Ouvrez le lien dans votre navigateur
4. ✅ La page du devis devrait s'afficher !

---

## 🔒 Sécurité

Cette policy est **sécurisée** car :
- ✅ Elle permet UNIQUEMENT la **lecture** (pas de modification)
- ✅ Le token est **unique et aléatoire** (12 caractères)
- ✅ C'est le **comportement attendu** pour un lien partageable
- ✅ Les actions (accepter/refuser) passent par des **fonctions sécurisées**

---

**Exécutez ce script SQL maintenant et testez ! 🚀**

