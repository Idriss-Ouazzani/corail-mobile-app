import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { VehicleType } from '../types';

export interface FilterOptions {
  vehicleTypes: VehicleType[];
  sortBy: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'distance_asc' | 'distance_desc' | 'duration_asc' | 'duration_desc' | null;
  minPrice?: number;
  maxPrice?: number;
}

interface MarketplaceFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const VEHICLE_TYPES: { type: VehicleType; label: string; icon: string; color: string }[] = [
  { type: 'STANDARD', label: 'Standard', icon: 'car', color: '#64748b' },
  { type: 'PREMIUM', label: 'Premium', icon: 'car-sport', color: '#8b5cf6' },
  { type: 'ELECTRIC', label: 'Électrique', icon: 'flash', color: '#10b981' },
  { type: 'VAN', label: 'Van', icon: 'bus', color: '#0ea5e9' },
  { type: 'LUXURY', label: 'Luxe', icon: 'diamond', color: '#fbbf24' },
];

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Prix croissant', icon: 'arrow-up' },
  { value: 'price_desc', label: 'Prix décroissant', icon: 'arrow-down' },
  { value: 'date_asc', label: 'Date la plus proche', icon: 'time' },
  { value: 'date_desc', label: 'Date la plus lointaine', icon: 'calendar' },
  { value: 'distance_asc', label: 'Distance la plus courte', icon: 'locate' },
  { value: 'distance_desc', label: 'Distance la plus longue', icon: 'navigate' },
  { value: 'duration_asc', label: 'Durée la plus courte', icon: 'hourglass' },
  { value: 'duration_desc', label: 'Durée la plus longue', icon: 'timer' },
];

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(currentFilters.vehicleTypes);
  const [sortBy, setSortBy] = useState(currentFilters.sortBy);

  const toggleVehicleType = (type: VehicleType) => {
    if (vehicleTypes.includes(type)) {
      setVehicleTypes(vehicleTypes.filter(t => t !== type));
    } else {
      setVehicleTypes([...vehicleTypes, type]);
    }
  };

  const handleApply = () => {
    onApply({ vehicleTypes, sortBy });
    onClose();
  };

  const handleReset = () => {
    setVehicleTypes([]);
    setSortBy(null);
  };

  const activeFiltersCount = vehicleTypes.length + (sortBy ? 1 : 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#f1f5f9" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Filtres & Tri</Text>
              {activeFiltersCount > 0 && (
                <Text style={styles.headerSubtitle}>{activeFiltersCount} filtre(s) actif(s)</Text>
              )}
            </View>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Vehicle Type Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="car-sport" size={16} color="#ff6b47" /> Type de véhicule
              </Text>
              <View style={styles.chipGrid}>
                {VEHICLE_TYPES.map((vehicle) => {
                  const isSelected = vehicleTypes.includes(vehicle.type);
                  return (
                    <TouchableOpacity
                      key={vehicle.type}
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: vehicle.color + '20', borderColor: vehicle.color }
                      ]}
                      onPress={() => toggleVehicleType(vehicle.type)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={vehicle.icon as any}
                        size={18}
                        color={isSelected ? vehicle.color : '#64748b'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.chipText, isSelected && { color: vehicle.color }]}>
                        {vehicle.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={vehicle.color} style={{ marginLeft: 6 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="swap-vertical" size={16} color="#ff6b47" /> Trier par
              </Text>
              <View style={styles.sortList}>
                {SORT_OPTIONS.map((option) => {
                  const isSelected = sortBy === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.sortItem, isSelected && styles.sortItemActive]}
                      onPress={() => setSortBy(option.value as any)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={isSelected ? '#ff6b47' : '#64748b'}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[styles.sortItemText, isSelected && styles.sortItemTextActive]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#ff6b47" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff6b47', '#ff8a6d']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>
                  Appliquer {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    height: '85%',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#ff6b47',
    marginTop: 2,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 5,
    marginVertical: 5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sortList: {
    marginVertical: -6,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 6,
  },
  sortItemActive: {
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    borderColor: '#ff6b47',
    borderWidth: 2,
  },
  sortItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sortItemTextActive: {
    color: '#ff6b47',
    fontWeight: '700',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
});

export default MarketplaceFilters;

