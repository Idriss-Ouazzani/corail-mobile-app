/**
 * Corail - Design proche de VTC Market Web 🪸
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import CoralLogo from './src/components/CoralLogo';
import RideCard from './src/components/RideCard';
import CitySelector from './src/components/CitySelector';
import MarketplaceFilters, { FilterOptions } from './src/components/MarketplaceFilters';
import RideDetailScreen from './src/screens/RideDetailScreen';
import CreateRideScreen from './src/screens/CreateRideScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import LoginScreen from './src/screens/LoginScreen';
import { firebaseAuth } from './src/services/firebase';
import { apiClient } from './src/services/api';
import type { Ride } from './src/types';
import type { User as FirebaseUser } from './src/services/firebase';

const { width } = Dimensions.get('window');

const MOCK_RIDES: Ride[] = [
  {
    id: '1',
    creator_id: 'user1',
    picker_id: null,
    pickup_address: 'Aéroport Toulouse-Blagnac',
    dropoff_address: 'Place du Capitole, Toulouse',
    scheduled_at: new Date(Date.now() + 3600000).toISOString(),
    price_cents: 2800,
    status: 'PUBLISHED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    visibility: 'PUBLIC',
    commission_enabled: true,
    vehicle_type: 'STANDARD',
    distance_km: 8,
    duration_minutes: 15,
    creator: { id: 'user1', full_name: 'Youssef D.', email: 'youssef@example.com', rating: 48, total_reviews: 15 },
  },
  {
    id: '2',
    creator_id: 'user2',
    picker_id: null,
    pickup_address: 'Gare Toulouse-Matabiau',
    dropoff_address: 'Ramonville Saint-Agne',
    scheduled_at: new Date(Date.now() + 7200000).toISOString(),
    price_cents: 1800,
    status: 'PUBLISHED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    visibility: 'PUBLIC',
    commission_enabled: false,
    vehicle_type: 'ELECTRIC',
    distance_km: 12,
    duration_minutes: 20,
    creator: { id: 'user2', full_name: 'Hassan Al Masri', email: 'hassan@example.com', rating: 48, total_reviews: 12 },
  },
  {
    id: '3',
    creator_id: 'user3',
    picker_id: null,
    pickup_address: 'CHU Purpan, Toulouse',
    dropoff_address: 'Labège Innopole',
    scheduled_at: new Date(Date.now() + 10800000).toISOString(),
    price_cents: 3200,
    status: 'PUBLISHED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    visibility: 'PUBLIC',
    commission_enabled: true,
    vehicle_type: 'PREMIUM',
    distance_km: 18,
    duration_minutes: 30,
    creator: { id: 'user3', full_name: 'Marie Dubois', email: 'marie@example.com', rating: 50, total_reviews: 20 },
  },
  {
    id: '4',
    creator_id: 'user1',
    picker_id: 'user2',
    pickup_address: 'Blagnac Centre',
    dropoff_address: 'Université Paul Sabatier',
    scheduled_at: new Date(Date.now() + 5400000).toISOString(),
    price_cents: 2200,
    status: 'CLAIMED',
    vehicle_type: 'VAN',
    distance_km: 15,
    duration_minutes: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    visibility: 'PUBLIC',
    commission_enabled: true,
    vehicle_type: 'LUXURY',
    distance_km: 22,
    duration_minutes: 35,
    creator: { id: 'user1', full_name: 'Youssef D.', email: 'youssef@example.com', rating: 48, total_reviews: 15 },
    picker: { id: 'user2', full_name: 'Hassan Al Masri', email: 'hassan@example.com' },
  },
  {
    id: '5',
    creator_id: 'user3',
    picker_id: 'user2',
    pickup_address: 'Toulouse Compans Caffarelli',
    dropoff_address: 'Colomiers Gare',
    scheduled_at: new Date(Date.now() - 86400000).toISOString(),
    price_cents: 2800,
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 86400000).toISOString(),
    visibility: 'PUBLIC',
    commission_enabled: true,
    vehicle_type: 'STANDARD',
    distance_km: 10,
    duration_minutes: 18,
    creator: { id: 'user3', full_name: 'Marie Dubois', email: 'marie@example.com', rating: 50, total_reviews: 20 },
    picker: { id: 'user2', full_name: 'Hassan Al Masri', email: 'hassan@example.com' },
  },
  {
    id: '6',
    creator_id: 'user4',
    picker_id: 'user2',
    pickup_address: 'Tournefeuille Mairie',
    dropoff_address: 'Airbus Toulouse-Blagnac',
    scheduled_at: new Date(Date.now() - 259200000).toISOString(),
    price_cents: 2400,
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    completed_at: new Date(Date.now() - 259200000).toISOString(),
    visibility: 'GROUP',
    commission_enabled: false,
    vehicle_type: 'VAN',
    distance_km: 14,
    duration_minutes: 22,
    creator: { id: 'user4', full_name: 'Jean Martin', email: 'jean@example.com', rating: 45, total_reviews: 8 },
    picker: { id: 'user2', full_name: 'Hassan Al Masri', email: 'hassan@example.com' },
  },
];

export default function App() {
  // 🔐 Gestion de l'authentification Firebase
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // 🆔 ID de l'utilisateur courant (Firebase UID)
  const currentUserId = user?.uid || '';

  // Écouter les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Configurer l'API client avec le user ID
        apiClient.setUserId(firebaseUser.uid);
        console.log('✅ Utilisateur connecté:', firebaseUser.email);
      } else {
        apiClient.clearAuth();
        console.log('❌ Utilisateur déconnecté');
      }
      
      setAuthLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  // États de l'application
  const [currentScreen, setCurrentScreen] = useState<'home' | 'marketplace' | 'myrides' | 'profile'>('home');
  const [selectedCity, setSelectedCity] = useState('toulouse');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'groups'>('all');
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    vehicleTypes: [],
    sortBy: null,
  });
  const [myRidesTab, setMyRidesTab] = useState<'claimed' | 'published'>('claimed');
  
  // 🗄️ Rides depuis Databricks
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);

  // 📥 Charger les rides depuis l'API
  const loadRides = async () => {
    try {
      setLoadingRides(true);
      console.log('📡 Chargement des courses... (peut prendre 30-60s si le serveur dort)');
      const response = await apiClient.getRides();
      console.log('📦 Réponse brute:', response);
      console.log('📦 Type de réponse:', typeof response);
      console.log('📦 Est un tableau ?', Array.isArray(response));
      
      if (Array.isArray(response)) {
        console.log('✅ Courses chargées depuis Databricks:', response.length);
        setRides(response);
      } else {
        console.error('❌ La réponse n\'est pas un tableau:', response);
        Alert.alert('Erreur', 'Format de réponse invalide');
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement courses:', error);
      console.error('❌ Message:', error.message);
      console.error('❌ Détails:', error.response?.data || error);
      
      // Message plus explicite pour timeout
      if (error.message === 'Erreur de connexion au serveur') {
        Alert.alert(
          'Serveur en démarrage', 
          'Le serveur se réveille (plan gratuit). Réessayez dans 10 secondes.',
          [
            { text: 'OK' },
            { text: 'Réessayer', onPress: () => loadRides() }
          ]
        );
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de charger les courses');
      }
    } finally {
      setLoadingRides(false);
    }
  };

  // 🔄 Charger les rides au montage et après authentification
  useEffect(() => {
    if (user) {
      loadRides();
    }
  }, [user]);

  // 🔐 Afficher écran de chargement pendant l'initialisation
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <CoralLogo size={100} />
            <ActivityIndicator size="large" color="#ff6b47" style={{ marginTop: 24 }} />
            <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 16 }}>Chargement...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // 🔐 Afficher écran de connexion si pas authentifié
  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.logoWrapper}>
            <CoralLogo size={60} />
          </View>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.userName}>Hassan Al Masri</Text>
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={12} color="#000" style={{ marginRight: 4 }} />
            <Text style={styles.premiumText}>Premium Member</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        {[
          { icon: 'car-sport', label: 'Courses disponibles', value: '156', color: '#ff6b47', library: 'Ionicons' },
          { icon: 'flash', label: 'En cours', value: '3', color: '#0ea5e9', library: 'Ionicons' },
          { icon: 'wallet', label: 'Gains du mois', value: '850€', color: '#10b981', library: 'Ionicons' },
          { icon: 'star', label: 'Note moyenne', value: '4.8', color: '#fbbf24', library: 'Ionicons' },
        ].map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* City Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Votre région</Text>
        <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        {[
          { 
            icon: 'search', 
            title: 'Explorer le Marketplace', 
            subtitle: 'Parcourir les courses disponibles', 
            action: () => setCurrentScreen('marketplace')
          },
          { 
            icon: 'add-circle', 
            title: 'Créer une course', 
            subtitle: 'Publier une nouvelle opportunité', 
            action: () => setShowCreateRide(true)
          },
          { 
            icon: 'list', 
            title: 'Mes courses', 
            subtitle: 'Gérer vos courses actives', 
            action: () => setCurrentScreen('myrides')
          },
        ].map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={action.action}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrapper}>
              <Ionicons name={action.icon as any} size={24} color="#ff6b47" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderMarketplace = () => {
    // Filter rides based on active filter and filters
    let filteredRides = rides.filter((ride) => {
      // Visibility filter
      if (activeFilter === 'public' && ride.visibility !== 'PUBLIC') return false;
      if (activeFilter === 'groups' && ride.visibility !== 'GROUP') return false;
      
      // Vehicle type filter
      if (filters.vehicleTypes.length > 0 && ride.vehicle_type) {
        if (!filters.vehicleTypes.includes(ride.vehicle_type)) return false;
      }
      
      // Region filter (case insensitive search in pickup or dropoff address)
      if (selectedCity && selectedCity !== 'toulouse') {
        const cityName = selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1);
        const pickupMatch = ride.pickup_address.toLowerCase().includes(cityName.toLowerCase());
        const dropoffMatch = ride.dropoff_address.toLowerCase().includes(cityName.toLowerCase());
        if (!pickupMatch && !dropoffMatch) return false;
      }
      
      // Only show published rides in marketplace
      return ride.status === 'PUBLISHED';
    });

    // Sort rides
    if (filters.sortBy) {
      filteredRides = [...filteredRides].sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc':
            return a.price_cents - b.price_cents;
          case 'price_desc':
            return b.price_cents - a.price_cents;
          case 'date_asc':
            return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
          case 'date_desc':
            return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
          case 'distance_asc':
            return (a.distance_km || 999) - (b.distance_km || 999);
          case 'distance_desc':
            return (b.distance_km || 0) - (a.distance_km || 0);
          case 'duration_asc':
            return (a.duration_minutes || 999) - (b.duration_minutes || 999);
          case 'duration_desc':
            return (b.duration_minutes || 0) - (a.duration_minutes || 0);
          default:
            return 0;
        }
      });
    }

    const activeFiltersCount = filters.vehicleTypes.length + (filters.sortBy ? 1 : 0);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Marketplace</Text>
            <Text style={styles.pageSubtitle}>
              <Ionicons name="car-sport" size={14} color="#b9e6fe" /> {filteredRides.length} courses disponibles
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateRide(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Créer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Selected Region Indicator - Opens CitySelector */}
        <View style={{ marginBottom: 16 }}>
          <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {[
            { key: 'all', label: 'Toutes', icon: 'grid' },
            { key: 'public', label: 'Public', icon: 'globe' },
            { key: 'groups', label: 'Groupes', icon: 'people' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.key as any)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={activeFilter === filter.key ? '#fff' : '#7dd3fc'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Advanced Filters Button - Icon Only */}
          <TouchableOpacity
            style={[styles.filterIconButton, activeFiltersCount > 0 && styles.filterIconButtonActive]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options"
              size={20}
              color={activeFiltersCount > 0 ? '#fff' : '#7dd3fc'}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loadingRides ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#ff6b47" />
            <Text style={styles.loadingText}>Chargement des courses...</Text>
            <Text style={styles.loadingSubtext}>Première connexion ? Cela peut prendre 30-60 secondes ⏳</Text>
          </View>
        ) : filteredRides.length > 0 ? (
          filteredRides.map((ride) => (
            <RideCard 
              key={ride.id} 
              ride={ride} 
              currentUserId={currentUserId}
              onPress={() => {
                console.log('Ride selected:', ride.id);
                setSelectedRide(ride);
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>Aucune course disponible</Text>
            <Text style={styles.emptyStateSubtext}>
              Changez de filtre pour voir plus de courses
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderMyRides = () => {
    // Filter rides where current user is the picker (claimed rides)
    const claimedByMe = rides.filter((ride) => ride.picker_id === currentUserId);
    const claimedRides = claimedByMe.filter((ride) => ride.status === 'CLAIMED');
    const completedRides = claimedByMe.filter((ride) => ride.status === 'COMPLETED');

    // Filter rides where current user is the creator (published rides)
    const publishedByMe = rides.filter((ride) => ride.creator_id === currentUserId);
    const activePublished = publishedByMe.filter((ride) => ride.status === 'PUBLISHED');
    const claimedPublished = publishedByMe.filter((ride) => ride.status === 'CLAIMED' || ride.status === 'COMPLETED');

    const totalCount = myRidesTab === 'claimed' ? claimedByMe.length : publishedByMe.length;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Mes Courses</Text>
            <Text style={styles.pageSubtitle}>
              <Ionicons name="car-sport" size={14} color="#b9e6fe" /> {totalCount} courses au total
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, myRidesTab === 'claimed' && styles.tabActive]}
            onPress={() => setMyRidesTab('claimed')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="hand-right"
              size={18}
              color={myRidesTab === 'claimed' ? '#fff' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, myRidesTab === 'claimed' && styles.tabTextActive]}>
              Prises ({claimedByMe.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, myRidesTab === 'published' && styles.tabActive]}
            onPress={() => setMyRidesTab('published')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="megaphone"
              size={18}
              color={myRidesTab === 'published' ? '#fff' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, myRidesTab === 'published' && styles.tabTextActive]}>
              Publiées ({publishedByMe.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Claimed Tab Content */}
        {myRidesTab === 'claimed' && (
          <>
            {/* Stats */}
            <View style={styles.myRidesStats}>
              <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
                  <Ionicons name="time" size={24} color="#0ea5e9" />
                </View>
                <Text style={styles.statValue}>{claimedRides.length}</Text>
                <Text style={styles.statLabel}>En cours</Text>
              </View>
              <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{completedRides.length}</Text>
                <Text style={styles.statLabel}>Terminées</Text>
              </View>
            </View>

            {/* Claimed Rides */}
            {claimedRides.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="time" size={20} color="#0ea5e9" /> En cours
                </Text>
                {claimedRides.map((ride) => (
                  <RideCard 
                    key={ride.id} 
                    ride={ride} 
                    currentUserId={currentUserId}
                    onPress={() => setSelectedRide(ride)}
                  />
                ))}
              </View>
            )}

            {/* Completed Rides */}
            {completedRides.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" /> Terminées
                </Text>
                {completedRides.map((ride) => (
                  <RideCard 
                    key={ride.id} 
                    ride={ride} 
                    currentUserId={currentUserId}
                    onPress={() => setSelectedRide(ride)}
                  />
                ))}
              </View>
            )}

            {claimedByMe.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="hand-right-outline" size={64} color="#475569" />
                <Text style={styles.emptyStateText}>Aucune course prise</Text>
                <Text style={styles.emptyStateSubtext}>
                  Explorez le marketplace pour prendre des courses
                </Text>
              </View>
            )}
          </>
        )}

        {/* Published Tab Content */}
        {myRidesTab === 'published' && (
          <>
            {/* Stats */}
            <View style={styles.myRidesStats}>
              <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(255, 107, 71, 0.2)' }]}>
                  <Ionicons name="radio-button-on" size={24} color="#ff6b47" />
                </View>
                <Text style={styles.statValue}>{activePublished.length}</Text>
                <Text style={styles.statLabel}>Actives</Text>
              </View>
              <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Ionicons name="person-add" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.statValue}>{claimedPublished.length}</Text>
                <Text style={styles.statLabel}>Prises</Text>
              </View>
            </View>

            {/* Active Published Rides */}
            {activePublished.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="radio-button-on" size={20} color="#ff6b47" /> Courses actives
                </Text>
                <Text style={styles.sectionSubtitle}>En attente d'être prises</Text>
                {activePublished.map((ride) => (
                  <RideCard 
                    key={ride.id} 
                    ride={ride} 
                    currentUserId={currentUserId}
                    onPress={() => setSelectedRide(ride)}
                  />
                ))}
              </View>
            )}

            {/* Claimed Published Rides */}
            {claimedPublished.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="person-add" size={20} color="#8b5cf6" /> Courses prises
                </Text>
                {claimedPublished.map((ride) => (
                  <View key={ride.id} style={styles.publishedRideWrapper}>
                    <RideCard 
                      ride={ride} 
                      currentUserId={currentUserId}
                      onPress={() => setSelectedRide(ride)}
                    />
                    {ride.picker && (
                      <View style={styles.pickerInfo}>
                        <View style={styles.pickerAvatar}>
                          <Text style={styles.pickerInitials}>
                            {ride.picker.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickerLabel}>Prise par</Text>
                          <Text style={styles.pickerName}>{ride.picker.full_name}</Text>
                        </View>
                        <View style={[styles.pickerStatusBadge, ride.status === 'COMPLETED' && styles.pickerStatusBadgeCompleted]}>
                          <Ionicons
                            name={ride.status === 'COMPLETED' ? 'checkmark-circle' : 'time'}
                            size={14}
                            color="#fff"
                          />
                          <Text style={styles.pickerStatusText}>
                            {ride.status === 'COMPLETED' ? 'Terminée' : 'En cours'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {publishedByMe.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="megaphone-outline" size={64} color="#475569" />
                <Text style={styles.emptyStateText}>Aucune course publiée</Text>
                <Text style={styles.emptyStateSubtext}>
                  Créez une nouvelle course pour commencer
                </Text>
              </View>
            )}
          </>
        )}

      </ScrollView>
    );
  };

  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <LinearGradient colors={['#ff6b47', '#ff8a6d']} style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>HA</Text>
        </LinearGradient>
        <View style={styles.profileBadge}>
          <Ionicons name="star" size={10} color="#000" style={{ marginRight: 4 }} />
          <Text style={styles.profileBadgeText}>Premium</Text>
        </View>
        <Text style={styles.profileName}>Hassan Al Masri</Text>
        <Text style={styles.profileEmail}>hassan.almasri@vtcpro.fr</Text>

        {/* Stats */}
        <View style={styles.profileStats}>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>4.8</Text>
            <Text style={styles.profileStatLabel}>
              <Ionicons name="star" size={12} color="#fbbf24" /> Note
            </Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>127</Text>
            <Text style={styles.profileStatLabel}>
              <Ionicons name="car-sport" size={12} color="#0ea5e9" /> Courses
            </Text>
          </View>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowSubscription(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="card" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Abonnement & Facturation</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowGroups(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="people" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Mes Groupes</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowPersonalInfo(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="person" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Informations personnelles</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowNotifications(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="notifications" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowHelpSupport(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconWrapper}>
            <Ionicons name="help-circle" size={20} color="#ff6b47" />
          </View>
          <Text style={styles.menuTitle}>Aide & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
        </TouchableOpacity>
      </View>

      {/* Déconnexion */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
          onPress={async () => {
            Alert.alert(
              'Déconnexion',
              'Êtes-vous sûr de vouloir vous déconnecter ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Déconnexion',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await firebaseAuth.signOut();
                      Alert.alert('Déconnecté', 'Vous avez été déconnecté avec succès');
                    } catch (error: any) {
                      Alert.alert('Erreur', error.message);
                    }
                  },
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="log-out" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.menuTitle, { color: '#ef4444' }]}>Déconnexion</Text>
        </TouchableOpacity>

        {/* User info */}
        <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
          <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
            Connecté en tant que
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 4 }}>
            {user?.email}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // If showing subscription screen
  if (showSubscription) {
    return <SubscriptionScreen onBack={() => setShowSubscription(false)} />;
  }

  // If showing personal info screen
  if (showPersonalInfo) {
    return <PersonalInfoScreen onBack={() => setShowPersonalInfo(false)} />;
  }

  // If showing notifications screen
  if (showNotifications) {
    return <NotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  // If showing help & support screen
  if (showHelpSupport) {
    return <HelpSupportScreen onBack={() => setShowHelpSupport(false)} />;
  }

  // If showing group detail screen
  if (selectedGroup) {
    return (
      <GroupDetailScreen
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  // If showing groups screen
  if (showGroups) {
    return (
      <GroupsScreen
        onBack={() => setShowGroups(false)}
        onSelectGroup={(group) => setSelectedGroup(group)}
      />
    );
  }

  // If creating a ride, show create screen
  if (showCreateRide) {
    return (
      <CreateRideScreen
        onBack={() => setShowCreateRide(false)}
        onCreate={async (ride) => {
          try {
            console.log('📤 Envoi de la course au backend:', ride);
            
            // Appeler l'API pour créer la course
            const response = await apiClient.createRide({
              pickup_address: ride.pickup_address,
              dropoff_address: ride.dropoff_address,
              scheduled_at: ride.scheduled_at,
              price_cents: ride.price_cents,
              visibility: ride.visibility,
              vehicle_type: ride.vehicle_type,
              distance_km: ride.distance_km,
              duration_minutes: ride.duration_minutes,
              commission_enabled: ride.commission_enabled || true,
              group_id: ride.group_ids && ride.group_ids.length > 0 ? ride.group_ids[0] : undefined,
            });
            
            console.log('✅ Course créée avec succès:', response);
            Alert.alert('Succès', 'Course créée avec succès !');
            setShowCreateRide(false);
            // Recharger les courses
            loadRides();
          } catch (error: any) {
            console.error('❌ Erreur création course:', error);
            Alert.alert('Erreur', error.message || 'Impossible de créer la course');
          }
        }}
      />
    );
  }

  // If a ride is selected, show detail screen
  if (selectedRide) {
    return (
      <RideDetailScreen
        ride={selectedRide}
        currentUserId={currentUserId}
        onBack={() => setSelectedRide(null)}
        onClaim={() => {
          Alert.alert('Succès', 'Course réclamée !');
          setSelectedRide(null);
        }}
        onDelete={async () => {
          try {
            console.log('🗑️ Suppression de la course:', selectedRide.id);
            await apiClient.deleteRide(selectedRide.id);
            console.log('✅ Course supprimée avec succès');
            Alert.alert('Succès', 'Course supprimée avec succès !');
            setSelectedRide(null);
            // Recharger les courses
            loadRides();
          } catch (error: any) {
            console.error('❌ Erreur suppression course:', error);
            Alert.alert('Erreur', error.message || 'Impossible de supprimer la course');
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.gradient}>
        {currentScreen === 'home' && renderHome()}
        {currentScreen === 'marketplace' && renderMarketplace()}
        {currentScreen === 'myrides' && renderMyRides()}
        {currentScreen === 'profile' && renderProfile()}

        {/* Marketplace Filters Modal */}
        <MarketplaceFilters
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={(newFilters) => setFilters(newFilters)}
          currentFilters={filters}
        />

        {/* Bottom Navigation - Ultra Modern Design */}
        <View style={styles.bottomNavWrapper}>
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.90)']}
            style={styles.bottomNavGradient}
          >
            <View style={styles.bottomNavContent}>
              {/* Home */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setCurrentScreen('home')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, currentScreen === 'home' && styles.navIconBoxActive]}>
                  <Ionicons
                    name={currentScreen === 'home' ? 'home' : 'home-outline'}
                    size={22}
                    color={currentScreen === 'home' ? '#fff' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.navText, currentScreen === 'home' && styles.navTextActive]}>
                  Accueil
                </Text>
              </TouchableOpacity>

              {/* Marketplace */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setCurrentScreen('marketplace')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, currentScreen === 'marketplace' && styles.navIconBoxActive]}>
                  <Ionicons
                    name={currentScreen === 'marketplace' ? 'search' : 'search-outline'}
                    size={22}
                    color={currentScreen === 'marketplace' ? '#fff' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.navText, currentScreen === 'marketplace' && styles.navTextActive]}>
                  Marché
                </Text>
              </TouchableOpacity>

              {/* Center FAB - Integrated */}
              <TouchableOpacity
                style={styles.centerFABIntegrated}
                onPress={() => setShowCreateRide(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#ff6b47', '#ff8a6d']}
                  style={styles.centerFABGradient}
                >
                  <Ionicons name="add" size={28} color="#fff" style={{ fontWeight: 'bold' }} />
                </LinearGradient>
              </TouchableOpacity>

              {/* My Rides */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setCurrentScreen('myrides')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, currentScreen === 'myrides' && styles.navIconBoxActive]}>
                  <Ionicons
                    name={currentScreen === 'myrides' ? 'car-sport' : 'car-sport-outline'}
                    size={22}
                    color={currentScreen === 'myrides' ? '#fff' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.navText, currentScreen === 'myrides' && styles.navTextActive]}>
                  Courses
                </Text>
              </TouchableOpacity>

              {/* Profile */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setCurrentScreen('profile')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, currentScreen === 'profile' && styles.navIconBoxActive]}>
                  <Ionicons
                    name={currentScreen === 'profile' ? 'person' : 'person-outline'}
                    size={22}
                    color={currentScreen === 'profile' ? '#fff' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.navText, currentScreen === 'profile' && styles.navTextActive]}>
                  Profil
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 120, paddingHorizontal: 20 },

  // Hero
  heroSection: { marginBottom: 30 },
  heroContent: { alignItems: 'center', paddingVertical: 20 },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 71, 0.4)',
    marginBottom: 16,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  greeting: { fontSize: 16, color: '#94a3b8', marginBottom: 4 },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 12 },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: { fontSize: 12, fontWeight: '700', color: '#000000' },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },

  // Section
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },

  // Action Cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 2 },
  actionSubtitle: { fontSize: 13, color: '#94a3b8' },

  // Page Header
  pageHeader: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#94a3b8' },

  // Filters
  regionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 71, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.2)',
    alignSelf: 'flex-start',
  },
  regionText: {
    fontSize: 14,
    color: '#f1f5f9',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  filtersRow: { 
    flexDirection: 'row', 
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  filterChipActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#7dd3fc',
  },
  filterTextActive: { 
    color: '#ffffff',
    fontWeight: '700',
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIconButtonActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // My Rides Stats
  myRidesStats: {
    flexDirection: 'row',
    marginBottom: 30,
  },

  // Profile
  profileHeader: { alignItems: 'center', paddingVertical: 30, marginBottom: 20 },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileAvatarText: { fontSize: 36, fontWeight: 'bold', color: '#ffffff' },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 100,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  profileBadgeText: { fontSize: 11, fontWeight: '700', color: '#000000' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginTop: 24, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  profileStatItem: { flex: 1, alignItems: 'center' },
  profileStatValue: { fontSize: 26, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  profileStatLabel: { fontSize: 12, color: '#94a3b8' },
  profileStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)' },

  // Menu
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#f1f5f9' },

  // Bottom Nav - Ultra Modern Design
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  bottomNavGradient: {
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    // Glassmorphism effect
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  bottomNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 68,
  },
  
  // Nav Items (regular tabs)
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  navIconBoxActive: {
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.4)',
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  navTextActive: {
    color: '#ff6b47',
    fontWeight: '700',
  },

  // Tabs (My Rides)
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },

  // Published Ride Wrapper
  publishedRideWrapper: {
    marginBottom: 16,
  },
  pickerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginTop: -8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  pickerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickerInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  pickerLabel: {
    fontSize: 11,
    color: '#a78bfa',
    marginBottom: 2,
    fontWeight: '600',
  },
  pickerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  pickerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  pickerStatusBadgeCompleted: {
    backgroundColor: '#10b981',
  },
  pickerStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // Center FAB - Integrated in the nav
  centerFABIntegrated: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginHorizontal: 4,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    // Lift effect
    transform: [{ translateY: -8 }],
  },
  centerFABGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Create Button in Marketplace
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 6,
  },
});
