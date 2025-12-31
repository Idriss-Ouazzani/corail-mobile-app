# 🔧 Fix erreur RLS pour les devis

## ⚠️ Problème
Quand vous créez un devis, vous avez l'erreur :
```
new row violates row-level security policy for table "quotes"
```

## ✅ Solution (1 minute)

### Étape 1 : Ouvrir Supabase SQL Editor
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **Corail**
3. Dans le menu de gauche, cliquez sur **SQL Editor** 🗃️
4. Cliquez sur **New query** ➕

### Étape 2 : Copier le script SQL
Ouvrez le fichier suivant et **copiez TOUT le contenu** :
```
supabase/migrations/005_fix_quotes_rls.sql
```

### Étape 3 : Exécuter le script
1. **Collez le contenu** dans l'éditeur SQL
2. Cliquez sur **Run** (en bas à droite) ▶️
3. Vous devriez voir : ✅ **Success. No rows returned**

### Étape 4 : Tester
1. **Rechargez votre app Expo** (secouez → Reload)
2. Allez dans **Outils** → **Créer un devis**
3. Remplissez le formulaire et cliquez sur **Envoyer**
4. ✅ Ça devrait fonctionner maintenant !

---

## 📝 Ce que le script fait

Le script corrige les permissions (RLS) pour permettre :
- ✅ Insertion de nouveaux devis par les drivers
- ✅ Consultation des devis
- ✅ Modification des devis
- ✅ Suppression des devis

---

## ❓ En cas de problème

Si vous avez toujours l'erreur :
1. Vérifiez que le script s'est bien exécuté (pas d'erreur rouge)
2. Relancez l'app Expo complètement (fermez et rouvrez)
3. Vérifiez que vous êtes bien connecté dans l'app

---

**Après avoir exécuté ce script, le système de devis devrait fonctionner parfaitement ! 🚀**

