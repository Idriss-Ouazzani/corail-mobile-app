# 📅 Système de Planning VTC - Guide de Déploiement

## Vue d'ensemble

Le système de planning permet aux chauffeurs VTC de :
- **Visualiser** toutes leurs courses sur un calendrier (Marketplace, Uber, Bolt, Direct)
- **Détecter** automatiquement les conflits d'horaires
- **Recevoir** des notifications avant chaque course
- **Optimiser** leur planning avec des suggestions intelligentes

---

## 🗄️ 1. Base de données (Databricks)

### Étape 1 : Créer les tables

```bash
# Exécuter le script SQL dans Databricks SQL Editor
```

```sql
-- Fichier: backend/create_planning_system.sql
-- Créer les tables: planning_events, notification_preferences
-- Créer les vues: v_upcoming_events, v_today_schedule
```

**Tables créées :**
- ✅ `io_catalog.corail.planning_events` : Stocke tous les événements (courses, pauses, etc.)
- ✅ `io_catalog.corail.notification_preferences` : Préférences de notification par chauffeur
- ✅ `io_catalog.corail.v_upcoming_events` : Vue des événements à venir
- ✅ `io_catalog.corail.v_today_schedule` : Vue du planning du jour

### Étape 2 : Vérifier les données

```sql
-- Compter les préférences par défaut créées
SELECT COUNT(*) FROM io_catalog.corail.notification_preferences;

-- Vérifier un exemple de préférences
SELECT * FROM io_catalog.corail.notification_preferences LIMIT 1;
```

---

## ⚙️ 2. Backend (FastAPI)

### Endpoints implémentés

#### **Planning Events**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/planning/events` | Récupérer les événements (avec filtres) |
| `POST` | `/api/v1/planning/events` | Créer un événement |
| `PUT` | `/api/v1/planning/events/{id}` | Mettre à jour un événement |
| `DELETE` | `/api/v1/planning/events/{id}` | Supprimer un événement |
| `GET` | `/api/v1/planning/conflicts` | Vérifier les conflits |

#### **Notifications**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/notifications/preferences` | Récupérer les préférences |
| `PUT` | `/api/v1/notifications/preferences` | Mettre à jour les préférences |

### Déploiement Backend

```bash
# Le code est déjà dans backend/app/main.py
# Render va automatiquement redéployer après le push Git

# Vérifier le déploiement
curl https://corail-backend-6e5o.onrender.com/api/v1/debug/config
```

---

## 📱 3. Frontend (React Native)

### Dépendances installées

```bash
npm install react-native-calendars
```

**Package** : `react-native-calendars` (vue calendrier élégante)

### Fichiers créés

#### **Services**
- ✅ `src/services/api.ts` : Méthodes API pour planning/notifications
  - `getPlanningEvents()`
  - `createPlanningEvent()`
  - `updatePlanningEvent()`
  - `deletePlanningEvent()`
  - `checkPlanningConflicts()`
  - `getNotificationPreferences()`
  - `updateNotificationPreferences()`

