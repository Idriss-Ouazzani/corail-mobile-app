import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  color: string;
  icon: string;
}

const MOCK_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'Famille',
    description: 'Groupe familial pour partager des trajets',
    memberCount: 5,
    color: '#10b981',
    icon: 'people',
  },
  {
    id: 'group-2',
    name: 'Collègues VTC',
    description: 'Réseau de chauffeurs VTC de Toulouse',
    memberCount: 12,
    color: '#0ea5e9',
    icon: 'briefcase',
  },
  {
    id: 'group-3',
    name: 'Amis',
    description: 'Groupe d\'amis proches',
    memberCount: 8,
    color: '#8b5cf6',
    icon: 'heart',
  },
];

interface CreateRideScreenProps {
  onBack: () => void;
  onCreate: (ride: any) => void;
  mode?: 'create' | 'publish'; // 'create' = depuis Mes Courses, 'publish' = depuis Marketplace
}

const VEHICLE_TYPES = [
  { type: 'STANDARD', label: 'Standard', icon: 'car', color: '#64748b' },
  { type: 'PREMIUM', label: 'Premium', icon: 'car-sport', color: '#8b5cf6' },
  { type: 'ELECTRIC', label: 'Électrique', icon: 'flash', color: '#10b981' },
  { type: 'VAN', label: 'Van', icon: 'bus', color: '#0ea5e9' },
  { type: 'LUXURY', label: 'Luxe', icon: 'diamond', color: '#fbbf24' },
];

