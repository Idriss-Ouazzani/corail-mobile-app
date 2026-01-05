/**
 * PublishRideModal - Modal pour publier une course personnelle sur le marketplace
 * 
 * Extrait de App.tsx pour améliorer la lisibilité
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { haptic } from '../services/haptic';
import { toast } from '../services/toast';
import { logger } from '../services/logger';
import { appStyles } from '../styles/App.styles';

type VehicleType = 'STANDARD' | 'ELECTRIC' | 'VAN' | 'PREMIUM' | 'LUXURY';
type Visibility = 'PUBLIC' | 'GROUP';

interface PersonalRide {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  [key: string]: any;
}

interface PublishRideModalProps {
  visible: boolean;
  personalRide: PersonalRide | null;
  onClose: () => void;
  onPublished: () => void;
}

export const PublishRideModal: React.FC<PublishRideModalProps> = ({
  visible,
  personalRide,
  onClose,
  onPublished,
}) => {
  const [publishVisibility, setPublishVisibility] = useState<Visibility>('PUBLIC');
  const [publishVehicleType, setPublishVehicleType] = useState<VehicleType>('STANDARD');

  if (!visible || !personalRide) return null;

  const handlePublish = async () => {
    try {
      haptic.heavy();
      console.log('📤 Publication course personnelle:', personalRide.id);
      
      await apiClient.publishPersonalRide(personalRide.id, {
        visibility: publishVisibility,
        vehicle_type: publishVehicleType,
      });
      
      haptic.success();
      toast.ridePublished();
      onPublished();
      onClose();
    } catch (error: any) {
      logger.error('Erreur publication', error, {
        action: 'publishPersonalRide',
        rideId: personalRide?.id,
        visibility: publishVisibility
      });
      toast.error('Erreur', error.message || 'Impossible de publier la course');
    }
  };

  return (
    <View style={appStyles.modalOverlay}>
      <View style={appStyles.publishModal}>
        <Text style={appStyles.publishModalTitle}>Publier la course</Text>
        <Text style={appStyles.publishModalSubtitle}>
          {personalRide.pickup_address} → {personalRide.dropoff_address}
        </Text>

        {/* Visibilité */}
        <Text style={appStyles.publishLabel}>Visibilité</Text>
        <View style={appStyles.publishOptions}>
          <TouchableOpacity
            style={[appStyles.publishOption, publishVisibility === 'PUBLIC' && appStyles.publishOptionActive]}
            onPress={() => setPublishVisibility('PUBLIC')}
          >
            <Ionicons 
              name="globe" 
              size={20} 
              color={publishVisibility === 'PUBLIC' ? '#fff' : '#64748b'} 
            />
            <Text style={[appStyles.publishOptionText, publishVisibility === 'PUBLIC' && appStyles.publishOptionTextActive]}>
              Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[appStyles.publishOption, publishVisibility === 'GROUP' && appStyles.publishOptionActive]}
            onPress={() => setPublishVisibility('GROUP')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={publishVisibility === 'GROUP' ? '#fff' : '#64748b'} 
            />
            <Text style={[appStyles.publishOptionText, publishVisibility === 'GROUP' && appStyles.publishOptionTextActive]}>
              Groupe
            </Text>
          </TouchableOpacity>
        </View>

        {/* Type de véhicule */}
        <Text style={appStyles.publishLabel}>Type de véhicule</Text>
        <View style={appStyles.publishVehicleTypes}>
          {[
            { type: 'STANDARD' as VehicleType, label: 'Standard', icon: 'car-outline' },
            { type: 'ELECTRIC' as VehicleType, label: 'Électrique', icon: 'flash-outline' },
            { type: 'VAN' as VehicleType, label: 'Van', icon: 'bus-outline' },
            { type: 'PREMIUM' as VehicleType, label: 'Premium', icon: 'star-outline' },
            { type: 'LUXURY' as VehicleType, label: 'Luxe', icon: 'diamond-outline' },
          ].map(({ type, label, icon }) => (
            <TouchableOpacity
              key={type}
              style={[appStyles.publishVehicleType, publishVehicleType === type && appStyles.publishVehicleTypeActive]}
              onPress={() => setPublishVehicleType(type)}
            >
              <Ionicons 
                name={icon as any} 
                size={18} 
                color={publishVehicleType === type ? '#fff' : '#94a3b8'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[appStyles.publishVehicleTypeText, publishVehicleType === type && appStyles.publishVehicleTypeTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={appStyles.publishModalActions}>
          <TouchableOpacity
            style={appStyles.publishCancelButton}
            onPress={onClose}
          >
            <Text style={appStyles.publishCancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={appStyles.publishConfirmButton}
            onPress={handlePublish}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={appStyles.publishConfirmGradient}
            >
              <Ionicons name="megaphone" size={18} color="#fff" />
              <Text style={appStyles.publishConfirmButtonText}>Publier</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

