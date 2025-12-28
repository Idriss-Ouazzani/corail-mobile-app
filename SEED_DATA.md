# 🌱 Seed Data - Ajouter des courses dans Databricks

## 📋 **Instructions**

### **1️⃣ Ouvrir Databricks SQL Editor**

1. Va sur ton workspace Databricks
2. Dans le menu de gauche, clique sur **"SQL Editor"** (ou **"SQL Warehouses"** puis **"Open SQL Editor"**)

### **2️⃣ Exécuter le script**

1. Copie **tout le contenu** du fichier `backend/seed_rides.sql`
2. Colle-le dans le SQL Editor
3. Clique sur **"Run All"** ou **▶️ Run**

### **3️⃣ Vérifier les données**

Exécute cette requête pour vérifier :

```sql
USE CATALOG io_catalog;
USE SCHEMA corail;

SELECT 
  COUNT(*) as total_rides,
  COUNT(CASE WHEN vehicle_type = 'STANDARD' THEN 1 END) as standard,
  COUNT(CASE WHEN vehicle_type = 'PREMIUM' THEN 1 END) as premium,
  COUNT(CASE WHEN vehicle_type = 'ELECTRIC' THEN 1 END) as electric,
  COUNT(CASE WHEN vehicle_type = 'VAN' THEN 1 END) as van,
  COUNT(CASE WHEN vehicle_type = 'LUXURY' THEN 1 END) as luxury
FROM rides;
```

Tu devrais voir **~35 courses** au total ! 🎉

---

## 📱 **Tester dans l'app mobile**

1. **Relance l'app** (shake → Reload)
2. **Connecte-toi** avec `test@corail.com`
3. **Va dans Marketplace**
4. Tu devrais voir **toutes les courses chargées depuis Databricks** ! 🚀

---

## 🔍 **Types de courses ajoutées**

Le script ajoute des courses variées :

| Type | Nombre | Exemples |
|------|--------|----------|
| 🚗 **Locales Toulouse** | 10 | Aéroport → Capitole, Gare → Airbus |
| 🛣️ **Longue distance** | 5 | Toulouse → Carcassonne, Albi, Auch |
| 💎 **Premium/Luxe** | 3 | Paris CDG, Monaco, Versailles |
| ⚡ **Électriques** | 3 | Trajets courts écologiques |
| 🚐 **Van (groupes)** | 3 | Aéroport, station de ski |
| 🌅 **Matinales** | 3 | Départs avant 7h |
| 🌙 **Nocturnes** | 3 | Départs après 23h |

---

## 🧪 **Tester les filtres**

Une fois les courses chargées, teste les filtres dans l'app :

✅ **Par type de véhicule** : Standard, Premium, Électrique, Van, Luxe  
✅ **Par prix** : Croissant/Décroissant  
✅ **Par date** : Prochain/Dernier  
✅ **Par distance** : Court/Long trajet  

---

## 🔄 **Réinitialiser les données**

Si tu veux repartir de zéro :

```sql
USE CATALOG io_catalog;
USE SCHEMA corail;

DELETE FROM rides WHERE id LIKE 'ride-%';

-- Puis réexécute le script seed_rides.sql
```

---

## ✅ **Checklist de test**

- [ ] Script SQL exécuté sans erreur
- [ ] ~35 courses ajoutées
- [ ] App mobile rechargée
- [ ] Courses visibles dans Marketplace
- [ ] Filtres fonctionnels
- [ ] Création de nouvelle course → Apparaît dans la liste

---

🎉 **Prêt à tester !**

