# 🚗 Système de Notifications "À la Uber/Bolt"

## ✅ Ce qui est fait

### 1. **IncomingRideModal** (`src/components/IncomingRideModal.tsx`)
Modal plein écran avec :
- ✅ Compteur visuel (20 secondes par défaut)
- ✅ Animation de "pulse" pour l'urgence
- ✅ Vibration au démarrage
- ✅ Détails de la course (heure, départ, arrivée, prix)
- ✅ Boutons Accepter (vert) / Refuser (rouge)
- ✅ Auto-timeout si pas de réponse
- ✅ Son de notification (à configurer)

### 2. **Services de notifications**

#### Option A (Recommandée) : **Supabase Realtime** (`src/services/incomingRidesRealtimeService.ts`)
- ✅ WebSockets temps réel (pas de polling)
- ✅ Détection instantanée des nouvelles courses
- ✅ Écoute marketplace + groupes
- ✅ Notification locale (app en arrière-plan)
- ✅ Listener pour clics sur notifications
- ✅ Plus efficace et économe en batterie

#### Option B : **Polling** (`src/services/incomingRidesService.ts`)
- ✅ Polling toutes les 10 secondes
- ✅ Détection de nouvelles courses marketplace
- ✅ Détection de nouvelles courses de groupes
- ✅ Notification locale (app en arrière-plan)
- ✅ Fonctionne sans configuration Realtime

---

## 🤔 Quelle option choisir ?

| Critère | Realtime (WebSockets) | Polling |
|---------|----------------------|---------|
| **Latence** | ~100ms | ~5-10s (moyenne) |
| **Batterie** | ✅ Économe | ⚠️ Consomme plus |
| **Données** | ✅ Minimal | ⚠️ Requêtes répétées |
| **Configuration** | Nécessite Realtime activé | Fonctionne out-of-the-box |
| **Scalabilité** | ✅ Excellente | ⚠️ Limitée |

**Recommandation : Utiliser Realtime** pour une expérience "Uber-like" optimale.

---

## 🔧 Intégration dans App.tsx

### Étape 1 : Imports (choisir une option)

**Option A - Realtime (recommandée) :**
```typescript
import { IncomingRideModal } from './src/components';
import * as IncomingRidesService from './src/services/incomingRidesRealtimeService';
import { AppState } from 'react-native';
```

**Option B - Polling :**
```typescript
import { IncomingRideModal } from './src/components';
import * as IncomingRidesService from './src/services/incomingRidesService';
import { AppState } from 'react-native';
```

### Étape 2 : States

```typescript
// Dans le composant App (ou composant principal)
const [incomingRide, setIncomingRide] = useState<any | null>(null);
const [showIncomingModal, setShowIncomingModal] = useState(false);
```

### Étape 3 : Démarrage du service

**Option A - Realtime :**
```typescript
useEffect(() => {
  if (!currentUserId || !isAuthenticated) return;

  // Démarrer l'écoute Realtime
  IncomingRidesService.startRealtimeListening(
    currentUserId,
    (ride) => {
      console.log('📢 Nouvelle course reçue (Realtime):', ride);
      
      // Vérifier si l'app est au premier plan
      if (AppState.currentState === 'active') {
        // Afficher le modal plein écran
        setIncomingRide(ride);
        setShowIncomingModal(true);
      } else {
        // App en arrière-plan → notification locale
        IncomingRidesService.sendLocalNotification(ride);
      }
    }
  );

  // Listener pour les clics sur notifications
  const unsubscribe = IncomingRidesService.setupNotificationListener((rideId) => {
    console.log('📱 Notification tapée, rideId:', rideId);
    // Ouvrir l'app sur la course
    // TODO: Navigation vers RideDetailScreen
  });

  // Cleanup
  return () => {
    IncomingRidesService.stopRealtimeListening();
    unsubscribe();
  };
}, [currentUserId, isAuthenticated]);
```

**Option B - Polling :**
```typescript
useEffect(() => {
  if (!currentUserId || !isAuthenticated) return;

  // Démarrer le polling
  IncomingRidesService.startListeningForNewRides(
    currentUserId,
    (ride) => {
      console.log('📢 Nouvelle course reçue (Polling):', ride);
      
      // Vérifier si l'app est au premier plan
      if (AppState.currentState === 'active') {
        // Afficher le modal plein écran
        setIncomingRide(ride);
        setShowIncomingModal(true);
      } else {
        // App en arrière-plan → notification locale
        IncomingRidesService.sendLocalNotification(ride);
      }
    }
  );

  // Listener pour les clics sur notifications
  const unsubscribe = IncomingRidesService.setupNotificationListener((rideId) => {
    console.log('📱 Notification tapée, rideId:', rideId);
    // Ouvrir l'app sur la course
    // TODO: Navigation vers RideDetailScreen
  });

  // Cleanup
  return () => {
    IncomingRidesService.stopListeningForNewRides();
    unsubscribe();
  };
}, [currentUserId, isAuthenticated]);
```

### Étape 4 : Gestion des actions