#### **Screens**
- ✅ `src/screens/PlanningScreen.tsx` : Vue planning complète
  - Vue calendrier (mois)
  - Vue jour (liste d'événements)
  - Marques multi-dot sur le calendrier
  - Cartes événements avec icônes par source
  - FAB pour ajouter des événements

---

## 🚀 4. Intégration dans l'app

### À faire manuellement

#### **Étape 1 : Ajouter dans App.tsx**

```typescript
import PlanningScreen from './src/screens/PlanningScreen';

// Dans le state
const [showPlanning, setShowPlanning] = useState(false);

// Dans le render conditionnnel (avant le bottom nav)
if (showPlanning) {
  return (
    <PlanningScreen 
      onBack={() => setShowPlanning(false)} 
    />
  );
}
```

#### **Étape 2 : Ajouter dans ToolsScreen**

```typescript
// Dans src/screens/ToolsScreen.tsx

<TouchableOpacity
  style={styles.toolButton}
  onPress={onOpenPlanning}  // Nouveau prop
  activeOpacity={0.8}
>
  <LinearGradient
    colors={['#8b5cf6', '#6366f1']}
    style={styles.toolGradient}
  >
    <View style={styles.toolLeft}>
      <View style={styles.toolIconContainer}>
        <Ionicons name="calendar" size={28} color="#fff" />
      </View>
      <View>
        <Text style={styles.toolTitle}>Planning</Text>
        <Text style={styles.toolDescription}>Gérez votre agenda et vos courses</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
  </LinearGradient>
</TouchableOpacity>
```

#### **Étape 3 : Ajouter dans Profile (menu)**

```typescript
{
  icon: 'calendar',
  title: 'Mon Planning',
  subtitle: 'Gérer mon agenda',
  action: () => setShowPlanning(true)
}
```

---

## 🔔 5. Notifications (Phase suivante)

### Dépendances à installer

```bash
expo install expo-notifications
expo install expo-task-manager
```

### Workflow notifications

1. **Demander permissions** lors du premier lancement
2. **Programmer notifications** lors de la création d'événements
3. **Background tasks** pour vérifier conflits
4. **Notifications push** pour suggestions Marketplace

---

## 📊 6. Fonctionnalités actuelles

### ✅ Implémenté

- [x] Base de données (tables + vues)
- [x] Backend API complet
- [x] Service API frontend
- [x] Vue calendrier (mois)
- [x] Vue jour avec événements
- [x] Détection conflits (backend)
- [x] Icônes par source (Uber, Bolt, Direct, Corail)
- [x] Statuts événements (Planifié, En cours, Terminé, Annulé)
- [x] Préférences notifications (backend)

### 🚧 À implémenter (Phase 2)

- [ ] Formulaire ajout événement (FAB)
- [ ] Édition/suppression événements
- [ ] Notifications locales (30min, 1h avant)
- [ ] Vue semaine
- [ ] Synchronisation auto courses personnelles
- [ ] Suggestions Marketplace compatibles
- [ ] Configuration notifications (écran Settings)
- [ ] Widget iOS/Android
- [ ] Export PDF planning semaine

---

## 🧪 7. Tests

### Tester les endpoints (Postman/curl)

```bash
# Récupérer les événements
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://corail-backend-6e5o.onrender.com/api/v1/planning/events?start_date=2025-12-01&end_date=2025-12-31

# Créer un événement
curl -X POST \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "RIDE",
    "start_time": "2025-12-30 10:00:00",
    "end_time": "2025-12-30 10:45:00",
    "start_address": "Toulouse Centre",
    "end_address": "Aéroport Blagnac",
    "ride_source": "UBER",
    "color": "#6366f1"
  }' \
  https://corail-backend-6e5o.onrender.com/api/v1/planning/events

# Vérifier conflits
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  "https://corail-backend-6e5o.onrender.com/api/v1/planning/conflicts?start_time=2025-12-30 10:00:00&end_time=2025-12-30 10:45:00"
```

### Tester dans l'app

1. ✅ Ouvrir Planning depuis Outils
2. ✅ Voir le calendrier du mois
3. ✅ Cliquer sur un jour → Vue jour
4. ✅ Basculer Mois/Jour avec les onglets
5. 🚧 Ajouter un événement (à implémenter)

---

## 🐛 8. Troubleshooting

### Erreur : "Table not found"

```sql
-- Vérifier que les tables existent
SHOW TABLES IN io_catalog.corail;

-- Recréer les tables
-- Exécuter backend/create_planning_system.sql
```

### Erreur : "No notification preferences"

```sql
-- Vérifier les préférences
SELECT * FROM io_catalog.corail.notification_preferences WHERE driver_id = 'YOUR_USER_ID';

-- Insérer manuellement si besoin
INSERT INTO io_catalog.corail.notification_preferences ...
```

### Calendrier ne s'affiche pas

```bash
# Vérifier l'installation
npm list react-native-calendars

# Réinstaller si nécessaire
npm install react-native-calendars
```

---

## 📈 9. Prochaines étapes

### Phase 2 : Notifications

1. Installer `expo-notifications`
2. Demander permissions
3. Programmer notifications locales
4. Background tasks pour conflits

### Phase 3 : Intelligence

1. Synchronisation auto personal_rides → planning_events
2. Suggestions Marketplace selon planning
3. Calcul temps trajet entre courses
4. Optimisation itinéraire journée

### Phase 4 : Avancé

1. Export PDF planning
2. Widget iOS/Android
3. Synchronisation Google Calendar
4. Mode "Auto-acceptation" courses compatibles

---

## ✅ Checklist déploiement

- [ ] Exécuter `create_planning_system.sql` dans Databricks
- [ ] Vérifier que les tables existent
- [ ] Push code backend (main.py)
- [ ] Attendre redéploiement Render (5-10 min)
- [ ] Push code frontend (PlanningScreen + api.ts)
- [ ] Tester endpoints avec Postman
- [ ] Intégrer PlanningScreen dans App.tsx
- [ ] Ajouter bouton Planning dans ToolsScreen
- [ ] Tester dans l'app (iOS/Android)

---

## 🎯 Résultat final

Les chauffeurs VTC peuvent maintenant :
✅ Voir toutes leurs courses sur un calendrier  
✅ Détecter les conflits automatiquement  
✅ Avoir une vue claire de leur planning  
🚧 Recevoir des notifications (Phase 2)  
🚧 Optimiser leur planning (Phase 3)  

**Le système est opérationnel pour la Phase 1 : Planning de base ! 🚀**

