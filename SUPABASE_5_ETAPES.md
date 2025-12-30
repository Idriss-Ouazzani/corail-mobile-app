# 🚀 MIGRATION SUPABASE - 5 ÉTAPES SIMPLES

## ⏱️ Temps total : 20 minutes

---

## ✅ ÉTAPE 1 : Créer le projet Supabase (10 min)

1. Allez sur **https://supabase.com**
2. Cliquez **"Start your project"**
3. Connectez-vous avec **GitHub**
4. Cliquez **"New Project"**
5. Remplissez :
   - **Project name** : `corail-vtc`
   - **Database password** : Cliquez "Generate" et **COPIEZ-LE** 📝
   - **Region** : `Europe (Frankfurt)` ou `Europe (Paris)`
   - **Pricing** : `Free`
6. Cliquez **"Create new project"**
7. ⏳ **Attendez 2-3 minutes** (la page se rafraîchit auto)

---

## ✅ ÉTAPE 2 : Récupérer vos credentials (2 min)

1. Dans Supabase, cliquez **⚙️ Settings** (en bas à gauche)
2. Cliquez **API**
3. **COPIEZ** ces 2 valeurs :

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

📋 **Gardez-les**, vous en aurez besoin !

---

## ✅ ÉTAPE 3 : Configurer dans l'app (1 min)

1. Dans Cursor, ouvrez **`src/lib/supabase.ts`**
2. Lignes 7-8, **remplacez** :

```typescript
const SUPABASE_URL = 'https://votre-projet.supabase.co';  // ← Votre URL ici
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5...';  // ← Votre key ici
```

3. **Sauvegardez** (Cmd+S)

---

## ✅ ÉTAPE 4 : Créer la base de données (5 min)

1. Dans Supabase, cliquez **</>** (**SQL Editor**)
2. Cliquez **"+ New query"**
3. Dans Cursor, ouvrez **`supabase/migrations/001_initial_schema.sql`**
4. **Sélectionnez TOUT** (Cmd+A)
5. **Copiez** (Cmd+C)
6. Dans Supabase SQL Editor, **Collez** (Cmd+V)
7. Cliquez **"Run"** ▶️
8. ✅ Devrait afficher **"Success. No rows returned"**

---

## ✅ ÉTAPE 5 : Vérifier (2 min)

1. Dans Supabase, cliquez **📊 Table Editor**
2. Vous devez voir **10 tables** :
   - users
   - rides
   - personal_rides
   - credits_ledger
   - badges
   - user_badges
   - groups
   - group_members
   - planning_events
   - activity_log

3. Cliquez sur **`badges`**
4. Vous devez voir **10 badges** 🏆 :
   - early-adopter
   - first-ride
   - ten-rides
   - generous
   - active-week
   - five-star
   - speed-demon
   - night-owl
   - marathon
   - community-hero

---

## 🎉 TERMINÉ !

Dites-moi simplement : **"C'est fait !"**

Et je vais automatiquement :
1. ✅ Créer l'API Supabase
2. ✅ Remplacer Databricks
3. ✅ Tester l'app
4. ✅ Commit & push sur GitHub

---

## 🆘 Problème ?

**Dites-moi à quelle étape vous bloquez !**

---

## 📊 Résultat attendu

Après migration :
- ⚡ Performance : < 100ms (vs 30-60s)
- 💰 Gratuit jusqu'à 50k requêtes/mois
- 🔥 Marketplace en temps réel
- 📊 Dashboard magnifique

---

**Commencez maintenant** : https://supabase.com