```typescript
const handleAcceptRide = async () => {
  if (!incomingRide) return;
  
  try {
    // Claim la course
    await apiClient.claimRide(incomingRide.id);
    
    // Fermer le modal
    setShowIncomingModal(false);
    setIncomingRide(null);
    
    // Toast de succès
    toast.success('Course acceptée !');
    
    // Ouvrir les détails de la course
    // TODO: Navigation vers RideDetailScreen avec incomingRide.id
    
    // Rafraîchir les données
    // TODO: Recharger les courses
  } catch (error: any) {
    console.error('Erreur acceptation course:', error);
    toast.error('Erreur lors de l\'acceptation');
  }
};

const handleDeclineRide = () => {
  setShowIncomingModal(false);
  setIncomingRide(null);
  toast.info('Course refusée');
};

const handleTimeoutRide = () => {
  setShowIncomingModal(false);
  setIncomingRide(null);
  toast.info('Demande expirée');
};
```

### Étape 5 : Affichage du modal

```tsx
// À la fin du return de App.tsx (après tous les autres composants)
<IncomingRideModal
  visible={showIncomingModal}
  ride={incomingRide}
  onAccept={handleAcceptRide}
  onDecline={handleDeclineRide}
  onTimeout={handleTimeoutRide}
  timeoutSeconds={20}
/>
```

---

## 📱 Push Notifications (App fermée)

### Configuration backend Supabase

Créer une Edge Function ou utiliser les triggers Supabase :

```sql
-- Trigger lors de la création d'une nouvelle course
CREATE OR REPLACE FUNCTION notify_new_ride()
RETURNS TRIGGER AS $$
BEGIN
  -- Envoyer une push notification à tous les chauffeurs éligibles
  -- Via Supabase Edge Function ou service externe (FCM/APNs)
  
  PERFORM pg_notify(
    'new_ride',
    json_build_object(
      'ride_id', NEW.id,
      'pickup_address', NEW.pickup_address,
      'dropoff_address', NEW.dropoff_address,
      'price_cents', NEW.price_cents
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ride_created
  AFTER INSERT ON rides
  FOR EACH ROW
  WHEN (NEW.status = 'AVAILABLE')
  EXECUTE FUNCTION notify_new_ride();
```

### Edge Function Supabase (à créer)

```typescript
// supabase/functions/send-ride-notification/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { rideId } = await req.json()
  
  // Récupérer les tokens push des chauffeurs éligibles
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data: users } = await supabase
    .from('users')
    .select('expo_push_token')
    .not('expo_push_token', 'is', null)
  
  // Envoyer les notifications via Expo Push API
  const messages = users.map(user => ({
    to: user.expo_push_token,
    sound: 'default',
    title: '🚗 Nouvelle course disponible !',
    body: 'Appuyez pour voir les détails',
    data: { rideId, type: 'new_ride' },
    priority: 'high',
    channelId: 'urgent',
  }))
  
  // Envoyer via Expo Push API
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  })
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## 🔊 Ajouter un son custom (optionnel)

### 1. Créer le dossier

```bash
mkdir -p assets/sounds
```

### 2. Ajouter un fichier audio

Télécharger ou créer un fichier `notification.mp3` et le placer dans `assets/sounds/`

### 3. Décommenter dans `IncomingRideModal.tsx`

```typescript
const playNotificationSound = async () => {
  try {
    const { sound: newSound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/notification.mp3'), // ← Décommenter
      { shouldPlay: true, isLooping: false, volume: 1.0 }
    );
    setSound(newSound);
  } catch (error) {
    console.log('Erreur lecture son:', error);
  }
};
```

---

## 🧪 Test du système

### Test en développement

```typescript
// Simuler une nouvelle course
const testRide = {
  id: 'test-123',
  pickup_address: 'Gare Matabiau, Toulouse',
  dropoff_address: 'Aéroport Blagnac',
  scheduled_at: new Date().toISOString(),
  price_cents: 4500,
  creator_name: 'Jean Dupont',
};

// Déclencher le modal
setIncomingRide(testRide);
setShowIncomingModal(true);
```

### Test des notifications

```typescript
// Envoyer une notification de test
IncomingRidesService.sendLocalNotification(testRide);
```

---

## ⚙️ Configuration recommandée

### `app.json`

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ff6b47",
      "androidMode": "default",
      "androidCollapsedTitle": "Courses disponibles"
    },
    "android": {
      "useNextNotificationsApi": true,
      "permissions": [
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "remote-notification"]
      }
    }
  }
}
```

---

## 📊 Métriques à suivre

- ✅ Temps de réponse moyen (acceptation/refus)
- ✅ Taux d'acceptation
- ✅ Taux de timeout
- ✅ Courses ratées (notification pas reçue)

---

## 🚀 Améliorations futures

1. **WebSockets** : Remplacer le polling par des WebSockets Supabase Realtime
2. **Priorité géographique** : Notifier d'abord les chauffeurs les plus proches
3. **Son personnalisé** : Laisser les chauffeurs choisir leur son de notification
4. **Vibration pattern** : Pattern de vibration unique pour les courses urgentes
5. **Statistiques** : Afficher "X chauffeurs ont vu cette course" en temps réel

---

## ✅ Checklist d'intégration

- [ ] Importer `IncomingRideModal` et `incomingRidesService` dans App.tsx
- [ ] Ajouter les states `incomingRide` et `showIncomingModal`
- [ ] Implémenter les handlers (accept/decline/timeout)
- [ ] Démarrer le service au montage
- [ ] Afficher le modal dans le render
- [ ] Tester avec des données mock
- [ ] Configurer le backend (Edge Function Supabase)
- [ ] Ajouter un son custom (optionnel)
- [ ] Tester les push notifications
- [ ] Déployer et monitorer

---

**Le système est prêt à être intégré ! 🎉**

