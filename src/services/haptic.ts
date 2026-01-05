/**
 * Haptic Feedback Service
 * 
 * Fournit des retours haptiques pour une UX premium
 * Compatible iOS (Taptic Engine) et Android (Vibration)
 * 
 * ⚠️ Graceful degradation : Si le module n'est pas disponible (Expo Go),
 * les appels ne feront rien silencieusement.
 */

// Import conditionnel avec gestion d'erreur
let ReactNativeHapticFeedback: any = null;
let isHapticAvailable = false;

try {
  ReactNativeHapticFeedback = require('react-native-haptic-feedback');
  isHapticAvailable = true;
  if (__DEV__) {
    console.log('✅ Haptic Feedback disponible');
  }
} catch (error) {
  if (__DEV__) {
    console.log('ℹ️ Haptic Feedback non disponible (Expo Go) - Mode silencieux activé');
  }
}

const options = {
  enableVibrateFallback: true, // Android vibration si pas de haptic
  ignoreAndroidSystemSettings: false,
};

/**
 * Fonction helper pour exécuter le haptic avec gestion d'erreur
 */
const triggerHaptic = (type: string) => {
  if (!isHapticAvailable || !ReactNativeHapticFeedback) {
    // Silent fail dans Expo Go
    return;
  }
  
  try {
    ReactNativeHapticFeedback.trigger(type, options);
  } catch (error) {
    // Double sécurité en cas d'erreur runtime
    if (__DEV__) {
      console.log(`⚠️ Haptic "${type}" a échoué`);
    }
  }
};

export const haptic = {
  /**
   * ⚡ Impact léger - Navigation, sélection
   * Utilisé pour : Tabs, chips, boutons secondaires
   */
  light: () => {
    triggerHaptic('impactLight');
  },

  /**
   * ⚡⚡ Impact moyen - Actions standards
   * Utilisé pour : Boutons principaux, switches, refresh
   */
  medium: () => {
    triggerHaptic('impactMedium');
  },

  /**
   * ⚡⚡⚡ Impact lourd - Actions importantes
   * Utilisé pour : Validation, publication, claim
   */
  heavy: () => {
    triggerHaptic('impactHeavy');
  },

  /**
   * ✅ Succès - Action réussie
   * Utilisé pour : Création, publication, validation
   */
  success: () => {
    triggerHaptic('notificationSuccess');
  },

  /**
   * ⚠️ Attention - Avertissement
   * Utilisé pour : Crédits insuffisants, champs vides
   */
  warning: () => {
    triggerHaptic('notificationWarning');
  },

  /**
   * ❌ Erreur - Action échouée
   * Utilisé pour : Erreurs, suppressions, échecs
   */
  error: () => {
    triggerHaptic('notificationError');
  },

  /**
   * 🔔 Sélection - Changement de valeur
   * Utilisé pour : Pickers, sliders, steppers
   */
  selection: () => {
    triggerHaptic('selection');
  },
};

export default haptic;

