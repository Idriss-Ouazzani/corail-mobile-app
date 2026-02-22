/**
 * Modal pour noter (étoiles + commentaire) l'auteur de la publication avant de terminer la course.
 * Envoyé au créateur si c'est un chauffeur Corail ; sinon SMS/email plus tard.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STAR_COUNT = 5;
const PLACEHOLDER = 'Optionnel : un mot pour l\'auteur de la course…';

interface CompleteRideRatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: { stars: number; comment: string }) => void;
  isLoading?: boolean;
}

export function CompleteRideRatingModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: CompleteRideRatingModalProps) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (stars < 1 || stars > 5) return;
    onSubmit({ stars, comment: comment.trim() });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Noter cette course</Text>
            <Text style={styles.subtitle}>
              Votre note et votre commentaire seront envoyés à l'auteur de la publication.
            </Text>

            <View style={styles.starsRow}>
              {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setStars(value)}
                  style={styles.starButton}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={stars >= value ? 'star' : 'star-outline'}
                    size={36}
                    color={stars >= value ? '#eab308' : '#64748b'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.starsLabel}>
              {stars === 0 && 'Choisissez une note'}
              {stars === 1 && '★ Très insatisfait'}
              {stars === 2 && '★★ Insatisfait'}
              {stars === 3 && '★★★ Correct'}
              {stars === 4 && '★★★★ Satisfait'}
              {stars === 5 && '★★★★★ Parfait'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={PLACEHOLDER}
              placeholderTextColor="#64748b"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!isLoading}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.submitButton, (stars < 1 || isLoading) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={stars < 1 || isLoading}
                activeOpacity={0.9}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Envoi…' : 'Terminer et envoyer la note'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  keyboard: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  starsLabel: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    padding: 14,
    color: '#e2e8f0',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
