/**
 * LegalInfoModal - Configurer les infos légales pour devis/factures
 * Affiché lorsqu'un chauffeur tente d'envoyer un devis ou de générer une facture
 * sans avoir complété SIRET + adresse (conformité PDF).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { apiClient } from '../services/api';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(WINDOW_HEIGHT * 0.92, 700);

const SIRET_LENGTH = 14;

export type VatOption = 'VAT_10' | 'NON_APPLICABLE';

// Image thématique légal / documents (Unsplash)
const LEGAL_HERO_IMAGE = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=85';

interface LegalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  /** Nom/prénom pour pré-remplir la raison sociale */
  initialBusinessName?: string;
  /** Appelé après enregistrement réussi → l'app peut ensuite continuer (devis/facture) */
  onSaved: () => void;
  /** Appelé quand l'utilisateur clique "Plus tard" → ne pas générer le document */
  onLater: () => void;
}

export function LegalInfoModal({
  visible,
  onClose,
  initialBusinessName = '',
  onSaved,
  onLater,
}: LegalInfoModalProps) {
  const [legalBusinessName, setLegalBusinessName] = useState('');
  const [legalAddressLine1, setLegalAddressLine1] = useState('');
  const [legalPostalCode, setLegalPostalCode] = useState('');
  const [legalCity, setLegalCity] = useState('');
  const [siret, setSiret] = useState('');
  const [vatOption, setVatOption] = useState<VatOption>('NON_APPLICABLE');
  const [vatNumber, setVatNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [legalKbisUrl, setLegalKbisUrl] = useState<string | null>(null);
  const [kbisUploading, setKbisUploading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLegalBusinessName(initialBusinessName.trim());
    (async () => {
      try {
        const p = await apiClient.getMyVTCProfile();
        if (p) {
          setLegalBusinessName((p.legal_business_name || initialBusinessName || '').trim());
          setLegalAddressLine1((p.legal_address_line1 as string) || '');
          setLegalPostalCode((p.legal_postal_code as string) || '');
          setLegalCity((p.legal_city as string) || '');
          setSiret(String((p.siret as string) || '').replace(/\D/g, '').slice(0, 14));
          const vo = p.vat_option as VatOption | undefined;
          setVatOption(vo === 'VAT_10' || vo === 'NON_APPLICABLE' ? vo : 'NON_APPLICABLE');
          setVatNumber((p.vat_number as string) || '');
          const kb = (p as { legal_kbis_url?: string | null }).legal_kbis_url;
          setLegalKbisUrl(typeof kb === 'string' && kb.trim() ? kb.trim() : null);
        } else {
          setLegalAddressLine1('');
          setLegalPostalCode('');
          setLegalCity('');
          setSiret('');
          setVatOption('NON_APPLICABLE');
          setVatNumber('');
          setLegalKbisUrl(null);
        }
      } catch {
        setLegalBusinessName(initialBusinessName.trim());
      }
    })();
  }, [visible, initialBusinessName]);

  const handleLater = () => {
    onLater();
    onClose();
  };

  const pickKbis = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Autorisez l’accès aux photos pour joindre le KBIS.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.88,
        base64: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const a = result.assets[0];
      setKbisUploading(true);
      const res = await apiClient.uploadLegalKbisDocument({
        uri: a.uri,
        type: a.mimeType || 'image/jpeg',
        name: a.fileName || 'kbis.jpg',
        base64: (a as { base64?: string }).base64,
      });
      const url = (res as { profile?: { legal_kbis_url?: string } })?.profile?.legal_kbis_url;
      if (url) setLegalKbisUrl(url);
      else setLegalKbisUrl(legalKbisUrl);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Téléversement impossible');
    } finally {
      setKbisUploading(false);
    }
  };

  const validate = (): boolean => {
    if (!legalBusinessName.trim()) {
      Alert.alert('Champ requis', 'Renseignez la raison sociale ou le nom commercial.');
      return false;
    }
    if (!legalAddressLine1.trim()) {
      Alert.alert('Champ requis', 'Renseignez l\'adresse.');
      return false;
    }
    if (!legalPostalCode.trim()) {
      Alert.alert('Champ requis', 'Renseignez le code postal.');
      return false;
    }
    if (!legalCity.trim()) {
      Alert.alert('Champ requis', 'Renseignez la ville.');
      return false;
    }
    const siretClean = siret.replace(/\s/g, '');
    if (siretClean.length !== SIRET_LENGTH || !/^\d+$/.test(siretClean)) {
      Alert.alert('SIRET invalide', 'Le SIRET doit contenir exactement 14 chiffres.');
      return false;
    }
    if (vatOption === 'VAT_10') {
      const vatTrim = vatNumber.trim();
      if (!vatTrim) {
        Alert.alert('Champ requis', 'Renseignez le numéro de TVA intracommunautaire (obligatoire si vous facturez la TVA).');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      await apiClient.updateVTCProfile({
        legal_business_name: legalBusinessName.trim(),
        legal_address_line1: legalAddressLine1.trim(),
        legal_postal_code: legalPostalCode.trim(),
        legal_city: legalCity.trim(),
        siret: siret.replace(/\s/g, ''),
        vat_option: vatOption,
        vat_number: vatOption === 'VAT_10' ? vatNumber.trim() || null : null,
        legal_info_configured: true,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible d\'enregistrer.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          style={[styles.sheetWrap, { height: SHEET_HEIGHT }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.sheet} collapsable={false}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={16}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Infos légales / Facturation</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
            <View style={styles.heroBlock}>
              <View style={styles.heroImageWrap}>
                <Image source={{ uri: LEGAL_HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
                <View style={styles.heroImageOverlay} />
              </View>
              <Text style={styles.heroTitle}>Configurer mes informations légales</Text>
              <Text style={styles.heroSubtitle}>
                Ces informations sont nécessaires pour générer vos documents (devis/factures) conformes.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Raison sociale / Nom commercial *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor={theme.colors.textMuted}
                value={legalBusinessName}
                onChangeText={setLegalBusinessName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Adresse *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 12 rue de la Paix"
                placeholderTextColor={theme.colors.textMuted}
                value={legalAddressLine1}
                onChangeText={setLegalAddressLine1}
                autoCapitalize="words"
              />

              <View style={styles.row}>
                <View style={[styles.half, styles.halfLeft]}>
                  <Text style={styles.label}>Code postal *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="75001"
                    placeholderTextColor={theme.colors.textMuted}
                    value={legalPostalCode}
                    onChangeText={setLegalPostalCode}
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Ville *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Paris"
                    placeholderTextColor={theme.colors.textMuted}
                    value={legalCity}
                    onChangeText={setLegalCity}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <Text style={styles.label}>SIRET (14 chiffres) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 12345678901234"
                placeholderTextColor={theme.colors.textMuted}
                value={siret}
                onChangeText={(t) => setSiret(t.replace(/\D/g, '').slice(0, 14))}
                keyboardType="number-pad"
                maxLength={14}
              />
              <Text style={styles.hint}>Exactement 14 chiffres. Utilisé sur vos factures et devis.</Text>

              <Text style={styles.label}>KBIS ou extrait Kbis (recommandé)</Text>
              <Text style={styles.hint}>
                Optionnel mais utile : conservé dans votre dossier et visible lors des demandes de changement de SIRET côté administration.
              </Text>
              {legalKbisUrl ? (
                <View style={styles.kbisPreviewWrap}>
                  <Image source={{ uri: legalKbisUrl }} style={styles.kbisThumb} resizeMode="cover" />
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.kbisBtn}
                onPress={pickKbis}
                disabled={kbisUploading}
                activeOpacity={0.85}
              >
                {kbisUploading ? (
                  <ActivityIndicator color={theme.colors.info} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.info} />
                    <Text style={styles.kbisBtnText}>{legalKbisUrl ? 'Remplacer le document' : 'Joindre une photo'}</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>TVA</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioRow, vatOption === 'VAT_10' && styles.radioRowSelected]}
                  onPress={() => setVatOption('VAT_10')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioOuter, vatOption === 'VAT_10' && styles.radioOuterSelected]}>
                    {vatOption === 'VAT_10' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>Je facture la TVA (10 %)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioRow, vatOption === 'NON_APPLICABLE' && styles.radioRowSelected]}
                  onPress={() => setVatOption('NON_APPLICABLE')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioOuter, vatOption === 'NON_APPLICABLE' && styles.radioOuterSelected]}>
                    {vatOption === 'NON_APPLICABLE' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>TVA non applicable (micro-entreprise – art. 293 B CGI)</Text>
                </TouchableOpacity>
              </View>

              {vatOption === 'VAT_10' && (
                <>
                  <Text style={styles.label}>Numéro de TVA intracommunautaire *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: FR12345678901"
                    placeholderTextColor={theme.colors.textMuted}
                    value={vatNumber}
                    onChangeText={setVatNumber}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <Text style={styles.hint}>Obligatoire si vous êtes assujetti à la TVA. Format : FR + 2 chiffres clé + 9 chiffres.</Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0ea5e9', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.ctaPrimaryText}>Enregistrer et continuer</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctaSecondary} onPress={handleLater} activeOpacity={0.8}>
              <Text style={styles.ctaSecondaryText}>Plus tard</Text>
            </TouchableOpacity>

            <Text style={styles.footerHint}>
              Vous pourrez configurer ces infos plus tard depuis Mes outils. Sans elles, la génération de devis et factures ne sera pas possible.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrap: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  closeBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSpacer: { width: 40 },
  scroll: {
    flex: 1,
    minHeight: 300,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  heroBlock: {
    marginBottom: 28,
  },
  heroImageWrap: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: { flex: 1 },
  halfLeft: { marginRight: 0 },
  kbisPreviewWrap: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start',
  },
  kbisThumb: { width: 160, height: 100, backgroundColor: theme.colors.surface },
  kbisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
    marginBottom: 8,
  },
  kbisBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  hint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  radioGroup: {
    marginTop: 2,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 2,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  radioRowSelected: {
    borderColor: 'rgba(14, 165, 233, 0.35)',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: theme.colors.info,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.info,
  },
  radioLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  ctaPrimary: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  ctaPrimaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  ctaSecondary: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  footerHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
