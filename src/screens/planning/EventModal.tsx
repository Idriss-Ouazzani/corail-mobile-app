/**
 * EventModal - Modal pour afficher les détails d'un événement
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { planningStyles as styles } from './PlanningStyles';
import { getEventIcon, getEventLabel, getEventColor, getStatusLabel } from './PlanningUtils';

interface PlanningEvent {
  id: string;
  event_type: 'RIDE' | 'BREAK' | 'MAINTENANCE' | 'PERSONAL';
  start_time: string;
  end_time: string;
  start_address?: string;
  end_address?: string;
  ride_source?: string;
  status?: string;
  notes?: string;
  color?: string;
}

interface EventModalProps {
  event: PlanningEvent;
  onClose: () => void;
}

export default function EventModal({ event, onClose }: EventModalProps) {
  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity 
        style={{ flex: 1 }} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <View style={styles.modalContent}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <Ionicons 
              name={getEventIcon(event.event_type, event.ride_source) as any} 
              size={24} 
              color={event.color || getEventColor(event.event_type)} 
            />
            <Text style={styles.modalTitle}>{getEventLabel(event)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView style={styles.modalBody}>
          {/* Horaires */}
          <View style={styles.modalSection}>
            <View style={styles.modalRow}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Début</Text>
                <Text style={styles.modalValue}>
                  {new Date(event.start_time).toLocaleString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Fin</Text>
                <Text style={styles.modalValue}>
                  {new Date(event.end_time).toLocaleString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Adresses (si course) */}
          {event.start_address && (
            <View style={styles.modalSection}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Départ</Text>
                <Text style={styles.modalValue}>{event.start_address}</Text>
              </View>
              {event.end_address && (
                <View style={[styles.modalField, { marginTop: 16 }]}>
                  <Text style={styles.modalLabel}>Arrivée</Text>
                  <Text style={styles.modalValue}>{event.end_address}</Text>
                </View>
              )}
            </View>
          )}

          {/* Statut */}
          {event.status && (
            <View style={styles.modalSection}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Statut</Text>
                <Text style={styles.modalValue}>{getStatusLabel(event.status)}</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {event.notes && (
            <View style={styles.modalSection}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Notes</Text>
                <Text style={styles.modalValue}>{event.notes}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.modalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

