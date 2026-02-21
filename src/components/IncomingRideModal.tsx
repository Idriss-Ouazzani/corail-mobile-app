/**
 * IncomingRideModal - Modal "Uber-like" pour nouvelle course
 * Affichage plein écran avec compteur et actions rapides
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface IncomingRideModalProps {
  visible: boolean;
  ride: {
    id: string;
    pickup_address: string;
    dropoff_address: string;
    scheduled_at: string;
    price_cents?: number;
    creator_name?: string;
    source?: string;
  } | null;
  onAccept: () => void;
  onDecline: () => void;
  onTimeout: () => void;
  timeoutSeconds?: number;
}

export const IncomingRideModal: React.FC<IncomingRideModalProps> = ({
  visible,
  ride,
  onAccept,
  onDecline,
  onTimeout,
  timeoutSeconds = 20,
}) => {
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Animation de "pulse" pour l'urgence
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible]);

  // Compteur + timeout
  useEffect(() => {
    if (!visible || !ride) {
      setCountdown(timeoutSeconds);
      return;
    }

    // Vibration initiale (pattern court)
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 400, 200, 400]);
    } else {
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);
    }

    // Jouer un son (notification)
    playNotificationSound();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopSound();
    };
  }, [visible, ride]);

  // Son de notification
  const playNotificationSound = async () => {
    try {
      // Pour ajouter un son custom :
      // 1. Ajouter le fichier audio dans assets/sounds/notification.mp3
      // 2. Décommenter la ligne ci-dessous :
      // const { sound: newSound } = await Audio.Sound.createAsync(
      //   require('../../assets/sounds/notification.mp3'),
      //   { shouldPlay: true, isLooping: false, volume: 1.0 }
      // );
      // setSound(newSound);
      
      // Pour l'instant, on utilise juste la vibration (son géré par la notification système)
      console.log('🔔 Notification visuelle (son via push notification)');
    } catch (error) {
      console.log('Erreur lecture son:', error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.log('Erreur arrêt son:', error);
      }
    }
  };

  if (!ride) return null;

  const scheduledTime = new Date(ride.scheduled_at);
  const formattedTime = scheduledTime.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const price = ride.price_cents ? `${(ride.price_cents / 100).toFixed(2)}€` : null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onDecline}
    >
      <View style={styles.container}>
        {/* Header avec compteur */}
        <View style={styles.header}>
          <View style={styles.countdownContainer}>
            <Animated.View style={[styles.countdown, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </Animated.View>
          </View>
          <Text style={styles.headerTitle}>Nouvelle annonce</Text>
          <Text style={styles.headerSubtitleNew}>
            Une course a été publiée sur la marketplace{ride.creator_name ? ` par ${ride.creator_name}` : ''}.
          </Text>
        </View>

        {/* Détails de la course */}
        <View style={styles.content}>
          {/* Heure */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={24} color="#0ea5e9" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Heure de départ</Text>
              <Text style={styles.infoValue}>{formattedTime}</Text>
            </View>
          </View>

          {/* Départ */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="location" size={24} color="#10b981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Départ</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {ride.pickup_address}
              </Text>
            </View>
          </View>

          {/* Arrivée */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="location" size={24} color="#ef4444" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Arrivée</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {ride.dropoff_address}
              </Text>
            </View>
          </View>

          {/* Prix */}
          {price && (
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Tarif proposé</Text>
              <Text style={styles.priceValue}>{price}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Bouton Refuser */}
          <TouchableOpacity
            style={styles.declineButton}
            onPress={onDecline}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={24} color="#ef4444" />
            <Text style={styles.declineButtonText}>Refuser</Text>
          </TouchableOpacity>

          {/* Bouton Accepter */}
          <TouchableOpacity
            style={[styles.acceptButton, styles.acceptButtonInner]}
            onPress={onAccept}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.acceptButtonText}>Accepter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color="#64748b" />
          <Text style={styles.footerText}>
            Cette demande expirera automatiquement dans {countdown}s
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  countdownContainer: {
    marginBottom: 20,
  },
  countdown: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(14, 165, 233, 0.4)',
    elevation: 8,
  },
  countdownText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitleNew: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '600',
  },
  priceCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 28,
    color: '#10b981',
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 14,
  },
  acceptButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#10b981',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});

