# 🚨 DEBUG URGENT : Les devis n'apparaissent pas

## ✅ Ce qui a été fait
1. ✅ Couleur du bouton changée en jaune/orange
2. ✅ Formats de retour des API corrigés (`{ data, error }`)
3. ✅ Logs verbeux ajoutés partout

---

## 🔍 ÉTAPE 1 : Vérifier les logs dans Expo

### 1.1 Redémarrer l'app avec un cache propre
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npm start -- --clear
```

### 1.2 Chercher ces logs dans la console

**Au démarrage :**
```
✅ Utilisateur connecté: [email]
✅ User ID: [votre_user_id]
🔑 setUserId appelé avec: [votre_user_id]
🔑 currentUserId est maintenant: [votre_user_id]
```

**IMPORTANT : Notez votre User ID !** Vous en aurez besoin.

### 1.3 Créer un devis

**Méthode A : Depuis "Mes Devis"**
1. Allez dans **Suivi > Mes Devis**
2. Cliquez sur **"Créer un nouveau devis"**
3. Remplissez le formulaire
4. Cliquez sur **"Envoyer"**

**Méthode B : Depuis une course personnelle**
1. Allez dans **Courses > Créer une course**
2. Activez **"Générer un devis"**
3. Remplissez nom et téléphone
4. Créez la course

### 1.4 Logs attendus lors de la création

```
🔍 createQuote - currentUserId: [votre_user_id]
🔍 createQuote - quoteData: {
  "client_name": "...",
  "client_phone": "...",
  ...
}
✅ Quote created: quote-xxxxx
```

**❓ Est-ce que vous voyez ces logs ?**
- ✅ OUI → Passez à l'étape 1.5
- ❌ NON → **Le problème est ici !** Copiez l'erreur exacte

### 1.5 Logs attendus lors du chargement

Allez dans **Suivi > Mes Devis**, vous devriez voir :

```
🔍 listQuotes - currentUserId: [votre_user_id]
🔍 listQuotes - filters: undefined
🔍 Chargement des devis...
📦 Réponse listQuotes: { data: [...], error: null }
📊 Nombre de devis: X
✅ Loaded X quotes
```

**❓ Quel est le nombre de devis ?**
- Si `0` → Le problème est dans Supabase (RLS ou user_id)
- Si `> 0` → Le problème est dans l'affichage

---

## 🗄️ ÉTAPE 2 : Vérifier Supabase directement

### 2.1 Ouvrir Supabase Dashboard
1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet Corail
3. Allez dans **Table Editor > quotes**

### 2.2 Vérifier si les devis existent
**Question : Est-ce que vous voyez des lignes dans la table `quotes` ?**
- ✅ OUI → Notez le `driver_id` de ces devis
- ❌ NON → Les devis ne sont pas créés du tout

### 2.3 Comparer les IDs
**Votre User ID (des logs) :** `___________________`
**Driver ID des devis :** `___________________`

**❓ Est-ce qu'ils sont identiques ?**
- ✅ OUI → Le problème est dans les politiques RLS
- ❌ NON → Le problème est dans l'authentification

---

## 🔧 ÉTAPE 3 : Corriger les politiques RLS

### 3.1 Exécuter le script de debug
1. Dans Supabase Dashboard
2. Allez dans **SQL Editor**
3. Cliquez sur **"New query"**
4. Copiez le contenu de `supabase/migrations/010_debug_quotes_rls.sql`
5. Cliquez sur **"Run"**

### 3.2 Vérifier le résultat
Vous devriez voir :
```
✅ 1 politique créée : quotes_all_access_policy
```

### 3.3 Tester la création manuelle (optionnel)
Dans le SQL Editor, remplacez `VOTRE_USER_ID` par votre vrai User ID et exécutez :

```sql
INSERT INTO quotes (
  driver_id,
  client_name,
  client_phone,
  pickup_address,
  dropoff_address,
  scheduled_date,
  scheduled_time,
  price_cents,
  status,
  sent_at
) VALUES (
  'VOTRE_USER_ID',
  'Test Manuel',
  '0612345678',
  'Test Départ',
  'Test Arrivée',
  '2026-01-02',
  '10:00:00',
  4500,
  'SENT',
  NOW()
) RETURNING *;
```

**❓ Est-ce que ça fonctionne ?**
- ✅ OUI → RLS OK, le problème est ailleurs
- ❌ NON → Erreur RLS, postez l'erreur

---

## 🐛 ÉTAPE 4 : Cas spécifiques

### Cas A : "User not authenticated"
**Symptôme :** Erreur `User not authenticated` dans les logs

**Cause :** `currentUserId` n'est pas défini

**Solution :**
1. Vérifiez que vous voyez `🔑 setUserId appelé avec:` dans les logs
2. Si non, redémarrez l'app complètement (fermez Expo Go, relancez `npm start`)
3. Si toujours non, il y a un problème dans le flow d'authentification Firebase

### Cas B : "PGRST116" ou "0 rows returned"
**Symptôme :** Erreur avec code `PGRST116`

**Cause :** Politiques RLS trop restrictives

**Solution :** Exécutez le script `010_debug_quotes_rls.sql` (ÉTAPE 3)

### Cas C : Les devis existent dans Supabase mais pas dans l'app
**Symptôme :** Vous voyez les devis dans Table Editor, mais pas dans l'app

**Cause possible 1 :** Driver ID différent
- Vérifiez que le `driver_id` des devis = votre User ID des logs

**Cause possible 2 :** Format de réponse incorrect
- Vérifiez dans les logs : `📦 Réponse listQuotes:`
- Devrait être : `{ data: [...], error: null }`
- Si différent, postez la structure exacte

### Cas D : Aucun log n'apparaît
**Symptôme :** Vous ne voyez aucun des logs mentionnés

**Solution :**
```bash
# Arrêter complètement
# Ctrl+C dans le terminal

