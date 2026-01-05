/**
 * Toast Notification Service
 * 
 * Remplace les Alert.alert() natifs par des toasts élégants
 * Compatible avec le design Corail (rouge/orange)
 */

import Toast from 'react-native-toast-message';

export const toast = {
  /**
   * ✅ Succès - Action réussie
   */
  success: (title: string, message?: string) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  /**
   * ❌ Erreur - Action échouée
   */
  error: (title: string, message?: string) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      visibilityTime: 4000,
      topOffset: 60,
    });
  },

  /**
   * ℹ️ Info - Information générale
   */
  info: (title: string, message?: string) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  /**
   * ⚠️ Avertissement
   */
  warning: (title: string, message?: string) => {
    Toast.show({
      type: 'error', // On utilise 'error' avec un message différent
      text1: title,
      text2: message,
      visibilityTime: 3500,
      topOffset: 60,
    });
  },

  /**
   * 🪸 Crédit gagné - Toast spécial Corail
   */
  creditEarned: (amount: number = 1) => {
    Toast.show({
      type: 'success',
      text1: '🪸 Crédit gagné !',
      text2: `+${amount} crédit${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''} à votre compte`,
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  /**
   * 💳 Crédit dépensé - Toast spécial Corail
   */
  creditSpent: (amount: number = 1) => {
    Toast.show({
      type: 'info',
      text1: '💳 Crédit utilisé',
      text2: `-${amount} crédit${amount > 1 ? 's' : ''}`,
      visibilityTime: 2500,
      topOffset: 60,
    });
  },

  /**
   * 🚗 Course créée
   */
  rideCreated: () => {
    Toast.show({
      type: 'success',
      text1: '🚗 Course créée !',
      text2: 'Votre course a été enregistrée avec succès',
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  /**
   * 📤 Course publiée
   */
  ridePublished: () => {
    Toast.show({
      type: 'success',
      text1: '📤 Course publiée !',
      text2: 'Vous avez gagné 1 crédit 🎉',
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  /**
   * ✅ Course prise
   */
  rideClaimed: () => {
    Toast.show({
      type: 'success',
      text1: '✅ Course prise !',
      text2: 'Rendez-vous ajouté à votre planning',
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  /**
   * 🗑️ Course supprimée
   */
  rideDeleted: () => {
    Toast.show({
      type: 'info',
      text1: '🗑️ Course supprimée',
      text2: 'La course a été retirée',
      visibilityTime: 2500,
      topOffset: 60,
    });
  },

  /**
   * ⚠️ Crédits insuffisants
   */
  insufficientCredits: () => {
    Toast.show({
      type: 'error',
      text1: '⚠️ Crédits insuffisants',
      text2: 'Publiez des courses pour gagner des crédits !',
      visibilityTime: 4000,
      topOffset: 60,
    });
  },

  /**
   * 🎉 Badge gagné
   */
  badgeEarned: (badgeName: string) => {
    Toast.show({
      type: 'success',
      text1: '🏆 Nouveau badge !',
      text2: badgeName,
      visibilityTime: 4000,
      topOffset: 60,
    });
  },

  /**
   * 👥 Invitation envoyée
   */
  invitationSent: () => {
    Toast.show({
      type: 'success',
      text1: '✉️ Invitation envoyée',
      text2: 'L\'utilisateur recevra une notification',
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  /**
   * Masquer tous les toasts
   */
  hide: () => {
    Toast.hide();
  },
};

export default toast;

