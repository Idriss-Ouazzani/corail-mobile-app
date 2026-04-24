import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { formatPhoneDisplay } from '../utils/phoneFormat';
import { apiClient } from '../services/api';
import type { CredentialChangeRequestType } from '../services/supabaseApi';
import { CredentialFieldEditModal } from '../components/CredentialFieldEditModal';
import { LegalInfoModal } from '../components/LegalInfoModal';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

function formatSiretDisplay(raw: string) {
  const d = raw.replace(/\s/g, '');
  if (d.length !== 14 || !/^\d+$/.test(d)) return raw?.trim() || '';
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

function vatOptionLabel(opt: string | null | undefined): string {
  if (opt === 'VAT_10') return 'TVA 10 % (assujetti)';
  if (opt === 'NON_APPLICABLE') return 'TVA non applicable (micro-entreprise)';
  return opt?.trim() || '—';
}

interface PersonalInfoScreenProps {
  onBack: () => void;
  fullName?: string;
  email?: string;
  phone?: string;
  siret?: string;
  vtcCard?: string;
  isDriverVerified?: boolean;
  onVerificationDocUpdated?: () => Promise<void> | void;
  onLegalInfoSaved?: () => Promise<void> | void;
  onOpenDriverVerification?: () => void;
}

type LegalSummary = {
  legal_business_name: string | null;
  legal_address_line1: string | null;
  legal_postal_code: string | null;
  legal_city: string | null;
  siret: string | null;
  vat_option: string | null;
  vat_number: string | null;
  legal_info_configured: boolean;
};

const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({
  onBack,
  fullName = '',
  email = '',
  phone = '',
  siret = '',
  vtcCard = '',
  isDriverVerified = false,
  onVerificationDocUpdated,
  onLegalInfoSaved,
  onOpenDriverVerification,
}) => {
  const [legalSummary, setLegalSummary] = useState<LegalSummary | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editField, setEditField] = useState<CredentialChangeRequestType | null>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const initials = getInitials(fullName);
  const phoneDisplay = phone?.trim() ? formatPhoneDisplay(phone) : '';
  const siretDisplayProp = siret?.trim() ? formatSiretDisplay(siret) : '';

  const loadLegalSummary = useCallback(async () => {
    try {
      setProfileLoading(true);
      const p = await apiClient.getMyVTCProfile();
      if (!p) {
        setLegalSummary(null);
        return;
      }
      setLegalSummary({
        legal_business_name: (p.legal_business_name as string) ?? null,
        legal_address_line1: (p.legal_address_line1 as string) ?? null,
        legal_postal_code: (p.legal_postal_code as string) ?? null,
        legal_city: (p.legal_city as string) ?? null,
        siret: (p.siret as string) ?? null,
        vat_option: (p.vat_option as string) ?? null,
        vat_number: (p.vat_number as string) ?? null,
        legal_info_configured: !!(p as { legal_info_configured?: boolean }).legal_info_configured,
      });
    } catch {
      setLegalSummary(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLegalSummary();
  }, [loadLegalSummary]);

  const siretFacturation =
    (legalSummary?.siret && String(legalSummary.siret).replace(/\s/g, '')) ? formatSiretDisplay(legalSummary.siret) : siretDisplayProp || '—';

  const addressFacturation = [legalSummary?.legal_address_line1, [legalSummary?.legal_postal_code, legalSummary?.legal_city].filter(Boolean).join(' ')]
    .filter((x) => x && String(x).trim())
    .join(', ') || '—';

  const currentForField = (f: CredentialChangeRequestType): string => {
    if (f === 'phone') return phoneDisplay || phone || '—';
    if (f === 'vtc_number') return vtcCard || '—';
    if (f === 'siret') return siretFacturation !== '—' ? siretFacturation : siretDisplayProp || '—';
    return 'Attestation RC Pro enregistrée';
  };

  const openEdit = (f: CredentialChangeRequestType) => {
    if (!isDriverVerified) return;
    setEditField(f);
  };

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
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {email || '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <ProfileFieldRow icon="person" iconColor={theme.colors.info} label="Nom complet" value={fullName} />
          <ProfileFieldRow icon="mail" iconColor={theme.colors.success} label="Email" value={email} />
          <ProfileFieldRow
            icon="call"
            iconColor={theme.colors.warning}
            label="Téléphone"
            value={phoneDisplay || phone || '—'}
            showPen={isDriverVerified}
            onPenPress={() => openEdit('phone')}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations professionnelles</Text>
          <ProfileFieldRow
            icon="card"
            iconColor={theme.colors.info}
            label="N° carte VTC"
            value={vtcCard || '—'}
            showPen={isDriverVerified}
            onPenPress={() => openEdit('vtc_number')}
          />
          <ProfileFieldRow
            icon="shield-checkmark-outline"
            iconColor="#0d9488"
            label="Assurance RC Pro"
            value={isDriverVerified ? 'Demander une mise à jour (pièce)' : 'Après vérification du profil'}
            showPen={isDriverVerified}
            onPenPress={() => openEdit('insurance')}
          />

          {onOpenDriverVerification ? (
            <TouchableOpacity style={styles.verifyLink} onPress={onOpenDriverVerification} activeOpacity={0.85}>
              <Ionicons name="folder-open-outline" size={18} color={theme.colors.info} />
              <Text style={styles.verifyLinkText}>
                Déposer ou mettre à jour vos documents de vérification (carte pro, identité, assurance)
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Société & facturation</Text>
            <TouchableOpacity
              style={styles.penBtn}
              onPress={() => setShowLegalModal(true)}
              activeOpacity={0.85}
              accessibilityLabel="Modifier société et facturation"
            >
              <Ionicons name="pencil" size={18} color="#0f172a" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionHint}>Devis, factures : raison sociale, adresse, SIRET, TVA, KBIS.</Text>

          {profileLoading ? (
            <ActivityIndicator color={theme.colors.info} style={{ marginVertical: 16 }} />
          ) : (
            <>
              <Text style={styles.legalLineLabel}>Raison sociale</Text>
              <Text style={styles.legalLineValue}>{legalSummary?.legal_business_name?.trim() || fullName || '—'}</Text>
              <Text style={styles.legalLineLabel}>Adresse</Text>
              <Text style={styles.legalLineValue}>{addressFacturation}</Text>
              <Text style={styles.legalLineLabel}>SIRET (facturation)</Text>
              <Text style={styles.legalLineValue}>{siretFacturation}</Text>
              <Text style={styles.legalLineLabel}>TVA</Text>
              <Text style={styles.legalLineValue}>{vatOptionLabel(legalSummary?.vat_option)}</Text>
              {legalSummary?.vat_option === 'VAT_10' ? (
                <>
                  <Text style={styles.legalLineLabel}>N° TVA intracommunautaire</Text>
                  <Text style={styles.legalLineValue}>{legalSummary?.vat_number?.trim() || '—'}</Text>
                </>
              ) : null}
              <Text style={styles.legalStatus}>
                {legalSummary?.legal_info_configured ? 'Fiche prête pour la facturation' : 'À compléter via le stylet ci-dessus'}
              </Text>
            </>
          )}

          {isDriverVerified ? (
            <TouchableOpacity style={styles.certifiedLink} onPress={() => openEdit('siret')} activeOpacity={0.85}>
              <Ionicons name="ribbon-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.certifiedLinkText}>
                Changement de SIRET avec validation équipe
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isDriverVerified ? (
          <View style={styles.card}>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={22} color={theme.colors.success} />
              <View style={styles.infoCardTextBlock}>
                <Text style={styles.infoCardTitle}>Profil chauffeur vérifié</Text>
                <Text style={styles.infoCardText}>
                  Les modifications d’identifiants (téléphone, carte, assurance) passent par l’équipe pour contrôle.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>

      <CredentialFieldEditModal
        visible={editField != null}
        field={editField}
        currentDisplay={editField ? currentForField(editField) : ''}
        onClose={() => setEditField(null)}
        onSubmitted={async () => {
          await loadLegalSummary();
          await onVerificationDocUpdated?.();
        }}
      />

      <LegalInfoModal
        visible={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialBusinessName={legalSummary?.legal_business_name?.trim() || fullName}
        onSaved={async () => {
          setShowLegalModal(false);
          await loadLegalSummary();
          await onLegalInfoSaved?.();
        }}
        onLater={() => setShowLegalModal(false)}
      />
    </View>
  );
};

function ProfileFieldRow({
  icon,
  iconColor,
  label,
  value,
  showPen,
  onPenPress,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value?: string;
  showPen?: boolean;
  onPenPress?: () => void;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={[styles.fieldIconWrap, { backgroundColor: iconColor + '25' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value?.trim() || 'Non renseigné'}</Text>
      </View>
      {showPen && onPenPress ? (
        <TouchableOpacity style={styles.penBtn} onPress={onPenPress} activeOpacity={0.85} accessibilityLabel={`Modifier ${label}`}>
          <Ionicons name="pencil" size={18} color="#0f172a" />
        </TouchableOpacity>
      ) : (
        <View style={styles.penPlaceholder} />
      )}
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginHorizontal: theme.spacing.sm,
    textAlign: 'center',
  },
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  sectionHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    lineHeight: 17,
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
  penBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  penPlaceholder: { width: 42, height: 42 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.infoBgSoft ?? 'rgba(14, 165, 233, 0.08)',
    borderRadius: theme.radii.sm,
    padding: 14,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.25)',
    gap: theme.spacing.sm,
  },
  infoCardTextBlock: { flex: 1 },
  infoCardTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  infoCardText: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, lineHeight: 17 },
  verifyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: theme.spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  verifyLinkText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
  legalLineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  legalLineValue: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary, marginTop: 4 },
  legalStatus: { fontSize: 12, color: theme.colors.textMuted, marginTop: 12, fontStyle: 'italic' },
  certifiedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 8,
  },
  certifiedLinkText: { flex: 1, fontSize: 12, color: theme.colors.textMuted, textDecorationLine: 'underline' },
});

export default PersonalInfoScreen;
