# 🐛 Debug : Devis n'apparaissent pas dans "Mes Devis"

## ✅ Corrections appliquées

### 1. Couleur du bouton "Mes Devis"
- ✅ Changé de violet (`#6366f1`, `#8b5cf6`) à jaune/orange (`#f59e0b`, `#f97316`)

### 2. Logs de debug ajoutés
- ✅ `MyQuotesScreen.tsx` : logs détaillés du chargement des devis
- ✅ `CreateRideScreen.tsx` : logs détaillés de la création du devis

---

## 🔍 Étapes de debug

### Étape 1 : Créer un nouveau devis
1. Allez dans **Courses > Mes Courses > Créer une course**
2. Remplissez les informations
3. Activez le toggle **"Générer un devis"**
4. Remplissez **Nom** et **Téléphone** du client
5. Cliquez sur **"Créer la course"**

### Étape 2 : Vérifier les logs de création
Dans la console Expo, vous devriez voir :
```
📄 Création du devis...
🔍 generateQuote: true
🔍 clientName: [nom du client]
🔍 clientPhone: [téléphone]
✅ Devis créé: [réponse]
✅ ID du devis: quote-xxxxx
✅ Token du devis: xxxxx
```

**❓ Questions à vérifier :**
- Est-ce que vous voyez ces logs ?
- Est-ce que l'ID du devis est affiché ?
- Est-ce qu'il y a une erreur ?

### Étape 3 : Ouvrir "Mes Devis"
1. Allez dans **Suivi > Mes Devis**

### Étape 4 : Vérifier les logs de chargement
Dans la console Expo, vous devriez voir :
```
🔍 Chargement des devis...
📦 Réponse listQuotes: [réponse]
📊 Nombre de devis: X
📝 Devis: [liste des devis]
```

**❓ Questions à vérifier :**
- Est-ce que vous voyez ces logs ?
- Quel est le nombre de devis ?
- Est-ce que la liste est vide ou contient des devis ?

---

## 🐛 Problèmes possibles et solutions

### Problème 1 : RLS (Row Level Security) bloque l'accès
**Symptôme :** Les devis sont créés mais ne s'affichent pas

**Solution :** Vérifier les politiques RLS dans Supabase

```sql
-- Vérifier les politiques actuelles
SELECT * FROM pg_policies WHERE tablename = 'quotes';

-- Si nécessaire, recréer les politiques
-- (Voir migrations/007_fix_rls_final.sql)
```

### Problème 2 : Driver ID incorrect
**Symptôme :** Les devis sont créés mais avec un driver_id différent

**Vérification :**
1. Dans les logs de création, vérifiez le `driver_id`
2. Dans les logs de chargement, vérifiez les devis retournés

### Problème 3 : Migration SQL non exécutée
**Symptôme :** Erreur lors de la création ou du chargement

**Solution :** Exécuter les migrations dans Supabase SQL Editor
1. `004_quotes_system.sql`
2. `005_fix_quotes_rls.sql`
3. `006_allow_public_quote_read.sql`
4. `007_fix_rls_final.sql`

### Problème 4 : Format de réponse incorrect
**Symptôme :** `response.data` est undefined

**Vérification :** Dans les logs, regarder la structure de `response`

**Solution possible :**
```typescript
// Dans MyQuotesScreen.tsx, ligne ~50
// Actuellement : setQuotes(response.data || []);
// Essayer : setQuotes(response || []);
```

---

## 🔧 Actions immédiates

### 1. Effacer le cache Expo
```bash
npm start -- --clear
```

### 2. Vérifier la base de données Supabase
1. Ouvrir Supabase Dashboard
2. Aller dans **Table Editor > quotes**
3. Vérifier si les devis sont créés
4. Noter le `driver_id` des devis

### 3. Vérifier l'authentification
Dans la console Expo, chercher :
```
✅ User authenticated: [user_id]
```

Le `user_id` doit correspondre au `driver_id` des devis.

---

## 📝 Informations à fournir si le problème persiste

1. **Logs de création de devis** (Étape 2)
2. **Logs de chargement des devis** (Étape 4)
3. **Capture d'écran de la table `quotes` dans Supabase**
4. **User ID actuel** (depuis les logs d'authentification)

---

## 🎯 Solution temporaire

En attendant de résoudre le problème, vous pouvez vérifier les devis directement dans Supabase :
1. Dashboard Supabase
2. Table Editor > quotes
3. Filtrer par votre `driver_id`

Les devis sont là et fonctionnels, même s'ils ne s'affichent pas dans l'app pour l'instant.

