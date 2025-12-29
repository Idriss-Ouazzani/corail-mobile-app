# 👥 Guide : Mise en place des Utilisateurs

## 🎯 **Objectif**

Ajouter une table `users` dans Databricks pour :
- ✅ Afficher le **nom complet** du créateur au lieu de l'ID Firebase
- ✅ Afficher les **informations du profil** (rating, avis, etc.)
- ✅ Identifier correctement **"Votre course"** avec le vrai Firebase UID

---

## 📋 **Étapes à suivre**

### **1️⃣ Créer la table `users` dans Databricks**

**Fichier :** `backend/create_users_table.sql`

1. Ouvre **Databricks SQL Editor**
2. **Copie tout le contenu** du fichier `create_users_table.sql`
3. **Colle dans l'éditeur**
4. Clique sur **"Run All"** ▶️

**Ce script va :**
- ✅ Créer la table `users` avec tous les champs nécessaires
- ✅ Insérer ton compte : `test@corail.com` → **Idriss Ouazzani**
- ✅ Insérer 5 utilisateurs de démo (Youssef, Hassan, Marie, Jean, Sarah)

**Vérifier :**
```sql
SELECT * FROM io_catalog.corail.users;
-- Tu devrais voir 6 utilisateurs
```

---

### **2️⃣ Ajouter des courses avec différents créateurs**

**Fichier :** `backend/seed_rides_with_users.sql`

1. **Copie tout le contenu** du fichier `seed_rides_with_users.sql`
2. **Colle dans SQL Editor**
3. Clique sur **"Run All"** ▶️

**Ce script va :**
- ✅ Supprimer les anciennes courses de test
- ✅ Insérer ~35 nouvelles courses créées par différents utilisateurs
- ✅ Varier les créateurs pour avoir de la diversité

**Vérifier :**
```sql
SELECT 
  r.id,
  r.pickup_address,
  u.full_name as creator_name
FROM rides r
LEFT JOIN users u ON r.creator_id = u.id
LIMIT 10;
-- Tu devrais voir les noms complets !
```

---

### **3️⃣ Déployer le nouveau backend**

**Fichiers modifiés :**
- `backend/app/main.py` :
  - Ajout du modèle `User`
  - Ajout du champ `creator` dans le modèle `Ride`
  - Modification de la requête SQL pour faire une **jointure** avec `users`
  - Transformation des résultats pour inclure les infos du créateur

**Commandes :**
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

git add -A

git commit -m "👥 Ajout table users + jointure backend

- Table users avec full_name, rating, reviews
- Backend: jointure rides + users
- Affiche toujours le créateur dans les cartes
- Fix: utilise vrai Firebase UID au lieu de 'user2'
- Dropdown région cliquable dans Marketplace"

git push origin main
```

**Puis déployer sur Render :**
1. Va sur https://dashboard.render.com
2. Clique sur **`corail-backend`**
3. **"Manual Deploy"** → **"Deploy latest commit"**
4. Attends 2-3 minutes ⏳

---

### **4️⃣ Tester l'app**

1. **Reload l'app** (shake → Reload)
2. **Va dans Marketplace**
3. **Tu devrais voir :**
   - ✅ "Youssef Driss" au lieu de "Utilisateur user-demo..."
   - ✅ "Hassan Al Masri"
   - ✅ "Marie Dubois"
   - ✅ Etc.

4. **Crée une nouvelle course**
5. **Vérifie que :**
   - ✅ Elle apparaît dans la Marketplace
   - ✅ Badge **"Votre course"** est affiché 🏷️
   - ✅ Elle apparaît dans **"Mes Courses"** → Onglet **"Publiées"**

6. **Change de région dans Marketplace**
   - ✅ Clique sur "Toulouse" en haut
   - ✅ Modal s'ouvre avec la liste des villes
   - ✅ Sélectionne "Paris"
   - ✅ Les courses se filtrent automatiquement !

---

## 🔄 **Workflow complet**

```
1. Databricks SQL Editor
   ↓
2. Exécuter create_users_table.sql
   ↓
3. Exécuter seed_rides_with_users.sql
   ↓
4. Vérifier les jointures
   ↓
5. Git commit + push
   ↓
6. Déployer sur Render
   ↓
7. Reload l'app
   ↓
8. TESTER ! 🎉
```

---

## 🐛 **Dépannage**

### **Problème : "Utilisateur NgnzMvZ..." au lieu du nom**

**Cause :** Le backend n'a pas encore été redéployé avec la nouvelle version.

**Solution :**
1. Vérifie que le commit est bien sur GitHub
2. Redéploie sur Render
3. Attends 2-3 minutes (le serveur redémarre)
4. Reload l'app

---

### **Problème : Badge "Votre course" ne s'affiche pas**

**Cause :** L'app utilise encore l'ancien `CURRENT_USER_ID = 'user2'` au lieu du vrai Firebase UID.

**Solution :**
- ✅ Déjà corrigé dans le commit !
- L'app utilise maintenant `user?.uid` (le vrai Firebase UID)

---

### **Problème : Dropdown région ne s'affiche pas**

**Cause :** Le composant `CitySelector` n'est pas bien intégré dans la Marketplace.

**Solution :**
- ✅ Déjà corrigé dans le commit !
- Le `CitySelector` est maintenant intégré directement dans la Marketplace

---

## 📊 **Structure des données**

### **Table `users`**
```sql
CREATE TABLE users (
  id STRING,              -- Firebase UID
  email STRING,
  full_name STRING,       -- Nom complet
  phone STRING,
  siret STRING,
  is_verified BOOLEAN,
  subscription_tier STRING,
  rating INT,
  total_reviews INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Table `rides` (inchangée)**
```sql
CREATE TABLE rides (
  id STRING,
  creator_id STRING,      -- FK vers users.id
  picker_id STRING,
  pickup_address STRING,
  dropoff_address STRING,
  ...
);
```

### **API Response (avec jointure)**
```json
{
  "id": "ride-tls-001",
  "creator_id": "user-demo-001",
  "pickup_address": "Aéroport Toulouse-Blagnac",
  "dropoff_address": "Place du Capitole",
  "price_cents": 2800,
  "creator": {
    "id": "user-demo-001",
    "email": "youssef.d@vtcpro.fr",
    "full_name": "Youssef Driss",
    "rating": 48,
    "total_reviews": 20
  }
}
```

---

## ✅ **Checklist finale**

- [ ] Table `users` créée dans Databricks
- [ ] 6 utilisateurs insérés (dont `test@corail.com`)
- [ ] ~35 courses insérées avec différents créateurs
- [ ] Jointure testée dans SQL Editor
- [ ] Code backend committé
- [ ] Backend déployé sur Render
- [ ] App reloadée
- [ ] Noms complets affichés dans la Marketplace
- [ ] Badge "Votre course" fonctionne
- [ ] Onglet "Publiées" fonctionne dans "Mes Courses"
- [ ] Dropdown région fonctionne et filtre

---

🎊 **Une fois tout ça fait, l'app sera complète !**


