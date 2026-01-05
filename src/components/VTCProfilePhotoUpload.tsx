import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface VTCProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  userId: string;
  onPhotoUploaded: (url: string) => void;
}

export const VTCProfilePhotoUpload: React.FC<VTCProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  userId,
  onPhotoUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);

  // Synchroniser avec le prop
  useEffect(() => {
    console.log('🔄 Photo URL mise à jour depuis le parent:', currentPhotoUrl);
    setPhotoUrl(currentPhotoUrl || null);
  }, [currentPhotoUrl]);

  // Demander les permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin de la permission pour accéder à vos photos.'
      );
      return false;
    }
    return true;
  };

  // Sélectionner et uploader la photo
  const handlePickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // Upload vers Supabase Storage
  const uploadPhoto = async (uri: string) => {
    try {
      setUploading(true);

      // Convertir l'image en blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Nom du fichier : {user_id}/profile.jpg
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/profile.${fileExt}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('vtc-profiles')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true, // Remplace si existe déjà
        });

      if (error) throw error;

      // Générer l'URL publique avec cache buster
      const { data: publicData } = supabase.storage
        .from('vtc-profiles')
        .getPublicUrl(fileName);

      // Ajouter un timestamp pour forcer le rechargement de l'image
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      // Mettre à jour la table vtc_profiles
      const { error: updateError } = await supabase
        .from('vtc_profiles')
        .update({ photo_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Succès !
      console.log('✅ Photo URL mise à jour:', publicUrl);
      setPhotoUrl(publicUrl);
      onPhotoUploaded(publicUrl);
      Alert.alert('✅ Succès', 'Photo de profil mise à jour !');
    } catch (error: any) {
      console.error('❌ Erreur upload:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'uploader la photo.');
    } finally {
      setUploading(false);
    }
  };

  // Supprimer la photo
  const handleDeletePhoto = async () => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);

              // Supprimer de Supabase Storage
              await supabase.storage
                .from('vtc-profiles')
                .remove([`${userId}/profile.jpg`, `${userId}/profile.png`]);

              // Mettre à jour la table
              await supabase
                .from('vtc_profiles')
                .update({ photo_url: null })
                .eq('user_id', userId);

              setPhotoUrl(null);
              onPhotoUploaded('');
              Alert.alert('✅ Supprimée', 'Photo de profil supprimée.');
            } catch (error) {
              console.error('❌ Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la photo.');
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photo de profil</Text>
      <Text style={styles.hint}>
        Apparaîtra sur votre page publique (corail.app/vtc/votre-slug)
      </Text>

      <View style={styles.photoContainer}>
        {/* Preview de la photo */}
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={48} color="#94a3b8" />
          </View>
        )}

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>
                  {photoUrl ? 'Changer' : 'Ajouter'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {photoUrl && !uploading && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});

