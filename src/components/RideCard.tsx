import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlert } from './CustomAlert';

interface RideCardProps {
  ride: any;
  status: 'IN_PROGRESS' | 'UPCOMING';
  onPress: () => void;
  onComplete?: (generateInvoice: boolean) => void;
  onCancel?: () => void;
}

export const RideCard: React.FC<RideCardProps> = ({
  ride,
  status,
  onPress,
  onComplete,
  onCancel,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showCompleteAlert, setShowCompleteAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  // Animation "breathing" pour les courses en cours
  useEffect(() => {
    if (status === 'IN_PROGRESS') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [status, scaleAnim]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleComplete = () => {
    setShowCompleteAlert(true);
  };

  const handleCancel = () => {
    setShowCancelAlert(true);
  };

  if (status === 'IN_PROGRESS') {
    return (
      <>
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.inProgressContainer}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inProgressGradient}
            >
              {/* Header avec badge EN COURS */}
              <View style={styles.inProgressHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>EN COURS</Text>
                </View>
                <Ionicons name="time" size={18} color="rgba(255,255,255,0.9)" />
              </View>

              {/* Itinéraire */}
              <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                  <Ionicons name="location" size={16} color="#fff" />
                  <Text style={styles.inProgressAddress} numberOfLines={1}>
                    {ride.pickup_address}
                  </Text>
                </View>
                <View style={styles.routeRow}>
                  <Ionicons name="flag" size={16} color="#fff" />
                  <Text style={styles.inProgressAddress} numberOfLines={1}>
                    {ride.dropoff_address}
                  </Text>
                </View>
              </View>

              {/* Prix */}
              {ride.price_cents && (
                <Text style={styles.inProgressPrice}>
                  {(ride.price_cents / 100).toFixed(2)}€
                </Text>
              )}

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleComplete}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.completeButtonText}>Terminer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Alerts personnalisés */}
        <CustomAlert
          visible={showCompleteAlert}
          title="Terminer la course"
          message="Voulez-vous générer la facture pour cette course ?"
          buttons={[
            {
              text: 'Plus tard',
              style: 'cancel',
              onPress: () => onComplete?.(false),
            },
            {
              text: 'Générer la facture',
              style: 'primary',
              onPress: () => onComplete?.(true),
            },
          ]}
          onClose={() => setShowCompleteAlert(false)}
        />

        <CustomAlert
          visible={showCancelAlert}
          title="Annuler la course"
          message="Êtes-vous sûr de vouloir annuler cette course ?"
          buttons={[
            {
              text: 'Non',
              style: 'cancel',
              onPress: () => {},
            },
            {
              text: 'Oui, annuler',
              style: 'destructive',
              onPress: () => onCancel?.(),
            },
          ]}
          onClose={() => setShowCancelAlert(false)}
        />
      </>
    );
  }

  // Course à venir
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.upcomingContainer}
      >
        <View style={styles.upcomingHeader}>
          <Ionicons name="calendar-outline" size={16} color="#6366f1" />
          <Text style={styles.upcomingTime}>
            {formatDate(ride.scheduled_at)}
          </Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <Ionicons name="location" size={14} color="#94a3b8" />
            <Text style={styles.upcomingAddress} numberOfLines={1}>
              {ride.pickup_address}
            </Text>
          </View>
          <View style={styles.routeRow}>
            <Ionicons name="flag" size={14} color="#94a3b8" />
            <Text style={styles.upcomingAddress} numberOfLines={1}>
              {ride.dropoff_address}
            </Text>
          </View>
        </View>

        {ride.price_cents && (
          <Text style={styles.upcomingPrice}>
            {(ride.price_cents / 100).toFixed(2)}€
          </Text>
        )}
      </TouchableOpacity>

      {/* Alerts personnalisés */}
      <CustomAlert
        visible={showCompleteAlert}
        title="Terminer la course"
        message="Voulez-vous générer la facture pour cette course ?"
        buttons={[
          {
            text: 'Plus tard',
            style: 'cancel',
            onPress: () => onComplete?.(false),
          },
          {
            text: 'Générer la facture',
            style: 'primary',
            onPress: () => onComplete?.(true),
          },
        ]}
        onClose={() => setShowCompleteAlert(false)}
      />

      <CustomAlert
        visible={showCancelAlert}
        title="Annuler la course"
        message="Êtes-vous sûr de vouloir annuler cette course ?"
        buttons={[
          {
            text: 'Non',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Oui, annuler',
            style: 'destructive',
            onPress: () => onCancel?.(),
          },
        ]}
        onClose={() => setShowCancelAlert(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // Cours en cours (vert)
  inProgressContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inProgressGradient: {
    padding: 16,
    gap: 12,
  },
  inProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  routeContainer: {
    gap: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inProgressAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  inProgressPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Course à venir
  upcomingContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  upcomingTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  upcomingAddress: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
  },
  upcomingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 8,
  },
});
