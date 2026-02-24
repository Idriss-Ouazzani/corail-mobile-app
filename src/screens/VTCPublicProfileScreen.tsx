import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Linking,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Clipboard,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import MultiSelectInput from '../components/MultiSelectInput';
import QRCodeCard from '../components/QRCodeCard';

// URL de production pour les profils VTC
import { getVtcProfileUrl } from '../constants/urls';
import { getCompletionScore, getMissingForActivation, isEligibleForActivation, getPageProStatus, type PageProFormData } from '../utils/pageProCompletion';
import * as Analytics from '../services/analytics';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

// Même image de fond que la page Pro sur getcorail.com (vtc/[slug])
const PAGE_PRO_HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=85';

const WIZARD_STEPS = ['Informations', 'Véhicule', 'Services', 'Équipements', 'Aperçu & Activation'] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4;

const SEAT_OPTIONS = [2, 3, 4, 5, 6, 7] as const;

// Listes prédéfinies
const PREDEFINED_LANGUAGES = [
  'Français',
  'Anglais',
  'Espagnol',
  'Arabe',
  'Italien',
  'Portugais',
  'Allemand',
  'Chinois',
  'Russe',
  'Japonais',
];

const PREDEFINED_SERVICES = [
  'Aéroport',
  'Mariage',
  'VIP',
  'Longue distance',
  'Évènementiel',
  'Transfert gare',
  'Business',
  'Tourisme',
  'Nuit',
];

const PREDEFINED_AMENITIES = [
  'WiFi',
  'Eau',
  'Chargeurs USB',
  'Siège bébé',
  'Siège enfant',
  'Climatisation',
  'Journaux',
  'Bouteilles offertes',
  'Tablette',
  'Musique',
];

interface VTCProfile {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  services: string[];
  zone_city: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_seats: number | null;
  experience_years: number | null;
  languages: string[];
  amenities: string[];
  is_public: boolean;
  view_count: number;
}

interface VTCPublicProfileScreenProps {
  onBack: () => void;
  currentUserId: string;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserPhone?: string;
  currentUserProfessionalCard?: string;
  currentUserPhotoUrl?: string; // Photo du profil général
}

