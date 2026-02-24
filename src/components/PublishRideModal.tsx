/**
 * PublishRideModal - Modal pour publier une course personnelle sur le marketplace
 * 
 * Extrait de App.tsx pour améliorer la lisibilité
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { formatPhoneInput, formatPhoneForSubmit, formatPhoneDisplay } from '../utils/phoneFormat';
import { haptic } from '../services/haptic';
import { toast } from '../services/toast';
import { logger } from '../services/logger';
import { appStyles } from '../styles/App.styles';

type VehicleType = 'STANDARD' | 'ELECTRIC' | 'VAN' | 'PREMIUM' | 'LUXURY';
type Visibility = 'PUBLIC' | 'GROUP';

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
}

interface PersonalRide {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  [key: string]: any;
}

interface PublishRideModalProps {
  visible: boolean;
  personalRide: PersonalRide | null;
  isDriverVerified?: boolean;
  onClose: () => void;
  onPublished: () => void;
}

export const PublishRideModal: React.FC<PublishRideModalProps> = ({
  visible,
  personalRide,
  isDriverVerified = false,
  onClose,
  onPublished,
}) => {
  const [publishVisibility, setPublishVisibility] = useState<Visibility>('PUBLIC');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<string, any[]>>({});
  
  // États pour les informations client
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Charger les groupes et infos client quand le modal s'ouvre
  useEffect(() => {
    if (visible && personalRide) {
      loadGroups();
      // Réinitialiser ou pré-remplir les champs
      setPublishVisibility('PUBLIC');
      setSelectedGroups([]);
      setExpandedGroupId(null);
      setGroupMembers({});
      
      // Pré-remplir avec les infos existantes si disponibles
      setClientName(personalRide.client_name || '');
      setClientPhone(personalRide.client_phone ? formatPhoneDisplay(personalRide.client_phone) : '');
      setClientEmail('');
    }
  }, [visible, personalRide]);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      console.log('🔍 Chargement des groupes...');
      const groupsData = await apiClient.listGroups();
      console.log('📦 Groupes reçus:', groupsData);
      setGroups(groupsData || []);
      console.log('✅ Groupes chargés:', groupsData?.length || 0);
    } catch (error) {
      console.error('❌ Erreur chargement groupes:', error);
      toast.error('Erreur', 'Impossible de charger vos groupes');
    } finally {
      setLoadingGroups(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    // Permettre de décocher le groupe
    setSelectedGroups(prev => 
      prev.includes(groupId) ? [] : [groupId]
    );
  };

  const toggleGroupExpand = async (groupId: string) => {
    if (expandedGroupId === groupId) {
      // Fermer si déjà ouvert
      setExpandedGroupId(null);
    } else {
      // Ouvrir et charger les membres si pas encore chargés
      setExpandedGroupId(groupId);
      if (!groupMembers[groupId]) {
        try {
          console.log('🔍 Chargement membres du groupe:', groupId);
          const members = await apiClient.getGroupMembers(groupId);
          setGroupMembers(prev => ({ ...prev, [groupId]: members }));
          console.log('✅ Membres chargés:', members.length);
        } catch (error) {
          console.error('❌ Erreur chargement membres:', error);
        }
      }
    }
  };

  if (!visible || !personalRide) return null;

  const handlePublish = async () => {
    if (publishVisibility === 'PUBLIC' && !isDriverVerified) {
      haptic.warning();
      Alert.alert(
        'Profil vérifié requis',
        'Pour accéder aux opportunités réseau, votre profil doit être vérifié.'
      );
      return;
    }

    // Validation
    if (publishVisibility === 'GROUP' && selectedGroups.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un groupe');
      return;
    }

    // Valider les informations client
    if (!clientName.trim()) {
      Alert.alert('Erreur', 'Le nom du client est obligatoire');
      return;
    }

    if (!clientPhone.trim() && !clientEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner au moins un contact (téléphone ou email)');
      return;
    }

    try {
      haptic.heavy();
      console.log('📤 Publication course personnelle:', {
        rideId: personalRide.id,
        visibility: publishVisibility,
        groups: selectedGroups,
        clientInfo: { name: clientName, phone: clientPhone, email: clientEmail },
      });
      
      // Publication (avec ou sans groupe) + infos client
      await apiClient.publishPersonalRide(personalRide.id, {
        visibility: publishVisibility,
        vehicle_type: 'STANDARD', // Valeur par défaut
        group_id: publishVisibility === 'GROUP' && selectedGroups.length > 0 
          ? selectedGroups[0] 
          : undefined,
        client_name: clientName.trim(),
        client_phone: formatPhoneForSubmit(clientPhone) || undefined,
        client_email: clientEmail.trim() || undefined,
      });
      
      haptic.success();
      toast.ridePublished();
      onPublished();
      onClose();
    } catch (error: any) {
      logger.error('Erreur publication', error, {
        action: 'publishPersonalRide',
        rideId: personalRide?.id,
        visibility: publishVisibility,
        selectedGroups,
      });
      toast.error('Erreur', error.message || 'Impossible de publier la course');
    }
  };

  return (
    <View style={appStyles.modalOverlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}
      >
        <View style={[appStyles.publishModal, { maxHeight: '90%' }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text style={appStyles.publishModalTitle}>Publier la course</Text>
            <Text style={appStyles.publishModalSubtitle}>
              {personalRide.pickup_address} → {personalRide.dropoff_address}
            </Text>

            {/* Informations Client */}
            <Text style={[appStyles.publishLabel, { marginTop: 16 }]}>Informations Client</Text>
            <View style={{ marginBottom: 16 }}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>
                  Nom du client <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    padding: 12,
                    color: '#f1f5f9',
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: clientName ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  }}
                  placeholder="Ex: Jean Dupont"
                  placeholderTextColor="#64748b"
                  value={clientName}
                  onChangeText={setClientName}
                />
              </View>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>
                  Téléphone
                </Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    padding: 12,
                    color: '#f1f5f9',
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: clientPhone ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  }}
                  placeholder="Ex: 06 12 34 56 78"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={clientPhone}
                  onChangeText={(t) => setClientPhone(formatPhoneInput(t))}
                />
              </View>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>
                  Email
                </Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    padding: 12,
                    color: '#f1f5f9',
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: clientEmail ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  }}
                  placeholder="Ex: jean.dupont@email.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={clientEmail}
                  onChangeText={setClientEmail}
                />
              </View>
              
              <Text style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>
                * Au moins un contact (téléphone ou email) est requis
              </Text>
            </View>

            {/* Visibilité */}
            <Text style={appStyles.publishLabel}>Visibilité</Text>
            <View style={appStyles.publishOptions}>
              <TouchableOpacity
                style={[
                  appStyles.publishOption,
                  {
                    backgroundColor: publishVisibility === 'PUBLIC' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: publishVisibility === 'PUBLIC' ? '#f97316' : 'rgba(255, 255, 255, 0.1)',
                  }
                ]}
                onPress={() => setPublishVisibility('PUBLIC')}
              >
                <Ionicons 
                  name="globe" 
                  size={20} 
                  color={publishVisibility === 'PUBLIC' ? '#f97316' : '#64748b'} 
                />
                <Text style={[
                  appStyles.publishOptionText,
                  { color: publishVisibility === 'PUBLIC' ? '#f97316' : '#94a3b8' }
                ]}>
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  appStyles.publishOption,
                  {
                    backgroundColor: publishVisibility === 'GROUP' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: publishVisibility === 'GROUP' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                  }
                ]}
                onPress={() => setPublishVisibility('GROUP')}
              >
                <Ionicons 
                  name="people" 
                  size={20} 
                  color={publishVisibility === 'GROUP' ? '#3b82f6' : '#64748b'} 
                />
                <Text style={[
                  appStyles.publishOptionText,
                  { color: publishVisibility === 'GROUP' ? '#3b82f6' : '#94a3b8' }
                ]}>
                  Groupe
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sélection des groupes si visibilité = GROUP */}
            {publishVisibility === 'GROUP' && (
              <>
                <Text style={appStyles.publishLabel}>
                  Sélectionner un groupe
                </Text>
                {loadingGroups ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={{ color: '#94a3b8', marginTop: 8, fontSize: 12 }}>
                      Chargement des groupes...
                    </Text>
                  </View>
                ) : groups.length === 0 ? (
                  <View style={{ padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, marginBottom: 16 }}>
                    <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>
                      Vous n'avez aucun groupe. Créez-en un d'abord !
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginBottom: 16 }}>
                    {groups.map(group => (
                      <View key={group.id} style={{ marginBottom: 8 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: selectedGroups.includes(group.id) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: selectedGroups.includes(group.id) ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                            onPress={() => toggleGroup(group.id)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                borderWidth: 2,
                                borderColor: selectedGroups.includes(group.id) ? '#3b82f6' : '#64748b',
                                backgroundColor: selectedGroups.includes(group.id) ? '#3b82f6' : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                              }}
                            >
                              {selectedGroups.includes(group.id) && (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '600' }}>
                                {group.name}
                              </Text>
                              {group.memberCount !== undefined && (
                                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                                  {group.memberCount} membre{group.memberCount !== 1 ? 's' : ''}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                          
                          {/* Bouton pour voir les membres */}
                          <TouchableOpacity
                            style={{
                              padding: 8,
                              marginLeft: 8,
                            }}
                            onPress={() => toggleGroupExpand(group.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons 
                              name={expandedGroupId === group.id ? "chevron-up" : "eye-outline"}
                              size={20} 
                              color="#3b82f6"
                            />
                          </TouchableOpacity>
                        </View>
                        
                        {/* Liste des membres (expandable) */}
                        {expandedGroupId === group.id && (
                          <View
                            style={{
                              marginTop: 4,
                              marginLeft: 12,
                              backgroundColor: 'rgba(59, 130, 246, 0.05)',
                              padding: 12,
                              borderRadius: 8,
                              borderLeftWidth: 2,
                              borderLeftColor: '#3b82f6',
                            }}
                          >
                            {!groupMembers[group.id] ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                                  Chargement...
                                </Text>
                              </View>
                            ) : groupMembers[group.id].length === 0 ? (
                              <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>
                                Aucun membre
                              </Text>
                            ) : (
                              <View>
                                <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
                                  MEMBRES
                                </Text>
                                {groupMembers[group.id].map((member: any, index: number) => (
                                  <View
                                    key={member.id || index}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      paddingVertical: 4,
                                    }}
                                  >
                                    <Ionicons name="person-circle-outline" size={16} color="#94a3b8" />
                                    <Text style={{ color: '#cbd5e1', fontSize: 13, marginLeft: 6 }}>
                                      {member.name || member.email || 'Membre'}
                                      {member.isCurrentUser && (
                                        <Text style={{ color: '#3b82f6', fontSize: 11 }}> (vous)</Text>
                                      )}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}


            {/* Actions */}
            <View style={[appStyles.publishModalActions, { marginTop: 20 }]}>
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

