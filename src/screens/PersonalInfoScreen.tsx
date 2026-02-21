import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

interface PersonalInfoScreenProps {
  onBack: () => void;
  fullName?: string;
  email?: string;
  phone?: string;
  siret?: string;
  vtcCard?: string;
}

const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({
  onBack,
  fullName = '',
  email = '',
  phone = '',
  siret = '',
  vtcCard = '',
}) => {
  const { loadVerificationStatus } = useAuth();
  const [isEditingSiret, setIsEditingSiret] = useState(false);
  const [localSiret, setLocalSiret] = useState(siret);
  const [savingSiret, setSavingSiret] = useState(false);

  const handleSaveSiret = async () => {
    const value = localSiret.trim();
    if (value && value.length !== 9 && value.length !== 14) {
      Alert.alert('SIRET / SIREN', 'Le SIREN comporte 9 chiffres, le SIRET 14 chiffres.');
      return;
    }
    setSavingSiret(true);
    try {
      await apiClient.updateUserProfile({ siren: value || undefined });
      await loadVerificationStatus();
      setIsEditingSiret(false);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible d\'enregistrer.');
    } finally {
      setSavingSiret(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const initials = getInitials(fullName);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informations personnelles</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>{fullName || 'Non renseigné'}</Text>
              <Text style={styles.heroSubtitle} numberOfLines={1}>{email || '—'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <FieldRow icon="person" iconColor={theme.colors.info} label="Nom complet" value={fullName} />
          <FieldRow icon="mail" iconColor={theme.colors.success} label="Email" value={email} />
          <FieldRow icon="call" iconColor={theme.colors.warning} label="Téléphone" value={phone} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations professionnelles</Text>
          {isEditingSiret ? (
            <View style={styles.siretEditRow}>
              <View style={[styles.fieldIconWrap, { backgroundColor: theme.colors.accentLight + '25' }]}>
                <Ionicons name="business" size={18} color={theme.colors.accentLight} />
              </View>
              <View style={styles.siretEditContent}>
                <Text style={styles.fieldLabel}>SIRET / SIREN</Text>
                <TextInput
                  style={styles.siretInput}
                  value={localSiret}
                  onChangeText={setLocalSiret}
                  placeholder="9 (SIREN) ou 14 chiffres (SIRET)"
                  placeholderTextColor={theme.colors.textMutedDark}
                  keyboardType="number-pad"
                  maxLength={14}
                  editable={!savingSiret}
                />
                <View style={styles.siretActions}>
                  <TouchableOpacity
                    style={styles.siretCancelBtn}
                    onPress={() => { setIsEditingSiret(false); setLocalSiret(siret); }}
                    disabled={savingSiret}
                  >
                    <Text style={styles.siretCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.siretSaveBtn}
                    onPress={handleSaveSiret}
                    disabled={savingSiret}
                  >
                    {savingSiret ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                      <Text style={styles.siretSaveText}>Enregistrer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIconWrap, { backgroundColor: theme.colors.accentLight + '25' }]}>
                <Ionicons name="business" size={18} color={theme.colors.accentLight} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>SIRET / SIREN</Text>
                <Text style={styles.fieldValue}>{siret?.trim() || 'Non renseigné'}</Text>
              </View>
              <TouchableOpacity
                style={styles.editSiretButton}
                onPress={() => { setLocalSiret(siret); setIsEditingSiret(true); }}
              >
                <Ionicons name="pencil" size={18} color={theme.colors.primary} />
                <Text style={styles.editSiretButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          )}
          <FieldRow icon="card" iconColor={theme.colors.info} label="Carte VTC" value={vtcCard} />
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={22} color={theme.colors.success} />
            <View style={styles.infoCardTextBlock}>
              <Text style={styles.infoCardTitle}>Compte vérifié</Text>
              <Text style={styles.infoCardText}>Profil professionnel vérifié</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

function FieldRow({ icon, iconColor, label, value }: { icon: string; iconColor: string; label: string; value?: string }) {
  return (
    <View style={styles.fieldRow}>
      <View style={[styles.fieldIconWrap, { backgroundColor: iconColor + '25' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value?.trim() || 'Non renseigné'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: theme.colors.text, marginHorizontal: theme.spacing.sm, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 40 },
  heroWrap: {
    height: 110,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlayLight },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: theme.colors.white },
  heroTextBlock: { flex: 1, minWidth: 0 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  heroSubtitle: { fontSize: 13, color: theme.colors.textMuted },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMutedDark,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.3,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderMuted,
    gap: theme.spacing.sm,
  },
  fieldIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContent: { flex: 1, minWidth: 0 },
  fieldLabel: { fontSize: 12, color: theme.colors.textMutedDark, marginBottom: 2 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  editSiretButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  editSiretButtonText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  siretEditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderMuted,
    gap: theme.spacing.sm,
  },
  siretEditContent: { flex: 1, minWidth: 0 },
  siretInput: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radii.sm,
    padding: 12,
    fontSize: 15,
    color: theme.colors.textSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 6,
  },
  siretActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  siretCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceElevated,
  },
  siretCancelText: { fontSize: 14, fontWeight: '600', color: theme.colors.textMuted },
  siretSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
    minWidth: 120,
    alignItems: 'center',
  },
  siretSaveText: { fontSize: 14, fontWeight: '700', color: theme.colors.white },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successBg,
    borderRadius: theme.radii.sm,
    padding: 14,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.successBorder,
    gap: theme.spacing.sm,
  },
  infoCardTextBlock: { flex: 1 },
  infoCardTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.success },
  infoCardText: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
});

export default PersonalInfoScreen;
