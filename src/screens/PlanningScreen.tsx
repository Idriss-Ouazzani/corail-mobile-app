/**
 * PlanningScreen - Vue orientée actions (style Doctolib)
 * Priorité : VUE AUJOURD'HUI avec actions rapides
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
  Linking,
  Image,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { getInvoiceUrl } from '../constants/urls';

// Photo sympa : calendrier / planning (représente l'outil Planning)
const HERO_IMAGE = 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800&q=80';

// Calendrier en français
LocaleConfig.locales.fr = {
  monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';
import { apiClient } from '../services/api';
import { CustomAlert } from '../components/CustomAlert';
import { LegalInfoModal } from '../components/LegalInfoModal';
import DayView from './planning/DayView';
import WeekView from './planning/WeekView';
import EventModal from './planning/EventModal';
import { PlanningEventSkeleton } from '../components/skeletons';

interface RideWithInvoice {
  id: string;
  scheduled_at: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  price_cents?: number;
  duration_minutes?: number;
  source?: string;
  ride_source?: string;
  invoice?: any;
  completed_at?: string;
}

interface PlanningScreenProps {
  onBack: () => void;
  onRidePress?: (rideId: string) => void;
  onPersonalRidePress?: (rideId: string) => void;
}

export default function PlanningScreen({ onBack, onRidePress, onPersonalRidePress }: PlanningScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'upcoming' | 'week' | 'month'>('upcoming');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedWeekDay, setExpandedWeekDay] = useState<string | null>(null);
  const [selectedMonthDay, setSelectedMonthDay] = useState<string | null>(null);
  
  // Données
  const [allRides, setAllRides] = useState<RideWithInvoice[]>([]);
  
  // Popup facture
  const [selectedRide, setSelectedRide] = useState<RideWithInvoice | null>(null);
  const [showCompleteAlert, setShowCompleteAlert] = useState(false);
  const [showShareInvoiceAlert, setShowShareInvoiceAlert] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [pendingInvoiceParams, setPendingInvoiceParams] = useState<{ sourceType: 'RIDE' | 'PERSONAL'; sourceId: string } | null>(null);
  const [legalModalBusinessName, setLegalModalBusinessName] = useState('');

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      
      // Charger courses marketplace
      let marketplaceRides: RideWithInvoice[] = [];
      try {
        const rides = await apiClient.getMyRides('claimed');
        if (Array.isArray(rides)) {
          marketplaceRides = rides
            .filter(ride => ride.scheduled_at)
            .map(ride => ({
              ...ride,
              completed_at: ride.completed_at ?? undefined,
              ride_source: 'MARKETPLACE',
            })) as RideWithInvoice[];
        }
      } catch (error) {
        console.warn('No marketplace rides');
      }
      
      // Charger courses personnelles (sauf CANCELLED, EXPIRED)
      let personalRides: RideWithInvoice[] = [];
      try {
        const rides = await apiClient.listPersonalRides({});
        if (Array.isArray(rides)) {
          personalRides = rides
            .filter(ride => 
              ride.scheduled_at && 
              ride.status !== 'CANCELLED' && 
              ride.status !== 'EXPIRED'
            )
            .map(ride => ({
              ...ride,
              completed_at: ride.completed_at ?? undefined,
              ride_source: ride.source || 'PERSONAL',
            })) as RideWithInvoice[];
        }
      } catch (error) {
        console.warn('No personal rides');
      }
      
      // Combiner
      const combined = [...marketplaceRides, ...personalRides];
      
      // Charger factures pour courses COMPLETED
      const ridesWithInvoices = await Promise.all(
        combined.map(async (ride) => {
          if (ride.status === 'COMPLETED') {
            try {
              const invoice = await apiClient.getInvoiceByRide(
                ride.ride_source === 'MARKETPLACE' ? 'RIDE' : 'PERSONAL',
                ride.id
              );
              return { ...ride, invoice };
            } catch {
              return ride;
            }
          }
          return ride;
        })
      );
      
      setAllRides(ridesWithInvoices);
    } catch (error) {
      console.error('Error loading rides:', error);
      Alert.alert('Erreur', 'Impossible de charger le planning');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  // Calcul des états de courses (pour toutes les vues)
  const getCourseState = (ride: RideWithInvoice): 'EN_COURS' | 'A_TERMINER' | 'A_VENIR' => {
    const now = new Date();
    const scheduledTime = new Date(ride.scheduled_at);
    
    // Si heure passée et pas terminée
    if (now > scheduledTime && ride.status !== 'COMPLETED') {
      return 'A_TERMINER';
    }
    
    // Si heure actuelle (dans les 5 minutes avant, jusqu'à 1h après)
    const diffMinutes = (scheduledTime.getTime() - now.getTime()) / 60000;
    if (diffMinutes <= 5 && diffMinutes >= -60) {
      return 'EN_COURS';
    }
    
    // Sinon à venir
    return 'A_VENIR';
  };
  
  // Afficher l'état correct des courses dans la vue Mois
  const getCourseStateForDisplay = (ride: RideWithInvoice): 'EN_COURS' | 'A_TERMINER' | 'A_VENIR' => {
    // Utiliser l'état normal
    return getCourseState(ride);
  };

  // Récupérer toutes les courses à venir groupées par jour (y compris aujourd'hui)
  const getAllUpcomingRidesByDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingRides = allRides.filter(ride => {
      // Exclure les courses facturées ou terminées
      if (ride.invoice || ride.status === 'COMPLETED') return false;
      const rideDate = new Date(ride.scheduled_at);
      return rideDate >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduled_at);
      const dateB = new Date(b.scheduled_at);
      const stateA = getCourseState(a);
      const stateB = getCourseState(b);
      
      // Priorité : A_TERMINER > EN_COURS > A_VENIR
      const priority: { [key: string]: number } = {
        'A_TERMINER': 1,
        'EN_COURS': 2,
        'A_VENIR': 3,
      };
      
      const prioA = priority[stateA] || 4;
      const prioB = priority[stateB] || 4;
      
      if (prioA !== prioB) {
        return prioA - prioB;
      }
      
      return dateA.getTime() - dateB.getTime();
    });
    
    // Grouper par jour en utilisant la date locale
    const grouped: { [key: string]: RideWithInvoice[] } = {};
    upcomingRides.forEach(ride => {
      const date = new Date(ride.scheduled_at);
      // Utiliser la date locale pour le groupement
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(ride);
    });
    
    return grouped;
  };

  // Actions
  const handleTerminateRide = (ride: RideWithInvoice) => {
    setSelectedRide(ride);
    setShowCompleteAlert(true);
  };

  const handleCompleteRide = async (generateInvoice: boolean) => {
    if (!selectedRide) return;
    
    try {
      setShowCompleteAlert(false);
      
      // Marquer comme COMPLETED
      if (selectedRide.ride_source === 'MARKETPLACE') {
        // Pour marketplace, on ne peut pas changer le statut directement
        Alert.alert('Info', 'Cette course marketplace sera marquée comme terminée après validation');
      } else {
        await apiClient.updatePersonalRide(selectedRide.id, { status: 'COMPLETED' });
      }
      
      if (generateInvoice) {
        let profile: any = null;
        try {
          profile = await apiClient.getMyVTCProfile();
        } catch (_e) {}
        if (!profile?.legal_info_configured) {
          setPendingInvoiceParams({
            sourceType: selectedRide.ride_source === 'MARKETPLACE' ? 'RIDE' : 'PERSONAL',
            sourceId: selectedRide.id,
          });
          setLegalModalBusinessName(profile?.display_name || '');
          setShowLegalModal(true);
          await loadRides();
          return;
        }
        try {
          const invoice = await apiClient.createInvoice(
            selectedRide.ride_source === 'MARKETPLACE' ? 'RIDE' : 'PERSONAL',
            selectedRide.id
          );
          setGeneratedInvoice(invoice);
          setShowShareInvoiceAlert(true);
        } catch (error: any) {
          console.error('Erreur génération facture:', error);
          Alert.alert('Course terminée', 'Mais erreur lors de la génération de la facture');
        }
      } else {
        Alert.alert('✅', 'Course terminée !');
      }
      
      await loadRides();
    } catch (error: any) {
      console.error('Erreur complétion course:', error);
      Alert.alert('Erreur', 'Impossible de terminer la course');
    }
  };

  const handleShareWhatsApp = async (invoice: any) => {
    try {
      const invoiceUrl = getInvoiceUrl(invoice.public_token);
      const message = `Merci pour votre course. Vous trouverez votre facture sur le lien suivant : ${invoiceUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      await Linking.openURL(whatsappUrl);
      setShowShareInvoiceAlert(false);
      setGeneratedInvoice(null);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager via WhatsApp');
    }
  };

  const handleShareEmail = async (invoice: any) => {
    try {
      const invoiceUrl = getInvoiceUrl(invoice.public_token);
      const subject = `Facture ${invoice.invoice_number}`;
      const body = `Bonjour,\n\nVeuillez trouver votre facture ${invoice.invoice_number} d'un montant de ${(invoice.total_amount_cents / 100).toFixed(2)}€.\n\nVoir la facture : ${invoiceUrl}\n\nCordialement`;
      const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      await Linking.openURL(mailUrl);
      setShowShareInvoiceAlert(false);
      setGeneratedInvoice(null);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager par email');
    }
  };

  const runPendingInvoiceAndShowShare = async () => {
    if (!pendingInvoiceParams) return;
    try {
      const invoice = await apiClient.createInvoice(pendingInvoiceParams.sourceType, pendingInvoiceParams.sourceId);
      setGeneratedInvoice(invoice);
      setShowShareInvoiceAlert(true);
      await loadRides();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer la facture');
    }
    setPendingInvoiceParams(null);
  };

  const handleOpenNavigation = (ride: RideWithInvoice) => {
    const address = encodeURIComponent(ride.pickup_address);
    Alert.alert(
      'Navigation',
      'Choisissez votre application',
      [
        {
          text: 'Waze',
          onPress: () => Linking.openURL(`https://waze.com/ul?q=${address}`),
        },
        {
          text: 'Google Maps',
          onPress: () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleRidePress = (ride: RideWithInvoice) => {
    if (ride.ride_source === 'MARKETPLACE' && onRidePress) {
      onRidePress(ride.id);
    } else if (onPersonalRidePress) {
      onPersonalRidePress(ride.id);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Planning</Text>
          <View style={styles.headerRight} />
        </View>
        <ScrollView style={styles.content}>
          <PlanningEventSkeleton />
        </ScrollView>
      </View>
    );
  }

  const allUpcomingByDay = getAllUpcomingRidesByDay();
  
  // Fonction pour formater une date (ex: "Aujourd'hui", "Demain", "Après-demain", "Vendredi 24 janv.")
  const formatDayLabel = (dateStr: string): string => {
    // Créer les dates en mode local pour éviter les problèmes de timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffMs = targetDate.getTime() - todayDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Demain';
    } else if (diffDays === 2) {
      return 'Après-demain';
    }
    
    return targetDate.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short' 
    });
  };
  
  // Récupérer les 7 jours de la semaine (lun-dim) + période
  const getWeekDays = () => {
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const monday = new Date(current);
    
    // Trouver le lundi de la semaine
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(current.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push({
        date: day,
        dateKey: day.toISOString().split('T')[0],
        label: day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }),
      });
    }
    
    return days;
  };
  
  // Récupérer la période de la semaine (ex: "du 22 au 29 janvier")
  const getWeekPeriod = () => {
    const days = getWeekDays();
    if (days.length === 0) return '';
    
    const firstDay = days[0].date;
    const lastDay = days[6].date;
    
    const firstDayNum = firstDay.getDate();
    const lastDayNum = lastDay.getDate();
    
    // Si même mois
    if (firstDay.getMonth() === lastDay.getMonth()) {
      const month = firstDay.toLocaleDateString('fr-FR', { month: 'long' });
      return `du ${firstDayNum} au ${lastDayNum} ${month}`;
    }
    
    // Si mois différents
    const firstMonth = firstDay.toLocaleDateString('fr-FR', { month: 'short' });
    const lastMonth = lastDay.toLocaleDateString('fr-FR', { month: 'long' });
    return `du ${firstDayNum} ${firstMonth} au ${lastDayNum} ${lastMonth}`;
  };
  
  // Générer les markedDates pour la vue Mois (avec dots colorés + sélection)
  const getMarkedDatesForMonth = () => {
    const marked: any = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Compter TOUTES les courses par jour (même passées et terminées)
    const ridesByDay: { [key: string]: RideWithInvoice[] } = {};
    allRides.forEach(ride => {
      const date = new Date(ride.scheduled_at);
      // Utiliser la date locale pour le groupement
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!ridesByDay[dateKey]) {
        ridesByDay[dateKey] = [];
      }
      ridesByDay[dateKey].push(ride);
    });
    
    // Créer les markers avec dots (max 3 dots par jour)
    Object.keys(ridesByDay).forEach(dateKey => {
      const rides = ridesByDay[dateKey];
      const [year, month, day] = dateKey.split('-').map(Number);
      const rideDate = new Date(year, month - 1, day);
      const isPast = rideDate < today;
      const dotColor = isPast ? '#64748b' : '#0ea5e9';
      
      // Créer des dots (max 3 visibles)
      const dots = rides.slice(0, 3).map((_, index) => ({
        key: `ride-${index}`,
        color: dotColor,
      }));
      
      marked[dateKey] = {
        dots,
        marked: true,
      };
      
      // Ajouter la sélection si c'est le jour sélectionné
      if (selectedMonthDay === dateKey) {
        marked[dateKey].selected = true;
        marked[dateKey].selectedColor = '#0ea5e9';
      }
    });
    
    // Si le jour sélectionné n'a pas de courses, on l'ajoute quand même
    if (selectedMonthDay && !marked[selectedMonthDay]) {
      marked[selectedMonthDay] = {
        selected: true,
        selectedColor: '#0ea5e9',
      };
    }
    
    return marked;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Planning</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Segmented Control */}
      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'upcoming' && styles.viewModeButtonActive]}
          onPress={() => {
            setViewMode('upcoming');
            setExpandedWeekDay(null);
            setSelectedMonthDay(null);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={16} color={viewMode === 'upcoming' ? '#fff' : '#64748b'} />
          <Text style={[styles.viewModeText, viewMode === 'upcoming' && styles.viewModeTextActive]}>
            À venir
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
          onPress={() => {
            setViewMode('week');
            setExpandedWeekDay(null);
            setSelectedMonthDay(null);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={16} color={viewMode === 'week' ? '#fff' : '#64748b'} />
          <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>
            Semaine
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
          onPress={() => {
            setViewMode('month');
            setExpandedWeekDay(null);
            // Ne pas réinitialiser selectedMonthDay pour garder la sélection
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar" size={16} color={viewMode === 'month' ? '#fff' : '#64748b'} />
          <Text style={[styles.viewModeText, viewMode === 'month' && styles.viewModeTextActive]}>
            Mois
          </Text>
        </TouchableOpacity>
      </View>

      {/* UPCOMING VIEW (À VENIR) */}
      {viewMode === 'upcoming' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.upcomingScrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {/* Bandeau image + descriptif */}
          <View style={styles.heroWrap}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="calendar" size={26} color="#fff" />
              </View>
              <Text style={styles.heroText}>
                Vos courses à venir par jour. Terminez pour générer la facture ou lancez l'itinéraire.
              </Text>
            </View>
          </View>

          {/* Toutes les courses groupées par jour */}
          {Object.keys(allUpcomingByDay).map((dateKey) => {
            const dayLabel = formatDayLabel(dateKey);
            const rides = allUpcomingByDay[dateKey];
            
            // Séparer par état pour ce jour
            const aTerminer = rides.filter(r => getCourseState(r) === 'A_TERMINER');
            const enCours = rides.filter(r => getCourseState(r) === 'EN_COURS');
            const aVenir = rides.filter(r => getCourseState(r) === 'A_VENIR');
            
            return (
              <View key={dateKey} style={styles.section}>
                {/* En-tête du jour */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <View style={[styles.sectionDot, { backgroundColor: '#64748b' }]} />
                    <Text style={styles.sectionTitle}>{dayLabel.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>{rides.length} course{rides.length > 1 ? 's' : ''}</Text>
                </View>
                
                {/* À TERMINER */}
                {aTerminer.map(ride => (
                  <RideCardActionable
                    key={ride.id}
                    ride={ride}
                    state="A_TERMINER"
                    onTerminate={() => handleTerminateRide(ride)}
                    onPress={() => handleRidePress(ride)}
                  />
                ))}
                
                {/* EN COURS */}
                {enCours.map(ride => (
                  <RideCardActionable
                    key={ride.id}
                    ride={ride}
                    state="EN_COURS"
                    onTerminate={() => handleTerminateRide(ride)}
                    onPress={() => handleRidePress(ride)}
                  />
                ))}
                
                {/* À VENIR */}
                {aVenir.map(ride => (
                  <RideCardActionable
                    key={ride.id}
                    ride={ride}
                    state="A_VENIR"
                    onOpenNavigation={() => handleOpenNavigation(ride)}
                    onPress={() => handleRidePress(ride)}
                  />
                ))}
              </View>
            );
          })}

          {/* Empty state */}
          {Object.keys(allUpcomingByDay).length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={56} color="#64748b" />
              <Text style={styles.emptyStateTitle}>Aucune course prévue</Text>
              <Text style={styles.emptyStateText}>
                Votre planning est vide pour les prochains jours. Les courses que vous récupérez sur la marketplace ou que vous créez en personnelles apparaîtront ici, avec la possibilité de lancer l'itinéraire ou de terminer la course pour générer la facture.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.planningScrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.heroWrap}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="calendar" size={26} color="#fff" />
              </View>
              <Text style={styles.heroText}>
                Vue semaine : parcourez vos courses jour par jour.
              </Text>
            </View>
          </View>
          {/* Navigation semaine */}
          <View style={styles.weekNavigation}>
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 7);
                setSelectedDate(d.toISOString().split('T')[0]);
                setExpandedWeekDay(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#f1f5f9" />
            </TouchableOpacity>
            
            <Text style={styles.weekTitle}>
              {getWeekPeriod()}
            </Text>
            
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 7);
                setSelectedDate(d.toISOString().split('T')[0]);
                setExpandedWeekDay(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={24} color="#f1f5f9" />
            </TouchableOpacity>
          </View>

          {/* Liste des 7 jours de la semaine */}
          {getWeekDays().map((day, index) => {
            const dayRides = allRides.filter(ride => {
              if (ride.status === 'COMPLETED' || ride.invoice) return false;
              const date = new Date(ride.scheduled_at);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const dayNum = String(date.getDate()).padStart(2, '0');
              const rideDate = `${year}-${month}-${dayNum}`;
              return rideDate === day.dateKey;
            });
            
            const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));
            const isToday = day.dateKey === new Date().toISOString().split('T')[0];
            const isExpanded = expandedWeekDay === day.dateKey;
            
            return (
              <View key={day.dateKey}>
                <TouchableOpacity
                  style={[
                    styles.weekDayCard,
                    index === 0 && styles.weekDayCardFirst,
                    isToday && styles.weekDayCardToday,
                    isPast && styles.weekDayCardPast,
                    isExpanded && styles.weekDayCardExpanded,
                  ]}
                  onPress={() => {
                    if (dayRides.length > 0) {
                      setExpandedWeekDay(isExpanded ? null : day.dateKey);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.weekDayHeader}>
                    <Text style={[styles.weekDayName, isPast && styles.weekDayNamePast]}>
                      {day.label}
                    </Text>
                    <View style={styles.weekDayHeaderRight}>
                      {dayRides.length > 0 && (
                        <View style={[styles.weekDayBadge, isPast && styles.weekDayBadgePast]}>
                          <Text style={styles.weekDayBadgeText}>{dayRides.length}</Text>
                        </View>
                      )}
                      {dayRides.length > 0 && (
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={isPast ? "#64748b" : "#cbd5e1"} 
                        />
                      )}
                    </View>
                  </View>
                  
                  {!isExpanded && dayRides.length > 0 && (
                    <View style={styles.weekDayRides}>
                      {dayRides.slice(0, 3).map((ride) => (
                        <Text key={ride.id} style={[styles.weekDayRideText, isPast && styles.weekDayRideTextPast]} numberOfLines={1}>
                          • {new Date(ride.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {ride.pickup_address}
                        </Text>
                      ))}
                      {dayRides.length > 3 && (
                        <Text style={[styles.weekDayMore, isPast && styles.weekDayMorePast]}>
                          +{dayRides.length - 3} autre{dayRides.length - 3 > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {!isExpanded && dayRides.length === 0 && (
                    <Text style={styles.weekDayEmpty}>Aucune course</Text>
                  )}
                </TouchableOpacity>
                
                {/* Courses détaillées dépliées */}
                {isExpanded && dayRides.length > 0 && (
                  <View style={styles.weekDayExpandedContent}>
                    {dayRides.map(ride => {
                      const state = getCourseState(ride);
                      return (
                        <RideCardActionable
                          key={ride.id}
                          ride={ride}
                          state={state}
                          onTerminate={state !== 'A_VENIR' ? () => handleTerminateRide(ride) : undefined}
                          onOpenNavigation={state === 'A_VENIR' ? () => handleOpenNavigation(ride) : undefined}
                          onPress={() => handleRidePress(ride)}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.planningScrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.heroWrap}>
            <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="calendar" size={26} color="#fff" />
              </View>
              <Text style={styles.heroText}>
                Vue mois : sélectionnez un jour pour voir les courses.
              </Text>
            </View>
          </View>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => {
              setSelectedMonthDay(day.dateString);
            }}
            markedDates={getMarkedDatesForMonth()}
            markingType="multi-dot"
            theme={{
              calendarBackground: '#0f172a',
              textSectionTitleColor: '#94a3b8',
              selectedDayBackgroundColor: '#0ea5e9',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#0ea5e9',
              dayTextColor: '#e2e8f0',
              textDisabledColor: '#475569',
              monthTextColor: '#f1f5f9',
              arrowColor: '#0ea5e9',
            }}
          />
          
          {/* Légende */}
          <View style={styles.monthLegend}>
            <View style={styles.monthLegendItem}>
              <View style={[styles.monthLegendDot, { backgroundColor: '#0ea5e9' }]} />
              <Text style={styles.monthLegendText}>Courses à venir</Text>
            </View>
            <View style={styles.monthLegendItem}>
              <View style={[styles.monthLegendDot, { backgroundColor: '#64748b' }]} />
              <Text style={styles.monthLegendText}>Courses passées</Text>
            </View>
          </View>
          
          {/* Courses du jour sélectionné */}
          {selectedMonthDay && (() => {
            const selectedDayRides = allRides.filter(ride => {
              const date = new Date(ride.scheduled_at);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const rideDate = `${year}-${month}-${day}`;
              return rideDate === selectedMonthDay;
            });
            
            const dayLabel = formatDayLabel(selectedMonthDay);
            
            return (
              <View style={styles.monthSelectedDay}>
                <View style={styles.monthSelectedDayHeader}>
                  <Text style={styles.monthSelectedDayTitle}>{dayLabel}</Text>
                  {selectedDayRides.length > 0 && (
                    <Text style={styles.monthSelectedDayCount}>
                      {selectedDayRides.length} course{selectedDayRides.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                
                {selectedDayRides.length > 0 ? (
                  <View style={styles.monthSelectedDayRides}>
                    {selectedDayRides.map(ride => {
                      const state = getCourseStateForDisplay(ride);
                      const isCompleted = ride.status === 'COMPLETED' || ride.invoice;
                      return (
                        <RideCardActionable
                          key={ride.id}
                          ride={ride}
                          state={state}
                          onTerminate={!isCompleted && state !== 'A_VENIR' ? () => handleTerminateRide(ride) : undefined}
                          onOpenNavigation={!isCompleted && state === 'A_VENIR' ? () => handleOpenNavigation(ride) : undefined}
                          onPress={() => handleRidePress(ride)}
                        />
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.monthSelectedDayEmpty}>
                    <Ionicons name="calendar-outline" size={32} color="#475569" />
                    <Text style={styles.monthSelectedDayEmptyText}>Aucune course ce jour</Text>
                  </View>
                )}
              </View>
            );
          })()}
        </ScrollView>
      )}

      {/* Popup Terminer course */}
      {selectedRide && (
        <CustomAlert
          visible={showCompleteAlert}
          title="Terminer la course"
          message="Voulez-vous générer la facture pour cette course ?"
          buttons={[
            {
              text: 'Générer la facture',
              style: 'primary',
              onPress: () => handleCompleteRide(true),
            },
            {
              text: 'Plus tard',
              style: 'default',
              onPress: () => handleCompleteRide(false),
            },
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => setShowCompleteAlert(false),
            },
          ]}
          onClose={() => setShowCompleteAlert(false)}
        />
      )}

      <LegalInfoModal
        visible={showLegalModal}
        onClose={() => { setShowLegalModal(false); setPendingInvoiceParams(null); }}
        initialBusinessName={legalModalBusinessName}
        onSaved={() => runPendingInvoiceAndShowShare()}
        onLater={() => {
          Alert.alert(
            'Infos légales requises',
            'Pour générer une facture conforme, renseignez vos infos légales (SIRET, adresse) depuis Mes outils. La course a bien été marquée comme terminée.'
          );
        }}
      />

      {/* Popup Partage facture */}
      {generatedInvoice && (
        <CustomAlert
          visible={showShareInvoiceAlert}
          title="Facture générée !"
          message={`Facture ${generatedInvoice.invoice_number} créée. Comment souhaitez-vous la partager ?`}
          buttons={[
            {
              text: 'Partager par WhatsApp',
              style: 'primary',
              onPress: () => handleShareWhatsApp(generatedInvoice),
            },
            {
              text: 'Partager par Email',
              style: 'default',
              onPress: () => handleShareEmail(generatedInvoice),
            },
            {
              text: 'Plus tard',
              style: 'cancel',
              onPress: () => {
                setShowShareInvoiceAlert(false);
                setGeneratedInvoice(null);
              },
            },
          ]}
          onClose={() => {
            setShowShareInvoiceAlert(false);
            setGeneratedInvoice(null);
          }}
        />
      )}
    </View>
  );
}

// ===== RIDE CARD ACTIONABLE =====
interface RideCardActionableProps {
  ride: RideWithInvoice;
  state: 'EN_COURS' | 'A_TERMINER' | 'A_VENIR';
  onTerminate?: () => void;
  onOpenNavigation?: () => void;
  onPress: () => void;
}

function RideCardActionable({ ride, state, onTerminate, onOpenNavigation, onPress }: RideCardActionableProps) {
  const time = new Date(ride.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const price = ride.price_cents ? `${(ride.price_cents / 100).toFixed(2)}€` : null;
  
  const stateColors = {
    EN_COURS: '#10b981',
    A_TERMINER: '#f59e0b',
    A_VENIR: '#3b82f6',
  };
  
  const stateLabels = {
    EN_COURS: 'En cours',
    A_TERMINER: 'À terminer',
    A_VENIR: 'À venir',
  };

  return (
    <TouchableOpacity
      style={[
        styles.rideCard,
        state === 'EN_COURS' && styles.rideCardEnCours,
        state === 'A_TERMINER' && styles.rideCardATerminer,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.rideCardHeader}>
        <View style={styles.rideCardHeaderLeft}>
          <View style={[styles.rideCardStateDot, { backgroundColor: stateColors[state] }]} />
          <Text style={styles.rideCardState}>{stateLabels[state]}</Text>
        </View>
        <Text style={styles.rideCardTime}>{time}</Text>
      </View>

      {/* Addresses */}
      <View style={styles.rideCardAddresses}>
        <View style={styles.rideCardAddressRow}>
          <Ionicons name="location" size={16} color="#10b981" />
          <Text style={styles.rideCardAddress} numberOfLines={1}>
            {ride.pickup_address}
          </Text>
        </View>
        <View style={styles.rideCardAddressRow}>
          <Ionicons name="location" size={16} color="#ef4444" />
          <Text style={styles.rideCardAddress} numberOfLines={1}>
            {ride.dropoff_address}
          </Text>
        </View>
      </View>

      {/* Footer avec prix et source */}
      <View style={styles.rideCardFooter}>
        {price && <Text style={styles.rideCardPrice}>{price}</Text>}
        <Text style={styles.rideCardSource}>
          {ride.ride_source === 'MARKETPLACE' ? 'Corail' : ride.source || 'Perso'}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.rideCardActions}>
        {state === 'EN_COURS' && onTerminate && (
          <TouchableOpacity
            style={[styles.rideCardActionButton, styles.rideCardActionButtonPrimary]}
            onPress={(e) => {
              e.stopPropagation();
              onTerminate();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.rideCardActionButtonText}>Terminer</Text>
          </TouchableOpacity>
        )}
        
        {state === 'A_TERMINER' && onTerminate && (
      <TouchableOpacity 
            style={[styles.rideCardActionButton, styles.rideCardActionButtonWarning]}
            onPress={(e) => {
              e.stopPropagation();
              onTerminate();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.rideCardActionButtonText}>Terminer</Text>
      </TouchableOpacity>
        )}
        
        {state === 'A_VENIR' && onOpenNavigation && (
          <TouchableOpacity
            style={[styles.rideCardActionButton, styles.rideCardActionButtonSecondary]}
            onPress={(e) => {
              e.stopPropagation();
              onOpenNavigation();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate" size={18} color="#0ea5e9" />
            <Text style={[styles.rideCardActionButtonText, styles.rideCardActionButtonSecondaryText]}>Itinéraire</Text>
          </TouchableOpacity>
      )}
    </View>
    </TouchableOpacity>
  );
}

// ===== RIDE CARD COMPACT =====
interface RideCardCompactProps {
  ride: RideWithInvoice;
  onPress: () => void;
}

function RideCardCompact({ ride, onPress }: RideCardCompactProps) {
  const time = new Date(ride.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const price = ride.price_cents ? `${(ride.price_cents / 100).toFixed(2)}€` : null;

  return (
    <TouchableOpacity style={styles.rideCardCompact} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rideCardCompactHeader}>
        <Text style={styles.rideCardCompactTime}>{time}</Text>
        {price && <Text style={styles.rideCardCompactPrice}>{price}</Text>}
      </View>
      <Text style={styles.rideCardCompactAddress} numberOfLines={1}>
        {ride.pickup_address} → {ride.dropoff_address}
      </Text>
    </TouchableOpacity>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  viewModeButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  upcomingScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  planningScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroWrap: {
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#1e293b',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  section: {
    marginTop: 4,
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  rideCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rideCardEnCours: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  rideCardATerminer: {
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  rideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rideCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideCardStateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rideCardState: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  rideCardTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  rideCardAddresses: {
    gap: 8,
    marginBottom: 12,
  },
  rideCardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideCardAddress: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
  },
  rideCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  rideCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  rideCardSource: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  rideCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rideCardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rideCardActionButtonPrimary: {
    backgroundColor: '#10b981',
  },
  rideCardActionButtonWarning: {
    backgroundColor: '#f59e0b',
  },
  rideCardActionButtonSecondary: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  rideCardActionButtonSecondaryText: {
    color: '#0ea5e9',
  },
  rideCardActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  rideCardCompact: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rideCardCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rideCardCompactTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  rideCardCompactPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  rideCardCompactAddress: {
    fontSize: 13,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  // Week view styles
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1e293b',
  },
  weekNavButton: {
    padding: 8,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    textTransform: 'capitalize',
  },
  weekDayCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  weekDayCardFirst: {
    marginTop: 16,
  },
  weekDayCardToday: {
    borderColor: '#0ea5e9',
    borderWidth: 2,
  },
  weekDayCardPast: {
    backgroundColor: '#0f172a',
    opacity: 0.6,
  },
  weekDayCardExpanded: {
    marginBottom: 4,
  },
  weekDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekDayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekDayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    textTransform: 'capitalize',
  },
  weekDayNamePast: {
    color: '#64748b',
  },
  weekDayBadge: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  weekDayBadgePast: {
    backgroundColor: '#475569',
  },
  weekDayBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  weekDayExpandedContent: {
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  weekDayRides: {
    gap: 6,
  },
  weekDayRideText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  weekDayRideTextPast: {
    color: '#64748b',
  },
  weekDayMore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
  weekDayMorePast: {
    color: '#475569',
  },
  weekDayEmpty: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
  },
  // Month view styles
  monthLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  monthLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthLegendText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  monthSelectedDay: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  monthSelectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthSelectedDayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    textTransform: 'capitalize',
  },
  monthSelectedDayCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  monthSelectedDayRides: {
    gap: 12,
  },
  monthSelectedDayEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  monthSelectedDayEmptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
});
