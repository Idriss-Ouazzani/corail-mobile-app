import React, { useState, useEffect } from 'react';
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
  sortBy: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'distance_asc' | 'distance_desc' | 'duration_asc' | 'duration_desc' | 'price_per_km_desc' | null;
  minPrice?: number;
  maxPrice?: number;
  radiusKm: number | null; // Rayon de recherche en km (null = France entière)
}

interface MarketplaceFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const SORT_OPTIONS = [
  { value: 'price_per_km_desc', label: 'Meilleur €/km', icon: 'trending-up' },
  { value: 'price_asc', label: 'Prix croissant', icon: 'arrow-up' },
  { value: 'price_desc', label: 'Prix décroissant', icon: 'arrow-down' },
  { value: 'date_asc', label: 'Date la plus proche', icon: 'time' },
  { value: 'date_desc', label: 'Date la plus lointaine', icon: 'calendar' },
  { value: 'distance_asc', label: 'Distance la plus courte', icon: 'locate' },
  { value: 'distance_desc', label: 'Distance la plus longue', icon: 'navigate' },
  { value: 'duration_asc', label: 'Durée la plus courte', icon: 'hourglass' },
  { value: 'duration_desc', label: 'Durée la plus longue', icon: 'timer' },
];

const RADIUS_OPTIONS = [
  { value: 10, label: '10 km', icon: 'location' },
  { value: 20, label: '20 km', icon: 'location' },
  { value: 50, label: '50 km', icon: 'navigate' },
  { value: 100, label: '100 km', icon: 'globe' },
  { value: null, label: 'France entière', icon: 'earth' },
];

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [sortBy, setSortBy] = useState(currentFilters.sortBy);
  const [radiusKm, setRadiusKm] = useState(currentFilters.radiusKm);

  useEffect(() => {
    if (visible) {
      setSortBy(currentFilters.sortBy);
      setRadiusKm(currentFilters.radiusKm);
    }
  }, [visible, currentFilters.sortBy, currentFilters.radiusKm]);

  const handleApply = () => {
    onApply({ vehicleTypes: [], sortBy, radiusKm });
    onClose();
  };

  const handleReset = () => {
    setSortBy(null);
    setRadiusKm(100); // Rayon par défaut: 100km
  };

  const activeFiltersCount = (sortBy ? 1 : 0) + (radiusKm !== 100 ? 1 : 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header épuré (aligné reste de l'app) */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#f1f5f9" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Filtres & Tri</Text>
              {activeFiltersCount > 0 && (
                <Text style={styles.headerSubtitle}>{activeFiltersCount} actif(s)</Text>
              )}
            </View>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Réinit.</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Rayon */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rayon</Text>
              <View style={styles.sortList}>
                {RADIUS_OPTIONS.map((option) => {
                  const isSelected = radiusKm === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value ?? 'all'}
                      style={[styles.sortItem, isSelected && styles.itemActive]}
                      onPress={() => setRadiusKm(option.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={18}
                        color={isSelected ? '#0ea5e9' : '#64748b'}
                        style={styles.sortItemIcon}
                      />
                      <Text style={[styles.sortItemText, isSelected && styles.sortItemTextActive]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color="#0ea5e9" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tri */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trier par</Text>
              <View style={styles.sortList}>
                {SORT_OPTIONS.map((option) => {
                  const isSelected = sortBy === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.sortItem, isSelected && styles.itemActive]}
                      onPress={() => setSortBy(option.value as any)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={18}
                        color={isSelected ? '#0ea5e9' : '#64748b'}
                        style={styles.sortItemIcon}
                      />
                      <Text style={[styles.sortItemText, isSelected && styles.sortItemTextActive]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color="#0ea5e9" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Appliquer */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0ea5e9', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '82%',
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#0ea5e9',
    marginTop: 2,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  sortList: {
    gap: 6,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sortItemIcon: {
    marginRight: 10,
  },
  itemActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderColor: '#0ea5e9',
    borderWidth: 1,
  },
  sortItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sortItemTextActive: {
    color: '#0ea5e9',
    fontWeight: '700',
  },
  actionContainer: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 2,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
});

export default MarketplaceFilters;