export const VTCPublicProfileScreen: React.FC<VTCPublicProfileScreenProps> = ({ 
  onBack, 
  currentUserId,
  currentUserEmail,
  currentUserName,
  currentUserPhone,
  currentUserProfessionalCard,
  currentUserPhotoUrl,
}) => {
  const { loadVerificationStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<VTCProfile | null>(null);

  // Debug: Vérifier l'utilisateur au chargement
  useEffect(() => {
    console.log('🔐 VTCPublicProfileScreen - Current User:', {
      exists: !!currentUserId,
      id: currentUserId,
      email: currentUserEmail,
      fullName: currentUserName,
    });
  }, [currentUserId]);

  // Form state
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [zoneCity, setZoneCity] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Français']);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoKey, setPhotoKey] = useState(Date.now());
  const [isPublic, setIsPublic] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [monthViews, setMonthViews] = useState(0);
  const [monthBookings, setMonthBookings] = useState(0);
  const [vehicleSeats, setVehicleSeats] = useState<number | null>(null);
  const [mode, setMode] = useState<'hub' | 'wizard'>('hub');
  const [showShareModal, setShowShareModal] = useState(false);
  const currentStepRef = React.useRef<StepIndex>(0);
  currentStepRef.current = currentStep;

  useEffect(() => {
    loadProfile(true);
  }, []);

  useEffect(() => {
    if (!loading) Analytics.trackPageProOpened();
  }, [loading]);

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      try {
        setMonthViews(profile.view_count ?? 0);
        const requests = await apiClient.getDriverRideRequests();
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const accepted = (requests || []).filter(
          (r: any) => r.status === 'ACCEPTED' && new Date(r.created_at) >= firstDayOfMonth
        ).length;
        setMonthBookings(accepted);
      } catch (_e) {
        setMonthBookings(0);
      }
    };
    load();
  }, [profile?.id, profile?.view_count]);

  const getFormData = (): PageProFormData => ({
    photoUrl,
    bio,
    zoneCity,
    slug,
    vehicleBrand,
    vehicleModel,
    vehicleYear,
    vehicleSeats,
    services,
    amenities,
  });

  const completionPercentage = getCompletionScore(getFormData());
  const missingForActivation = getMissingForActivation(getFormData());
  const eligibleForActivation = isEligibleForActivation(getFormData());
  const pageProStatus = getPageProStatus(getFormData(), isPublic);

  const completionMessage =
    completionPercentage >= 100
      ? 'Votre profil est complet.'
      : completionPercentage >= 70
        ? 'Quelques infos en plus pour optimiser votre page.'
        : 'Ajoutez des infos pour activer les réservations directes — votre page peut être visible dès maintenant.';

  const getFirstIncompleteStep = (): StepIndex => {
    if (!slug.trim()) return 0;
    if (!bio.trim() || !zoneCity.trim()) return 0;
    if (!vehicleBrand.trim() || !vehicleModel.trim() || !vehicleYear.trim() || vehicleSeats == null) return 1;
    if (services.length < 1) return 2;
    if (amenities.length < 1) return 3;
    return 4;
  };

  const loadProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      if (!currentUserId) {
        console.warn('⚠️ Utilisateur non connecté, impossible de charger le profil');
        if (showLoading) setLoading(false);
        return;
      }

      console.log('📥 Chargement du profil VTC pour user:', currentUserId);
      const data = await apiClient.getMyVTCProfile();
      
      if (data) {
        console.log('✅ Profil VTC trouvé:', data.slug);
        setProfile(data);
        setSlug(data.slug);
        setBio(data.bio || '');
        setPhone(data.phone || currentUserPhone || '');
        setZoneCity(data.zone_city || '');
        setVehicleBrand(data.vehicle_brand || '');
        setVehicleModel(data.vehicle_model || '');
        setVehicleYear(data.vehicle_year?.toString() || '');
        const seats = data.vehicle_seats != null && data.vehicle_seats >= 2 && data.vehicle_seats <= 7 ? data.vehicle_seats : null;
        setVehicleSeats(seats);
        setExperienceYears(data.experience_years?.toString() || '');
        setLanguages(data.languages || ['Français']);
        setAmenities(data.amenities || []);
        setServices(data.services || []);
        // Pré-remplir avec la photo du profil général si pas de photo VTC
        const photoToUse = data.photo_url || currentUserPhotoUrl || '';
        setPhotoUrl(photoToUse);
        if (photoToUse && !data.photo_url) {
          console.log('📸 Photo pré-remplie depuis le profil général');
        }
        setIsPublic(data.is_public);
      } else {
        console.log('ℹ️ Pas de profil VTC, pré-remplissage avec les données utilisateur');
        // Pré-remplir avec les données du user
        setPhone(currentUserPhone || '');
        // Pré-remplir avec la photo du profil général
        if (currentUserPhotoUrl) {
          setPhotoUrl(currentUserPhotoUrl);
          console.log('📸 Photo pré-remplie depuis le profil général');
        }
        // Générer un slug par défaut à partir du nom
        const defaultSlug = generateSlug(currentUserName || '');
        setSlug(defaultSlug);
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer espaces/symboles par tirets
      .replace(/^-+|-+$/g, ''); // Enlever tirets au début/fin
  };

  // Upload de la photo
  const handlePickImage = async () => {
    // Vérifier que l'utilisateur est connecté
    if (!currentUserId) {
      console.error('❌ Utilisateur non connecté, currentUserId:', currentUserId);
      Alert.alert(
        'Non connecté',
        'Vous devez être connecté pour uploader une photo. Essayez de vous reconnecter.'
      );
      return;
    }

    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de la permission pour accéder à vos photos.'
        );
        return;
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Fix: Utiliser array au lieu de MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1], // Carré
        quality: 0.8,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;
      await uploadPhoto(imageUri);
    } catch (error) {
      console.error('❌ Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
    }
  };

  const uploadPhoto = async (uri: string) => {
    console.log('📸 Début upload, URI locale:', uri);
    
    try {
      setUploading(true);

      // Vérifier que l'utilisateur est bien authentifié
      if (!currentUserId) {
        console.error('❌ Utilisateur non authentifié:', currentUserId);
        throw new Error('Vous devez être connecté pour uploader une photo');
      }

      console.log('👤 User ID:', currentUserId);
      console.log('⏳ Upload en cours...');

      // Lire l'image en base64 avec expo-file-system
      console.log('📦 Lecture du fichier en base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64', // Utiliser la string directement
      });
      
      console.log('✅ Base64 lu:', base64.length, 'caractères');

      // Nom du fichier : {user_id}/profile-timestamp.jpg
      const timestamp = Date.now();
      const fileName = `${currentUserId}/profile-${timestamp}.jpg`;

      console.log('☁️ Upload vers Supabase:', fileName);
      console.log('📁 Chemin complet: vtc-profiles/' + fileName);

      // Décoder le base64 pour l'upload (Supabase attend un Uint8Array ou Blob)
      const decode = (str: string): Uint8Array => {
        const binaryString = atob(str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const fileData = decode(base64);
      console.log('✅ Données décodées:', fileData.length, 'bytes');

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('vtc-profiles')
        .upload(fileName, fileData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Erreur upload Supabase:', uploadError);
        throw new Error(uploadError.message);
      }

      console.log('✅ Fichier uploadé sur Supabase !');

      // Générer une URL signée (valide 10 ans = 315360000 secondes)
      const { data: signedData, error: signError } = await supabase.storage
        .from('vtc-profiles')
        .createSignedUrl(fileName, 315360000); // 10 ans

      if (signError || !signedData) {
        console.error('❌ Erreur génération URL signée:', signError);
        throw new Error('Impossible de générer l\'URL de la photo');
      }

      const publicUrl = signedData.signedUrl;
      console.log('✅ Photo uploadée avec succès !');
      console.log('🔗 URL signée:', publicUrl);

      // Sauvegarder l'URL et rafraîchir le preview
      const finalKey = Date.now();
      setPhotoUrl(publicUrl);
      setPhotoKey(finalKey);
      
      console.log('🖼️ URL sauvegardée');
      
      Alert.alert(
        'Photo enregistrée',
        'Votre photo est maintenant visible. Enregistrez votre profil pour la sauvegarder.'
      );
    } catch (error: any) {
      console.error('❌ ERREUR UPLOAD:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'uploader la photo.');
      setPhotoUrl('');
      setPhotoKey(Date.now());
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (opts?: { skipSuccessAlert?: boolean; skipRefresh?: boolean }) => {
    const skipSuccessAlert = opts?.skipSuccessAlert === true;
    const skipRefresh = opts?.skipRefresh === true;
    
    // Validation
    if (!currentUserName?.trim()) {
      Alert.alert('Erreur', 'Votre nom est requis. Veuillez mettre à jour votre profil.');
      return;
    }
    if (!slug.trim()) {
      Alert.alert('Erreur', 'Le lien est obligatoire');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      Alert.alert('Erreur', 'Le lien doit contenir uniquement des lettres minuscules, chiffres et tirets');
      return;
    }
    console.log('📝 Slug:', slug.toLowerCase());
    console.log('📝 Display name:', currentUserName);
    console.log('🔓 Public:', isPublic);
    console.log('🖼️ Photo URL:', photoUrl || 'Pas de photo');

    try {
      setSaving(true);

      const seatsNum = vehicleSeats != null && vehicleSeats >= 2 && vehicleSeats <= 7 ? vehicleSeats : null;
      const profileData = {
        slug: slug.toLowerCase(),
        display_name: currentUserName,
        bio: bio || null,
        phone: (phone?.trim() || currentUserPhone || null) as string | null,
        whatsapp: null,
        email: currentUserEmail || null,
        zone_city: zoneCity || null,
        vehicle_brand: vehicleBrand || null,
        vehicle_model: vehicleModel || null,
        vehicle_year: vehicleYear ? parseInt(vehicleYear) : null,
        vehicle_seats: seatsNum,
        experience_years: experienceYears ? parseInt(experienceYears) : null,
        languages: languages.length > 0 ? languages : ['Français'],
        amenities: amenities,
        services: services,
        photo_url: photoUrl || null,
        is_public: isPublic,
      };

      console.log('☁️ Envoi vers Supabase...');
      
      // updateVTCProfile fait maintenant un UPSERT (crée ou met à jour automatiquement)
      const savedProfile = await apiClient.updateVTCProfile(profileData);
      
      console.log('✅ Profil sauvegardé avec succès !');
      console.log('🔗 URL du profil:', getVtcProfileUrl(slug));
      
      // Mettre à jour la photo du profil utilisateur uniquement hors wizard (évite loadVerificationStatus qui remonte l’arbre et réaffiche le Hub)
      if (photoUrl && !skipRefresh) {
        try {
          await apiClient.updateUserPhoto(photoUrl);
          console.log('✅ Photo utilisateur mise à jour');
          await loadVerificationStatus();
          console.log('✅ Profil utilisateur rechargé avec la nouvelle photo');
        } catch (photoError) {
          console.warn('⚠️ Erreur mise à jour photo utilisateur:', photoError);
        }
      }
      
      if (!skipSuccessAlert) {
        Alert.alert(
          'Succès',
          profile ? 'Profil mis à jour.' : 'Profil créé.',
          [{ text: 'OK' }]
        );
      }
      if (!skipRefresh) {
        await loadProfile(false);
      }
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      console.error('📍 Message:', error.message);
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!slug.trim()) {
      Alert.alert('Lien à partager', 'Enregistrez votre page (étape 1) pour obtenir votre lien. Vous pourrez le partager ensuite.');
      return;
    }

    const url = getVtcProfileUrl(slug);
    const message = `Réservez directement avec moi — mon profil chauffeur privé sur Corail : ${url}`;

    console.log('📤 Partage du profil:', url);

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleOpenLink = () => {
    if (!slug.trim()) {
      Alert.alert('Votre lien', 'Enregistrez votre page pour générer votre lien getcorail.com. Une seule configuration suffit.');
      return;
    }
    const url = getVtcProfileUrl(slug);
    console.log('🔗 Ouverture du profil VTC:', url);
    Linking.openURL(url);
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const statusLabel = pageProStatus === 'inactive' ? 'Non visible' : pageProStatus === 'incomplete' ? 'Visible' : 'Active';
  const statusText = pageProStatus === 'inactive'
    ? 'Rendez votre page visible pour partager votre lien et recevoir des réservations.'
    : pageProStatus === 'incomplete'
      ? 'Votre page est en ligne. Complétez les infos ci-dessous pour activer les réservations directes.'
      : 'Page visible et réservations directes actives.';

  // ─── HUB : ultra minimal, une carte statut, un CTA, perf si actif, deux liens secondaires
  if (mode === 'hub') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ma Page Pro</Text>
          <View style={styles.headerRight} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.hubScrollContent} showsVerticalScrollIndicator={false}>
          {/* Image stylée : aperçu type Page Pro / getcorail.com — remplacer PAGE_PRO_HERO_IMAGE_URL par votre capture d’écran */}
          <View style={styles.hubHeroWrap}>
            <ExpoImage
              source={{ uri: PAGE_PRO_HERO_IMAGE_URL }}
              style={styles.hubHeroImage}
              contentFit="cover"
            />
            <View style={styles.hubHeroOverlay} />
            <View style={styles.hubHeroBadge}>
              <Text style={styles.hubHeroBadgeText}>Votre page sur getcorail.com</Text>
            </View>
          </View>

          <Text style={styles.hubTagline}>
            Votre page de réservation directe — recevez des réservations sans intermédiaire.
          </Text>

          {/* Une seule carte : statut + complétion — premium, lisible sur fond sombre */}
          <View style={styles.hubStatusCard}>
            <View style={styles.hubStatusRow}>
              <View style={styles.hubStatusLeft}>
                <View style={[styles.hubStatusDot, pageProStatus === 'active' && styles.hubStatusDotActive, pageProStatus === 'incomplete' && styles.hubStatusDotIncomplete]} />
                <Text style={styles.hubStatusLabel}>{statusLabel}</Text>
              </View>
              <Text style={styles.hubCompletionPctBadge}>{completionPercentage} %</Text>
            </View>
            <Text style={styles.hubStatusHint}>{statusText}</Text>
            <View style={styles.hubCompletionRow}>
              <Text style={styles.hubCompletionLabel}>Complétion</Text>
              <View style={styles.hubCompletionBarBg}>
                <View style={[styles.hubCompletionBarFill, { width: `${Math.min(100, completionPercentage)}%` }]} />
              </View>
            </View>
            {completionPercentage < 100 && missingForActivation.length > 0 && (
              <View style={styles.hubMissingWrap}>
                <Text style={styles.hubMissingTitle}>Pour compléter votre page :</Text>
                {missingForActivation.map((item) => (
                  <Text key={item} style={styles.hubMissingItem}>• {item}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Consulter ma page — bien visible */}
          {slug.trim() && (
            <TouchableOpacity
              onPress={handleOpenLink}
              style={styles.hubConsulterCta}
              activeOpacity={0.85}
            >
              <Ionicons name="open-outline" size={22} color="#0ea5e9" />
              <Text style={styles.hubConsulterCtaText}>Consulter ma page</Text>
            </TouchableOpacity>
          )}

          {/* CTA principal : gérer / continuer */}
          <TouchableOpacity
            onPress={() => { setMode('wizard'); setCurrentStep(0); }}
            style={styles.hubCtaPrimary}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#0ea5e9', '#06b6d4']} style={styles.hubCtaPrimaryGradient}>
              <Text style={styles.hubCtaPrimaryText}>
                {pageProStatus === 'active' ? 'Gérer ma Page Pro' : 'Continuer la configuration'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Performance ce mois-ci — toujours affichée sur le Hub */}
          <View style={styles.hubPerfBlock}>
            <Text style={styles.hubPerfBlockTitle}>Performance ce mois-ci</Text>
            <View style={styles.hubPerfRow}>
              <View style={styles.hubPerfItem}>
                <Text style={styles.hubPerfValue}>{monthViews}</Text>
                <Text style={styles.hubPerfLabel}>Vues</Text>
              </View>
              <View style={styles.hubPerfItem}>
                <Text style={styles.hubPerfValue}>{monthBookings}</Text>
                <Text style={styles.hubPerfLabel}>Résa. directes</Text>
              </View>
              <View style={styles.hubPerfItem}>
                <Text style={styles.hubPerfValue}>{monthViews > 0 ? Math.round((monthBookings / monthViews) * 100) : 0} %</Text>
                <Text style={styles.hubPerfLabel}>Conversion</Text>
              </View>
            </View>
          </View>

          {/* Boutons secondaires */}
          {slug.trim() && (
            <View style={styles.hubSecondaryRow}>
              <TouchableOpacity style={styles.hubSecondaryBtn} onPress={() => { setShowShareModal(true); Analytics.trackPageProShared(); }} activeOpacity={0.7}>
                <Text style={styles.hubSecondaryBtnText}>Partager mon lien</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <Modal visible={showShareModal} transparent animationType="slide">
          <View style={styles.shareModalOverlay}>
            <View style={styles.shareModalContent}>
              <View style={styles.shareModalHeader}>
                <Text style={styles.shareModalTitle}>Partager mon lien</Text>
                <TouchableOpacity onPress={() => setShowShareModal(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              {slug.trim() ? (
                <>
                  <Text style={styles.shareModalLabel}>Lien</Text>
                  <View style={styles.shareModalLinkRow}>
                    <Text style={styles.shareModalLink} numberOfLines={1}>{getVtcProfileUrl(slug)}</Text>
                    <TouchableOpacity onPress={() => { Clipboard.setString(getVtcProfileUrl(slug)); Alert.alert('Copié', 'Lien copié dans le presse-papiers.'); }} style={styles.shareModalCopyBtn}>
                      <Ionicons name="copy-outline" size={18} color="#0ea5e9" />
                      <Text style={styles.shareModalCopyText}>Copier</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shareModalQRWrap}>
                    <QRCodeCard
                      userData={{ name: currentUserName || '', email: currentUserEmail || '' }}
                      qrValue={getVtcProfileUrl(slug)}
                      footerLabel="Scannez pour voir ma Page Pro"
                      size={160}
                    />
                  </View>
                  <Text style={styles.shareModalMicro}>Partagez ce lien à vos clients pour recevoir des réservations directement dans Corail.</Text>
                  <TouchableOpacity onPress={() => { handleShare(); setShowShareModal(false); }} style={styles.shareModalShareBtn}>
                    <Ionicons name="share-social" size={20} color="#fff" />
                    <Text style={styles.shareModalShareBtnText}>Partager</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.shareModalEmpty}>Enregistrez votre page pour obtenir votre lien à partager.</Text>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const STEP_TITLES: Record<StepIndex, string> = {
    0: 'Votre identité',
    1: 'Votre véhicule',
    2: 'Services proposés',
    3: 'Équipements à bord',
    4: 'Aperçu & Activation',
  };
  const STEP_SUBTITLES: Record<StepIndex, string> = {
    0: 'Ces informations apparaîtront sur votre page de réservation.',
    1: 'Précisez les caractéristiques de votre véhicule pour rassurer vos clients.',
    2: 'Indiquez les types de prestations que vous proposez.',
    3: 'Les équipements améliorent l\'expérience client et aident au choix.',
    4: 'Vérifiez puis activez votre page pour recevoir des réservations.',
  };

  // ─── WIZARD : parcours guidé, une barre, titre + sous-titre, mini aperçu en haut
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={async () => {
            try {
              await handleSave({ skipSuccessAlert: true, skipRefresh: true });
            } catch (_e) {}
            onBack();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ma Page Pro</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.wizardScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.wizardStepLabel}>Étape {currentStep + 1} sur 5</Text>
          <View style={styles.wizardProgressBar}>
            <View style={[styles.wizardProgressFill, { width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }]} />
          </View>

          {/* Mini aperçu — carte professionnelle en construction */}
          <View style={styles.wizardPreview}>
            <View style={styles.wizardPreviewPhotoWrap}>
              {photoUrl ? (
                <ExpoImage source={{ uri: photoUrl }} style={styles.wizardPreviewPhoto} contentFit="cover" />
              ) : (
                <View style={styles.wizardPreviewPhotoPlaceholder}>
                  <Ionicons name="person" size={32} color="#64748b" />
                </View>
              )}
            </View>
            <View style={styles.wizardPreviewText}>
              <Text style={styles.wizardPreviewName} numberOfLines={1}>{currentUserName || 'Votre nom'}</Text>
              <Text style={styles.wizardPreviewMeta} numberOfLines={1}>{zoneCity || 'Ville'} · {[vehicleBrand, vehicleModel].filter(Boolean).join(' ') || 'Véhicule'}</Text>
            </View>
          </View>

          <Text style={styles.wizardStepTitle}>{STEP_TITLES[currentStep]}</Text>
          <Text style={styles.wizardStepSubtitle}>{STEP_SUBTITLES[currentStep]}</Text>

          {/* Étape 0 : Informations — un seul niveau, pas de cartes imbriquées */}
          {currentStep === 0 && (
          <>
          <View style={styles.wizardBlock}>
            <View style={styles.photoContainer}>
              {/* Preview de la photo */}
              <View style={styles.photoWrapper}>
                {uploading ? (
                  // Pendant l'upload : spinner
                  <View style={styles.photoPlaceholder}>
                    <ActivityIndicator size="large" color="#0ea5e9" />
                    <Text style={styles.uploadingText}>Upload...</Text>
                  </View>
                ) : photoUrl ? (
                  // Après upload : preview avec expo-image
                  <ExpoImage
                    key={`photo-${photoKey}`}
                    source={{ uri: photoUrl }}
                    style={styles.photo}
                    contentFit="cover"
                    transition={300}
                    placeholder={require('../../assets/icon.png')}
                    onLoad={() => console.log('✅ Image chargée avec expo-image')}
                    onError={(error) => {
                      console.error('❌ Erreur expo-image:', error);
                      // Fallback vers l'icône de succès
                      setPhotoUrl('');
                    }}
                  />
                ) : (
                  // Pas de photo : placeholder
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person" size={48} color="#64748b" />
                  </View>
                )}
              </View>

              {/* Boutons d'action */}
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickImage}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  {uploading ? (
                    <>
                      <ActivityIndicator size="small" color="#0ea5e9" />
                      <Text style={styles.uploadButtonText}>Upload...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="camera" size={20} color="#0ea5e9" />
                      <Text style={styles.uploadButtonText}>
                        {photoUrl ? 'Changer' : 'Ajouter'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {photoUrl && !uploading && (
                  <Text style={styles.photoUploadedHint}>Visible sur votre page</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.wizardBlock}>
            <Text style={[styles.wizardFieldLabel, styles.wizardFieldLabelFirst]}>Nom</Text>
            <View style={[styles.wizardInput, styles.readonlyInput]}>
              <Text style={styles.readonlyText}>{currentUserName || 'Non défini'}</Text>
            </View>

            <Text style={styles.wizardFieldLabel}>Lien de votre page</Text>
            <View style={styles.slugContainer}>
              <Text style={styles.slugPrefix}>corail.app/vtc/</Text>
              <TextInput
                style={styles.slugInput}
                value={slug}
                onChangeText={(text) => setSlug(text.toLowerCase())}
                placeholder="jean-dupont"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.wizardFieldLabel}>Bio / Présentation</Text>
            <TextInput
              style={[styles.wizardInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Chauffeur privé professionnel à Toulouse..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.wizardFieldLabel}>Ville</Text>
            <TextInput
              style={styles.wizardInput}
              value={zoneCity}
              onChangeText={setZoneCity}
              placeholder="Toulouse"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.wizardFieldLabel}>Téléphone</Text>
            <View style={[styles.wizardInput, styles.readonlyInput]}>
              <Text style={styles.readonlyText}>{phone?.trim() || currentUserPhone || 'Non défini'}</Text>
            </View>

            <Text style={styles.wizardFieldLabel}>Email</Text>
            <View style={[styles.wizardInput, styles.readonlyInput]}>
              <Text style={styles.readonlyText}>{currentUserEmail || 'Non défini'}</Text>
            </View>
            <Text style={styles.wizardFieldHint}>Profil Corail</Text>
          </View>
          </>
          )}

          {/* Étape 1 : Véhicule — un bloc, pas de carte */}
          {currentStep === 1 && (
            <View style={styles.wizardBlock}>
              <Text style={[styles.wizardFieldLabel, styles.wizardFieldLabelFirst]}>Marque</Text>
              <TextInput
                style={styles.wizardInput}
                value={vehicleBrand}
                onChangeText={setVehicleBrand}
                placeholder="Mercedes, BMW, Tesla..."
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.wizardFieldLabel}>Modèle</Text>
              <TextInput
                style={styles.wizardInput}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="Classe E, Série 5, Model 3..."
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.wizardFieldLabel}>Année</Text>
              <TextInput
                style={styles.wizardInput}
                value={vehicleYear}
                onChangeText={setVehicleYear}
                placeholder="2022"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
              <Text style={styles.wizardFieldLabel}>Nombre de places</Text>
              <View style={styles.seatSegmentedWrap}>
                {SEAT_OPTIONS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setVehicleSeats(n)}
                    style={[styles.seatSegmentedItem, vehicleSeats === n && styles.seatSegmentedItemActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.seatSegmentedText, vehicleSeats === n && styles.seatSegmentedTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.seatMicroText}>Filtre les demandes compatibles.</Text>
            </View>
          )}

          {/* Étape 2 : Services — tags directement, pas de carte */}
          {currentStep === 2 && (
            <View style={styles.wizardBlock}>
              <MultiSelectInput
                label="Langues parlées"
                selectedItems={languages}
                predefinedOptions={PREDEFINED_LANGUAGES}
                onItemsChange={setLanguages}
                placeholder="Ajouter une langue"
                accentColor="#0ea5e9"
              />
              <MultiSelectInput
                label="Services proposés"
                selectedItems={services}
                predefinedOptions={PREDEFINED_SERVICES}
                onItemsChange={setServices}
                placeholder="Ajouter un service"
                accentColor="#0ea5e9"
              />
            </View>
          )}

          {/* Étape 3 : Équipements — un bloc */}
          {currentStep === 3 && (
            <View style={styles.wizardBlock}>
              <MultiSelectInput
                label="Équipements à bord"
                selectedItems={amenities}
                predefinedOptions={PREDEFINED_AMENITIES}
                onItemsChange={setAmenities}
                placeholder="Ajouter un équipement"
                accentColor="#0ea5e9"
              />
            </View>
          )}

          {/* Étape 4 : Aperçu & Activation — épuré, pas de grosses cartes */}
          {currentStep === 4 && (
          <>
            <View style={styles.wizardBlock}>
              {slug.trim() && (
                <TouchableOpacity onPress={() => Linking.openURL(getVtcProfileUrl(slug))} style={styles.apercuConsulterBtn} activeOpacity={0.8}>
                  <Ionicons name="open-outline" size={20} color="#fff" />
                  <Text style={styles.apercuConsulterBtnText}>Consulter mon profil</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.previewLabel}>Lien</Text>
              <Text style={styles.previewValue}>{slug.trim() || '—'}</Text>
              <Text style={styles.previewLabel}>Présentation</Text>
              <Text style={styles.previewValue}>{bio.trim() || '—'}</Text>
              <Text style={styles.previewLabel}>Ville · Contact</Text>
              <Text style={styles.previewValue}>{zoneCity.trim() || '—'} · {phone.trim() || '—'}</Text>
              <Text style={styles.previewLabel}>Véhicule</Text>
              <Text style={styles.previewValue}>{[vehicleBrand, vehicleModel, vehicleYear, vehicleSeats != null ? `${vehicleSeats} pl.` : ''].filter(Boolean).join(' ') || '—'}</Text>
              <Text style={styles.previewLabel}>Services · Langues</Text>
              <Text style={styles.previewValue}>{(services.length ? services.join(', ') : '—') + (languages.length ? ' · ' + languages.join(', ') : '')}</Text>
            </View>

            <View style={styles.wizardBlock}>
              {!isPublic && !eligibleForActivation && missingForActivation.length > 0 && (
                <View style={styles.missingList}>
                  <Text style={styles.missingListTitle}>Pour activer les réservations directes, ajoutez :</Text>
                  {missingForActivation.map((item) => (
                    <Text key={item} style={styles.missingListItem}>• {item}</Text>
                  ))}
                </View>
              )}
              {!isPublic && (
                <TouchableOpacity
                  onPress={async () => {
                    setIsPublic(true);
                    try {
                      setSaving(true);
                      await apiClient.updateVTCProfile({
                        slug: slug.toLowerCase(),
                        display_name: currentUserName,
                        bio: bio || null,
                        phone: phone || null,
                        email: currentUserEmail || null,
                        zone_city: zoneCity || null,
                        vehicle_brand: vehicleBrand || null,
                        vehicle_model: vehicleModel || null,
                        vehicle_year: vehicleYear ? parseInt(vehicleYear) : null,
                        vehicle_seats: vehicleSeats,
                        experience_years: experienceYears ? parseInt(experienceYears) : null,
                        languages: languages.length > 0 ? languages : ['Français'],
                        amenities,
                        services,
                        photo_url: photoUrl || null,
                        is_public: true,
                      });
                      Analytics.trackPageProActivated();
                      await loadProfile(false);
                      Alert.alert(
                        'Page visible',
                        eligibleForActivation
                          ? 'Votre Page Pro est en ligne. Les réservations directes sont activées.'
                          : 'Votre page est en ligne. Complétez les infos pour activer les réservations directes.'
                      );
                    } catch (e: any) {
                      Alert.alert('Erreur', e.message || 'Impossible de rendre la page visible.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || !slug?.trim()}
                  style={[styles.activateCta, !slug?.trim() && styles.activateCtaDisabled]}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.activateCtaGradient}>
                    <Text style={styles.activateCtaText}>
                      {eligibleForActivation ? 'Activer ma Page Pro' : 'Rendre ma page visible'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {!isPublic && !slug?.trim() && (
                <Text style={styles.activateHint}>Choisissez un lien pour votre page (étape 1) pour la rendre visible.</Text>
              )}
              {isPublic && (
                <>
                  <View style={styles.statusBadgeActive}>
                    <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                    <Text style={styles.statusBadgeText}>Page active</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Alert.alert(
                      'Désactiver les réservations directes',
                      'Votre page ne sera plus visible. Vous pourrez réactiver à tout moment.',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Désactiver', style: 'destructive', onPress: async () => {
                          setIsPublic(false);
                          try {
                            const seatsNum = vehicleSeats != null && vehicleSeats >= 2 && vehicleSeats <= 7 ? vehicleSeats : null;
                            await apiClient.updateVTCProfile({
                              slug: slug.toLowerCase(),
                              display_name: currentUserName,
                              bio: bio || null,
                              phone: phone || null,
                              email: currentUserEmail || null,
                              zone_city: zoneCity || null,
                              vehicle_brand: vehicleBrand || null,
                              vehicle_model: vehicleModel || null,
                              vehicle_year: vehicleYear ? parseInt(vehicleYear) : null,
                              vehicle_seats: seatsNum,
                              experience_years: experienceYears ? parseInt(experienceYears) : null,
                              languages: languages.length > 0 ? languages : ['Français'],
                              amenities,
                              services,
                              photo_url: photoUrl || null,
                              is_public: false,
                            });
                            await loadProfile(false);
                          } catch (_e) {}
                        }},
                      ]
                    )}
                    style={styles.deactivateLink}
                  >
                    <Text style={styles.deactivateLinkText}>Désactiver les réservations directes</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {isPublic && slug.trim() && (
              <View style={styles.wizardBlock}>
                <View style={styles.step5ShareRow}>
                  <Text style={styles.shareModalLink} numberOfLines={1}>{getVtcProfileUrl(slug)}</Text>
                  <TouchableOpacity onPress={() => { Clipboard.setString(getVtcProfileUrl(slug)); Alert.alert('Copié', 'Lien copié.'); }} style={styles.shareModalCopyBtn}>
                    <Ionicons name="copy-outline" size={18} color="#0ea5e9" />
                    <Text style={styles.shareModalCopyText}>Copier</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.step5QRWrap}>
                  <QRCodeCard userData={{ name: currentUserName || '', email: currentUserEmail || '' }} qrValue={getVtcProfileUrl(slug)} footerLabel="Scannez pour ma Page Pro" size={120} />
                </View>
                <TouchableOpacity onPress={() => { handleShare(); Analytics.trackPageProShared(); }} style={styles.step5ShareBtn}>
                  <Ionicons name="share-social" size={18} color="#fff" />
                  <Text style={styles.step5ShareBtnText}>Partager</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.performanceCard}>
              <Text style={styles.performanceTitle}>Performance ce mois-ci</Text>
              <View style={styles.performanceRow}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>{monthViews}</Text>
                  <Text style={styles.performanceLabel}>Vues</Text>
                </View>
                <View style={styles.performanceDivider} />
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>{monthBookings}</Text>
                  <Text style={styles.performanceLabel}>Résa. directes</Text>
                </View>
                <View style={styles.performanceDivider} />
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>{monthViews > 0 ? Math.round((monthBookings / monthViews) * 100) : 0} %</Text>
                  <Text style={styles.performanceLabel}>Conversion</Text>
                </View>
              </View>
            </View>
          </>
          )}

          {/* Pied du wizard : Retour + Continuer, puis Ignorer (pas de Voir/Partager ici) */}
          <View style={styles.wizardFooter}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await handleSave({ skipSuccessAlert: true, skipRefresh: true });
                } catch (_e) {}
                if (currentStep === 0) setMode('hub'); else setCurrentStep((currentStep - 1) as StepIndex);
              }}
              style={styles.wizardFooterBack}
              activeOpacity={0.7}
            >
              <Text style={styles.wizardFooterBackText}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                const stepAtTap = currentStepRef.current;
                // 1) D’abord mettre à jour l’étape (synchrone) pour ne jamais revenir au Hub à cause de l’async
                if (stepAtTap < 4) {
                  setCurrentStep((stepAtTap + 1) as StepIndex);
                }
                try {
                  await handleSave({ skipSuccessAlert: true, skipRefresh: stepAtTap < 4 });
                  if (stepAtTap === 4) {
                    await loadProfile(false);
                    onBack();
                  }
                } catch (_e) {}
                Analytics.trackPageProStepCompleted({ step: stepAtTap + 1, stepName: WIZARD_STEPS[stepAtTap] });
              }}
              disabled={saving}
              activeOpacity={0.8}
              style={styles.wizardFooterPrimaryWrap}
            >
              <LinearGradient colors={['#0ea5e9', '#06b6d4']} style={styles.wizardFooterPrimary}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.wizardFooterPrimaryText}>{currentStep === 4 ? 'Terminer' : 'Continuer'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {currentStep < 4 && (
            <TouchableOpacity onPress={() => setCurrentStep((currentStep + 1) as StepIndex)} style={styles.ignoreLink}>
              <Text style={styles.ignoreLinkText}>Ignorer pour l'instant</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showShareModal} transparent animationType="slide">
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Partager mon lien</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {slug.trim() ? (
              <>
                <TouchableOpacity onPress={() => { Linking.openURL(getVtcProfileUrl(slug)); setShowShareModal(false); }} style={styles.shareModalConsulterBtn} activeOpacity={0.8}>
                  <Ionicons name="open-outline" size={20} color="#fff" />
                  <Text style={styles.shareModalConsulterBtnText}>Consulter ma Page Pro</Text>
                </TouchableOpacity>
                <Text style={styles.shareModalLabel}>Lien</Text>
                <View style={styles.shareModalLinkRow}>
                  <Text style={styles.shareModalLink} numberOfLines={1}>{getVtcProfileUrl(slug)}</Text>
                  <TouchableOpacity onPress={() => { Clipboard.setString(getVtcProfileUrl(slug)); Alert.alert('Copié', 'Lien copié dans le presse-papiers.'); }} style={styles.shareModalCopyBtn}>
                    <Ionicons name="copy-outline" size={18} color="#0ea5e9" />
                    <Text style={styles.shareModalCopyText}>Copier</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.shareModalQRWrap}>
                  <QRCodeCard userData={{ name: currentUserName || '', email: currentUserEmail || '' }} qrValue={getVtcProfileUrl(slug)} footerLabel="Scannez pour voir ma Page Pro" size={160} />
                </View>
                <Text style={styles.shareModalMicro}>Partagez ce lien à vos clients pour recevoir des réservations directement dans Corail.</Text>
                <TouchableOpacity onPress={() => { handleShare(); setShowShareModal(false); }} style={styles.shareModalShareBtn}>
                  <Ionicons name="share-social" size={20} color="#fff" />
                  <Text style={styles.shareModalShareBtnText}>Partager</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.shareModalEmpty}>Enregistrez votre page pour obtenir votre lien à partager.</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 10,
    elevation: 10,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  hubScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  hubHeroWrap: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  hubHeroImage: {
    width: '100%',
    height: '100%',
  },
  hubHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  hubHeroBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubHeroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.3,
  },
  hubTagline: {
    fontSize: 15,
    lineHeight: 22,
    color: '#94a3b8',
    marginBottom: 28,
    paddingHorizontal: 2,
    letterSpacing: 0.1,
  },
  hubStatusCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    overflow: 'hidden',
  },
  hubStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hubStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hubStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64748b',
  },
  hubStatusDotActive: {
    backgroundColor: '#22c55e',
  },
  hubStatusDotIncomplete: {
    backgroundColor: '#f59e0b',
  },
  hubStatusLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  hubCompletionPctBadge: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  hubStatusHint: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
    marginBottom: 16,
    paddingLeft: 22,
  },
  hubCompletionRow: {
    marginTop: 0,
  },
  hubCompletionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  hubCompletionPct: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  hubCompletionBarBg: {
    height: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hubCompletionBarFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 3,
  },
  hubMissingWrap: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(71, 85, 105, 0.4)',
  },
  hubMissingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  hubMissingItem: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
    marginLeft: 4,
  },
  hubConsulterCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  hubConsulterCtaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  hubCtaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  hubCtaPrimaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  hubCtaPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  hubPerfBlock: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  hubPerfBlockTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  hubPerfRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hubPerfItem: {
    flex: 1,
    alignItems: 'center',
  },
  hubPerfValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  hubPerfLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  hubSecondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
    justifyContent: 'center',
  },
  hubSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  hubSecondaryBtnText: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '600',
  },
  wizardScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  wizardStepLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  wizardProgressBar: {
    height: 3,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 2,
    marginBottom: 28,
    overflow: 'hidden',
  },
  wizardProgressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
  },
  wizardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.25)',
    gap: 16,
  },
  wizardPreviewPhotoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
  },
  wizardPreviewPhoto: {
    width: '100%',
    height: '100%',
  },
  wizardPreviewPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardPreviewText: {
    flex: 1,
  },
  wizardPreviewName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  wizardPreviewMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  wizardStepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  wizardStepSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 28,
  },
  wizardBlock: {
    marginBottom: 32,
  },
  wizardFieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 14,
  },
  wizardFieldLabelFirst: {
    marginTop: 0,
  },
  wizardFieldHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  wizardInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#f8fafc',
  },
  wizardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
  },
  wizardFooterBack: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  wizardFooterBackText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  wizardFooterPrimaryWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  wizardFooterPrimary: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardFooterPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  seatSegmentedWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    marginBottom: 4,
  },
  seatSegmentedItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  seatSegmentedItemActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  seatSegmentedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  seatSegmentedTextActive: {
    color: '#38bdf8',
  },
  seatMicroText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 16,
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
  introBlock: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  introBlockText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  stepChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepChipActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#0ea5e9',
  },
  stepChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  stepChipTextActive: {
    color: '#38bdf8',
  },
  stepProgressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
  },
  completionCard: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  completionRow: {
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  completionBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionBarFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 4,
  },
  completionMessage: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  performanceCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 18,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.35)',
  },
  performanceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  performanceLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  performanceConversionHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  performanceDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#334155',
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
  },
  step5ShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  step5QRWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  step5ShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 12,
  },
  step5ShareBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  apercuConsulterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  apercuConsulterBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  hubCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hubCardActive: {
    borderColor: 'rgba(34, 197, 94, 0.5)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  hubCardIncomplete: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  hubCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#64748b',
  },
  statusDotActive: {
    backgroundColor: '#22c55e',
  },
  statusDotIncomplete: {
    backgroundColor: '#f59e0b',
  },
  hubCardTextBlock: {
    flex: 1,
  },
  hubCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  hubCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  hubCardSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  hubCtaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 6,
  },
  hubCtaSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  shareModalConsulterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  shareModalConsulterBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  shareModalLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  shareModalLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  shareModalLink: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
  },
  shareModalCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  shareModalCopyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  shareModalQRWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  shareModalMicro: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  shareModalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareModalShareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  shareModalEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  wizardStepIndicator: {
    marginBottom: 8,
  },
  wizardStepIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  wizardNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  wizardNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wizardNavBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  ignoreLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 12,
  },
  ignoreLinkText: {
    fontSize: 12,
    color: '#64748b',
  },
  seatPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  seatChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  seatChipActive: {
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  seatChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  seatChipTextActive: {
    color: '#38bdf8',
  },
  missingList: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  missingListTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fca5a5',
    marginBottom: 8,
  },
  missingListItem: {
    fontSize: 12,
    color: '#fecaca',
    marginBottom: 2,
  },
  activateCta: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  activateCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  activateCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  activateCtaDisabled: {
    opacity: 0.6,
  },
  activateHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    marginHorizontal: 4,
  },
  deactivateLink: {
    marginTop: 12,
    paddingVertical: 8,
  },
  deactivateLinkText: {
    fontSize: 13,
    color: '#f87171',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
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
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 14,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#f8fafc',
  },
  readonlyInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#334155',
    justifyContent: 'center',
  },
  readonlyText: {
    fontSize: 15,
    color: '#94a3b8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  slugContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    paddingLeft: 14,
  },
  slugPrefix: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  slugInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#f8fafc',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadingText: {
    color: '#0ea5e9',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  photoActions: {
    flex: 1,
  },
  photoUploadedHint: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  toggleHint: {
    fontSize: 13,
    color: '#64748b',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#0ea5e9',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  analyticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  analyticsText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  analyticsCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  actions: {
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 18,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0ea5e9',
  },
});

