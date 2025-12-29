/**
 * PlanningScreen - Calendrier et planning VTC
 * Vue jour/semaine/mois avec événements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

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

interface PlanningScreenProps {
  onBack: () => void;
}

export default function PlanningScreen({ onBack }: PlanningScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'day'>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Charger événements du mois
      const startOfMonth = new Date(selectedDate);
      startOfMonth.setDate(1);
      const endOfMonth = new Date(selectedDate);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      
      // Charger événements de planning existants
      let planningEvents: PlanningEvent[] = [];
      try {
        planningEvents = await apiClient.getPlanningEvents({
          start_date: startOfMonth.toISOString().split('T')[0],
          end_date: endOfMonth.toISOString().split('T')[0],
        });
      } catch (error) {
        console.warn('No planning events found, will sync rides only');
        planningEvents = [];
      }
      
      // Charger les courses de la marketplace et les convertir en événements
      // UNIQUEMENT les courses CLAIMED (prises/validées)
      let ridesAsEvents: PlanningEvent[] = [];
      try {
        const rides = await apiClient.getRides();
        if (Array.isArray(rides)) {
          ridesAsEvents = rides
            .filter(ride => 
              ride.scheduled_at && 
              ride.status === 'CLAIMED' && // SEULEMENT les courses CLAIMED
              new Date(ride.scheduled_at) >= startOfMonth &&
              new Date(ride.scheduled_at) <= endOfMonth
            )
            .map(ride => {
              const startTime = new Date(ride.scheduled_at);
              const durationMinutes = ride.duration_minutes || 60; // 1 heure par défaut
              const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
              
              return {
                id: `ride-${ride.id}`,
                event_type: 'RIDE' as const,
                start_time: startTime.toISOString().replace('T', ' ').substring(0, 19),
                end_time: endTime.toISOString().replace('T', ' ').substring(0, 19),
                start_address: ride.pickup_address,
                end_address: ride.dropoff_address,
                ride_source: 'MARKETPLACE',
                status: ride.status,
                notes: `Course réclamée`,
                color: '#ff6b47', // Corail color
              };
            });
        }
      } catch (error) {
        console.warn('Error loading rides for planning:', error);
      }
      
      // Fusionner événements de planning et courses marketplace
      const allEvents = [...planningEvents, ...ridesAsEvents];
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading planning events:', error);
      Alert.alert('Erreur', 'Impossible de charger le planning');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    events.forEach(event => {
      const date = event.start_time.split(' ')[0];
      if (!marked[date]) {
        marked[date] = { dots: [] };
      }
      
      marked[date].dots.push({
        color: event.color || getEventColor(event.event_type),
      });
    });
    
    // Selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#ff6b47',
    };
    
    return marked;
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'RIDE': return '#6366f1';
      case 'BREAK': return '#10b981';
      case 'MAINTENANCE': return '#f59e0b';
      case 'PERSONAL': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const getEventIcon = (eventType: string, source?: string) => {
    if (eventType === 'RIDE' && source) {
      switch (source) {
        case 'UBER': return 'car';
        case 'BOLT': return 'flash';
        case 'DIRECT_CLIENT': return 'person';
        case 'MARKETPLACE': return 'storefront';
        default: return 'car-sport';
      }
    }
    
    switch (eventType) {
      case 'RIDE': return 'car-sport';
      case 'BREAK': return 'cafe';
      case 'MAINTENANCE': return 'construct';
      case 'PERSONAL': return 'calendar';
      default: return 'ellipse';
    }
  };

  const getEventLabel = (event: PlanningEvent) => {
    if (event.event_type === 'RIDE') {
      if (event.ride_source === 'UBER') return 'Uber';
      if (event.ride_source === 'BOLT') return 'Bolt';
      if (event.ride_source === 'DIRECT_CLIENT') return 'Direct';
      if (event.ride_source === 'MARKETPLACE') return 'Corail';
      return 'Course';
    }
    
    switch (event.event_type) {
      case 'BREAK': return 'Pause';
      case 'MAINTENANCE': return 'Maintenance';
      case 'PERSONAL': return 'Personnel';
      default: return event.event_type;
    }
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getDayEvents = () => {
    return events.filter(event => 
      event.start_time.startsWith(selectedDate)
    ).sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  };

  const renderDayView = () => {
    const dayEvents = getDayEvents();
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23
    
    return (
      <ScrollView style={styles.dayView} showsVerticalScrollIndicator={false}>
        {/* Header jour sélectionné */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>
            {new Date(selectedDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
          <Text style={styles.dayHeaderCount}>
            {dayEvents.length} {dayEvents.length <= 1 ? 'événement' : 'événements'}
          </Text>
        </View>

        {/* Timeline heure par heure */}
        <View style={styles.timeline}>
          {hours.map(hour => {
            // Trouver les événements pour cette heure
            const hourEvents = dayEvents.filter(event => {
              const eventStartHour = new Date(event.start_time).getHours();
              return eventStartHour === hour;
            });

            return (
              <View key={hour} style={styles.timeSlot}>
                {/* Colonne heure */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>
                    {hour.toString().padStart(2, '0')}:00
                  </Text>
                </View>

                {/* Colonne événements */}
                <View style={styles.eventsColumn}>
                  {hourEvents.length === 0 ? (
                    <View style={styles.emptySlot} />
                  ) : (
                    hourEvents.map(event => (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.timelineEvent,
                          { borderLeftColor: event.color || getEventColor(event.event_type) }
                        ]}
                        onPress={() => setSelectedEvent(event)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.timelineEventHeader}>
                          <Ionicons 
                            name={getEventIcon(event.event_type, event.ride_source) as any} 
                            size={16} 
                            color={event.color || getEventColor(event.event_type)} 
                          />
                          <Text style={styles.timelineEventLabel}>
                            {getEventLabel(event)}
                          </Text>
                        </View>
                        <Text style={styles.timelineEventTime}>
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </Text>
                        {event.start_address && (
                          <Text style={styles.timelineEventAddress} numberOfLines={1}>
                            <Ionicons name="location" size={12} color="#94a3b8" /> {event.start_address}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Message si aucun événement */}
        {dayEvents.length === 0 && (
          <View style={styles.emptyDayMessage}>
            <Ionicons name="calendar-outline" size={48} color="#64748b" />
            <Text style={styles.emptyDayText}>Aucun événement ce jour</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'rgba(99, 102, 241, 0.2)';
      case 'IN_PROGRESS': return 'rgba(16, 185, 129, 0.2)';
      case 'COMPLETED': return 'rgba(100, 116, 139, 0.2)';
      case 'CANCELLED': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(100, 116, 139, 0.2)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Planifié';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff6b47" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Planning</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Alert.alert('Réglages', 'Préférences de notifications à venir')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#f1f5f9" />
        </TouchableOpacity>
      </LinearGradient>

      {/* View Mode Toggle */}
      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('calendar')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="calendar" 
            size={18} 
            color={viewMode === 'calendar' ? '#fff' : '#64748b'} 
          />
          <Text style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}>
            Mois
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('day')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="list" 
            size={18} 
            color={viewMode === 'day' ? '#fff' : '#64748b'} 
          />
          <Text style={[styles.viewModeText, viewMode === 'day' && styles.viewModeTextActive]}>
            Jour
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <Calendar
            current={selectedDate}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setViewMode('day');
            }}
            markedDates={getMarkedDates()}
            markingType='multi-dot'
            theme={{
              calendarBackground: '#0f172a',
              textSectionTitleColor: '#94a3b8',
              selectedDayBackgroundColor: '#ff6b47',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ff6b47',
              dayTextColor: '#e2e8f0',
              textDisabledColor: '#475569',
              monthTextColor: '#f1f5f9',
              arrowColor: '#ff6b47',
            }}
          />
        </ScrollView>
      )}

      {/* Day View */}
      {viewMode === 'day' && renderDayView()}

      {/* FAB pour ajouter événement */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.9}
        onPress={() => Alert.alert('Créer un événement', 'Fonctionnalité à venir')}
      >
        <LinearGradient
          colors={['#ff6b47', '#ff8a6d']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal détail événement */}
      {selectedEvent && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons 
                  name={getEventIcon(selectedEvent.event_type, selectedEvent.ride_source) as any} 
                  size={24} 
                  color={selectedEvent.color || getEventColor(selectedEvent.event_type)} 
                />
                <Text style={styles.modalTitle}>{getEventLabel(selectedEvent)}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setSelectedEvent(null)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Horaires */}
              <View style={styles.modalSection}>
                <View style={styles.modalRow}>
                  <Ionicons name="time" size={20} color="#10b981" />
                  <View style={styles.modalRowContent}>
                    <Text style={styles.modalLabel}>Horaire</Text>
                    <Text style={styles.modalValue}>
                      {formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Adresses */}
              {selectedEvent.start_address && selectedEvent.end_address && (
                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <Ionicons name="location" size={20} color="#10b981" />
                    <View style={styles.modalRowContent}>
                      <Text style={styles.modalLabel}>Départ</Text>
                      <Text style={styles.modalValue}>{selectedEvent.start_address}</Text>
                    </View>
                  </View>
                  <View style={[styles.modalRow, { marginTop: 12 }]}>
                    <Ionicons name="flag" size={20} color="#ff6b47" />
                    <View style={styles.modalRowContent}>
                      <Text style={styles.modalLabel}>Arrivée</Text>
                      <Text style={styles.modalValue}>{selectedEvent.end_address}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Statut */}
              {selectedEvent.status && (
                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <Ionicons name="information-circle" size={20} color="#6366f1" />
                    <View style={styles.modalRowContent}>
                      <Text style={styles.modalLabel}>Statut</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedEvent.status) }]}>
                        <Text style={styles.statusText}>{getStatusLabel(selectedEvent.status)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Notes */}
              {selectedEvent.notes && (
                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <Ionicons name="document-text" size={20} color="#94a3b8" />
                    <View style={styles.modalRowContent}>
                      <Text style={styles.modalLabel}>Notes</Text>
                      <Text style={styles.modalValue}>{selectedEvent.notes}</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setSelectedEvent(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeToggle: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewModeButtonActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  dayView: {
    flex: 1,
  },
  dayHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1e293b',
  },
  dayHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  dayHeaderCount: {
    fontSize: 13,
    color: '#94a3b8',
  },
  timeline: {
    paddingVertical: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeColumn: {
    width: 70,
    paddingTop: 12,
    paddingLeft: 16,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  eventsColumn: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 16,
    gap: 8,
  },
  emptySlot: {
    height: 44,
  },
  timelineEvent: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timelineEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timelineEventLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  timelineEventTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  timelineEventAddress: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyDayMessage: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyDayText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e2e8f0',
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: 400,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRowContent: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalButton: {
    backgroundColor: '#ff6b47',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

