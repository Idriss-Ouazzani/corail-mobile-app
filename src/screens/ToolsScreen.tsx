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
import { Ionicons } from '@expo/vector-icons';

interface ToolsScreenProps {
  verificationStatus: string | null;
  onRefreshVerification: () => Promise<void>;
  onOpenQRCode: () => void;
  onOpenPersonalRides: () => void;
  onOpenPlanning: () => void;
  onOpenQuotes: () => void;
  onOpenVTCProfile: () => void;
  onOpenInvoices: () => void;
}

export default function ToolsScreen({ verificationStatus, onRefreshVerification, onOpenQRCode, onOpenPersonalRides, onOpenPlanning, onOpenQuotes, onOpenVTCProfile, onOpenInvoices }: ToolsScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Suivi</Text>
          <Text style={styles.headerSubtitle}>Vos outils chauffeur privé</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outils principaux</Text>

          <View style={styles.toolsRow}>
            <TouchableOpacity style={[styles.toolCard, styles.toolCardAmber]} onPress={onOpenQuotes} activeOpacity={0.8}>
              <View style={[styles.toolCardIcon, styles.toolCardIconAmber]}>
                <Ionicons name="document-text" size={26} color="#f59e0b" />
              </View>
              <Text style={styles.toolCardTitle}>Devis</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toolCard, styles.toolCardGreen]} onPress={onOpenPlanning} activeOpacity={0.8}>
              <View style={[styles.toolCardIcon, styles.toolCardIconGreen]}>
                <Ionicons name="calendar" size={26} color="#10b981" />
              </View>
              <Text style={styles.toolCardTitle}>Planning</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolsRow}>
            <TouchableOpacity style={[styles.toolCard, styles.toolCardIndigo]} onPress={onOpenPersonalRides} activeOpacity={0.8}>
              <View style={[styles.toolCardIcon, styles.toolCardIconIndigo]}>
                <Ionicons name="car-sport" size={26} color="#6366f1" />
              </View>
              <Text style={styles.toolCardTitle}>Courses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toolCard, styles.toolCardRose]} onPress={onOpenQRCode} activeOpacity={0.8}>
              <View style={[styles.toolCardIcon, styles.toolCardIconRose]}>
                <Ionicons name="qr-code" size={26} color="#f43f5e" />
              </View>
              <Text style={styles.toolCardTitle}>QR Code</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolsRow}>
            <TouchableOpacity style={[styles.toolCard, styles.toolCardCyan]} onPress={onOpenVTCProfile} activeOpacity={0.8}>
              <View style={[styles.toolCardIcon, styles.toolCardIconCyan]}>
                <Ionicons name="globe-outline" size={26} color="#0ea5e9" />
              </View>
              <Text style={styles.toolCardTitle}>Page Publique</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toolCard, styles.toolCardViolet]} onPress={onOpenInvoices} activeOpacity={0.8}>
              <View style={[styles.toolCardIcon, styles.toolCardIconViolet]}>
                <Ionicons name="receipt" size={26} color="#a78bfa" />
              </View>
              <Text style={styles.toolCardTitle}>Factures</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    paddingBottom: 8,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    borderTopWidth: 3,
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    minHeight: 100,
  },
  toolCardAmber:   { borderTopColor: '#f59e0b' },
  toolCardGreen:   { borderTopColor: '#10b981' },
  toolCardIndigo:  { borderTopColor: '#6366f1' },
  toolCardRose:    { borderTopColor: '#f43f5e' },
  toolCardCyan:    { borderTopColor: '#0ea5e9' },
  toolCardViolet:  { borderTopColor: '#8b5cf6' },
  toolCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolCardIconAmber:  { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  toolCardIconGreen: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  toolCardIconIndigo: { backgroundColor: 'rgba(99, 102, 241, 0.2)' },
  toolCardIconRose:  { backgroundColor: 'rgba(244, 63, 94, 0.2)' },
  toolCardIconCyan:  { backgroundColor: 'rgba(14, 165, 233, 0.2)' },
  toolCardIconViolet: { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
  toolCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  comingSoonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
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
    color: '#e2e8f0',
    marginBottom: 4,
  },
  comingSoonDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0ea5e9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});


