/**
 * Modale premium : demande de changement pour un seul champ (tél., VTC recto/verso, SIRET, assurance).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { apiClient } from '../services/api';
import type { CredentialChangeRequestType } from '../services/supabaseApi';
import { formatPhoneForSubmit } from '../utils/phoneFormat';

type FileAsset = { uri: string; type?: string; name?: string; base64?: string };

const FIELD_META: Record<
  CredentialChangeRequestType,
  { title: string; subtitle: string; valueLabel: string; placeholder: string }
> = {
  phone: {
    title: 'Changer de numéro',
    subtitle: 'Le numéro actuel est indiqué ci-dessous. Saisissez le nouveau ; un justificatif reste optionnel.',
    valueLabel: 'Nouveau numéro',
    placeholder: '06 12 34 56 78',
  },
  vtc_number: {
    title: 'Carte VTC',
    subtitle: 'Recto et verso obligatoires pour comparer avec votre dossier validé.',
    valueLabel: 'Nouveau numéro de carte',
    placeholder: 'Numéro sur la carte',
  },
  siret: {
    title: 'SIRET / société',
    subtitle: '14 chiffres. Un justificatif reste optionnel si vous souhaitez l’ajouter.',
    valueLabel: 'Nouveau SIRET',
    placeholder: '14 chiffres',
  },
  insurance: {
    title: 'Attestation RC Pro',
    subtitle: 'Une seule pièce (recto de l’attestation ou PDF). Commentaire libre optionnel.',
    valueLabel: 'Commentaire (optionnel)',
    placeholder: 'Ex. nouvelle compagnie, date d’effet…',
  },
};

interface Props {
  visible: boolean;
  field: CredentialChangeRequestType | null;
  currentDisplay: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function CredentialFieldEditModal({ visible, field, currentDisplay, onClose, onSubmitted }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingTypes, setPendingTypes] = useState<Set<string>>(new Set());
  const [value, setValue] = useState('');
  const [fileRecto, setFileRecto] = useState<FileAsset | null>(null);
  const [fileVerso, setFileVerso] = useState<FileAsset | null>(null);
  const [labelRecto, setLabelRecto] = useState<string | null>(null);
  const [labelVerso, setLabelVerso] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    try {
      const rows = await apiClient.getMyCredentialChangeRequests();
      const pend = new Set(
        (rows as { request_type: string; status: string }[])
          .filter((r) => r.status === 'pending')
          .map((r) => r.request_type)
      );
      setPendingTypes(pend);
    } catch {
      setPendingTypes(new Set());
    }
  }, []);

  useEffect(() => {
    if (!visible || !field) return;
    setValue('');
    setFileRecto(null);
    setFileVerso(null);
    setLabelRecto(null);
    setLabelVerso(null);
    setLoading(true);
    loadPending()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, field, loadPending]);

  const blocked = !!(field && pendingTypes.has(field));

  const pick = async (which: 'recto' | 'verso') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Accès aux photos requis.');
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
    const asset: FileAsset = {
      uri: a.uri,
      type: a.mimeType || 'image/jpeg',
      name: 'doc.jpg',
      base64: (a as { base64?: string }).base64,
    };
    if (which === 'recto') {
      setFileRecto(asset);
      setLabelRecto('Fichier sélectionné');
    } else {
      setFileVerso(asset);
      setLabelVerso('Fichier sélectionné');
    }
  };

  const submit = async () => {
    if (!field) return;
    if (blocked) {
      Alert.alert('En attente', 'Une demande pour ce type est déjà en cours.');
      return;
    }
    const meta = FIELD_META[field];
    if (field !== 'insurance' && field !== 'phone' && !value.trim()) {
      Alert.alert('Champ requis', `Renseignez ${meta.valueLabel.toLowerCase()}.`);
      return;
    }
    if (field === 'phone' && !value.trim()) {
      Alert.alert('Champ requis', 'Indiquez le nouveau numéro.');
      return;
    }
    let requested = value.trim();
    if (field === 'phone') requested = formatPhoneForSubmit(requested);
    if (field === 'siret') {
      requested = requested.replace(/\s/g, '');
      if (requested.length !== 14 || !/^\d+$/.test(requested)) {
        Alert.alert('SIRET', '14 chiffres exactement.');
        return;
      }
    }
    if (field === 'vtc_number') {
      if (!requested) {
        Alert.alert('Carte VTC', 'Indiquez le nouveau numéro.');
        return;
      }
      if (!fileRecto || !fileVerso) {
        Alert.alert('Photos', 'Ajoutez le recto et le verso de la carte.');
        return;
      }
    }
    if (field === 'insurance') {
      if (!fileRecto) {
        Alert.alert('Document', 'Joignez la nouvelle attestation.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await apiClient.createCredentialChangeRequest({
        requestType: field,
        requestedValue: field === 'insurance' && !requested ? '' : requested,
        ...(fileRecto ? { document: fileRecto } : {}),
        ...(field === 'vtc_number' && fileVerso ? { documentVerso: fileVerso } : {}),
      });
      await loadPending();
      onSubmitted();
      Alert.alert('Envoyé', 'Votre demande a été transmise à l’équipe pour validation.', [{ text: 'OK', onPress: onClose }]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Envoi impossible');
    } finally {
      setSubmitting(false);
    }
  };

  if (!field) return null;

  const meta = FIELD_META[field];
  const showVerso = field === 'vtc_number';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>
          <View style={styles.sheetHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="create-outline" size={22} color={theme.colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{meta.title}</Text>
              <Text style={styles.sheetSub}>{meta.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeHit} hitSlop={12}>
              <Ionicons name="close" size={26} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.currentBox}>
              <Text style={styles.currentLabel}>Valeur actuelle enregistrée</Text>
              <Text style={styles.currentValue}>{currentDisplay?.trim() || '—'}</Text>
            </View>

            {loading ? (
              <ActivityIndicator color={theme.colors.info} style={{ marginVertical: 16 }} />
            ) : null}

            {blocked ? (
              <View style={styles.blockedBanner}>
                <Ionicons name="hourglass-outline" size={20} color="#b45309" />
                <Text style={styles.blockedText}>Une demande est déjà en cours pour ce type. Revenez après traitement par l’équipe.</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>{meta.valueLabel}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={meta.placeholder}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType={field === 'siret' || field === 'phone' ? 'number-pad' : 'default'}
            />

            {field === 'insurance' ? (
              <Text style={styles.hintMuted}>Si vous laissez le commentaire vide, un libellé par défaut sera enregistré.</Text>
            ) : null}

            {field === 'phone' || field === 'siret' ? (
              <>
                <Text style={styles.inputLabel}>Justificatif (optionnel)</Text>
                <TouchableOpacity style={styles.fileBtn} onPress={() => pick('recto')} activeOpacity={0.85}>
                  <Ionicons name="image-outline" size={20} color={theme.colors.textMuted} />
                  <Text style={styles.fileBtnText}>{labelRecto || 'Ajouter une photo (facultatif)'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>{showVerso ? 'Photo recto' : 'Justificatif'}</Text>
                <TouchableOpacity style={styles.fileBtn} onPress={() => pick('recto')} activeOpacity={0.85}>
                  <Ionicons name="image-outline" size={20} color={theme.colors.info} />
                  <Text style={styles.fileBtnText}>{labelRecto || 'Choisir une image ou PDF'}</Text>
                </TouchableOpacity>
              </>
            )}

            {showVerso ? (
              <>
                <Text style={styles.inputLabel}>Photo verso</Text>
                <TouchableOpacity style={styles.fileBtn} onPress={() => pick('verso')} activeOpacity={0.85}>
                  <Ionicons name="images-outline" size={20} color={theme.colors.info} />
                  <Text style={styles.fileBtnText}>{labelVerso || 'Choisir le verso'}</Text>
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, (submitting || blocked) && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={submitting || blocked}
              activeOpacity={0.9}
            >
              <LinearGradientBtn label={submitting ? 'Envoi…' : 'Envoyer la demande'} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Petit libellé gradient sans dépendre de LinearGradient sur tout le fichier */
function LinearGradientBtn({ label }: { label: string }) {
  return (
    <View style={styles.submitInner}>
      <Ionicons name="paper-plane" size={18} color="#fff" />
      <Text style={styles.submitText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  grabberWrap: { alignItems: 'center', paddingTop: 10 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  sheetSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, lineHeight: 17 },
  closeHit: { padding: 4 },
  scroll: { maxHeight: 480 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  currentBox: {
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  currentLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  currentValue: { fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary, marginTop: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textMutedDark, marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  hintMuted: { fontSize: 12, color: theme.colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
  },
  fileBtnText: { flex: 1, fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  submitBtn: {
    marginTop: 22,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: theme.colors.primary,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  blockedText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
});
