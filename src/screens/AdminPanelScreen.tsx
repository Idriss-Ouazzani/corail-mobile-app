import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Button,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';

interface PendingDriverVerification {
  id: string;
  user_id: string;
  driver_verification_submitted_at: string | null;
  verification_vtc_card_status: string;
  verification_id_card_status: string;
  verification_insurance_status: string;
  verification_vtc_card_url: string | null;
  verification_id_card_url: string | null;
  verification_insurance_url: string | null;
  user?: { id: string; full_name: string | null; email: string | null };
}

interface AdminPanelScreenProps {
  onBack: () => void;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({ onBack }) => {
  const [pendingDriverVerifications, setPendingDriverVerifications] = useState<PendingDriverVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<PendingDriverVerification | null>(null);
  const [signedUrls, setSignedUrls] = useState<{ vtc_card?: string; id_card?: string; insurance?: string }>({});
  const [processingDoc, setProcessingDoc] = useState<string | null>(null);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [expandedDocUrl, setExpandedDocUrl] = useState<string | null>(null);
  const [expandedDocDataUrl, setExpandedDocDataUrl] = useState<string | null>(null);
  const [docImageError, setDocImageError] = useState(false);
  const [docImageLoading, setDocImageLoading] = useState(false);
  const [docImageErrorMsg, setDocImageErrorMsg] = useState<string | null>(null);

  const closeDriverModal = () => {
    setSelectedDriver(null);
    setSignedUrls({});
    setExpandedDocUrl(null);
    setExpandedDocDataUrl(null);
    setDocImageError(false);
    setDocImageErrorMsg(null);
    setDocImageLoading(false);
  };

  const loadPendingVerifications = async () => {
    try {
      setLoading(true);
      const driverVerifs = await apiClient.listPendingDriverVerifications().catch((err) => {
        console.warn('listPendingDriverVerifications:', err?.message || err);
        throw err;
      });
      setPendingDriverVerifications(driverVerifs);
    } catch (error: any) {
      console.error('❌ Erreur chargement vérifications:', error);
      setPendingDriverVerifications([]);
      Alert.alert(
        'Erreur',
        error?.message || 'Impossible de charger les vérifications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const isStoredAsUrl = (v: string | null | undefined) => typeof v === 'string' && v.startsWith('http');

  const openDriverDetail = async (driver: PendingDriverVerification) => {
    setSelectedDriver(driver);
    setSignedUrls({});
    setLoadingUrls(true);
    const urls: { vtc_card?: string; id_card?: string; insurance?: string } = {};
    try {
      // RLS strict : bucket privé → URLs signées via Edge Function (admin) ou URL déjà stockée
      if (driver.verification_vtc_card_url) {
        if (isStoredAsUrl(driver.verification_vtc_card_url)) {
          urls.vtc_card = driver.verification_vtc_card_url;
        } else {
          let u = await apiClient.getDriverVerificationDocumentSignedUrlAdmin(driver.verification_vtc_card_url).catch(() => null);
          if (!u) u = await apiClient.getDriverVerificationDocumentSignedUrl(driver.verification_vtc_card_url, 86400).catch(() => null);
          if (u) urls.vtc_card = u;
        }
      }
      if (driver.verification_id_card_url) {
        if (isStoredAsUrl(driver.verification_id_card_url)) {
          urls.id_card = driver.verification_id_card_url;
        } else {
          let u = await apiClient.getDriverVerificationDocumentSignedUrlAdmin(driver.verification_id_card_url).catch(() => null);
          if (!u) u = await apiClient.getDriverVerificationDocumentSignedUrl(driver.verification_id_card_url, 86400).catch(() => null);
          if (u) urls.id_card = u;
        }
      }
      if (driver.verification_insurance_url) {
        if (isStoredAsUrl(driver.verification_insurance_url)) {
          urls.insurance = driver.verification_insurance_url;
        } else {
          let u = await apiClient.getDriverVerificationDocumentSignedUrlAdmin(driver.verification_insurance_url).catch(() => null);
          if (!u) u = await apiClient.getDriverVerificationDocumentSignedUrl(driver.verification_insurance_url, 86400).catch(() => null);
          if (u) urls.insurance = u;
        }
      }
      setSignedUrls({ ...urls });
    } catch (e) {
      console.warn('URLs documents:', e);
      Alert.alert('Erreur', 'Impossible de charger les documents. Vérifiez vos droits admin.');
    } finally {
      setLoadingUrls(false);
    }
  };

  const isImageUrl = (u: string) => /\.(jpg|jpeg|png|gif|webp|heic)(\?|$)/i.test(u);

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    if (typeof globalThis.btoa !== 'undefined') return globalThis.btoa(binary);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < binary.length; i += 3) {
      const a = binary.charCodeAt(i);
      const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
      const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
      result += chars[(a >> 2) & 63] + chars[((a << 4) | (b >> 4)) & 63] + chars[((b << 2) | (c >> 6)) & 63] + chars[c & 63];
    }
    const pad = binary.length % 3;
    if (pad === 1) return result.slice(0, -2) + '==';
    if (pad === 2) return result.slice(0, -1) + '=';
    return result;
  };

  /** Quand on ouvre une image : fetch dans l'app puis affichage en data URI (contourne tout souci Image + URL). */
  useEffect(() => {
    if (!expandedDocUrl || !isImageUrl(expandedDocUrl)) return;
    let cancelled = false;
    setExpandedDocDataUrl(null);
    setDocImageError(false);
    setDocImageErrorMsg(null);
    setDocImageLoading(true);
    (async () => {
      try {
        const res = await fetch(expandedDocUrl, { method: 'GET' });
        if (cancelled) return;
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          setDocImageErrorMsg(`HTTP ${res.status}${text ? `: ${text.slice(0, 80)}` : ''}`);
          setDocImageError(true);
          console.warn('[AdminPanel] fetch doc image:', res.status, res.headers.get('content-type'), text?.slice(0, 200));
          return;
        }
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const base64 = arrayBufferToBase64(buf);
        const mime = res.headers.get('content-type') || 'image/jpeg';
        setExpandedDocDataUrl(`data:${mime};base64,${base64}`);
      } catch (e: any) {
        if (!cancelled) {
          setDocImageErrorMsg(e?.message ?? String(e));
          setDocImageError(true);
          console.warn('[AdminPanel] fetch doc image error:', e);
        }
      } finally {
        if (!cancelled) setDocImageLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [expandedDocUrl]);

  /** Ouvrir le document : image = affichage inline (fetch→base64) ; PDF = navigateur. */
  const handleOpenDoc = (url: string) => {
    if (!url) {
      Alert.alert('Erreur', 'Aucune URL disponible pour ce document.');
      return;
    }
    if (isImageUrl(url)) {
      setDocImageError(false);
      setDocImageErrorMsg(null);
      setExpandedDocUrl(url);
    } else {
      Linking.openURL(url).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir le lien.'));
    }
  };

  const handleReviewDoc = async (
    vtcProfileId: string,
    docType: 'vtc_card' | 'id_card' | 'insurance',
    status: 'approved' | 'rejected',
    adminNotes?: string
  ) => {
    try {
      setProcessingDoc(docType);
      const { allApproved } = await apiClient.reviewDriverVerificationDocument(
        vtcProfileId,
        docType,
        status,
        adminNotes || null
      );
      if (allApproved) {
        Alert.alert('Profil approuvé', 'Tous les documents sont validés. Le chauffeur a accès au réseau.');
        closeDriverModal();
        loadPendingVerifications();
      } else {
        setSelectedDriver(prev => prev ? { ...prev, [`verification_${docType}_status`]: status } as PendingDriverVerification : null);
        loadPendingVerifications();
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Action impossible');
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleRejectDriverProfile = (driver: PendingDriverVerification) => {
    Alert.prompt(
      'Rejeter la vérification',
      `Indiquez la raison du rejet pour ${driver.user?.full_name || driver.user_id} :`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async (value?: string) => {
            const reason = (value || '').trim();
            if (!reason) {
              Alert.alert('Erreur', 'Veuillez indiquer une raison');
              return;
            }
            try {
              setProcessingId(driver.id);
              await apiClient.rejectDriverVerification(driver.id, reason);
              Alert.alert('Rejeté', 'Le chauffeur a été notifié.');
              closeDriverModal();
              loadPendingVerifications();
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de rejeter');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Panel Admin</Text>
          <Text style={styles.headerSubtitle}>Validation VTC</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingDriverVerifications.length}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPendingVerifications();
            }}
            tintColor="#ff6b47"
          />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color="#0ea5e9" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoBannerTitle}>Vérification par documents</Text>
            <Text style={styles.infoBannerText}>
              Consulte les documents (carte pro, pièce d'identité, assurance) puis valide ou rejette chaque demande.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6b47" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : pendingDriverVerifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={64} color="#10b981" />
            <Text style={styles.emptyStateTitle}>Tout est à jour !</Text>
            <Text style={styles.emptyStateText}>
              Aucune vérification en attente.
            </Text>
            <Text style={styles.emptyStateHint}>
              Les demandes n’apparaissent que si un chauffeur a uploadé les 3 documents (carte pro, pièce d’identité, assurance) puis a cliqué sur « Soumettre pour vérification » (Ma Page Pro → Vérifier mon profil).
            </Text>
            <Text style={styles.emptyStateHint}>
              Pour vérifier en base : Supabase → SQL Editor → exécutez :{'\n'}
              SELECT id, user_id, driver_verification_status FROM vtc_profiles;
            </Text>
            <Text style={styles.emptyStateHint}>
              S’il n’y a aucune ligne avec driver_verification_status = 'pending', la liste restera vide. Script de test : supabase/scripts/force_one_profile_pending.sql
            </Text>
          </View>
        ) : (
          <>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Vérification chauffeur (documents)</Text>
            <Text style={styles.sectionHint}>Appuyez sur une carte pour voir les documents</Text>
          </View>
          {pendingDriverVerifications.map((driver) => (
            <TouchableOpacity
              key={driver.id}
              style={styles.verificationCard}
              onPress={() => openDriverDetail(driver)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {(driver.user?.full_name || driver.user_id).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{driver.user?.full_name || 'Chauffeur'}</Text>
                  <Text style={styles.userEmail}>{driver.user?.email || driver.user_id}</Text>
                </View>
                <View style={styles.timeTag}>
                  <Text style={styles.timeText}>
                    {driver.driver_verification_submitted_at
                      ? formatDate(driver.driver_verification_submitted_at)
                      : '—'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.infoLabel}>
                  Documents : Carte {driver.verification_vtc_card_status} · ID {driver.verification_id_card_status} · Assurance {driver.verification_insurance_status}
                </Text>
                <View style={styles.tapToViewHint}>
                  <Ionicons name="document-text-outline" size={14} color="#94a3b8" />
                  <Text style={styles.tapToViewHintText}>Appuyer pour voir les documents</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal détail vérification chauffeur */}
      <Modal
        visible={!!selectedDriver}
        animationType="slide"
        transparent
        onRequestClose={closeDriverModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDriver?.user?.full_name || selectedDriver?.user_id}
              </Text>
              <TouchableOpacity onPress={closeDriverModal} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#f1f5f9" />
              </TouchableOpacity>
            </View>
            {expandedDocUrl ? (
              <View style={styles.inlineDocViewer}>
                <ScrollView style={styles.inlineDocScroll} contentContainerStyle={styles.inlineDocScrollContent}>
                  {docImageLoading ? (
                    <View style={styles.inlineDocError}>
                      <ActivityIndicator size="large" color="#ff6b47" />
                      <Text style={styles.inlineDocErrorText}>Chargement...</Text>
                    </View>
                  ) : docImageError ? (
                    <View style={styles.inlineDocError}>
                      <Ionicons name="document-outline" size={48} color="#94a3b8" />
                      <Text style={styles.inlineDocErrorText}>Image non chargée</Text>
                      {docImageErrorMsg ? <Text style={styles.inlineDocErrorUrl} numberOfLines={3}>{docImageErrorMsg}</Text> : null}
                      <Text style={styles.inlineDocErrorUrl} numberOfLines={2}>{expandedDocUrl}</Text>
                      <TouchableOpacity style={styles.inlineDocBrowserBtn} onPress={() => Linking.openURL(expandedDocUrl)} activeOpacity={0.8}>
                        <Text style={styles.inlineDocCloseText}>Ouvrir dans le navigateur</Text>
                      </TouchableOpacity>
                    </View>
                  ) : expandedDocDataUrl ? (
                    <Image source={{ uri: expandedDocDataUrl }} style={styles.inlineDocImage} resizeMode="contain" />
                  ) : null}
                </ScrollView>
                <TouchableOpacity style={styles.inlineDocCloseBtn} onPress={() => { setExpandedDocUrl(null); setExpandedDocDataUrl(null); }} activeOpacity={0.8}>
                  <Ionicons name="close-circle" size={28} color="#fff" />
                  <Text style={styles.inlineDocCloseText}>Fermer le document</Text>
                </TouchableOpacity>
                {expandedDocUrl ? (
                  <TouchableOpacity style={styles.inlineDocBrowserBtn} onPress={() => Linking.openURL(expandedDocUrl)} activeOpacity={0.8}>
                    <Ionicons name="open-outline" size={20} color="#fff" />
                    <Text style={styles.inlineDocCloseText}>Ouvrir dans le navigateur</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : selectedDriver ? (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
              >
                <Text style={styles.modalIntro}>
                  Téléchargez ou ouvrez chaque document pour le consulter, puis validez ou rejetez.
                </Text>
                {[
                  { key: 'vtc_card' as const, label: 'Carte pro chauffeur', path: selectedDriver.verification_vtc_card_url, status: selectedDriver.verification_vtc_card_status, url: signedUrls.vtc_card },
                  { key: 'id_card' as const, label: 'Pièce d\'identité', path: selectedDriver.verification_id_card_url, status: selectedDriver.verification_id_card_status, url: signedUrls.id_card },
                  { key: 'insurance' as const, label: 'Assurance RC Pro', path: selectedDriver.verification_insurance_url, status: selectedDriver.verification_insurance_status, url: signedUrls.insurance },
                ].map(({ key, label, path, status, url }) => (
                  <View key={key} style={styles.docRow}>
                    <Text style={styles.docRowLabel}>{label}</Text>
                    <Text style={styles.docRowStatus}>{status}</Text>
                    {loadingUrls && path ? (
                      <View style={styles.docThumbPlaceholder}>
                        <ActivityIndicator color="#94a3b8" />
                        <Text style={styles.docThumbPlaceholderText}>Chargement...</Text>
                      </View>
                    ) : url ? (
                      <View style={styles.docBlock}>
                        <Pressable
                          onPress={() => handleOpenDoc(url)}
                          style={({ pressed }) => [styles.docThumbWrap, pressed && { opacity: 0.8 }]}
                        >
                          {isImageUrl(url) ? (
                            <Image
                              source={{ uri: url }}
                              style={styles.docThumbImage}
                              resizeMode="cover"
                              onError={() => {}}
                            />
                          ) : (
                            <View style={styles.docThumbPlaceholder}>
                              <Ionicons name="document-attach-outline" size={40} color="#94a3b8" />
                              <Text style={styles.docThumbPlaceholderText}>PDF</Text>
                            </View>
                          )}
                        </Pressable>
                        <View style={styles.docOpenButtonWrap}>
                          <Button
                            title="Ouvrir le document"
                            onPress={() => handleOpenDoc(url)}
                            color={Platform.OS === 'ios' ? '#ff6b47' : undefined}
                          />
                        </View>
                      </View>
                    ) : path ? (
                      <Text style={styles.docUnavailable}>Document non disponible</Text>
                    ) : null}
                    {(status === 'uploaded' || status === 'rejected') && (
                      <View style={styles.docActions}>
                        <TouchableOpacity
                          style={[styles.docBtn, styles.docBtnReject]}
                          onPress={() => {
                            Alert.prompt('Note (optionnel)', 'Raison du rejet', [
                              { text: 'Annuler', style: 'cancel' },
                              { text: 'Rejeter', style: 'destructive', onPress: (v) => handleReviewDoc(selectedDriver.id, key, 'rejected', v || undefined) },
                            ], 'plain-text');
                          }}
                          disabled={!!processingDoc}
                        >
                          <Text style={styles.docBtnText}>Rejeter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.docBtn, styles.docBtnApprove]}
                          onPress={() => handleReviewDoc(selectedDriver.id, key, 'approved')}
                          disabled={!!processingDoc}
                        >
                          {processingDoc === key ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.docBtnText}>Approuver</Text>}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.rejectProfileBtn}
                  onPress={() => selectedDriver && handleRejectDriverProfile(selectedDriver)}
                  disabled={!!processingId}
                >
                  <Text style={styles.rejectProfileBtnText}>Rejeter le profil</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
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
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#ff6b47',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateHint: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  verificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff6b47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  timeTag: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sectionHintEmpty: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  tapToViewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  tapToViewHintText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalClose: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  modalIntro: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 20,
  },
  docRow: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  docRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  docRowStatus: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  docOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#ff6b47',
    borderRadius: 10,
  },
  docOpenButtonWrap: {
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inlineDocViewer: {
    flex: 1,
    padding: 16,
    minHeight: 300,
  },
  inlineDocScroll: {
    flex: 1,
  },
  inlineDocScrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  inlineDocImage: {
    width: '100%',
    minHeight: 400,
  },
  inlineDocCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
  },
  inlineDocBrowserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#ff6b47',
    borderRadius: 10,
  },
  inlineDocCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  inlineDocError: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  inlineDocErrorText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  inlineDocErrorUrl: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  docOpenButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  docBlock: {
    marginBottom: 12,
  },
  docThumbWrap: {
    width: '100%',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#334155',
  },
  docThumb: {
    width: '100%',
    height: 200,
  },
  docThumbImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  docViewDocWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 107, 71, 0.9)',
    borderRadius: 8,
  },
  docViewDocText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  docThumbPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  docThumbPlaceholderText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  docUnavailable: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  docActions: {
    flexDirection: 'row',
    gap: 10,
  },
  docBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  docBtnReject: {
    backgroundColor: '#ef4444',
  },
  docBtnApprove: {
    backgroundColor: '#10b981',
  },
  docBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  rejectProfileBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  rejectProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default AdminPanelScreen;


