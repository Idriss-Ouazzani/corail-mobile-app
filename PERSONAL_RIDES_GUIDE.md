# 📝 Guide : Enregistrement de Courses Personnelles

## 🎯 Vue d'ensemble

Cette fonctionnalité permet aux chauffeurs VTC d'enregistrer **toutes leurs courses**, qu'elles viennent de :
- 🚗 **Uber**
- ⚡ **Bolt**
- 👤 **Clients directs**
- 🏪 **Marketplace Corail**
- 📋 **Autres plateformes**

---

## 📋 Étapes de déploiement

### 1️⃣ Databricks : Créer la table `personal_rides`

```bash
# Exécuter dans Databricks SQL Warehouse
cat backend/create_personal_rides_table.sql
```

**Ce script crée :**
- ✅ Table `personal_rides` (stockage des courses)
- ✅ Index pour performance (driver_id, date, source)
- ✅ Vue `v_driver_stats` (stats rapides par chauffeur)
- ✅ Données de test pour développement

**Vérification :**
```sql
SELECT COUNT(*) as total_rides, source
FROM io_catalog.corail.personal_rides
GROUP BY source;
```

---

### 2️⃣ Backend : Routes API (FastAPI)

Le backend inclut maintenant ces nouveaux endpoints :

#### **Créer une course**
```http
POST /api/v1/personal-rides
Authorization: Bearer <firebase_token>

{
  "source": "UBER",
  "pickup_address": "Gare Toulouse-Matabiau",
  "dropoff_address": "Aéroport Toulouse-Blagnac",
  "price_cents": 2800,
  "distance_km": 12.5,
  "duration_minutes": 25,
  "status": "COMPLETED"
}
```

#### **Lister les courses**
```http
GET /api/v1/personal-rides?status=COMPLETED&source=UBER&limit=50
Authorization: Bearer <firebase_token>
```

#### **Statistiques**
```http
GET /api/v1/personal-rides/stats/summary
Authorization: Bearer <firebase_token>
```

**Réponse :**
```json
{
  "by_source": [
    {
      "source": "UBER",
      "total_rides": 45,
      "completed_rides": 42,
      "revenue_eur": 1250.50,
      "total_distance_km": 450.2,
      "avg_price_eur": 29.77
    }
  ],
  "totals": {
    "total_rides": 120,
    "completed_rides": 115,
    "total_revenue_eur": 3450.80,
    "total_distance_km": 1200.5
  }
}
```

---

### 3️⃣ Frontend : Écran mobile

**Fichier créé :** `src/screens/PersonalRidesScreen.tsx`

**3 onglets disponibles :**

1. **➕ Ajouter** : Formulaire d'enregistrement
   - Choix de la source (Uber, Bolt, Direct, Autre)
   - Adresses départ/arrivée
   - Prix, distance, durée
   - Infos client (si Direct)
   - Notes personnelles

2. **📚 Historique** : Liste de toutes les courses
   - Pull-to-refresh
   - Affichage détaillé par course
   - Filtrage par source et statut

3. **📊 Statistiques** : Vue synthétique
   - Totaux globaux (revenus, distance, nb courses)
   - Stats par source (Uber, Bolt, etc.)
   - Prix moyen, distance moyenne

---

### 4️⃣ Intégration dans l'App

**Nouveau bouton ajouté dans le Profil :**

```
🧑‍💼 Outils Professionnels
├── 🔲 Mon QR Code Pro
└── 🚗 Mes Courses  ← NOUVEAU
    └── "Enregistrez Uber, Bolt, Direct..."
```

**Accès :** 
- Profil → "Mes Courses"
- Couleur : Violet/indigo (différent du QR Code orange)

---

## 🚀 Déploiement

### **Option A : Déploiement automatique (Render)**

1. **Commit et push :**
   ```bash
   git add -A
   git commit -m "feat: Personal rides tracking system"
   git push origin assistant-pivot
   ```

2. **Render redéploie automatiquement** (GitHub webhook)

3. **Vérifier les logs Render :**
   - Aucune erreur d'import
   - Backend démarre correctement

---

### **Option B : Déploiement manuel**

1. **Backend (Render) :**
   - Dashboard Render → Manual Deploy
   - Branche : `assistant-pivot`

2. **Mobile (Expo) :**
   ```bash
   cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
   npx expo start --clear
   ```

---

## ✅ Tests

