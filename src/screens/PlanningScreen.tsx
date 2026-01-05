/**
 * PlanningScreen - Calendrier et planning VTC (VERSION REFACTORISÉE)
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
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { planningStyles as styles } from './planning/PlanningStyles';
import DayView from './planning/DayView';
import WeekView from './planning/WeekView';
import EventModal from './planning/EventModal';
import { PlanningEventSkeleton } from '../components/skeletons';

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
  onRidePress?: (rideId: string) => void; // Ouvrir le détail d'une course marketplace
  onPersonalRidePress?: (rideId: string) => void; // Ouvrir le détail d'une course personnelle
}

export default function PlanningScreen({ onBack, onRidePress, onPersonalRidePress }: PlanningScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'day' | 'week'>('week');
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  // Gérer le clic sur un événement
  const handleEventPress = (event: PlanningEvent) => {
    // Si c'est une course (RIDE), ouvrir le détail complet
    if (event.event_type === 'RIDE') {
      // Extraire l'ID de la course (format: "marketplace-{id}" ou "personal-{id}")
      const rideId = event.id.replace('marketplace-', '').replace('personal-', '');
      
      if (event.id.startsWith('marketplace-') && onRidePress) {
        onRidePress(rideId);
      } else if (event.id.startsWith('personal-') && onPersonalRidePress) {
        onPersonalRidePress(rideId);
      } else {
        // Fallback : afficher le modal simple
        setSelectedEvent(event);
      }
    } else {
      // Pour les autres types d'événements, afficher le modal
      setSelectedEvent(event);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Charger événements de planning
      let planningEvents: PlanningEvent[] = [];
      try {
        planningEvents = await apiClient.getPlanningEvents({});
      } catch (error) {
        console.warn('No planning events found');
        planningEvents = [];
      }
      
      // Charger courses marketplace CLAIMED
      let marketplaceRidesAsEvents: PlanningEvent[] = [];
      try {
        const rides = await apiClient.getMyRides('claimed');
        if (Array.isArray(rides)) {
          marketplaceRidesAsEvents = rides
            .filter(ride => ride.scheduled_at && (ride.status === 'CLAIMED' || ride.status === 'COMPLETED'))
            .map(ride => {
              const startTime = new Date(ride.scheduled_at);
              const durationMinutes = ride.duration_minutes || 60;
              const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
              const isPast = startTime.getTime() < Date.now();
              
              return {
                id: `marketplace-${ride.id}`,
                event_type: 'RIDE' as const,
                start_time: startTime.toISOString().replace('T', ' ').substring(0, 19),
                end_time: endTime.toISOString().replace('T', ' ').substring(0, 19),
                start_address: ride.pickup_address,
                end_address: ride.dropoff_address,
                ride_source: 'MARKETPLACE',
                status: ride.status,
                notes: `Course Corail ${ride.status === 'COMPLETED' ? '(terminée)' : ''}`,
                color: isPast ? '#64748b' : '#ff6b47',
              };
            });
        }
      } catch (error) {
        console.error('Error loading marketplace rides:', error);
      }
      
      // Charger courses personnelles
      let personalRidesAsEvents: PlanningEvent[] = [];
      try {
        const personalRides = await apiClient.listPersonalRides({});
        if (Array.isArray(personalRides)) {
          personalRidesAsEvents = personalRides
            .filter(ride => ride.scheduled_at)
            .map(ride => {
              const startTime = new Date(ride.scheduled_at);
              const durationMinutes = ride.duration_minutes || 60;
              const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
              const isPast = startTime.getTime() < Date.now();
              
              return {
                id: `personal-${ride.id}`,
                event_type: 'RIDE' as const,
                start_time: startTime.toISOString().replace('T', ' ').substring(0, 19),
                end_time: endTime.toISOString().replace('T', ' ').substring(0, 19),
                start_address: ride.pickup_address,
                end_address: ride.dropoff_address,
                ride_source: ride.source || 'DIRECT',
                status: ride.status,
                notes: ride.notes,
                color: isPast ? '#64748b' : getColorForSource(ride.source),
              };
            });
        }
      } catch (error) {
        console.error('Error loading personal rides:', error);
      }
      
      // Combiner tous les événements
      const allEvents = [...planningEvents, ...marketplaceRidesAsEvents, ...personalRidesAsEvents];
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Erreur', 'Impossible de charger le planning');
    } finally {
      setLoading(false);
    }
  };

  const getColorForSource = (source?: string): string => {
    switch (source) {
      case 'UBER': return '#000000';
      case 'BOLT': return '#34d186';
      case 'DIRECT': return '#8b5cf6';
      default: return '#64748b';
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
        color: event.color || '#ff6b47',
      });
    });
    return marked;
  };

  // Navigation
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToPreviousWeek = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 7);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 7);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
            </TouchableOpacity>
            <Text style={styles.title}>Planning</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {/* Skeletons */}
          <ScrollView style={styles.content}>
            <PlanningEventSkeleton />
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
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
          <Ionicons name="calendar" size={16} color={viewMode === 'calendar' ? '#fff' : '#64748b'} />
          <Text style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}>
            Mois
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('week')}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={16} color={viewMode === 'week' ? '#fff' : '#64748b'} />
          <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>
            Semaine
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('day')}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={16} color={viewMode === 'day' ? '#fff' : '#64748b'} />
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
            markingType='dot'
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

      {/* Week View */}
      {viewMode === 'week' && (
        <WeekView
          selectedDate={selectedDate}
          events={events}
          onSelectDate={setSelectedDate}
          onSelectEvent={handleEventPress}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onToday={goToToday}
        />
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <DayView
          selectedDate={selectedDate}
          events={events}
          onSelectEvent={handleEventPress}
          onPreviousDay={goToPreviousDay}
          onNextDay={goToNextDay}
        />
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.9}
        onPress={() => Alert.alert('Créer un événement', 'Fonctionnalité à venir')}
      >
        <LinearGradient colors={['#ff6b47', '#ff8a6d']} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </View>
  );
}