export const CreateRideScreen: React.FC<CreateRideScreenProps> = ({ onBack, onCreate, mode = 'publish' }) => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [price, setPrice] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'GROUP' | 'PERSONAL'>(mode === 'create' ? 'PERSONAL' : 'PUBLIC');
  const [publishToMarketplace, setPublishToMarketplace] = useState(false); // Pour mode 'create'
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [vehicleType, setVehicleType] = useState<string>('STANDARD');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  // Formater la date pour l'API (YYYY-MM-DD HH:MM)
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Formater la date pour l'affichage (ex: Lun 31 Déc 2025)
  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Formater l'heure pour l'affichage (ex: 14:30)
  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const onDateChange = (event: any, selected?: Date) => {
    // Sur Android, fermer automatiquement après sélection ou annulation
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selected) {
        setSelectedDate(selected);
      }
    } else if (selected) {
      // Sur iOS, juste mettre à jour la date (le modal reste ouvert jusqu'au clic sur "Valider")
      setSelectedDate(selected);
    }
  };

  const onTimeChange = (event: any, selected?: Date) => {
    // Sur Android, fermer automatiquement après sélection ou annulation
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (selected) {
        const newDate = new Date(selectedDate);
        newDate.setHours(selected.getHours());
        newDate.setMinutes(selected.getMinutes());
        setSelectedDate(newDate);
      }
    } else if (selected) {
      // Sur iOS, juste mettre à jour l'heure (le modal reste ouvert jusqu'au clic sur "Valider")
      const newDate = new Date(selectedDate);
      newDate.setHours(selected.getHours());
      newDate.setMinutes(selected.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const handleCreate = () => {
    if (!pickup || !dropoff || !price) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (visibility === 'GROUP' && selectedGroups.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un groupe');
      return;
    }

    Alert.alert('Succès', 'Course créée avec succès !');
    onCreate({
      pickup_address: pickup,
      dropoff_address: dropoff,
      price_cents: parseFloat(price) * 100,
      scheduled_at: formatDateForAPI(selectedDate),
      visibility,
      group_ids: selectedGroups.map(g => g.id),
      vehicle_type: vehicleType,
      distance_km: distance ? parseFloat(distance) : undefined,
      duration_minutes: duration ? parseInt(duration) : undefined,
    });
    onBack();
  };

  const toggleGroup = (group: Group) => {
    if (selectedGroups.find(g => g.id === group.id)) {
      // Remove group
      setSelectedGroups(selectedGroups.filter(g => g.id !== group.id));
    } else {
      // Add group
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const isGroupSelected = (groupId: string) => {
    return selectedGroups.some(g => g.id === groupId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'create' ? 'Créer une course' : 'Publier une course'}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pickup */}
        <View style={styles.section}>
          <Text style={styles.label}>
            <Ionicons name="location" size={16} color="#10b981" /> Point de départ
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Gare Toulouse-Matabiau"
            placeholderTextColor="#64748b"
            value={pickup}
            onChangeText={setPickup}
          />
        </View>

        {/* Dropoff */}
        <View style={styles.section}>
          <Text style={styles.label}>
            <Ionicons name="flag" size={16} color="#ff6b47" /> Point d'arrivée
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Aéroport Toulouse-Blagnac"
            placeholderTextColor="#64748b"
            value={dropoff}
            onChangeText={setDropoff}
          />
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>
            <Ionicons name="cash" size={16} color="#fbbf24" /> Prix (€)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 25.00"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>
            <Ionicons name="calendar" size={16} color="#0ea5e9" /> Date et heure
          </Text>
          
          <View style={styles.dateTimeContainer}>
            {/* Date Picker Button */}
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#0ea5e9" />
              <Text style={styles.dateText}>
                {formatDateDisplay(selectedDate)}
              </Text>
            </TouchableOpacity>

            {/* Separator */}
            <View style={styles.dateSeparator} />

            {/* Time Picker Button */}
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#8b5cf6" />
              <Text style={styles.timeText}>
                {formatTimeDisplay(selectedDate)}
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Vehicle Type */}
        <View style={styles.section}>
          <Text style={styles.label}>
            <Ionicons name="car-sport" size={16} color="#ff6b47" /> Type de véhicule
          </Text>
          <View style={styles.vehicleTypeGrid}>
            {VEHICLE_TYPES.map((vehicle) => {
              const isSelected = vehicleType === vehicle.type;
              return (
                <TouchableOpacity
                  key={vehicle.type}
                  style={[
                    styles.vehicleTypeChip,
                    isSelected && { backgroundColor: vehicle.color + '20', borderColor: vehicle.color, borderWidth: 2 }
                  ]}
                  onPress={() => setVehicleType(vehicle.type)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={vehicle.icon as any}
                    size={20}
                    color={isSelected ? vehicle.color : '#64748b'}
                  />
                  <Text style={[styles.vehicleTypeText, isSelected && { color: vehicle.color, fontWeight: '700' }]}>
                    {vehicle.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Distance & Duration (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>
            <Ionicons name="information-circle" size={16} color="#64748b" /> Informations complémentaires (optionnel)
          </Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <TextInput
                style={styles.input}
                placeholder="Distance (km)"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={distance}
                onChangeText={setDistance}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <TextInput
                style={styles.input}
                placeholder="Durée (min)"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>
        </View>

        {/* Visibility - Mode 'create' : PERSONAL par défaut + option publier */}
        {mode === 'create' && (
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Ionicons name="lock-closed" size={18} color="#6366f1" />
              <Text style={styles.labelBold}>Course personnelle</Text>
            </View>
            <Text style={styles.hint}>Cette course sera enregistrée dans votre historique privé</Text>
            
            {/* Toggle "Publier sur la marketplace ?" */}
            <TouchableOpacity
              style={styles.publishToggle}
              onPress={() => {
                setPublishToMarketplace(!publishToMarketplace);
                if (!publishToMarketplace) {
                  setVisibility('PUBLIC'); // Par défaut PUBLIC quand on active
                } else {
                  setVisibility('PERSONAL');
                  setSelectedGroups([]);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.publishToggleLeft}>
                <Ionicons name="megaphone" size={20} color="#ff6b47" />
                <Text style={styles.publishToggleText}>Publier sur la marketplace ?</Text>
              </View>
              <View style={[styles.toggleSwitch, publishToMarketplace && styles.toggleSwitchActive]}>
                <View style={[styles.toggleKnob, publishToMarketplace && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>

            {/* Options PUBLIC/GROUP si toggle activé */}
            {publishToMarketplace && (
              <View style={styles.visibilityOptionsContainer}>
                <Text style={styles.labelSmall}>Visibilité de la publication</Text>
                <View style={styles.visibilityRow}>
                  <TouchableOpacity
                    style={[styles.visibilityButton, visibility === 'PUBLIC' && styles.visibilityButtonActive]}
                    onPress={() => {
                      setVisibility('PUBLIC');
                      setSelectedGroups([]);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="globe" size={18} color={visibility === 'PUBLIC' ? '#fff' : '#64748b'} />
                    <Text style={[styles.visibilityText, visibility === 'PUBLIC' && styles.visibilityTextActive]}>
                      Public
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.visibilityButton, visibility === 'GROUP' && styles.visibilityButtonActive]}
                    onPress={() => setVisibility('GROUP')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="people" size={18} color={visibility === 'GROUP' ? '#fff' : '#64748b'} />
                    <Text style={[styles.visibilityText, visibility === 'GROUP' && styles.visibilityTextActive]}>
                      Groupe
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Visibility - Mode 'publish' : PUBLIC/GROUP uniquement */}
        {mode === 'publish' && (
          <View style={styles.section}>
            <Text style={styles.label}>Visibilité</Text>
            <View style={styles.visibilityRow}>
              <TouchableOpacity
                style={[styles.visibilityButton, visibility === 'PUBLIC' && styles.visibilityButtonActive]}
                onPress={() => {
                  setVisibility('PUBLIC');
                  setSelectedGroups([]);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="globe" size={18} color={visibility === 'PUBLIC' ? '#fff' : '#64748b'} />
                <Text style={[styles.visibilityText, visibility === 'PUBLIC' && styles.visibilityTextActive]}>
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.visibilityButton, visibility === 'GROUP' && styles.visibilityButtonActive]}
                onPress={() => setVisibility('GROUP')}
                activeOpacity={0.7}
              >
                <Ionicons name="people" size={18} color={visibility === 'GROUP' ? '#fff' : '#64748b'} />
                <Text style={[styles.visibilityText, visibility === 'GROUP' && styles.visibilityTextActive]}>
                  Groupe
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Group Selection (only visible when GROUP is selected) */}
        {visibility === 'GROUP' && (
          <View style={styles.section}>
            <Text style={styles.label}>
              <Ionicons name="people" size={16} color="#8b5cf6" /> Sélectionner vos groupes
            </Text>
            
            {/* Selected Groups Display */}
            {selectedGroups.length > 0 && (
              <View style={styles.selectedGroupsContainer}>
                {selectedGroups.map((group) => (
                  <View 
                    key={group.id} 
                    style={[styles.selectedGroupChip, { backgroundColor: group.color + '20', borderColor: group.color }]}
                  >
                    <View style={[styles.chipIconWrapper, { backgroundColor: group.color }]}>
                      <Ionicons name={group.icon as any} size={14} color="#fff" />
                    </View>
                    <Text style={styles.chipText}>{group.name}</Text>
                    <TouchableOpacity onPress={() => toggleGroup(group)}>
                      <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* All Groups List */}
            <View style={styles.groupsList}>
              {MOCK_GROUPS.map((group) => {
                const isSelected = isGroupSelected(group.id);
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.groupCard,
                      isSelected && { backgroundColor: group.color + '15', borderColor: group.color, borderWidth: 2 }
                    ]}
                    onPress={() => toggleGroup(group)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.groupIconWrapper, { backgroundColor: group.color }]}>
                      <Ionicons name={group.icon as any} size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupMembers}>{group.memberCount} membres</Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={group.color} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color="#64748b" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.actionContainer}>
        {/* Credits Reward Banner */}
        <View style={styles.creditsRewardBanner}>
          <View style={styles.creditsRewardIcon}>
            <Text style={styles.creditsRewardIconText}>C</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.creditsRewardTitle}>🎉 Gagnez des crédits !</Text>
            <Text style={styles.creditsRewardText}>
              <Text style={{ fontWeight: '700', color: '#10b981' }}>+1 crédit</Text> immédiatement{'\n'}
              <Text style={{ fontWeight: '700', color: '#10b981' }}>+1 bonus</Text> si votre course est prise et terminée
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ff6b47', '#ff8a6d']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>
              {mode === 'create' ? 'Créer la course' : 'Publier la course'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner la date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close-circle" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
              textColor="#fff"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDatePicker(false)}
              >
                <LinearGradient
                  colors={['#0ea5e9', '#06b6d4']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Valider</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner l'heure</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close-circle" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              textColor="#fff"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowTimePicker(false)}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#a78bfa']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Valider</Text>
                </LinearGradient>
              </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  labelBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  labelSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  publishToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.3)',
  },
  publishToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  publishToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  toggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#64748b',
  },
  toggleKnobActive: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-end',
  },
  visibilityOptionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  visibilityButtonActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
  },
  visibilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  visibilityTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vehicleTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    minWidth: '47%',
  },
  vehicleTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  row: {
    flexDirection: 'row',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  dateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  dateSeparator: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  creditsRewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  creditsRewardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditsRewardIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  creditsRewardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  creditsRewardText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  selectedGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectedGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
    marginRight: 6,
  },
  groupIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  groupMembers: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default CreateRideScreen;

