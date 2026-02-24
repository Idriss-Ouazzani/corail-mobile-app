/**
 * DriverVerificationProfileScreen - Wizard "Vérifier mon profil"
 * 3 documents : carte pro, pièce d'identité, attestation assurance RC Pro.
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
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../services/api';
import { theme } from '../theme';

const DOCS = [
  { key: 'vtc_card' as const, label: 'Carte professionnelle chauffeur', hint: 'Photo recto nette' },
  { key: 'id_card' as const, label: 'Pièce d\'identité', hint: 'CNI ou passeport, en cours de validité' },
  { key: 'insurance' as const, label: 'Attestation assurance RC Pro', hint: 'Photo ou PDF du document' },
] as const;

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
    verification_vtc_card_status: string;
    verification_id_card_status: string;
    verification_insurance_status: string;
    verification_vtc_card_admin_notes: string | null;
    verification_id_card_admin_notes: string | null;
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

  const pickImage = async (docType: 'vtc_card' | 'id_card' | 'insurance') => {
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

  const vtcStatus = data?.verification_vtc_card_status ?? 'missing';
  const idStatus = data?.verification_id_card_status ?? 'missing';
  const insStatus = data?.verification_insurance_status ?? 'missing';

  const canEdit = isPending || isRejected || status === 'not_started';
  const countUploaded = [vtcStatus, idStatus, insStatus].filter(
    s => s === 'uploaded' || s === 'approved'
  ).length;
  const allUploaded = countUploaded === 3;
  const canSubmit = allUploaded && (status === 'not_started' || isRejected) && !submitting;

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
          La vérification protège les clients et débloque les opportunités réseau (marketplace et réservations via getcorail.com).
        </Text>

        {/* Barre de progression */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(countUploaded / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{countUploaded}/3 documents</Text>
        </View>

        {isApproved && (
          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark" size={28} color="#22c55e" />
            <Text style={styles.statusBadgeText}>Profil vérifié</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time" size={20} color="#f59e0b" />
            <Text style={styles.pendingBannerText}>
              Vérification en cours. Vous pouvez encore modifier un document si besoin.
            </Text>
          </View>
        )}

        {isRejected && data?.driver_verification_rejection_reason && (
          <View style={styles.rejectedBanner}>
            <Text style={styles.rejectedBannerText}>{data.driver_verification_rejection_reason}</Text>
          </View>
        )}

        {/* Cartes documents */}
        {DOCS.map(({ key, label, hint }) => {
          const docStatus = key === 'vtc_card' ? vtcStatus : key === 'id_card' ? idStatus : insStatus;
          const adminNotes = key === 'vtc_card'
            ? data?.verification_vtc_card_admin_notes
            : key === 'id_card'
              ? data?.verification_id_card_admin_notes
              : data?.verification_insurance_admin_notes;
          const isDone = docStatus === 'approved' || docStatus === 'uploaded';
          const isRej = docStatus === 'rejected';

          return (
            <View key={key} style={[styles.docCard, isRej && styles.docCardRejected]}>
              <View style={styles.docCardTop}>
                <Text style={styles.docLabel}>{label}</Text>
                {docStatus === 'approved' && <Ionicons name="checkmark-circle" size={22} color="#22c55e" />}
                {docStatus === 'rejected' && <Ionicons name="close-circle" size={22} color="#ef4444" />}
                {docStatus === 'uploaded' && <Text style={styles.docStatusLabel}>Envoyé</Text>}
                {docStatus === 'missing' && canEdit && (
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => pickImage(key)}
                    disabled={submitting}
                  >
                    <Text style={styles.uploadBtnText}>Ajouter</Text>
                  </TouchableOpacity>
                )}
                {(docStatus === 'uploaded' || docStatus === 'rejected') && canEdit && (
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => pickImage(key)}
                    disabled={submitting}
                  >
                    <Text style={styles.uploadBtnText}>Remplacer</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.docHint}>{hint}</Text>
              {adminNotes && (
                <Text style={styles.adminNotes}>Note : {adminNotes}</Text>
              )}
            </View>
          );
        })}

        {canSubmit && (
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Soumettre pour vérification</Text>
            )}
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
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressWrap: {
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 12,
    gap: 8,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
    gap: 8,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#fbbf24',
  },
  rejectedBanner: {
    padding: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
  },
  rejectedBannerText: {
    fontSize: 13,
    color: '#f87171',
  },
  docCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  docCardRejected: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  docCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  docLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
  },
  docStatusLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 8,
  },
  docHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  adminNotes: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 6,
    fontStyle: 'italic',
  },
  uploadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  submitBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});
