/**
 * Corail - Design proche de VTC Market Web 🪸
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import CoralLogo from './src/components/CoralLogo';
import RideCard from './src/components/RideCard';
import CitySelector from './src/components/CitySelector';
import CreditsBadge from './src/components/CreditsBadge';
import { BadgeCard } from './src/components/BadgeCard';
import MarketplaceFilters, { FilterOptions } from './src/components/MarketplaceFilters';
import RideDetailScreen from './src/screens/RideDetailScreen';
import CreateRideScreen from './src/screens/CreateRideScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import LoginScreen from './src/screens/LoginScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import PendingVerificationScreen from './src/screens/PendingVerificationScreen';
import AdminPanelScreen from './src/screens/AdminPanelScreen';
import QRCodeScreen from './src/screens/QRCodeScreen';
import PersonalRidesScreen from './src/screens/PersonalRidesScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import ToolsScreen from './src/screens/ToolsScreen';
import PlanningScreen from './src/screens/PlanningScreen';
import CreateQuoteScreen from './src/screens/CreateQuoteScreen';
import GlobalCreditsBadge from './src/components/GlobalCreditsBadge';
import ActivityFeed from './src/components/ActivityFeed';
import { firebaseAuth } from './src/services/firebase';
import { apiClient } from './src/services/api';
import * as NotificationService from './src/services/notifications';
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
    vehicle_type: 'VAN',
    distance_km: 14,
    duration_minutes: 22,
    creator: { id: 'user4', full_name: 'Jean Martin', email: 'jean@example.com', rating: 45, total_reviews: 8 },
    picker: { id: 'user2', full_name: 'Hassan Al Masri', email: 'hassan@example.com' },
  },
];

/**
 * Formatte un nom en capitalisant la première lettre de chaque mot
 * Ex: "jean dupont" → "Jean Dupont"
 */
const formatName = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Composant d'écran de chargement ULTRA ÉLÉGANT
 * Design minimaliste et raffiné
 */