### **Test 1 : Créer une course Uber**

1. Ouvrir l'app → Profil
2. Cliquer sur "Mes Courses"
3. Onglet "➕ Ajouter"
4. Sélectionner "🚗 Uber"
5. Remplir :
   - Départ : "Gare Toulouse"
   - Arrivée : "Aéroport Blagnac"
   - Prix : 28
   - Distance : 12.5
   - Durée : 25
6. Cliquer "Enregistrer"
7. ✅ Vérifier : Course visible dans l'onglet "Historique"

### **Test 2 : Statistiques**

1. Onglet "📊 Stats"
2. ✅ Vérifier : Vue d'ensemble affiche les totaux
3. ✅ Vérifier : Stats par source (Uber, Bolt) affichées

### **Test 3 : Client Direct**

1. Onglet "➕ Ajouter"
2. Sélectionner "👤 Client Direct"
3. Remplir :
   - Adresses
   - Nom client : "Jean Dupont"
   - Téléphone client : "+33 6 12 34 56 78"
   - Prix : 35
4. Enregistrer
5. ✅ Vérifier : Infos client visibles dans l'historique

---

## 📊 Schéma de la table

```sql
CREATE TABLE personal_rides (
  id STRING NOT NULL,
  driver_id STRING NOT NULL,
  source STRING NOT NULL,  -- UBER, BOLT, DIRECT_CLIENT, MARKETPLACE, OTHER
  
  pickup_address STRING NOT NULL,
  dropoff_address STRING NOT NULL,
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  price_cents INT,
  currency STRING DEFAULT 'EUR',
  distance_km FLOAT,
  duration_minutes INT,
  
  client_name STRING,
  client_phone STRING,
  notes STRING,
  
  status STRING NOT NULL,  -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)
```

---

## 🎨 Design

**Couleurs :**
- **QR Code** : Orange/Corail (`#ff6b47` → `#ff8a6d`)
- **Mes Courses** : Violet/Indigo (`#6366f1` → `#8b5cf6`)

**UX :**
- 3 onglets clairs et distincts
- Formulaire simple avec validation
- Affichage élégant des courses (cartes)
- Stats visuelles par source

---

## 🔮 Évolutions futures

- [ ] **Autocomplétion adresses** (Google Places API)
- [ ] **Export CSV** des courses
- [ ] **Graphiques** de revenus par jour/semaine/mois
- [ ] **Notifications** de rappel (enregistrer la course après un trajet)
- [ ] **Import automatique** depuis Uber/Bolt (API)
- [ ] **Intégration comptable** (export pour comptable)
- [ ] **Dashboard avancé** (revenus vs dépenses)

---

## ❓ FAQ

**Q : Mes courses Uber/Bolt sont-elles synchronisées automatiquement ?**  
R : Non, pour l'instant l'enregistrement est **manuel**. L'import automatique est prévu dans une version future.

**Q : Puis-je modifier une course après enregistrement ?**  
R : Pas encore dans l'UI, mais le backend supporte `PUT /api/v1/personal-rides/{id}`.

**Q : Les courses de la marketplace Corail sont-elles automatiquement enregistrées ?**  
R : Oui, c'est prévu dans une évolution future (auto-enregistrement lors de la validation).

**Q : Puis-je exporter mes données ?**  
R : Pas encore dans l'UI, mais les données sont accessibles via l'API. Export CSV à venir.

---

## 🐛 Dépannage

**Erreur : "Failed to load rides"**
- Vérifier que le backend Render est bien déployé
- Vérifier les logs Render
- Tester l'endpoint : `GET https://corail-backend-6e5o.onrender.com/api/v1/personal-rides`

**Erreur : "Table not found"**
- Exécuter le script SQL `create_personal_rides_table.sql` dans Databricks

**Aucune statistique affichée**
- Ajouter au moins 1 course complétée
- Vérifier que `status = 'COMPLETED'`

---

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. ✅ Databricks : Table créée
2. ✅ Backend : Déployé sans erreur
3. ✅ Mobile : Pas d'erreur dans les logs Expo

**Logs utiles :**
```bash
# Backend
https://dashboard.render.com/web/srv-xxx/logs

# Mobile
npx expo start --clear
# Puis ouvrir l'app et regarder les logs
```

---

✅ **Système opérationnel !** Les chauffeurs peuvent maintenant enregistrer toutes leurs courses, quelle que soit la plateforme. 🚀