# Nettoyer
rm -rf node_modules/.cache
rm -rf .expo

# Redémarrer
npm start -- --clear
```

---

## 📋 CHECKLIST DE DEBUG

Cochez au fur et à mesure :

- [ ] Logs au démarrage vus (User ID, setUserId)
- [ ] Logs de création vus (createQuote, currentUserId)
- [ ] Logs de chargement vus (listQuotes, currentUserId)
- [ ] Devis visibles dans Supabase Table Editor
- [ ] Driver ID = User ID
- [ ] Script RLS 010 exécuté
- [ ] Cache Expo nettoyé
- [ ] App redémarrée

---

## 🆘 Si rien ne fonctionne

**Envoyez-moi :**

1. **User ID :**
   ```
   User ID: [copiez depuis les logs ✅ User ID:]
   ```

2. **Logs de création (toute la section) :**
   ```
   [Copiez tout depuis "📄 Création du devis..." jusqu'à "✅ Devis créé:"]
   ```

3. **Logs de chargement (toute la section) :**
   ```
   [Copiez tout depuis "🔍 Chargement des devis..." jusqu'à "✅ Loaded X quotes"]
   ```

4. **Screenshot Supabase :**
   - Ouvrez Table Editor > quotes
   - Faites une capture d'écran montrant les colonnes `id`, `driver_id`, `client_name`, `status`

5. **Résultat du script RLS :**
   ```
   [Copiez le résultat de l'exécution de 010_debug_quotes_rls.sql]
   ```

---

## 🎯 Solution temporaire

En attendant que le problème soit résolu, vous pouvez voir vos devis directement dans Supabase :
1. Dashboard > Table Editor > quotes
2. Filtrer par votre `driver_id`
3. Copier manuellement le token pour générer les liens

**Format du lien :**
```
https://corail-quotes-web.vercel.app/q/[TOKEN_ICI]
```

---

**Version :** 1.0.2 - Debug  
**Date :** 1er janvier 2026

