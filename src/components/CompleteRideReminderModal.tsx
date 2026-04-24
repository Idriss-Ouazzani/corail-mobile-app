/**
 * Pop-up élégant pour rappeler à l'utilisateur de terminer sa(ses) course(s) en cours.
 * Affiché après 30 min ou à la prochaine connexion (app au premier plan).
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { Ride } from '../types';

const REMINDER_TITLE = 'Terminer votre course';
const REMINDER_MESSAGE =
  'Vous avez une course en attente de finalisation. Pensez à la marquer comme terminée et à envoyer votre retour au chauffeur.';

interface CompleteRideReminderModalProps {
  visible: boolean;
  rides: Ride[];
  onDismiss: () => void;
  onOpenRide: (ride: Ride) => void;
}

export function CompleteRideReminderModal({
  visible,
  rides,
  onDismiss,
  onOpenRide,
}: CompleteRideReminderModalProps) {
  if (!visible || rides.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.overlayDark]} />
        )}
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="car-sport" size={40} color="#0ea5e9" />
          </View>
          <Text style={styles.title}>{REMINDER_TITLE}</Text>
          <Text style={styles.message}>{REMINDER_MESSAGE}</Text>
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {rides.map((ride) => (
              <TouchableOpacity
                key={ride.id}
                style={styles.rideRow}
                onPress={() => onOpenRide(ride)}
                activeOpacity={0.8}
              >
                <View style={styles.rideInfo}>
                  <Text style={styles.rideAddress} numberOfLines={1}>
                    {ride.pickup_address}
                  </Text>
                  <Text style={styles.rideArrow}>→</Text>
                  <Text style={styles.rideAddress} numberOfLines={1}>
                    {ride.dropoff_address}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onOpenRide(rides[0])}
              activeOpacity={0.9}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {rides.length === 1 ? 'Terminer cette course' : 'Voir ma course'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterButton} onPress={onDismiss} activeOpacity={0.8}>
              <Text style={styles.laterButtonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayDark: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  list: {
    maxHeight: 160,
    marginBottom: 20,
  },
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  rideInfo: {
    flex: 1,
    marginRight: 8,
  },
  rideAddress: {
    fontSize: 13,
    color: '#e2e8f0',
  },
  rideArrow: {
    fontSize: 12,
    color: '#64748b',
    marginVertical: 2,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
