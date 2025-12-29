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

const CITIES = [
  { id: 'toulouse', name: 'Toulouse', region: 'Occitanie', icon: 'airplane', color: '#ff6b47' },
  { id: 'paris', name: 'Paris', region: 'Île-de-France', icon: 'business', color: '#0ea5e9' },
  { id: 'lyon', name: 'Lyon', region: 'Auvergne-Rhône-Alpes', icon: 'restaurant', color: '#10b981' },
  { id: 'marseille', name: 'Marseille', region: 'PACA', icon: 'boat', color: '#f59e0b' },
  { id: 'bordeaux', name: 'Bordeaux', region: 'Nouvelle-Aquitaine', icon: 'wine', color: '#8b5cf6' },
  { id: 'nantes', name: 'Nantes', region: 'Pays de la Loire', icon: 'water', color: '#06b6d4' },
];

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (cityId: string) => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({ selectedCity, onCityChange }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selected = CITIES.find((c) => c.id === selectedCity) || CITIES[0];

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[selected.color + '30', selected.color + '10']}
          style={styles.triggerGradient}
        >
          <View style={[styles.triggerIcon, { backgroundColor: selected.color + '30' }]}>
            <Ionicons name={selected.icon as any} size={18} color={selected.color} />
          </View>
          <View style={styles.triggerContent}>
            <Text style={styles.triggerLabel}>📍 Votre région</Text>
            <Text style={styles.triggerCity}>{selected.name}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={selected.color} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1e293b', '#334155']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choisir votre région</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#f1f5f9" />
                </TouchableOpacity>
              </View>

              {/* Cities List */}
              <ScrollView
                contentContainerStyle={styles.citiesList}
                showsVerticalScrollIndicator={false}
              >
                {CITIES.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.cityCard,
                      selectedCity === city.id && styles.cityCardActive,
                    ]}
                    onPress={() => {
                      onCityChange(city.id);
                      setModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.cityIcon, { backgroundColor: city.color + '20' }]}>
                      <Ionicons name={city.icon as any} size={28} color={city.color} />
                    </View>
                    <View style={styles.cityContent}>
                      <Text style={styles.cityName}>{city.name}</Text>
                      <Text style={styles.cityRegion}>{city.region}</Text>
                    </View>
                    {selectedCity === city.id && (
                      <Ionicons name="checkmark-circle" size={24} color={city.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  triggerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  triggerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  triggerContent: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 11,
    color: '#f1f5f9',
    marginBottom: 2,
    fontWeight: '600',
  },
  triggerCity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  citiesList: {
    paddingHorizontal: 24,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cityCardActive: {
    borderColor: 'rgba(255, 107, 71, 0.5)',
    backgroundColor: 'rgba(255, 107, 71, 0.05)',
  },
  cityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cityContent: {
    flex: 1,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  cityRegion: {
    fontSize: 13,
    color: '#94a3b8',
  },
});

export default CitySelector;

