/**
 * ProfileTab - Onglet Profil complet
 * Assemble tous les sous-composants du profil
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import ProfileHeader from './ProfileHeader';
import ProfileGroupsSection from './ProfileGroupsSection';
import ProfileBadgesSection from './ProfileBadgesSection';
import ProfileMenuList from './ProfileMenuList';
import BetaContactBanner from './BetaContactBanner';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { apiClient } from '../services/api';

interface User {
  id: string;
  uid?: string;
  email?: string;
  displayName?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at?: string;
}

interface Group {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  memberCount?: number;
}

interface Ride {
  id: string;
  picker_id?: string | null;
  creator_id?: string;
  status: string;
  [key: string]: any;
}

interface ProfileTabProps {
  verificationStatus: string | null;
  onRefreshVerification: () => Promise<void>;
  user: User | null;
  userFullName: string;
  userPhotoUrl?: string;
  userCredits: number;
  userBadges: Badge[];
  userGroups: Group[];
  rides: Ride[];
  personalRides?: any[];
  isAdmin: boolean;
  formatName: (name: string) => string;
  onShowPersonalInfo: () => void;
  onShowNotifications: () => void;
  onShowHelpSupport: () => void;
  onShowBadges: () => void;
  onShowGroups: () => void;
  onShowGroupInvitations: () => void;
  onShowAdminPanel: () => void;
  onShowPrivacyPolicy: () => void;
  onShowTermsOfService: () => void;
  onShowLegalNotice: () => void;
  onShowPrivacyData: () => void;
  onSelectGroup: (group: Group) => void;
  onSignOut: () => Promise<void>;
}

export default function ProfileTab({
  verificationStatus,
  onRefreshVerification,
  user,
  userFullName,
  userPhotoUrl,
  userCredits,
  userBadges,
  userGroups,
  rides,
  personalRides = [],
  isAdmin,
  formatName,
  onShowPersonalInfo,
  onShowNotifications,
  onShowHelpSupport,
  onShowBadges,
  onShowGroups,
  onShowGroupInvitations,
  onShowAdminPanel,
  onShowPrivacyPolicy,
  onShowTermsOfService,
  onShowLegalNotice,
  onShowPrivacyData,
  onSelectGroup,
  onSignOut,
}: ProfileTabProps) {
  // Générer les initiales depuis le nom réel
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = formatName(userFullName) || user?.email?.split('@')[0] || 'Utilisateur';
  const displayEmail = user?.email || 'email@example.com';
  const initials = getInitials(userFullName || displayName);

  // Stats
  const badgesCount = userBadges?.length || 0;
  
  // Compter toutes les courses terminées (marketplace + personnelles)
  // Marketplace : compter les courses créées OU prises par l'utilisateur et complétées
  const marketplaceCompleted = (rides || []).filter(
    r => (r.picker_id === user?.id || r.creator_id === user?.id) && r.status === 'COMPLETED'
  ).length;
  
  // Personnelles : compter les courses complétées
  const personalCompleted = (personalRides || []).filter(
    r => r.status === 'COMPLETED'
  ).length;
  
  const completedRidesCount = marketplaceCompleted + personalCompleted;

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  /**
   * Changement de photo - réutilise la même logique que VTCPublicProfileScreen
   */
  const handleChangePhoto = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
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
        mediaTypes: ['images'],
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

  /**
   * Upload de la photo vers Supabase Storage
   * Même logique que VTCPublicProfileScreen
   */
  const uploadPhoto = async (uri: string) => {
    console.log('📸 Début upload, URI locale:', uri);
    
    try {
      setUploadingPhoto(true);

      if (!user?.id) {
        throw new Error('Vous devez être connecté pour uploader une photo');
      }

      console.log('👤 User ID:', user.id);
      console.log('⏳ Upload en cours...');

      // Lire l'image en base64 avec expo-file-system
      console.log('📦 Lecture du fichier en base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      console.log('✅ Base64 lu:', base64.length, 'caractères');

      // Nom du fichier : {user_id}/profile-timestamp.jpg
      const timestamp = Date.now();
      const fileName = `${user.id}/profile-${timestamp}.jpg`;

      console.log('☁️ Upload vers Supabase:', fileName);
      console.log('📁 Chemin complet: vtc-profiles/' + fileName);

      // Décoder le base64 pour l'upload (Supabase attend un Uint8Array)
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

      // Upload vers Supabase Storage (même bucket que VTCPublicProfile)
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
        .createSignedUrl(fileName, 315360000);

      if (signError || !signedData) {
        console.error('❌ Erreur génération URL signée:', signError);
        throw new Error('Impossible de générer l\'URL de la photo');
      }

      const publicUrl = signedData.signedUrl;
      console.log('✅ Photo uploadée avec succès !');
      console.log('🔗 URL signée:', publicUrl);

      // Mettre à jour la photo dans le profil utilisateur
      await apiClient.updateUserPhoto(publicUrl);
      console.log('✅ Photo utilisateur mise à jour');

      Alert.alert(
        '✅ Photo mise à jour !', 
        'Votre photo de profil a été changée avec succès.'
      );

      // Recharger le profil pour afficher la nouvelle photo
      await onRefreshVerification();
      console.log('✅ Profil rechargé avec la nouvelle photo');
      
    } catch (error: any) {
      console.error('❌ ERREUR UPLOAD:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'uploader la photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader
        displayName={displayName}
        displayEmail={displayEmail}
        initials={initials}
        photoUrl={userPhotoUrl}
        userCredits={userCredits}
        badgesCount={badgesCount}
        completedRidesCount={completedRidesCount}
        onChangePhoto={handleChangePhoto}
      />
      
      {/* Indicateur de chargement pendant l'upload */}
      {uploadingPhoto && (
        <View style={{ padding: 10, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#ff6b47" />
        </View>
      )}

      {/* Bannière Contact Beta - Visible et accessible */}
      <BetaContactBanner />

      <ProfileGroupsSection
        userGroups={userGroups || []}
        onShowGroups={onShowGroups}
        onSelectGroup={(group) => {
          onSelectGroup(group);
          onShowGroups();
        }}
      />

      <ProfileBadgesSection
        userBadges={userBadges || []}
        onShowBadges={onShowBadges}
      />

      <ProfileMenuList
        isAdmin={isAdmin}
        userEmail={displayEmail}
        onShowAdminPanel={onShowAdminPanel}
        onShowPersonalInfo={onShowPersonalInfo}
        onShowGroups={onShowGroups}
        onShowGroupInvitations={onShowGroupInvitations}
        onShowNotifications={onShowNotifications}
        onShowHelpSupport={onShowHelpSupport}
        onShowPrivacyPolicy={onShowPrivacyPolicy}
        onShowTermsOfService={onShowTermsOfService}
        onShowLegalNotice={onShowLegalNotice}
        onShowPrivacyData={onShowPrivacyData}
        onSignOut={onSignOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 100,
  },
});
