/**
 * ToolsScreen - Outils professionnels VTC
 * QR Code, Enregistrement courses, Planning, Statistiques
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ToolsScreenProps {
  onOpenQRCode: () => void;
  onOpenPersonalRides: () => void;
  onOpenPlanning: () => void;
  onCreateQuote: () => void;
}

export default function ToolsScreen({ onOpenQRCode, onOpenPersonalRides, onOpenPlanning, onCreateQuote }: ToolsScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Outils</Text>
          <Text style={styles.headerSubtitle}>Outils professionnels pour chauffeurs VTC</Text>
        </View>

        {/* Section Outils principaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outils principaux</Text>

          {/* QR Code Pro */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={onOpenQRCode}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.toolGradient}
            >
              <View style={styles.toolLeft}>
                <View style={styles.toolIconContainer}>
                  <Ionicons name="qr-code" size={28} color="#fff" />
                </View>
                <View>
                  <Text style={styles.toolTitle}>QR Code Pro</Text>
                  <Text style={styles.toolDescription}>Partagez vos coordonnées facilement</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Enregistrer une course */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={onOpenPersonalRides}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.toolGradient}
            >
              <View style={styles.toolLeft}>
                <View style={styles.toolIconContainer}>
                  <Ionicons name="add-circle" size={28} color="#fff" />
                </View>
                <View>
                  <Text style={styles.toolTitle}>Mes Courses</Text>
                  <Text style={styles.toolDescription}>Enregistrez Uber, Bolt, Direct...</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Planning */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={onOpenPlanning}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.toolGradient}
            >
              <View style={styles.toolLeft}>
                <View style={styles.toolIconContainer}>
                  <Ionicons name="calendar" size={28} color="#fff" />
                </View>
                <View>
                  <Text style={styles.toolTitle}>Planning</Text>
                  <Text style={styles.toolDescription}>Organisez votre emploi du temps</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Créer un devis */}
          <TouchableOpacity
            style={styles.toolButton}
            onPress={onCreateQuote}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#f59e0b", "#f97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.toolGradient}
            >
              <View style={styles.toolLeft}>
                <View style={styles.toolIconContainer}>
                  <Ionicons name="document-text" size={28} color="#fff" />
                </View>
                <View>
                  <Text style={styles.toolTitle}>Créer un devis</Text>
                  <Text style={styles.toolDescription}>Envoyez un devis par WhatsApp</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>

        </View>

        {/* Section Outils à venir */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bientôt disponibles</Text>

          {/* Statistiques avancées */}
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonIconContainer}>
              <Ionicons name="stats-chart" size={24} color="#64748b" />
            </View>
            <View style={styles.comingSoonContent}>
              <Text style={styles.comingSoonTitle}>Statistiques avancées</Text>
              <Text style={styles.comingSoonDescription}>
                Graphiques détaillés, export PDF, analyse de revenus
              </Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Bientôt</Text>
            </View>
          </View>

          {/* Notifications intelligentes */}
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonIconContainer}>
              <Ionicons name="notifications" size={24} color="#64748b" />
            </View>
            <View style={styles.comingSoonContent}>
              <Text style={styles.comingSoonTitle}>Notifications intelligentes</Text>
              <Text style={styles.comingSoonDescription}>
                Rappels de courses, alertes de proximité, suggestions
              </Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Bientôt</Text>
            </View>
          </View>

          {/* Export comptable */}
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonIconContainer}>
              <Ionicons name="document-text" size={24} color="#64748b" />
            </View>
            <View style={styles.comingSoonContent}>
              <Text style={styles.comingSoonTitle}>Export comptable</Text>
              <Text style={styles.comingSoonDescription}>
                Exportez vos données pour votre comptable (CSV, Excel)
              </Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Bientôt</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  toolButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  toolGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  toolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  toolIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  comingSoonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 4,
  },
  comingSoonDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