const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Chargement' }) => {
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Animation de respiration fluide et ample (inspirée Apple)
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow pulsation autour du logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in élégant
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animation des points - séquentielle et élégante
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(350, [
          Animated.sequence([
            Animated.timing(dot1, { 
              toValue: 1, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
            Animated.timing(dot1, { 
              toValue: 0.3, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
          ]),
          Animated.sequence([
            Animated.timing(dot2, { 
              toValue: 1, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
            Animated.timing(dot2, { 
              toValue: 0.3, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
          ]),
          Animated.sequence([
            Animated.timing(dot3, { 
              toValue: 1, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
            Animated.timing(dot3, { 
              toValue: 0.3, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
          ]),
        ])
      ).start();
    };
    animateDots();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <LinearGradient 
        colors={['#0a0f1a', '#151b2e', '#0a0f1a']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          opacity: fadeAnim 
        }}>
          {/* Logo HD avec animation de respiration ample */}
          <Animated.View
            style={{
              transform: [{ scale: breatheAnim }],
              marginBottom: 80,
            }}
          >
            {/* Glow effet autour du logo */}
            <Animated.View
              style={{
                position: 'absolute',
                top: -20,
                left: -20,
                right: -20,
                bottom: -20,
                borderRadius: 100,
                backgroundColor: 'rgba(255, 107, 107, 0.15)',
                opacity: glowAnim,
                transform: [{ scale: 1.1 }],
              }}
            />
            
            {/* Logo container HD */}
            <View style={styles.logoContainerHD}>
              <CoralLogo size={140} />
            </View>
          </Animated.View>

          {/* Message élégant avec typographie raffinée */}
          <Text style={styles.loadingTextRefined}>{message}</Text>

          {/* Points de chargement espacés et élégants */}
          <View style={styles.dotsContainerRefined}>
            <Animated.View style={[styles.dotRefined, { opacity: dot1 }]} />
            <Animated.View style={[styles.dotRefined, { opacity: dot2 }]} />
            <Animated.View style={[styles.dotRefined, { opacity: dot3 }]} />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

export default function App() {
  // 🔐 Gestion de l'authentification Firebase
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // 🆔 ID de l'utilisateur courant (Firebase UID)
  const currentUserId = user?.uid || '';

  // ✅ Statut de vérification et infos utilisateur
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userSiren, setUserSiren] = useState<string>('');
  const [userProfessionalCard, setUserProfessionalCard] = useState<string>('');
  const [verificationSubmittedAt, setVerificationSubmittedAt] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(true);

  // Écouter les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Configurer l'API client avec le user ID
        apiClient.setUserId(firebaseUser.uid);
        console.log('✅ Utilisateur connecté:', firebaseUser.email);
      } else {
        // 🧹 Nettoyer toutes les données de la session précédente
        apiClient.clearAuth();
        setVerificationStatus(null);
        setUserFullName('');
        setUserPhone('');
        setUserSiren('');
        setUserProfessionalCard('');
        setVerificationSubmittedAt(undefined);
        setIsAdmin(false);
        setVerificationLoading(true);
        setRides([]);
        setPersonalRides([]);
        setUserCredits(0);
        setUserBadges([]);
        setShowPersonalRides(false);
        setShowPlanning(false);
        console.log('❌ Utilisateur déconnecté - Cache nettoyé');
      }
      
      setAuthLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  // États de l'application
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'courses' | 'tools' | 'profile'>('dashboard');
  const [coursesTab, setCoursesTab] = useState<'marketplace' | 'myrides' | 'history'>('marketplace');
  const [selectedCity, setSelectedCity] = useState('toulouse');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'groups'>('all');
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [createRideMode, setCreateRideMode] = useState<'create' | 'publish'>('publish');
  const [showSubscription, setShowSubscription] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showCreditsInfo, setShowCreditsInfo] = useState(true); // Bandeau crédits marketplace
  const [showPersonalRides, setShowPersonalRides] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    vehicleTypes: [],
    sortBy: null,
  });
  const [myRidesTab, setMyRidesTab] = useState<'claimed' | 'published' | 'personal'>('claimed');
  
  // États pour publier une course personnelle
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedPersonalRide, setSelectedPersonalRide] = useState<any | null>(null);
  const [publishVisibility, setPublishVisibility] = useState<'PUBLIC' | 'GROUP'>('PUBLIC');
  const [publishVehicleType, setPublishVehicleType] = useState<'STANDARD' | 'ELECTRIC' | 'VAN' | 'PREMIUM' | 'LUXURY'>('STANDARD');
  
  // 🗄️ Rides depuis Databricks
  const [rides, setRides] = useState<Ride[]>([]);
  const [personalRides, setPersonalRides] = useState<any[]>([]); // Courses personnelles
  const [loadingRides, setLoadingRides] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);

  // 🏆 Badges de l'utilisateur (chargés depuis l'API)
  const [userBadges, setUserBadges] = useState<any[]>([]);

  // 📥 Charger les courses personnelles
  const loadPersonalRides = async () => {
    try {
      console.log('📡 Chargement des courses personnelles...');
      const response = await apiClient.listPersonalRides();
      console.log('✅ Courses personnelles chargées:', response.length);
      setPersonalRides(response);
    } catch (error: any) {
      console.error('❌ Erreur chargement courses personnelles:', error);
    }
  };

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

  // 🪸 Charger les crédits Corail
  const loadCredits = async () => {
    try {
      const response = await apiClient.getCredits();
      setUserCredits(response.credits);
      console.log('💰 Crédits chargés:', response.credits);
    } catch (error: any) {
      console.error('❌ Erreur chargement crédits:', error);
      // Ne pas afficher d'erreur, juste mettre 0 par défaut
      setUserCredits(0);
    }
  };

  const loadBadges = async () => {
    try {
      if (!currentUserId) return;
      const badges = await apiClient.getUserBadges(currentUserId);
      // Mapper les données pour le format BadgeCard
      const formattedBadges = badges.map((b: any) => ({
        id: b.badge_id,
        name: b.badge_name,
        description: b.badge_description,
        icon: b.badge_icon,
        color: b.badge_color,
        rarity: b.badge_rarity,
        earned_at: b.earned_at,
      }));
      setUserBadges(formattedBadges.slice(0, 4)); // Afficher max 4 badges dans le profil
      console.log('🏆 Badges chargés:', formattedBadges.length);
    } catch (error: any) {
      console.error('❌ Erreur chargement badges:', error);
      setUserBadges([]);
    }
  };

  // ✅ Charger le statut de vérification
  const loadVerificationStatus = async () => {
    try {
      setVerificationLoading(true);
      const response = await apiClient.getVerificationStatus();
      
      setVerificationStatus(response.verification_status || 'UNVERIFIED');
      setUserFullName(response.full_name || '');
      setUserPhone(response.phone || '');
      setUserSiren(response.siren || '');
      setUserProfessionalCard(response.professional_card_number || '');
      setVerificationSubmittedAt(response.verification_submitted_at);
      setIsAdmin(response.is_admin === true || response.is_admin === 'true');
    } catch (error: any) {
      console.error('❌ Erreur chargement statut vérification:', error);
      // Par défaut, si l'utilisateur n'existe pas, on considère qu'il n'est pas vérifié
      setVerificationStatus('UNVERIFIED');
      setIsAdmin(false);
    } finally {
      setVerificationLoading(false);
    }
  };

  // 🔄 Charger les rides, crédits, badges et statut de vérification au montage et après authentification
  useEffect(() => {
    if (user) {
      loadVerificationStatus(); // Charger en premier pour rediriger si besoin
      loadRides();
      loadPersonalRides(); // Charger courses personnelles
      loadCredits();
      loadBadges();
      
      // 🔔 Initialiser les notifications
      initializeNotifications();
    }
  }, [user]);

  // 🔔 Initialiser les notifications
  const initializeNotifications = async () => {
    try {
      const hasPermission = await NotificationService.requestNotificationPermissions();
      if (hasPermission) {
        console.log('✅ Notifications activées');
        
        // Vérifier les crédits pour alerte si faible
        if (userCredits < 2) {
          await NotificationService.notifyLowCredits(userCredits);
        }
        
        // Notifier QR Code prêt (une seule fois)
        if (verificationStatus === 'VERIFIED') {
          await NotificationService.notifyQRCodeReady();
        }
      }
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error);
    }
  };

  // 🔐 Afficher écran de chargement pendant l'initialisation
  if (authLoading) {
    return <LoadingScreen message="Chargement" />;
  }

  // 🔐 Afficher écran de connexion si pas authentifié
  if (!user) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  // 🔄 Afficher écran de chargement pendant la vérification du statut
  if (verificationLoading || verificationStatus === null) {
    return <LoadingScreen message="Chargement" />;
  }

  // ✅ Afficher écran de vérification si pas vérifié
  if (verificationStatus === 'UNVERIFIED') {
    return (
      <VerificationScreen
        onBack={async () => {
          await firebaseAuth.signOut();
        }}
        onSuccess={() => {
          // Recharger le statut après soumission
          loadVerificationStatus();
        }}
      />
    );
  }

  // 🟠 Afficher écran d'attente si en cours de validation
  if (verificationStatus === 'PENDING') {
    return (
      <PendingVerificationScreen
        onLogout={async () => {
          await firebaseAuth.signOut();
        }}
        onRefresh={loadVerificationStatus}
        submittedAt={verificationSubmittedAt}
      />
    );
  }

  const renderHome = () => {
    // Calculate real stats from rides data
    const availableRides = rides.filter(r => r.status === 'PUBLISHED').length;
    const myActiveRides = rides.filter(r => 
      r.picker_id === currentUserId && r.status === 'CLAIMED'
    ).length;
    const myCompletedRides = rides.filter(r => 
      (r.picker_id === currentUserId || r.creator_id === currentUserId) && r.status === 'COMPLETED'
    ).length;
    
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.logoWrapper}>
              <CoralLogo size={60} />
            </View>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.userName}>{formatName(userFullName) || user?.email?.split('@')[0] || 'Utilisateur'}</Text>
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color="#000" style={{ marginRight: 4 }} />
              <Text style={styles.premiumText}>Premium Member</Text>
            </View>
          </View>
        </View>

      {/* 🪸 Crédits Corail - Solde */}
      <TouchableOpacity 
        style={styles.creditsBalance}
        onPress={() => setShowSubscription(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#ff6b47', '#ff8a6d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.creditsBalanceGradient}
        >
          <View style={styles.creditsBalanceLeft}>
            <View style={styles.creditsIconLarge}>
              <Text style={styles.creditsIconLargeText}>C</Text>
            </View>
            <View style={styles.creditsBalanceInfo}>
              <Text style={styles.creditsBalanceLabel}>Crédits Corail</Text>
              <Text style={styles.creditsBalanceValue}>{userCredits} crédit{userCredits !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={styles.creditsAddButton}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* 🪸 Explication des crédits */}
      <View style={styles.creditsExplainer}>
        <Ionicons name="information-circle" size={18} color="#0ea5e9" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.creditsExplainerTitle}>Comment ça marche ?</Text>
          <Text style={styles.creditsExplainerText}>
            <Text style={{ fontWeight: '700', color: '#10b981' }}>+1 crédit</Text> quand vous publiez une course{'\n'}
            <Text style={{ fontWeight: '700', color: '#10b981' }}>+1 bonus</Text> si elle est prise et terminée{'\n'}
            <Text style={{ fontWeight: '700', color: '#ff6b47' }}>-1 crédit</Text> pour prendre une course
          </Text>
        </View>
      </View>

      {/* Stats Grid - Compact */}
      <View style={styles.statsContainerCompact}>
        {[
          { icon: 'car-sport', label: 'Disponibles', value: availableRides.toString(), color: '#ff6b47' },
          { icon: 'flash', label: 'En cours', value: myActiveRides.toString(), color: '#0ea5e9' },
        ].map((stat, index) => (
          <View key={index} style={styles.statCardCompact}>
            <View style={[styles.statIconWrapperCompact, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <View style={styles.statInfoCompact}>
              <Text style={styles.statValueCompact}>{stat.value}</Text>
              <Text style={styles.statLabelCompact}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>
      
      {/* Secondary Stats Row */}
      <View style={styles.secondaryStatsRow}>
        <View style={styles.secondaryStatItem}>
          <Ionicons name="checkmark-done" size={16} color="#10b981" />
          <Text style={styles.secondaryStatText}>{myCompletedRides} terminée{myCompletedRides !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.secondaryStatDivider} />
        <View style={styles.secondaryStatItem}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.secondaryStatText}>4.8 note</Text>
        </View>
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
            action: () => {
              setCreateRideMode('publish');
              setShowCreateRide(true);
            }
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
  };

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
        const pickupMatch = ride.pickup_address?.toLowerCase().includes(cityName.toLowerCase()) || false;
        const dropoffMatch = ride.dropoff_address?.toLowerCase().includes(cityName.toLowerCase()) || false;
        if (!pickupMatch && !dropoffMatch) return false;
      }
      
      // Only show published rides in marketplace
      // Exclure les courses EXPIRED et celles dont la date est passée
      if (ride.status === 'EXPIRED') return false;
      if (ride.status !== 'PUBLISHED') return false;
      
      // Filtrer les courses dont la date scheduled_at est dans le passé
      const scheduledTime = new Date(ride.scheduled_at).getTime();
      const now = Date.now();
      if (scheduledTime < now) return false;
      
      return true;
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
      <ScrollView contentContainerStyle={styles.scrollContentCourses} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitleCompact}>Market</Text>
            <Text style={styles.pageSubtitle}>
              <Ionicons name="car-sport" size={14} color="#b9e6fe" /> {filteredRides.length} courses
            </Text>
          </View>
          
          {/* Publier button */}
          <TouchableOpacity
            style={styles.createButtonCompact}
            onPress={() => {
              setCreateRideMode('publish');
              setShowCreateRide(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createButtonText}>Publier</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Credits Info Banner - Collapsible */}
        {showCreditsInfo && (
          <View style={styles.creditsInfoBanner}>
            <View style={styles.creditsInfoLeft}>
              <View style={styles.creditsInfoIcon}>
                <Text style={styles.creditsInfoIconText}>C</Text>
              </View>
              <Text style={styles.creditsInfoTitle}>Prendre une course = -1 crédit</Text>
            </View>
            <TouchableOpacity onPress={() => setShowCreditsInfo(false)} style={styles.creditsInfoClose}>
              <Ionicons name="close" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}

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

    // Filter rides where current user is the creator
    const createdByMe = rides.filter((ride) => ride.creator_id === currentUserId);
    
    // Published rides = PUBLIC + GROUP only (excluant PERSONAL)
    const publishedByMe = createdByMe.filter((ride) => 
      ride.visibility === 'PUBLIC' || ride.visibility === 'GROUP'
    );
    
    // Personal rides = utiliser l'état personalRides directement
    const personalByMe = personalRides;
    
    // Active published: PUBLISHED status + date future (non expirées)
    const activePublished = publishedByMe.filter((ride) => {
      if (ride.status !== 'PUBLISHED') return false;
      if (ride.status === 'EXPIRED') return false;
      // Vérifier que la date n'est pas passée
      const scheduledTime = new Date(ride.scheduled_at).getTime();
      const now = Date.now();
      return scheduledTime >= now;
    });
    
    const claimedPublished = publishedByMe.filter((ride) => ride.status === 'CLAIMED' || ride.status === 'COMPLETED');
    
    // Personal rides actives (SCHEDULED ou sans statut, non expirées)
    const activePersonal = personalByMe.filter((ride) => {
      if (ride.status === 'COMPLETED' || ride.status === 'EXPIRED') return false;
      const scheduledTime = new Date(ride.scheduled_at).getTime();
      const now = Date.now();
      return scheduledTime >= now;
    });

    const totalCount = myRidesTab === 'claimed' ? claimedByMe.length : myRidesTab === 'published' ? publishedByMe.length : personalByMe.length;

    return (
      <ScrollView contentContainerStyle={styles.scrollContentCourses} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitleCompact}>Mes Courses</Text>
            <Text style={styles.pageSubtitle}>
              <Ionicons name="car-sport" size={14} color="#b9e6fe" /> {totalCount} courses
            </Text>
          </View>
          
          {/* Créer une course button */}
          <TouchableOpacity
            style={styles.createButtonCompact}
            onPress={() => {
              setCreateRideMode('create');
              setShowCreateRide(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createButtonText}>Créer</Text>
            </LinearGradient>
          </TouchableOpacity>
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
              size={14}
              color={myRidesTab === 'claimed' ? '#fff' : '#64748b'}
              style={{ marginRight: 4 }}
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
              size={14}
              color={myRidesTab === 'published' ? '#fff' : '#64748b'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabText, myRidesTab === 'published' && styles.tabTextActive]}>
              Publiées ({publishedByMe.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, myRidesTab === 'personal' && styles.tabActive]}
            onPress={() => setMyRidesTab('personal')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="lock-closed"
              size={14}
              color={myRidesTab === 'personal' ? '#fff' : '#64748b'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabText, myRidesTab === 'personal' && styles.tabTextActive]}>
              Perso ({personalByMe.length})
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
                  <Ionicons name="time" size={18} color="#0ea5e9" />
                </View>
                <Text style={styles.statValue}>{claimedRides.length}</Text>
                <Text style={styles.statLabel}>En cours</Text>
              </View>
              <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{completedRides.length}</Text>
                <Text style={styles.statLabel}>Terminées</Text>
              </View>
            </View>

            {/* Claimed Rides - Compact View */}
            {claimedRides.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="time" size={20} color="#0ea5e9" /> En cours
                </Text>
                {claimedRides.map((ride) => (
                  <TouchableOpacity
                    key={ride.id}
                    style={styles.compactRideRow}
                    onPress={() => setSelectedRide(ride)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.compactRideLeft}>
                      <View style={styles.compactRideIconWrapper}>
                        <Ionicons name="car-sport-outline" size={20} color="#0ea5e9" />
                      </View>
                      <View style={styles.compactRideInfo}>
                        <Text style={styles.compactRideTime}>
                          {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                        <View style={styles.compactRideRoute}>
                          <Ionicons name="location" size={12} color="#10b981" />
                          <Text style={styles.compactRideAddress} numberOfLines={1}>
                            {ride.pickup_address}
                          </Text>
                        </View>
                        <View style={styles.compactRideRoute}>
                          <Ionicons name="flag" size={12} color="#ff6b47" />
                          <Text style={styles.compactRideAddress} numberOfLines={1}>
                            {ride.dropoff_address}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.compactRideRight}>
                      <Text style={styles.compactRidePrice}>
                        {(ride.price_cents / 100).toFixed(2)}€
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#64748b" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Completed Rides - Compact View */}
            {completedRides.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" /> Terminées
                </Text>
                {completedRides.map((ride) => (
                  <TouchableOpacity
                    key={ride.id}
                    style={styles.compactRideRow}
                    onPress={() => setSelectedRide(ride)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.compactRideLeft}>
                      <View style={styles.compactRideIconWrapper}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
                      </View>
                      <View style={styles.compactRideInfo}>
                        <Text style={styles.compactRideTime}>
                          {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                        <View style={styles.compactRideRoute}>
                          <Ionicons name="location" size={12} color="#10b981" />
                          <Text style={styles.compactRideAddress} numberOfLines={1}>
                            {ride.pickup_address}
                          </Text>
                        </View>
                        <View style={styles.compactRideRoute}>
                          <Ionicons name="flag" size={12} color="#ff6b47" />
                          <Text style={styles.compactRideAddress} numberOfLines={1}>
                            {ride.dropoff_address}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.compactRideRight}>
                      <Text style={styles.compactRidePrice}>
                        {(ride.price_cents / 100).toFixed(2)}€
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#64748b" />
                    </View>
                  </TouchableOpacity>
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
                  <Ionicons name="radio-button-on" size={18} color="#ff6b47" />
                </View>
                <Text style={styles.statValue}>{activePublished.length}</Text>
                <Text style={styles.statLabel}>Actives</Text>
              </View>
              <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Ionicons name="person-add" size={18} color="#8b5cf6" />
                </View>
                <Text style={styles.statValue}>{claimedPublished.length}</Text>
                <Text style={styles.statLabel}>Prises</Text>
              </View>
            </View>

            {/* Active Published Rides - Compact View */}
            {activePublished.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="radio-button-on" size={20} color="#ff6b47" /> Courses actives
                </Text>
                <Text style={styles.sectionSubtitle}>En attente d'être prises</Text>
                
                {/* Liste compacte des courses */}
                {activePublished.map((ride) => (
                  <TouchableOpacity
                    key={ride.id}
                    style={styles.compactRideRow}
                    onPress={() => setSelectedRide(ride)}
                    activeOpacity={0.7}
                  >
                    {/* Icône et horaire */}
                    <View style={styles.compactRideLeft}>
                      <View style={styles.compactRideIconWrapper}>
                        <Ionicons name="time-outline" size={20} color="#ff6b47" />
                      </View>
                      <View style={styles.compactRideInfo}>
                        <Text style={styles.compactRideTime}>
                          {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                        <View style={styles.compactRideRoute}>
                          <Ionicons name="location" size={12} color="#10b981" />
                          <Text style={styles.compactRideAddress} numberOfLines={1}>
                            {ride.pickup_address}
                          </Text>
                        </View>
                        <View style={styles.compactRideRoute}>
                          <Ionicons name="flag" size={12} color="#ff6b47" />
                          <Text style={styles.compactRideAddress} numberOfLines={1}>
                            {ride.dropoff_address}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Prix et chevron */}
                    <View style={styles.compactRideRight}>
                      <Text style={styles.compactRidePrice}>
                        {(ride.price_cents / 100).toFixed(2)}€
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#64748b" />
                    </View>
                  </TouchableOpacity>
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

        {/* Personal Tab Content */}
        {myRidesTab === 'personal' && (
          <>
            {/* Stats */}
            <View style={styles.myRidesStats}>
              <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                  <Ionicons name="calendar" size={18} color="#6366f1" />
                </View>
                <Text style={styles.statValue}>{activePersonal.length}</Text>
                <Text style={styles.statLabel}>À venir</Text>
              </View>
              <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Ionicons name="lock-closed" size={18} color="#8b5cf6" />
                </View>
                <Text style={styles.statValue}>{personalByMe.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* Active Personal Rides */}
            {activePersonal.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="calendar" size={20} color="#6366f1" /> Prochaines courses personnelles
                </Text>
                <Text style={styles.sectionSubtitle}>Courses privées non publiées</Text>
                
                {activePersonal.map((ride) => (
                  <View key={ride.id} style={styles.compactRideRow}>
                    <TouchableOpacity
                      style={[styles.compactRideLeft, { flex: 1 }]}
                      onPress={() => setSelectedRide(ride)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.compactRideIconWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />
                      </View>
                      <View style={styles.compactRideInfo}>
                        <Text style={styles.compactRideTime}>
                          {new Date(ride.scheduled_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        <View style={styles.compactRideRoute}>
                          <Ionicons name="location-outline" size={12} color="#94a3b8" />
                          <Text style={styles.compactRideAddress} numberOfLines={1}>
                            {ride.pickup_address}
                          </Text>
                        </View>
                        <View style={styles.compactRideRoute}>
                          <Ionicons name="flag-outline" size={12} color="#94a3b8" />
                          <Text style={styles.compactRideAddress} numberOfLines={1}>
                            {ride.dropoff_address}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    
                    <View style={styles.compactRideRight}>
                      <Text style={styles.compactRidePrice}>
                        {(ride.price_cents / 100).toFixed(2)}€
                      </Text>
                      <TouchableOpacity
                        style={styles.publishButton}
                        onPress={() => {
                          setSelectedPersonalRide(ride);
                          setShowPublishModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="megaphone" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {personalByMe.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="lock-closed-outline" size={64} color="#475569" />
                <Text style={styles.emptyStateText}>Aucune course personnelle</Text>
                <Text style={styles.emptyStateSubtext}>
                  Créez une course privée pour votre propre usage
                </Text>
              </View>
            )}
          </>
        )}

      </ScrollView>
    );
  };

  const renderProfile = () => {
    // Générer les initiales depuis le nom réel
    const getInitials = (name: string) => {
      if (!name) return '??';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const displayName = formatName(userFullName) || user?.email?.split('@')[0] || 'Utilisateur';
    const displayEmail = user?.email || 'email@example.com';
    const initials = getInitials(userFullName || displayName);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <LinearGradient colors={['#ff6b47', '#ff8a6d']} style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.profileBadge}>
            <Ionicons name="star" size={10} color="#000" style={{ marginRight: 4 }} />
            <Text style={styles.profileBadgeText}>Premium</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>

        {/* Stats */}
        <View style={styles.profileStats}>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{userCredits}</Text>
            <Text style={styles.profileStatLabel}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff6b47', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>C</Text>
              </View> Crédits
            </Text>
          </View>
          <View style={styles.profileStatDivider} />
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

      {/* 🏆 Badges Section - Réduite */}
      {userBadges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="trophy" size={18} color="#fbbf24" /> Badges
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowBadges(true)}>
              <Text style={styles.seeAllText}>Tout voir ({userBadges.length})</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScroll}
          >
            {userBadges.slice(0, 3).map((badge) => (
              <BadgeCard key={badge.id} badge={badge} size="small" />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Menu */}
      {/* 👨‍💼 Section Admin (visible uniquement pour les admins) */}
      {isAdmin && (
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="shield-checkmark" size={20} color="#fbbf24" /> Administration
            </Text>
            <View style={{
              backgroundColor: 'rgba(251, 191, 36, 0.15)',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#fbbf24' }}>ADMIN</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.menuItem, {
              backgroundColor: 'rgba(251, 191, 36, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(251, 191, 36, 0.2)',
            }]}
            onPress={() => setShowAdminPanel(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrapper, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#fbbf24" />
            </View>
            <Text style={styles.menuTitle}>Panel Admin</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(251, 191, 36, 0.5)" />
          </TouchableOpacity>
        </View>
      )}

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
};

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

  if (showBadges) {
    return <BadgesScreen onBack={() => setShowBadges(false)} currentUserId={currentUserId} />;
  }

  // 📱 If showing QR Code
  if (showQRCode) {
    return (
      <QRCodeScreen
        onBack={() => setShowQRCode(false)}
        userData={{
          name: userFullName || user?.displayName || 'Utilisateur',
          email: user?.email || '',
          phone: userPhone || undefined,
          company: undefined, // B2B: Pas d'intermédiaire, contact direct chauffeur
          siren: userSiren || undefined,
          professionalCardNumber: userProfessionalCard || undefined,
        }}
      />
    );
  }

  // 🚗 If showing Personal Rides (Enregistrement courses externes)
  if (showPersonalRides) {
    return <PersonalRidesScreen onClose={() => setShowPersonalRides(false)} />;
  }

  if (showCreateQuote) {
    return <CreateQuoteScreen onBack={() => setShowCreateQuote(false)} onQuoteSent={() => setShowCreateQuote(false)} />;
  }

  // 📅 If showing Planning
  if (showPlanning) {
    return <PlanningScreen onBack={() => setShowPlanning(false)} />;
  }

  // 👨‍💼 If showing admin panel
  if (showAdminPanel) {
    return <AdminPanelScreen onBack={() => setShowAdminPanel(false)} />;
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
        mode={createRideMode}
        onBack={() => setShowCreateRide(false)}
        onCreate={async (ride) => {
          try {
            console.log('📤 Envoi de la course au backend:', ride);
            
            // 🔀 Si visibility === 'PERSONAL', créer une personal_ride
            if (ride.visibility === 'PERSONAL') {
              const response = await apiClient.createPersonalRide({
                source: 'OTHER',
                pickup_address: ride.pickup_address,
                dropoff_address: ride.dropoff_address,
                scheduled_at: ride.scheduled_at,
                price_cents: ride.price_cents,
                distance_km: ride.distance_km,
                duration_minutes: ride.duration_minutes,
                client_name: ride.client_name,
                client_phone: ride.client_phone,
                status: 'SCHEDULED',
              });
              
              console.log('✅ Course personnelle créée avec succès:', response);
              
              // 🔔 Planifier notification de rappel 1h avant
              await NotificationService.scheduleRideReminder(
                response.id,
                ride.scheduled_at,
                ride.pickup_address,
                ride.dropoff_address
              );
              
              // Recharger les courses personnelles
              await loadPersonalRides();
              
              // Fermer le modal
              setShowCreateRide(false);
              Alert.alert('Succès', 'Course personnelle enregistrée ! 📝');
            } else {
              // Sinon, créer une course normale (marketplace)
              const response = await apiClient.createRide({
                pickup_address: ride.pickup_address,
                dropoff_address: ride.dropoff_address,
                scheduled_at: ride.scheduled_at,
                price_cents: ride.price_cents,
                visibility: ride.visibility,
                vehicle_type: ride.vehicle_type,
                distance_km: ride.distance_km,
                duration_minutes: ride.duration_minutes,
                group_id: ride.group_ids && ride.group_ids.length > 0 ? ride.group_ids[0] : undefined,
              });
              
              console.log('✅ Course marketplace créée avec succès:', response);
              
              // Ajouter la nouvelle course au state local immédiatement
              const newRide: Ride = {
                ...response,
                creator_id: currentUserId,
                creator: undefined, // Sera chargé lors du prochain refresh
                picker_id: null,
                picker: undefined,
              };
              setRides(prevRides => [newRide, ...prevRides]);
              console.log('✅ Course ajoutée au state local - compteur devrait augmenter');
              
              // 🔔 Planifier notification de rappel 1h avant (pour le créateur aussi)
              await NotificationService.scheduleRideReminder(
                response.id,
                ride.scheduled_at,
                ride.pickup_address,
                ride.dropoff_address
              );
              
              // 🪸 Recharger les crédits après création (devrait avoir +1 crédit)
              await loadCredits();
              
              // Fermer le modal
              setShowCreateRide(false);
              Alert.alert('Succès', 'Course créée avec succès ! +1 crédit 🪸');
            }
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
        userCredits={userCredits}
        onBack={() => setSelectedRide(null)}
        onClaim={async () => {
          try {
            // 🪸 Vérifier les crédits avant de prendre la course
            if (userCredits < 1) {
              Alert.alert(
                'Crédits insuffisants',
                'Vous avez besoin d\'au moins 1 crédit pour prendre une course. Publiez des courses pour gagner des crédits !',
                [{ text: 'OK' }]
              );
              return;
            }

            // Prendre la course
            await apiClient.claimRide(selectedRide.id);
            console.log('✅ Course réclamée avec succès');
            
            // 🔔 Planifier notification de rappel 1h avant
            await NotificationService.scheduleRideReminder(
              selectedRide.id,
              selectedRide.scheduled_at,
              selectedRide.pickup_address,
              selectedRide.dropoff_address
            );
            
            // 🔔 Planifier rappel pour terminer la course
            await NotificationService.notifyCompleteRide(
              selectedRide.id,
              selectedRide.scheduled_at
            );
            
            // Recharger les crédits et les rides
            await loadCredits();
            await loadRides();
            await loadPersonalRides();
            
            // Recharger la course spécifique pour voir les infos client mises à jour
            const updatedRide = await apiClient.getRide(selectedRide.id);
            setSelectedRide(updatedRide);
            
            Alert.alert('Succès', 'Course réclamée ! -1 crédit [C]\n\nLes informations du client sont maintenant visibles.');
          } catch (error: any) {
            console.error('❌ Erreur réclamation course:', error);
            Alert.alert('Erreur', error.message || 'Impossible de réclamer la course');
          }
        }}
        onDelete={async () => {
          try {
            console.log('🗑️ Suppression de la course:', selectedRide.id);
            const deletedRideId = selectedRide.id;
            
            // Supprimer de la base de données
            await apiClient.deleteRide(deletedRideId);
            console.log('✅ Course supprimée avec succès');
            
            // Mettre à jour immédiatement le state local
            setRides(prevRides => prevRides.filter(r => r.id !== deletedRideId));
            console.log('✅ State local mis à jour - compteur devrait changer instantanément');
            
            // Fermer le modal
            setSelectedRide(null);
            Alert.alert('Succès', 'Course supprimée avec succès !');
          } catch (error: any) {
            console.error('❌ Erreur suppression course:', error);
            Alert.alert('Erreur', error.message || 'Impossible de supprimer la course');
          }
        }}
        onComplete={async () => {
          try {
            console.log('✅ Terminer la course:', selectedRide.id);
            
            // Terminer la course
            await apiClient.completeRide(selectedRide.id);
            console.log('✅ Course terminée avec succès');
            
            // Recharger les crédits et les rides
            await loadCredits();
            await loadRides();
            await loadPersonalRides();
            
            // Fermer le modal
            setSelectedRide(null);
            Alert.alert('Succès', 'Course terminée avec succès ! Le créateur a reçu un crédit bonus (+1 [C])');
          } catch (error: any) {
            console.error('❌ Erreur terminer course:', error);
            Alert.alert('Erreur', error.message || 'Impossible de terminer la course');
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.gradient}>
        {/* Global Credits Badge - Affiché partout */}
        <GlobalCreditsBadge credits={userCredits} onPress={() => setShowSubscription(true)} />
        
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            userFullName={userFullName}
            userCredits={userCredits}
            userRides={rides}
            onNavigateToCourses={() => setCurrentScreen('courses')}
            onNavigateToTools={() => setCurrentScreen('tools')}
            onNavigateToActivity={() => {
              setCoursesTab('history');
              setCurrentScreen('courses');
            }}
            onNavigateToPlanning={() => setShowPlanning(true)}
            onOpenQRCode={() => setShowQRCode(true)}
            onCreateRide={() => {
              setCreateRideMode('create');
              setShowCreateRide(true);
            }}
          />
        )}
        {currentScreen === 'courses' && (
          <CoursesScreen
            activeTab={coursesTab}
            onTabChange={setCoursesTab}
            marketplaceContent={renderMarketplace()}
            myRidesContent={renderMyRides()}
            historyContent={<ActivityFeed limit={50} />}
          />
        )}
        {currentScreen === 'tools' && (
          <ToolsScreen
            onOpenQRCode={() => setShowQRCode(true)}
            onOpenPersonalRides={() => setShowPersonalRides(true)}
            onOpenPlanning={() => setShowPlanning(true)}
            onCreateQuote={() => setShowCreateQuote(true)}
          />
        )}
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
              {/* Accueil */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setCurrentScreen('dashboard')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, currentScreen === 'dashboard' && styles.navIconBoxActive]}>
                  <Ionicons
                    name={currentScreen === 'dashboard' ? 'home-sharp' : 'home-outline'}
                    size={22}
                    color={currentScreen === 'dashboard' ? '#fff' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.navText, currentScreen === 'dashboard' && styles.navTextActive]}>
                  Accueil
                </Text>
              </TouchableOpacity>

              {/* Courses */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setCurrentScreen('courses')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, currentScreen === 'courses' && styles.navIconBoxActive]}>
                  <Ionicons
                    name={currentScreen === 'courses' ? 'car-sport' : 'car-sport-outline'}
                    size={22}
                    color={currentScreen === 'courses' ? '#fff' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.navText, currentScreen === 'courses' && styles.navTextActive]}>
                  Courses
                </Text>
              </TouchableOpacity>

              {/* Center FAB - Integrated */}
              <TouchableOpacity
                style={styles.centerFABIntegrated}
                onPress={() => {
                  setCreateRideMode('create');
                  setShowCreateRide(true);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#ff6b47', '#ff8a6d']}
                  style={styles.centerFABGradient}
                >
                  <Ionicons name="add" size={28} color="#fff" style={{ fontWeight: 'bold' }} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Suivi */}
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => setCurrentScreen('tools')}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, currentScreen === 'tools' && styles.navIconBoxActive]}>
                  <Ionicons
                    name={currentScreen === 'tools' ? 'analytics' : 'analytics-outline'}
                    size={22}
                    color={currentScreen === 'tools' ? '#fff' : '#94a3b8'}
                  />
                </View>
                <Text style={[styles.navText, currentScreen === 'tools' && styles.navTextActive]}>
                  Suivi
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

        {/* Modal: Publier une course personnelle */}
        {showPublishModal && selectedPersonalRide && (
          <View style={styles.modalOverlay}>
            <View style={styles.publishModal}>
              <Text style={styles.publishModalTitle}>Publier la course</Text>
              <Text style={styles.publishModalSubtitle}>
                {selectedPersonalRide.pickup_address} → {selectedPersonalRide.dropoff_address}
              </Text>

              {/* Visibilité */}
              <Text style={styles.publishLabel}>Visibilité</Text>
              <View style={styles.publishOptions}>
                <TouchableOpacity
                  style={[styles.publishOption, publishVisibility === 'PUBLIC' && styles.publishOptionActive]}
                  onPress={() => setPublishVisibility('PUBLIC')}
                >
                  <Ionicons 
                    name="globe" 
                    size={20} 
                    color={publishVisibility === 'PUBLIC' ? '#fff' : '#64748b'} 
                  />
                  <Text style={[styles.publishOptionText, publishVisibility === 'PUBLIC' && styles.publishOptionTextActive]}>
                    Public
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.publishOption, publishVisibility === 'GROUP' && styles.publishOptionActive]}
                  onPress={() => setPublishVisibility('GROUP')}
                >
                  <Ionicons 
                    name="people" 
                    size={20} 
                    color={publishVisibility === 'GROUP' ? '#fff' : '#64748b'} 
                  />
                  <Text style={[styles.publishOptionText, publishVisibility === 'GROUP' && styles.publishOptionTextActive]}>
                    Groupe
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Type de véhicule */}
              <Text style={styles.publishLabel}>Type de véhicule</Text>
              <View style={styles.publishVehicleTypes}>
                {['STANDARD', 'ELECTRIC', 'VAN', 'PREMIUM', 'LUXURY'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.publishVehicleType, publishVehicleType === type && styles.publishVehicleTypeActive]}
                    onPress={() => setPublishVehicleType(type as any)}
                  >
                    <Text style={[styles.publishVehicleTypeText, publishVehicleType === type && styles.publishVehicleTypeTextActive]}>
                      {type === 'STANDARD' ? '🚗 Standard' :
                       type === 'ELECTRIC' ? '⚡ Électrique' :
                       type === 'VAN' ? '🚐 Van' :
                       type === 'PREMIUM' ? '✨ Premium' :
                       '💎 Luxe'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.publishModalActions}>
                <TouchableOpacity
                  style={styles.publishCancelButton}
                  onPress={() => {
                    setShowPublishModal(false);
                    setSelectedPersonalRide(null);
                  }}
                >
                  <Text style={styles.publishCancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.publishConfirmButton}
                  onPress={async () => {
                    try {
                      console.log('📤 Publication course personnelle:', selectedPersonalRide.id);
                      await apiClient.publishPersonalRide(selectedPersonalRide.id, {
                        visibility: publishVisibility,
                        vehicle_type: publishVehicleType,
                      });
                      
                      // Recharger les données
                      await loadRides();
                      await loadPersonalRides();
                      
                      setShowPublishModal(false);
                      setSelectedPersonalRide(null);
                      Alert.alert('Succès', 'Course publiée sur le marketplace ! 🎉');
                    } catch (error: any) {
                      console.error('❌ Erreur publication:', error);
                      Alert.alert('Erreur', error.message || 'Impossible de publier la course');
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.publishConfirmGradient}
                  >
                    <Ionicons name="megaphone" size={18} color="#fff" />
                    <Text style={styles.publishConfirmButtonText}>Publier</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 120, paddingHorizontal: 20 },
  scrollContentCourses: { paddingTop: 16, paddingBottom: 120, paddingHorizontal: 20 },

  // 🎨 Loading Screen Styles - ULTRA ÉLÉGANT & RAFFINÉ
  logoContainer: {
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainerHD: {
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#cbd5e1',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  loadingTextRefined: {
    fontSize: 17,
    fontWeight: '300',
    color: '#e2e8f0',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 36,
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dotsContainerRefined: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff6b47',
  },
  dotRefined: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff8b6d',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },

  // Hero
  heroSection: { marginBottom: 20 },
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

  // 🪸 Crédits Corail
  creditsBalance: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  creditsBalanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  creditsBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creditsIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  creditsIconLargeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  creditsBalanceInfo: {
    flex: 1,
  },
  creditsBalanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  creditsBalanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  creditsAddButton: {
    marginLeft: 12,
  },
  creditsExplainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  creditsExplainerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  creditsExplainerText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },

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
    borderRadius: 14,
    padding: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 3 },
  statLabel: { fontSize: 10, color: '#94a3b8', textAlign: 'center' },

  // Stats Compact
  statsContainerCompact: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCardCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statIconWrapperCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfoCompact: {
    flex: 1,
  },
  statValueCompact: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#f1f5f9', 
    marginBottom: 2 
  },
  statLabelCompact: { 
    fontSize: 11, 
    color: '#94a3b8' 
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryStatText: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '600',
  },
  secondaryStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },

  // Section
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },

  // Badges Section
  badgesScroll: {
    paddingVertical: 8,
  },
  badgesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  badgesInfoText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },

  // QR Code Button
  qrCodeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  qrCodeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  qrCodeButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qrCodeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  qrCodeButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  qrCodeButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },

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
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  pageTitleCompact: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#94a3b8' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

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
  creditsInfoBanner: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditsInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  creditsInfoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsInfoIconText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
  },
  creditsInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    flex: 1,
  },
  creditsInfoClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
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
    fontSize: 11,
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
  createButtonCompact: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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

  // Compact Ride Row
  compactRideRow: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b47',
  },
  compactRideLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  compactRideIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactRideInfo: {
    flex: 1,
    gap: 4,
  },
  compactRideTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  compactRideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactRideAddress: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
  },
  compactRideRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  compactRidePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  
  // Bouton publier course personnelle
  publishButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Modal publier course
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  publishModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  publishModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  publishModalSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
  },
  publishLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 12,
    marginTop: 16,
  },
  publishOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  publishOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#334155',
  },
  publishOptionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  publishOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  publishOptionTextActive: {
    color: '#fff',
  },
  publishVehicleTypes: {
    gap: 8,
  },
  publishVehicleType: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#334155',
  },
  publishVehicleTypeActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  publishVehicleTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  publishVehicleTypeTextActive: {
    color: '#fff',
  },
  publishModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  publishCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  publishConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  publishConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  publishConfirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
