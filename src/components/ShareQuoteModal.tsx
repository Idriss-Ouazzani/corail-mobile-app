/**
 * ShareQuoteModal - Modal élégant pour partager un devis
 * Utilisé dans CreateQuoteScreen et CreateRideScreen
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Linking, Alert, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../services/api';

interface ShareQuoteModalProps {
  visible: boolean;
  onClose: () => void;
  quoteUrl: string;
  quoteData: {
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    price: string;
    date: string;
    time: string;
    pickupAddress: string;
    dropoffAddress: string;
  };
  driverName?: string;
}

export const ShareQuoteModal: React.FC<ShareQuoteModalProps> = ({
  visible,
  onClose,
  quoteUrl,
  quoteData,
  driverName,
}) => {
  const [sending, setSending] = useState(false);

  const shareMessage = `Bonjour,\n\nVoici votre devis pour le ${quoteData.date} à ${quoteData.time}.\nMontant : ${quoteData.price} €.\n\n👉 Consulter et valider :\n${quoteUrl}`;

  const handleCopyLink = () => {
    Clipboard.setString(quoteUrl);
    Alert.alert(
      'Lien copié !',
      'Le lien du devis a été copié dans votre presse-papiers.',
      [{ text: 'OK', onPress: onClose }]
    );
  };

  const handleEmail = async () => {
    if (!quoteData.clientEmail) {
      Alert.alert('Email manquant', 'Aucun email client n\'a été renseigné.');
      return;
    }

    try {
      setSending(true);
      await apiClient.sendQuoteEmail({
        clientEmail: quoteData.clientEmail,
        clientName: quoteData.clientName,
        quoteUrl,
        price: quoteData.price,
        date: quoteData.date,
        time: quoteData.time,
        pickupAddress: quoteData.pickupAddress,
        dropoffAddress: quoteData.dropoffAddress,
        driverName,
      });

      Alert.alert(
        'Email envoyé !',
        `Le devis a été envoyé à ${quoteData.clientEmail}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        `Impossible d'envoyer l'email.\n\n${error.message || 'Erreur inconnue'}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setSending(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!quoteData.clientPhone) {
      Alert.alert('Téléphone manquant', 'Aucun numéro de téléphone n\'a été renseigné.');
      return;
    }

    try {
      const cleanPhone = quoteData.clientPhone.replace(/[\s\-\(\)]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareMessage)}`;
      await Linking.openURL(whatsappUrl);
      onClose();
    } catch (error) {
      console.error('Erreur ouverture WhatsApp:', error);
      Clipboard.setString(quoteUrl);
      Alert.alert(
        'Erreur',
        `Impossible d'ouvrir WhatsApp.\n\n✅ Le lien a été copié dans votre presse-papiers !`,
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.title}>Devis créé !</Text>
            <Text style={styles.subtitle}>
              Comment souhaitez-vous l'envoyer à {quoteData.clientName} ?
            </Text>
          </View>

          {/* Options de partage */}
          <View style={styles.optionsContainer}>
            {/* Copier le lien */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleCopyLink}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="copy-outline" size={24} color="#6366f1" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Copier le lien</Text>
                <Text style={styles.optionDescription}>Partager manuellement</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>

            {/* Email (si disponible) */}
            {quoteData.clientEmail && (
              <TouchableOpacity
                style={styles.option}
                onPress={handleEmail}
                disabled={sending}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  {sending ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <Ionicons name="mail-outline" size={24} color="#6366f1" />
                  )}
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Envoyer par email</Text>
                  <Text style={styles.optionDescription}>{quoteData.clientEmail}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}

            {/* WhatsApp (si disponible) */}
            {quoteData.clientPhone && (
              <TouchableOpacity
                style={styles.option}
                onPress={handleWhatsApp}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="logo-whatsapp" size={24} color="#25d366" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Envoyer par WhatsApp</Text>
                  <Text style={styles.optionDescription}>{quoteData.clientPhone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Bouton Fermer */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  closeButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
});

