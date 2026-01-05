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
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import MultiSelectInput from '../components/MultiSelectInput';

// URL de production pour les profils VTC
const VTC_BASE_URL = 'https://corail-quotes-web.vercel.app';

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
}

export const VTCPublicProfileScreen: React.FC<VTCPublicProfileScreenProps> = ({ 
  onBack, 
  currentUserId,
  currentUserEmail,
  currentUserName,
  currentUserPhone,
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
  const [photoKey, setPhotoKey] = useState(Date.now()); // Pour forcer le refresh de l'image
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      if (!currentUserId) {
        console.warn('⚠️ Utilisateur non connecté, impossible de charger le profil');
        setLoading(false);
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
        setExperienceYears(data.experience_years?.toString() || '');
        setLanguages(data.languages || ['Français']);
        setAmenities(data.amenities || []);
        setServices(data.services || []);
        setPhotoUrl(data.photo_url || '');
        setIsPublic(data.is_public);
      } else {
        console.log('ℹ️ Pas de profil VTC, pré-remplissage avec les données utilisateur');
        // Pré-remplir avec les données du user
        setPhone(currentUserPhone || '');
        // Générer un slug par défaut à partir du nom
        const defaultSlug = generateSlug(currentUserName || '');
        setSlug(defaultSlug);
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
    } finally {
      setLoading(false);
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
        '✅ Photo uploadée !', 
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

  const handleSave = async () => {
    console.log('💾 Début sauvegarde du profil VTC...');
    
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

    console.log('✅ Validation OK');
    console.log('📝 Slug:', slug.toLowerCase());
    console.log('📝 Display name:', currentUserName);
    console.log('🔓 Public:', isPublic);
    console.log('🖼️ Photo URL:', photoUrl || 'Pas de photo');

    try {
      setSaving(true);

      const profileData = {
        slug: slug.toLowerCase(),
        display_name: currentUserName,
        bio: bio || null,
        phone: phone || null,
        whatsapp: null, // Plus utilisé
        email: currentUserEmail || null,
        zone_city: zoneCity || null,
        vehicle_brand: vehicleBrand || null,
        vehicle_model: vehicleModel || null,
        vehicle_year: vehicleYear ? parseInt(vehicleYear) : null,
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
      console.log('🔗 URL du profil:', `${VTC_BASE_URL}/vtc/${slug.toLowerCase()}`);
      
      // Mettre à jour aussi la photo dans le profil utilisateur (si photo présente)
      if (photoUrl) {
        try {
          await apiClient.updateUserPhoto(photoUrl);
          console.log('✅ Photo utilisateur mise à jour');
          
          // Recharger le profil utilisateur pour que la photo apparaisse immédiatement
          await loadVerificationStatus();
          console.log('✅ Profil utilisateur rechargé avec la nouvelle photo');
        } catch (photoError) {
          console.warn('⚠️ Erreur mise à jour photo utilisateur:', photoError);
          // Non bloquant, on continue quand même
        }
      }
      
      Alert.alert(
        '✅ Succès', 
        profile ? 'Profil mis à jour !' : 'Profil créé !',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('💡 Le profil est accessible sur:', `${VTC_BASE_URL}/vtc/${slug.toLowerCase()}`);
            }
          }
        ]
      );
      
      await loadProfile();
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
      Alert.alert('Info', 'Créez d\'abord votre profil pour le partager');
      return;
    }

    const url = `${VTC_BASE_URL}/vtc/${slug.toLowerCase()}`;
    const message = `Découvrez mon profil VTC sur Corail :\n${url}`;

    console.log('📤 Partage du profil:', url);

    try {
      await Share.share({
        message,
        url, // iOS
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleOpenLink = () => {
    if (!slug.trim()) {
      Alert.alert('Info', 'Créez d\'abord votre profil');
      return;
    }
    const url = `${VTC_BASE_URL}/vtc/${slug.toLowerCase()}`;
    console.log('🔗 Ouverture du profil VTC:', url);
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ma Page Publique</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Intro */}
          <View style={styles.intro}>
            <Ionicons name="globe-outline" size={32} color="#6366f1" />
            <Text style={styles.introText}>
              Créez votre profil VTC public pour attirer de nouveaux clients
            </Text>
          </View>

          {/* Photo de profil */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo de profil</Text>
            <Text style={styles.hint}>
              Apparaîtra sur votre page publique (corail.app/vtc/votre-slug)
            </Text>

            <View style={styles.photoContainer}>
              {/* Preview de la photo */}
              <View style={styles.photoWrapper}>
                {uploading ? (
                  // Pendant l'upload : spinner
                  <View style={styles.photoPlaceholder}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.uploadingText}>Upload...</Text>
                  </View>
                ) : photoUrl ? (
                  // Après upload : preview avec expo-image
                  <Image
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
                      <ActivityIndicator size="small" color="#a5b4fc" />
                      <Text style={styles.uploadButtonText}>Upload...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="camera" size={20} color="#a5b4fc" />
                      <Text style={styles.uploadButtonText}>
                        {photoUrl ? 'Changer' : 'Ajouter'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {photoUrl && !uploading && (
                  <Text style={styles.photoUploadedHint}>
                    Photo uploadée ! Visible sur votre page publique.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Informations de base */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de base</Text>

            <Text style={styles.label}>Nom</Text>
            <View style={[styles.input, styles.readonlyInput]}>
              <Text style={styles.readonlyText}>{currentUserName || 'Non défini'}</Text>
            </View>
            <Text style={styles.hint}>Configuré dans votre profil</Text>

            <Text style={styles.label}>Lien de votre page *</Text>
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
            <Text style={styles.hint}>Votre lien personnalisé (lettres, chiffres et tirets)</Text>

            <Text style={styles.label}>Bio / Présentation</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Chauffeur VTC professionnel à Toulouse..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              value={zoneCity}
              onChangeText={setZoneCity}
              placeholder="Toulouse"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>

            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+33612345678"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.readonlyInput]}>
              <Text style={styles.readonlyText}>{currentUserEmail || 'Non défini'}</Text>
            </View>
            <Text style={styles.hint}>Configuré dans votre profil</Text>
          </View>

          {/* Véhicule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Véhicule</Text>

            <Text style={styles.label}>Marque</Text>
            <TextInput
              style={styles.input}
              value={vehicleBrand}
              onChangeText={setVehicleBrand}
              placeholder="Mercedes, BMW, Tesla..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Modèle</Text>
            <TextInput
              style={styles.input}
              value={vehicleModel}
              onChangeText={setVehicleModel}
              placeholder="Classe E, Série 5, Model 3..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Année</Text>
            <TextInput
              style={styles.input}
              value={vehicleYear}
              onChangeText={setVehicleYear}
              placeholder="2022"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
            />
          </View>

          {/* Expérience & Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expérience & Services</Text>

            <Text style={styles.label}>Années d'expérience</Text>
            <TextInput
              style={styles.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="10"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
            />

            <MultiSelectInput
              label="Langues parlées"
              selectedItems={languages}
              predefinedOptions={PREDEFINED_LANGUAGES}
              onItemsChange={setLanguages}
              placeholder="Ajouter une langue"
            />

            <MultiSelectInput
              label="Services proposés"
              selectedItems={services}
              predefinedOptions={PREDEFINED_SERVICES}
              onItemsChange={setServices}
              placeholder="Ajouter un service"
            />

            <MultiSelectInput
              label="Équipements"
              selectedItems={amenities}
              predefinedOptions={PREDEFINED_AMENITIES}
              onItemsChange={setAmenities}
              placeholder="Ajouter un équipement"
            />
          </View>

          {/* Visibilité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visibilité</Text>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsPublic(!isPublic)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Profil public</Text>
                <Text style={styles.toggleHint}>
                  {isPublic ? 'Visible par tous' : 'Privé'}
                </Text>
              </View>
              <View style={[styles.toggle, isPublic && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Analytics */}
          {profile && (
            <View style={styles.analyticsCard}>
              <Ionicons name="stats-chart" size={20} color="#6366f1" />
              <Text style={styles.analyticsText}>
                <Text style={styles.analyticsCount}>{profile.view_count}</Text> vues
              </Text>
            </View>
          )}

          {/* Boutons d'action */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366f1', '#4f46e5']}
                style={styles.saveButton}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      {profile ? 'Mettre à jour' : 'Créer mon profil'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {slug.trim() && (
              <>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleOpenLink}
                  activeOpacity={0.7}
                >
                  <Ionicons name="open-outline" size={18} color="#6366f1" />
                  <Text style={styles.secondaryButtonText}>Voir mon profil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleShare}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-social" size={18} color="#6366f1" />
                  <Text style={styles.secondaryButtonText}>Partager</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#fff',
  },
  readonlyInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingLeft: 12,
  },
  slugPrefix: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  slugInput: {
    flex: 1,
    padding: 12,
    paddingLeft: 8,
    fontSize: 15,
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadingText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  photoActions: {
    flex: 1,
  },
  photoUploadedHint: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#a5b4fc',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  toggleHint: {
    fontSize: 13,
    color: '#94a3b8',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#6366f1',
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
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  analyticsText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  analyticsCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a5b4fc',
  },
  actions: {
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a5b4fc',
  },
});

