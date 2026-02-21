/**
 * EXEMPLE D'INTÉGRATION dans App.tsx
 * 
 * Copiez ces blocs dans votre App.tsx existant
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1) IMPORTS (ajouter en haut du fichier)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { IncomingRideModal } from './src/components';
import * as IncomingRidesService from './src/services/incomingRidesRealtimeService'; // ou incomingRidesService
import { AppState, AppStateStatus } from 'react-native';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2) STATES (ajouter dans votre composant App)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const [incomingRide, setIncomingRide] = useState<any | null>(null);
const [showIncomingModal, setShowIncomingModal] = useState(false);
const appState = useRef(AppState.currentState);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3) HANDLERS (ajouter dans votre composant App)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const handleAcceptRide = async () => {
  if (!incomingRide) return;
  
  try {
    console.log('✅ Acceptation de la course:', incomingRide.id);
    
    // Claim la course via l'API
    await apiClient.claimRide(incomingRide.id);
    
    // Fermer le modal
    setShowIncomingModal(false);
    setIncomingRide(null);
    
    // Toast de succès
    toast.success('Course acceptée !');
    
    // Optionnel : Ouvrir les détails de la course
    // setModalScreen('rideDetail');
    // setSelectedRideId(incomingRide.id);
    
    // Recharger les courses
    // await loadRides(); // ou votre fonction de rafraîchissement
  } catch (error: any) {
    console.error('❌ Erreur acceptation course:', error);
    toast.error('Erreur lors de l\'acceptation');
    setShowIncomingModal(false);
  }
};

const handleDeclineRide = () => {
  console.log('❌ Course refusée');
  setShowIncomingModal(false);
  setIncomingRide(null);
  toast.info('Course refusée');
};

const handleTimeoutRide = () => {
  console.log('⏱️ Course expirée');
  setShowIncomingModal(false);
  setIncomingRide(null);
  toast.info('Demande expirée');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4) EFFET PRINCIPAL (ajouter dans useEffect existant ou créer un nouveau)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useEffect(() => {
  // Vérifier que l'utilisateur est authentifié et vérifié
  if (!currentUserId || !isAuthenticated || verificationStatus !== 'VERIFIED') {
    return;
  }

  console.log('🔔 Initialisation du système de notifications');

  // Démarrer l'écoute des nouvelles courses
  IncomingRidesService.startRealtimeListening(
    currentUserId,
    (ride) => {
      console.log('📢 Nouvelle course détectée:', ride);
      
      // Vérifier que ce n'est pas une course créée par l'utilisateur lui-même
      if (ride.creator_id === currentUserId) {
        console.log('⚠️ Course créée par moi-même, ignorée');
        return;
      }
      
      // Déterminer si l'app est au premier plan
      const isAppActive = AppState.currentState === 'active';
      
      if (isAppActive) {
        // App au premier plan → Modal plein écran
        console.log('📱 App active → Affichage modal');
        setIncomingRide(ride);
        setShowIncomingModal(true);
      } else {
        // App en arrière-plan ou fermée → Notification locale
        console.log('🔕 App en arrière-plan → Notification');
        IncomingRidesService.sendLocalNotification(ride);
      }
    }
  );

  // Écouter les clics sur les notifications
  const unsubscribeNotifications = IncomingRidesService.setupNotificationListener((rideId) => {
    console.log('📱 Notification tapée, rideId:', rideId);
    
    // Ouvrir l'app sur les détails de la course
    // Exemple avec votre système de navigation :
    // setModalScreen('rideDetail');
    // setSelectedRideId(rideId);
  });

  // Écouter les changements d'état de l'app (optionnel mais recommandé)
  const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    console.log('📱 AppState change:', appState.current, '→', nextAppState);
    appState.current = nextAppState;
  });

  // Cleanup
  return () => {
    console.log('🔕 Nettoyage du système de notifications');
    IncomingRidesService.stopRealtimeListening();
    unsubscribeNotifications();
    appStateSubscription.remove();
  };
}, [currentUserId, isAuthenticated, verificationStatus]);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5) RENDER (ajouter à la fin du return, après tous les autres composants)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

return (
  <View style={{ flex: 1 }}>
    {/* ... Tous vos composants existants ... */}
    
    {/* Modal de nouvelle course */}
    <IncomingRideModal
      visible={showIncomingModal}
      ride={incomingRide}
      onAccept={handleAcceptRide}
      onDecline={handleDeclineRide}
      onTimeout={handleTimeoutRide}
      timeoutSeconds={20}
    />
  </View>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6) EXEMPLE COMPLET POUR TEST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Pour tester, ajoutez un bouton temporaire dans votre UI :
/*
<TouchableOpacity
  onPress={() => {
    const testRide = {
      id: 'test-' + Date.now(),
      pickup_address: 'Gare Matabiau, Toulouse',
      dropoff_address: 'Aéroport Toulouse-Blagnac',
      scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1h
      price_cents: 4500,
      creator_name: 'Jean Dupont',
    };
    setIncomingRide(testRide);
    setShowIncomingModal(true);
  }}
  style={{ padding: 20, backgroundColor: '#10b981', margin: 20, borderRadius: 10 }}
>
  <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
    🧪 TESTER LE MODAL
  </Text>
</TouchableOpacity>
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTES IMPORTANTES :
// 
// 1. Vérifiez que expo-av est installé :
//    npx expo install expo-av
// 
// 2. Permissions notifications (app.json) :
//    "notification": {
//      "icon": "./assets/notification-icon.png",
//      "color": "#ff6b47"
//    }
// 
// 3. Pour tester les notifications locales :
//    - Mettez l'app en arrière-plan
//    - Créez une nouvelle course depuis un autre compte
//    - Vous devriez recevoir une notification
// 
// 4. Pour tester le modal :
//    - Gardez l'app ouverte
//    - Créez une nouvelle course depuis un autre compte
//    - Le modal devrait apparaître immédiatement
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

