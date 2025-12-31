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
      
      // Charger événements de planning existants
      let planningEvents: PlanningEvent[] = [];
      try {
        planningEvents = await apiClient.getPlanningEvents({});
      } catch (error) {
        console.warn('No planning events found, will sync rides only');
        planningEvents = [];
      }
      
      // Charger MES courses CLAIMED (courses marketplace que j'ai prises)
      let marketplaceRidesAsEvents: PlanningEvent[] = [];
      try {
        const rides = await apiClient.getMyRides('claimed');
        console.log(`📅 Planning: ${rides.length} courses claimed chargées`);
        
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
                color: isPast ? '#64748b' : '#ff6b47', // Gris si passé, orange si futur
              };
            });
          console.log(`📅 Planning: ${marketplaceRidesAsEvents.length} courses marketplace ajoutées`);
        }
      } catch (error) {
        console.error('Error loading marketplace rides:', error);
      }
      
      // Charger MES courses PERSONNELLES (Uber, Bolt, Direct, etc.)
      let personalRidesAsEvents: PlanningEvent[] = [];
      try {
        const personalRides = await apiClient.listPersonalRides({ status: 'SCHEDULED' });
        console.log(`📅 Planning: ${personalRides.length} courses personnelles chargées`);
        
        if (Array.isArray(personalRides)) {
          personalRidesAsEvents = personalRides
            .filter(ride => ride.scheduled_at)
            .map(ride => {
              const startTime = new Date(ride.scheduled_at);
              const durationMinutes = ride.duration_minutes || 60;
              const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
              const isPast = startTime.getTime() < Date.now();
              
              // Couleur selon la source
              let color = '#6366f1'; // Défaut
              if (ride.source === 'UBER') color = '#000000';
              if (ride.source === 'BOLT') color = '#34d399';
              if (ride.source === 'DIRECT_CLIENT') color = '#8b5cf6';
              if (isPast) color = '#64748b'; // Gris si passé
              
              return {
                id: `personal-${ride.id}`,
                event_type: 'RIDE' as const,
                start_time: startTime.toISOString().replace('T', ' ').substring(0, 19),
                end_time: endTime.toISOString().replace('T', ' ').substring(0, 19),
                start_address: ride.pickup_address || '',
                end_address: ride.dropoff_address || '',
                ride_source: ride.source || 'OTHER',
                status: ride.status,
                notes: `Course ${ride.source || 'autre'}`,
                color: color,
              };
            });
          console.log(`📅 Planning: ${personalRidesAsEvents.length} courses personnelles ajoutées`);
        }
      } catch (error) {
        console.error('Error loading personal rides:', error);
      }
      
      // Fusionner tous les événements
      const allEvents = [...planningEvents, ...marketplaceRidesAsEvents, ...personalRidesAsEvents];
      console.log(`📅 Planning: Total ${allEvents.length} événements`);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading planning events:', error);
      Alert.alert('Erreur', 'Impossible de charger le planning');
    } finally {
      setLoading(false);
    }
  };

