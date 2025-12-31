/**
 * DayView - Vue jour du planning avec timeline et navigation
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { planningStyles as styles } from './PlanningStyles';
import { getEventIcon, getEventLabel, formatTime, getEventColor } from './PlanningUtils';

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

interface DayViewProps {
  selectedDate: string;
  events: PlanningEvent[];
  onSelectEvent: (event: PlanningEvent) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export default function DayView({
  selectedDate,
  events,
  onSelectEvent,
  onPreviousDay,
  onNextDay,
}: DayViewProps) {
  const dayEvents = events
    .filter(event => event.start_time.startsWith(selectedDate))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Calculer la position de l'indicateur d'heure actuelle
  const now = new Date();
  const isToday = selectedDate === now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  return (
    <ScrollView style={styles.dayView} showsVerticalScrollIndicator={false}>
      {/* Navigation jour */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={onPreviousDay} style={styles.navButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#ff6b47" />
        </TouchableOpacity>
        <View style={styles.navigationCenter}>
          <Text style={styles.navigationTitle}>
            {new Date(selectedDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
          <Text style={styles.navigationSubtitle}>
            {dayEvents.length} {dayEvents.length <= 1 ? 'événement' : 'événements'}
          </Text>
        </View>
        <TouchableOpacity onPress={onNextDay} style={styles.navButton} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color="#ff6b47" />
        </TouchableOpacity>
      </View>

      {/* Timeline heure par heure */}
      <View style={styles.timeline}>
        {hours.map(hour => {
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
                {/* Indicateur d'heure actuelle */}
                {isToday && hour === currentHour && (
                  <View style={[styles.currentTimeIndicator, { top: (currentMinutes / 60) * 60 }]}>
                    <View style={styles.currentTimeDot} />
                    <View style={styles.currentTimeLine} />
                    <Text style={styles.currentTimeText}>
                      {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}

                {hourEvents.length === 0 ? (
                  <View style={styles.emptySlot} />
                ) : (
                  hourEvents.map(event => {
                    const eventTime = new Date(event.start_time).getTime();
                    const isPast = eventTime < Date.now();
                    const isFuture = eventTime > Date.now();
                    
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.timelineEvent,
                          { borderLeftColor: event.color || getEventColor(event.event_type) },
                          isPast && styles.timelineEventPast,
                          isFuture && styles.timelineEventFuture,
                        ]}
                        onPress={() => onSelectEvent(event)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.timelineEventHeader}>
                          <Ionicons 
                            name={getEventIcon(event.event_type, event.ride_source) as any} 
                            size={16} 
                            color={isPast ? '#64748b' : (event.color || getEventColor(event.event_type))} 
                          />
                          <Text style={[
                            styles.timelineEventLabel,
                            isPast && { color: '#64748b' }
                          ]}>
                            {getEventLabel(event)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.timelineEventTime,
                          isPast && { color: '#475569' }
                        ]}>
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </Text>
                        {event.start_address && (
                          <Text style={[
                            styles.timelineEventAddress,
                            isPast && { color: '#475569' }
                          ]} numberOfLines={1}>
                            <Ionicons name="location" size={12} color={isPast ? '#475569' : '#94a3b8'} /> {event.start_address}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
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
}

