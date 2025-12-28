# 🗄️ Gestion des Données - Scripts SQL

## 📝 **1. Ajouter des courses de démo**

### **Fichier :** `backend/seed_rides.sql`

**Ce script ajoute ~35 courses variées :**
- 🚗 Courses locales Toulouse
- 🛣️ Longue distance (Carcassonne, Albi, Auch)
- 💎 Premium/Luxe (Paris, Monaco)
- ⚡ Électriques
- 🚐 Van (groupes)
- 🌅 Matinales (avant 7h)
- 🌙 Nocturnes (après 23h)

### **Comment l'exécuter :**

1. Ouvre **Databricks SQL Editor**
2. Copie le contenu de `backend/seed_rides.sql`
3. Colle dans l'éditeur
4. Clique sur **"Run All"** ▶️

### **Vérifier :**
```sql
SELECT COUNT(*) FROM io_catalog.corail.rides;
-- Tu devrais voir ~35+ courses
```

---

## 🗑️ **2. Nettoyer/Supprimer des courses**

### **Fichier :** `backend/cleanup_rides.sql`

**Plusieurs options disponibles :**

### **Option 1 : Supprimer seulement les courses de démo**
```sql
DELETE FROM rides WHERE id LIKE 'ride-tls-%' 
  OR id LIKE 'ride-ld-%' 
  OR id LIKE 'ride-lux-%' 
  OR id LIKE 'ride-eco-%' 
  OR id LIKE 'ride-van-%' 
  OR id LIKE 'ride-early-%' 
  OR id LIKE 'ride-night-%';
```

### **Option 2 : Supprimer les vieilles courses (passées)**
```sql
DELETE FROM rides WHERE scheduled_at < CURRENT_TIMESTAMP();
```

### **Option 3 : Supprimer les courses d'un utilisateur spécifique**
```sql
-- Remplace par ton Firebase user_id
DELETE FROM rides WHERE creator_id = 'NgnzMvZvqkhTw636aYvcoD3EtSD2';
```

### **Option 4 : Supprimer TOUTES les courses ⚠️**
```sql
-- ⚠️ ATTENTION : Supprime tout !
DELETE FROM rides;
```

---

## 📊 **3. Voir les statistiques**

### **Compter les courses par statut :**
```sql
SELECT 
  status,
  COUNT(*) as count
FROM io_catalog.corail.rides
GROUP BY status;
```

### **Voir les courses récentes :**
```sql
SELECT 
  id,
  pickup_address,
  dropoff_address,
  price_cents,
  status,
  scheduled_at,
  created_at
FROM io_catalog.corail.rides
ORDER BY created_at DESC
LIMIT 20;
```

### **Voir tes propres courses :**
```sql
-- Remplace par ton Firebase user_id
SELECT * FROM io_catalog.corail.rides
WHERE creator_id = 'NgnzMvZvqkhTw636aYvcoD3EtSD2'
ORDER BY created_at DESC;
```

---

## 🗑️ **4. Supprimer une course depuis l'app mobile**

### **Nouvelle fonctionnalité ajoutée ! 🎉**

1. **Ouvre une course** que tu as créée
2. **Scroll en bas**
3. Tu verras un bouton **"Supprimer cette course"** (rouge)
4. Clique dessus
5. Confirme la suppression
6. La course est supprimée de Databricks ! ✅

**Sécurité :**
- ✅ Tu peux supprimer **seulement tes propres courses**
- ✅ Impossible de supprimer une course d'un autre utilisateur
- ✅ Seulement les courses **PUBLISHED** peuvent être supprimées

---

## 🔄 **5. Workflow complet**

### **Développement / Test :**
1. **Ajouter des données de démo** → `seed_rides.sql`
2. **Tester l'app**
3. **Nettoyer** → `cleanup_rides.sql` (Option 1)
4. **Répéter**

### **Production :**
1. Les utilisateurs créent des courses via l'app
2. Ils peuvent les supprimer via l'app
3. Tu peux nettoyer les vieilles courses périodiquement avec `cleanup_rides.sql` (Option 2)

---

## 📌 **Raccourcis SQL**

### **Tout en un pour reset complet :**
```sql
USE CATALOG io_catalog;
USE SCHEMA corail;

-- 1. Supprimer toutes les courses
DELETE FROM rides;

-- 2. Réinsérer les données de démo
-- (Copie/colle le contenu de seed_rides.sql ici)

-- 3. Vérifier
SELECT COUNT(*) FROM rides;
```

---

## ⚙️ **Déployer les changements**

Après avoir modifié le code :

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

git add -A
git commit -m "🗑️ Ajout suppression de courses + Scripts SQL"
git push origin main
```

Puis **déploie sur Render** :
1. https://dashboard.render.com
2. Clique sur **`corail-backend`**
3. **"Manual Deploy"** → **"Deploy latest commit"**
4. Attends 2-3 minutes
5. Teste l'app ! 🎉

---

## ✅ **Checklist**

- [ ] Script `seed_rides.sql` exécuté
- [ ] Données de démo visibles dans l'app
- [ ] Code backend déployé sur Render
- [ ] Bouton "Supprimer" visible dans les détails d'une course
- [ ] Suppression fonctionnelle
- [ ] Course supprimée disparaît de la liste

---

🎊 **Tout est prêt !**

