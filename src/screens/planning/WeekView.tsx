/**
 * WeekView - Vue semaine du planning avec navigation
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { planningStyles as styles } from './PlanningStyles';
import { getEventIcon, getEventLabel, formatTime, getEventColor, getWeekDays } from './PlanningUtils';

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

interface WeekViewProps {
  selectedDate: string;
  events: PlanningEvent[];
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: PlanningEvent) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export default function WeekView({
  selectedDate,
  events,
  onSelectDate,
  onSelectEvent,
  onPreviousWeek,
  onNextWeek,
  onToday,
}: WeekViewProps) {
  const weekDays = getWeekDays(selectedDate);
  
  const getDayEvents = (date: string) => {
    return events
      .filter(event => event.start_time.startsWith(date))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const selectedDayEvents = getDayEvents(selectedDate);

  return (
    <View style={styles.weekView}>
      {/* Navigation semaine */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={onPreviousWeek} style={styles.navButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#ff6b47" />
        </TouchableOpacity>
        <View style={styles.navigationCenter}>
          <Text style={styles.navigationTitle}>
            Semaine du {new Date(weekDays[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
          <TouchableOpacity onPress={onToday} activeOpacity={0.7}>
            <Text style={styles.todayButton}>Aujourd'hui</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onNextWeek} style={styles.navButton} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color="#ff6b47" />
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDaysScroll}>
        {weekDays.map((day) => {
          const dayEvents = getDayEvents(day.date);
          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.weekDayCard,
                day.isSelected && styles.weekDayCardSelected,
                day.isToday && !day.isSelected && styles.weekDayCardToday,
              ]}
              onPress={() => onSelectDate(day.date)}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekDayName, day.isSelected && styles.weekDayNameSelected]}>
                {day.dayName}
              </Text>
              <Text style={[styles.weekDayNumber, day.isSelected && styles.weekDayNumberSelected]}>
                {day.dayNumber}
              </Text>
              {dayEvents.length > 0 && (
                <View style={[styles.weekDayDot, day.isSelected && styles.weekDayDotSelected]}>
                  <Text style={[styles.weekDayDotText, day.isSelected && { color: '#ff6b47' }]}>
                    {dayEvents.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Événements du jour sélectionné */}
      <ScrollView style={styles.weekEventsContainer} showsVerticalScrollIndicator={false}>
        {selectedDayEvents.map((event) => {
          const eventTime = new Date(event.start_time).getTime();
          const isPast = eventTime < Date.now();
          
          return (
            <TouchableOpacity
              key={event.id}
              style={[styles.weekEventCard, isPast && styles.weekEventCardPast]}
              onPress={() => onSelectEvent(event)}
              activeOpacity={0.7}
            >
              <View style={[styles.weekEventColorBar, { backgroundColor: event.color || getEventColor(event.event_type) }]} />
              <View style={styles.weekEventContent}>
                <View style={styles.weekEventHeader}>
                  <Ionicons 
                    name={getEventIcon(event.event_type, event.ride_source) as any} 
                    size={20} 
                    color={isPast ? '#64748b' : (event.color || getEventColor(event.event_type))} 
                  />
                  <Text style={[styles.weekEventLabel, isPast && styles.weekEventLabelPast]}>
                    {getEventLabel(event)}
                  </Text>
                </View>
                <Text style={[styles.weekEventTime, isPast && styles.weekEventTimePast]}>
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </Text>
                {event.start_address && (
                  <Text style={[styles.weekEventAddress, isPast && styles.weekEventAddressPast]} numberOfLines={1}>
                    <Ionicons name="location" size={14} color={isPast ? '#64748b' : '#94a3b8'} /> {event.start_address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        {selectedDayEvents.length === 0 && (
          <View style={styles.emptyWeekDay}>
            <Ionicons name="calendar-outline" size={48} color="#64748b" />
            <Text style={styles.emptyWeekDayText}>Aucun événement ce jour</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

