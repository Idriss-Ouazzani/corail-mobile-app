/**
 * CreditsModal - Modal explicatif sur le système de crédits
 * 
 * Extrait de App.tsx pour améliorer la lisibilité
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { appStyles } from '../styles/App.styles';

interface CreditsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <View style={appStyles.modalOverlay}>
      <TouchableOpacity 
        style={appStyles.modalBackdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <View style={appStyles.creditsModalContainer}>
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={appStyles.creditsModalGradient}
        >
          <View style={appStyles.creditsModalHeader}>
            <View style={appStyles.creditsModalIconLarge}>
              <Text style={appStyles.creditsModalIconText}>C</Text>
            </View>
            <Text style={appStyles.creditsModalTitle}>Comment fonctionnent les crédits ?</Text>
            <TouchableOpacity 
              style={appStyles.creditsModalClose}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={appStyles.creditsModalContent} showsVerticalScrollIndicator={false}>
            {/* Gagner des crédits */}
            <View style={appStyles.creditsModalSection}>
              <View style={appStyles.creditsModalSectionHeader}>
                <Ionicons name="add-circle" size={20} color="#10b981" />
                <Text style={appStyles.creditsModalSectionTitle}>Gagner des crédits</Text>
              </View>
              <View style={appStyles.creditsModalItem}>
                <View style={appStyles.creditsModalDot} />
                <Text style={appStyles.creditsModalItemText}>
                  <Text style={appStyles.creditsModalBadgePositive}>+1 C</Text> à chaque course publiée en public (groupe = 0)
                </Text>
              </View>
              <View style={appStyles.creditsModalItem}>
                <View style={appStyles.creditsModalDot} />
                <Text style={appStyles.creditsModalItemText}>
                  <Text style={appStyles.creditsModalBadgePositive}>+1 C</Text> bonus pour l'auteur quand sa course est terminée par celui qui l'a prise
                </Text>
              </View>
            </View>

            {/* Utiliser des crédits */}
            <View style={appStyles.creditsModalSection}>
              <View style={appStyles.creditsModalSectionHeader}>
                <Ionicons name="remove-circle" size={20} color="#ff6b47" />
                <Text style={appStyles.creditsModalSectionTitle}>Utiliser des crédits</Text>
              </View>
              <View style={appStyles.creditsModalItem}>
                <View style={appStyles.creditsModalDot} />
                <Text style={appStyles.creditsModalItemText}>
                  <Text style={appStyles.creditsModalBadge}>-1 C</Text> pour prendre une course dans les annonces (groupe ou client = 0)
                </Text>
              </View>
            </View>

            {/* 100% Gratuit */}
            <View style={appStyles.creditsModalFreeSection}>
              <Ionicons name="sparkles" size={24} color="#fbbf24" />
              <Text style={appStyles.creditsModalFreeTitle}>100% Gratuit</Text>
              <Text style={appStyles.creditsModalFreeText}>
                Corail est entièrement gratuit. Les crédits permettent de réguler l'utilisation et d'encourager la participation active.
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
};

