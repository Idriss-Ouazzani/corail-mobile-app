/**
 * DriverVerificationProfileScreen - Wizard "Vérifier mon profil"
 * Carte VTC recto + verso, identité (CNI recto/verso ou passeport une page), assurance RC Pro.
 * Statuts par doc : missing | uploaded | approved | rejected.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../services/api';
import { theme } from '../theme';

type DocPick = 'vtc_card' | 'vtc_card_verso' | 'id_card' | 'id_card_verso' | 'insurance';

interface DriverVerificationProfileScreenProps {
  onBack: () => void;
  onSubmitted?: () => void;
}

export default function DriverVerificationProfileScreen({ onBack, onSubmitted }: DriverVerificationProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<{
    driver_verification_status: string | null;
    driver_verification_rejection_reason: string | null;
    verification_id_document_type?: string | null;
    verification_vtc_card_status: string;
    verification_vtc_card_status_verso?: string | null;
    verification_id_card_status: string;
    verification_id_card_status_verso?: string | null;
    verification_insurance_status: string;
    verification_vtc_card_admin_notes: string | null;
    verification_vtc_card_admin_notes_verso?: string | null;
    verification_id_card_admin_notes: string | null;
    verification_id_card_admin_notes_verso?: string | null;
    verification_insurance_admin_notes: string | null;
  } | null>(null);
  const [ensureError, setEnsureError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getDriverVerification();
      setData(res || null);
    } catch (e) {
      console.warn('Driver verification load:', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const hasEnsuredRef = useRef(false);

  /** Créer un profil VTC minimal si absent (la vérification est administrative, pas liée à la Page Pro). */
  const ensureProfileThenLoad = async () => {
    try {
      setEnsureError(null);
      setLoading(true);
      await apiClient.updateVTCProfile({});
      await load();
    } catch (e: any) {
      console.warn('ensureProfileThenLoad:', e);
      setEnsureError(e?.message || 'Impossible de préparer le dossier. Vérifiez votre connexion.');
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!loading && data === null && !hasEnsuredRef.current) {
      hasEnsuredRef.current = true;
      ensureProfileThenLoad();
    }
  }, [loading, data]);

  const pickImage = async (docType: DocPick) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'accès aux photos pour ajouter le document.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
        base64: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setSubmitting(true);
      await apiClient.uploadDriverVerificationDocument(docType, {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `doc.jpg`,
        base64: (asset as { base64?: string }).base64,
      });
      await load();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d\'envoyer le document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await apiClient.submitDriverVerification();
      await load();
      onSubmitted?.();
      Alert.alert(
        'Vérification envoyée',
        'Vos documents ont été soumis. Nous les examinerons sous peu. Vous pouvez modifier un document tant que l\'examen n\'est pas terminé.'
      );
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de soumettre.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <Text style={styles.headerTitleCentered}>Vérifier mon profil</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 16 }} />
          <Text style={styles.noProfileText}>Préparation de votre dossier de vérification...</Text>
          {ensureError ? (
            <Text style={styles.ensureErrorText}>{ensureError}</Text>
          ) : null}
          <TouchableOpacity style={styles.ensureProfileBtn} onPress={ensureProfileThenLoad}>
            <Text style={styles.ensureProfileBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = data?.driver_verification_status ?? 'not_started';
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  const idDocType = (data?.verification_id_document_type || 'cni') as 'cni' | 'passport';

  const vtcDocs: { key: DocPick; label: string; hint: string }[] = [
    { key: 'vtc_card', label: 'Recto', hint: 'Photo nette, texte lisible' },
    { key: 'vtc_card_verso', label: 'Verso', hint: 'Face arrière de la carte professionnelle' },
  ];

  const idDocs: { key: DocPick; label: string; hint: string }[] =
    idDocType === 'passport'
      ? [{ key: 'id_card', label: 'Page identité', hint: 'Photo de la page avec votre photo et vos informations, document valide' }]
      : [
          { key: 'id_card', label: 'Recto', hint: 'CNI ou titre de séjour — face avec photo' },
          { key: 'id_card_verso', label: 'Verso', hint: 'Face indiquant la validité du document' },
        ];

  const insDocs: { key: DocPick; label: string; hint: string }[] = [
    { key: 'insurance', label: 'Attestation RC professionnelle', hint: 'Photo ou PDF à jour' },
  ];

  const allDocRows = [...vtcDocs, ...idDocs, ...insDocs];

  const statusFor = (key: DocPick): string => {
    if (!data) return 'missing';
    switch (key) {
      case 'vtc_card':
        return data.verification_vtc_card_status ?? 'missing';
      case 'vtc_card_verso':
        return data.verification_vtc_card_status_verso ?? 'missing';
      case 'id_card':
        return data.verification_id_card_status ?? 'missing';
      case 'id_card_verso':
        return data.verification_id_card_status_verso ?? 'missing';
      case 'insurance':
        return data.verification_insurance_status ?? 'missing';
    }
  };

  const adminNoteFor = (key: DocPick): string | null | undefined => {
    if (!data) return undefined;
    switch (key) {
      case 'vtc_card':
        return data.verification_vtc_card_admin_notes;
      case 'vtc_card_verso':
        return data.verification_vtc_card_admin_notes_verso;
      case 'id_card':
        return data.verification_id_card_admin_notes;
      case 'id_card_verso':
        return data.verification_id_card_admin_notes_verso;
      case 'insurance':
        return data.verification_insurance_admin_notes;
    }
  };

  const canEdit = isPending || isRejected || status === 'not_started';
  const totalSlots = allDocRows.length;
  const countUploaded = allDocRows.filter(({ key }) => {
    const s = statusFor(key);
    return s === 'uploaded' || s === 'approved';
  }).length;
  const allUploaded = totalSlots > 0 && countUploaded === totalSlots;
  const canSubmit = allUploaded && (status === 'not_started' || isRejected) && !submitting;

  const handleIdTypeChange = async (next: 'cni' | 'passport') => {
    if (!data || !canEdit || next === idDocType) return;
    try {
      setSubmitting(true);
      await apiClient.setVerificationIdDocumentType(next);
      await load();
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de mettre à jour le type de pièce.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderUploadRow = (key: DocPick, label: string, hint: string) => {
    const st = statusFor(key);
    const adminNotes = adminNoteFor(key);
    const isRej = st === 'rejected';
    return (
      <View key={key} style={[styles.docRow, isRej && styles.docRowRejected]}>
        <View style={styles.docRowTop}>
          <View style={styles.docRowTitleCol}>
            <Text style={styles.docRowLabel}>{label}</Text>
            <Text style={styles.docHint}>{hint}</Text>
          </View>
          <View style={styles.docRowActions}>
            {st === 'approved' && <Ionicons name="checkmark-circle" size={22} color="#34d399" />}
            {st === 'rejected' && <Ionicons name="close-circle" size={22} color="#f87171" />}
            {st === 'uploaded' && <Text style={styles.docStatusPill}>Envoyé</Text>}
            {st === 'missing' && canEdit && (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickImage(key)}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.uploadBtnText}>Ajouter</Text>
              </TouchableOpacity>
            )}
            {(st === 'uploaded' || st === 'rejected') && canEdit && (
              <TouchableOpacity
                style={styles.uploadBtnOutline}
                onPress={() => pickImage(key)}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.uploadBtnOutlineText}>Remplacer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {adminNotes ? <Text style={styles.adminNotes}>Note : {adminNotes}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitleCentered}>Vérifier mon profil</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.intro}>
          La vérification protège les clients et débloque le réseau ainsi que les réservations directes sur getcorail.com.
        </Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Progression du dossier</Text>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[theme.colors.primary, '#fb923c']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[
                styles.progressFill,
                { width: `${totalSlots ? (countUploaded / totalSlots) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressMeta}>
            {countUploaded} sur {totalSlots || '—'} pièces jointes
          </Text>
        </View>

        {isApproved && (
          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark" size={28} color="#34d399" />
            <Text style={styles.statusBadgeText}>Profil vérifié</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time" size={20} color="#fbbf24" />
            <Text style={styles.pendingBannerText}>
              Vérification en cours. Vous pouvez encore remplacer un document si besoin.
            </Text>
          </View>
        )}

        {isRejected && data?.driver_verification_rejection_reason && (
          <View style={styles.rejectedBanner}>
            <Text style={styles.rejectedBannerText}>{data.driver_verification_rejection_reason}</Text>
          </View>
        )}

        {/* Carte VTC */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#0ea5e9', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.sectionAccentBar}
            />
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionEyebrow}>Document 1</Text>
              <Text style={styles.sectionTitle}>Carte professionnelle</Text>
              <Text style={styles.sectionSubtitle}>Recto et verso de votre carte VTC.</Text>
            </View>
          </View>
          <View style={styles.sectionBody}>{vtcDocs.map((d) => renderUploadRow(d.key, d.label, d.hint))}</View>
        </View>

        {/* Pièce d’identité — choix CNI/titre vs passeport uniquement ici */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#a855f7', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.sectionAccentBar}
            />
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionEyebrow}>Document 2</Text>
              <Text style={styles.sectionTitle}>Pièce d’identité</Text>
              <Text style={styles.sectionSubtitle}>
                Indiquez le type de document, puis ajoutez les photos demandées.
              </Text>
            </View>
          </View>
          <View style={styles.sectionBody}>
            {canEdit ? (
              <View style={styles.idSegmentWrap}>
                <Text style={styles.idSegmentLabel}>Type de document</Text>
                <View style={styles.idSegmentTrack}>
                  <TouchableOpacity
                    style={[styles.idSegmentCell, idDocType === 'cni' && styles.idSegmentCellActive]}
                    onPress={() => handleIdTypeChange('cni')}
                    disabled={submitting}
                    activeOpacity={0.88}
                  >
                    <Text style={[styles.idSegmentTitle, idDocType === 'cni' && styles.idSegmentTitleActive]}>
                      CNI / titre
                    </Text>
                    <Text style={[styles.idSegmentHint, idDocType === 'cni' && styles.idSegmentHintActive]}>
                      2 photos · recto & verso
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.idSegmentCell, idDocType === 'passport' && styles.idSegmentCellActive]}
                    onPress={() => handleIdTypeChange('passport')}
                    disabled={submitting}
                    activeOpacity={0.88}
                  >
                    <Text style={[styles.idSegmentTitle, idDocType === 'passport' && styles.idSegmentTitleActive]}>
                      Passeport
                    </Text>
                    <Text style={[styles.idSegmentHint, idDocType === 'passport' && styles.idSegmentHintActive]}>
                      1 photo · page identité
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.idReadonlyChip}>
                <Ionicons name="finger-print-outline" size={18} color="#94a3b8" />
                <Text style={styles.idReadonlyChipText}>
                  {idDocType === 'passport' ? 'Passeport (1 photo)' : 'CNI ou titre (recto + verso)'}
                </Text>
              </View>
            )}
            {idDocs.map((d) => renderUploadRow(d.key, d.label, d.hint))}
          </View>
        </View>

        {/* Assurance */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[theme.colors.primary, '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.sectionAccentBar}
            />
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionEyebrow}>Document 3</Text>
              <Text style={styles.sectionTitle}>Assurance RC Pro</Text>
              <Text style={styles.sectionSubtitle}>Attestation à jour de votre assurance responsabilité civile professionnelle.</Text>
            </View>
          </View>
          <View style={styles.sectionBody}>{insDocs.map((d) => renderUploadRow(d.key, d.label, d.hint))}</View>
        </View>

        {canSubmit && (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.92}
            style={[styles.submitOuter, submitting && styles.submitBtnDisabled]}
          >
            <LinearGradient
              colors={['#ff6b47', '#ea580c']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Soumettre pour vérification</Text>
                  <Ionicons name="paper-plane" size={18} color="#fff" style={styles.submitIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={styles.footerHint}>
          Délai indicatif : examen sous quelques jours. Nous vous préviendrons dès que votre profil sera validé.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    position: 'relative',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  headerTitleCentered: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  intro: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 22,
    letterSpacing: 0.2,
  },
  progressCard: {
    marginBottom: 22,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressMeta: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 10,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 18,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.28)',
    gap: 10,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6ee7b7',
    letterSpacing: 0.3,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.22)',
    gap: 10,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#fcd34d',
    lineHeight: 19,
  },
  rejectedBanner: {
    padding: 14,
    marginBottom: 18,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  rejectedBannerText: {
    fontSize: 13,
    color: '#fca5a5',
    lineHeight: 19,
  },
  sectionCard: {
    marginBottom: 18,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 14,
  },
  sectionAccentBar: {
    width: 4,
    borderRadius: 4,
    minHeight: 56,
    alignSelf: 'stretch',
  },
  sectionHeaderText: {
    flex: 1,
    paddingBottom: 8,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
  },
  sectionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  docRow: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  docRowRejected: {
    borderColor: 'rgba(248, 113, 113, 0.45)',
    backgroundColor: 'rgba(127, 29, 29, 0.12)',
  },
  docRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  docRowTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  docRowLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  docRowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  docStatusPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  docHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 17,
  },
  adminNotes: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 6,
    fontStyle: 'italic',
  },
  uploadBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  uploadBtnOutline: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.22)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  uploadBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  submitOuter: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  submitIcon: {
    marginLeft: 8,
  },
  footerHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 18,
  },
  noProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginTop: 16,
    textAlign: 'center',
  },
  noProfileHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  ensureProfileBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  ensureProfileBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  ensureErrorText: {
    fontSize: 13,
    color: '#f87171',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  idSegmentWrap: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  idSegmentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  idSegmentTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    gap: 6,
  },
  idSegmentCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  idSegmentCellActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
    borderColor: 'rgba(165, 180, 252, 0.45)',
  },
  idSegmentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94a3b8',
  },
  idSegmentTitleActive: {
    color: '#f8fafc',
  },
  idSegmentHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  idSegmentHintActive: {
    color: '#c4b5fd',
  },
  idReadonlyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(51, 65, 85, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  idReadonlyChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
});
