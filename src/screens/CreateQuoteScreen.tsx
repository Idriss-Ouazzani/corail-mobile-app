/**
 * CreateQuoteScreen - Créer et envoyer un devis VTC par SMS
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient } from '../services/api';

interface CreateQuoteScreenProps {
  onBack: () => void;
  onQuoteSent?: () => void;
}

export default function CreateQuoteScreen({ onBack, onQuoteSent }: CreateQuoteScreenProps) {
  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  // Format date for display
  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit' 
    });
  };

  // Format time for display
  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Date picker handlers
  const onDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const onTimeChange = (event: any, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) {
      const newDate = new Date(selectedDate);
      newDate.setHours(selected.getHours());
      newDate.setMinutes(selected.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const handleSendQuote = async () => {
    // Validation
    if (!clientName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du client');
      return;
    }
    if (!clientPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le téléphone du client');
      return;
    }
    if (!pickupAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'adresse de départ');
      return;
    }
    if (!dropoffAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir l\'adresse d\'arrivée');
      return;
    }
    if (!price.trim() || isNaN(parseFloat(price))) {
      Alert.alert('Erreur', 'Veuillez saisir un prix valide');
      return;
    }

    try {
      setSending(true);

      // Préparer les données
      const quoteData = {
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        pickup_address: pickupAddress.trim(),
        dropoff_address: dropoffAddress.trim(),
        scheduled_date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD
        scheduled_time: `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}:00`, // HH:MM:SS
        price_cents: Math.round(parseFloat(price) * 100),
        notes: notes.trim() || null,
      };

      console.log('📤 Envoi du devis:', quoteData);

      // Envoyer le devis via l'API
      const response = await apiClient.createQuote(quoteData);

      console.log('✅ Devis créé:', response);

      // Construire le lien du devis
      const quoteUrl = `https://corail-quotes-web.vercel.app/q/${response.token}`;
      
      // Formater la date pour le message
      const dateFormatted = selectedDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'numeric',
      });
      const timeFormatted = `${selectedDate.getHours().toString().padStart(2, '0')}h${selectedDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Message WhatsApp
      const whatsappMessage = `Bonjour,\nVoici votre devis VTC pour le ${dateFormatted} à ${timeFormatted}.\nMontant : ${price} €.\n\n👉 Consulter et valider :\n${quoteUrl}`;
      
      // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
      const cleanPhone = clientPhone.replace(/[\s\-\(\)]/g, '');
      
      // Ouvrir WhatsApp
      const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMessage)}`;
      
      Alert.alert(
        '✅ Devis créé !',
        `Le devis a été créé pour ${clientName}.\n\nComment souhaitez-vous l'envoyer ?`,
        [
          {
            text: 'Copier le lien',
            onPress: () => {
              Clipboard.setString(quoteUrl);
              Alert.alert(
                '✅ Lien copié !',
                `Le lien du devis a été copié.\n\nVous pouvez maintenant l'envoyer par SMS, email, etc.\n\n${quoteUrl}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onQuoteSent?.();
                      onBack();
                    },
                  },
                ]
              );
            },
          },
          {
            text: 'WhatsApp',
            onPress: async () => {
              try {
                const canOpen = await Linking.canOpenURL(whatsappUrl);
                if (canOpen) {
                  await Linking.openURL(whatsappUrl);
                  onQuoteSent?.();
                  onBack();
                } else {
                  // Copier automatiquement le lien
                  Clipboard.setString(quoteUrl);
                  Alert.alert(
                    'WhatsApp non disponible',
                    `WhatsApp n'est pas installé sur cet appareil.\n\n✅ Le lien a été copié dans votre presse-papiers !\n\nVous pouvez l'envoyer par SMS, email ou tout autre moyen.\n\nLien : ${quoteUrl}`,
                    [
                      {
                        text: 'Copier à nouveau',
                        onPress: () => {
                          Clipboard.setString(quoteUrl);
                          Alert.alert('✅ Copié !', 'Le lien a été copié dans votre presse-papiers.');
                        },
                      },
                      {
                        text: 'OK',
                        style: 'default',
                        onPress: () => {
                          onQuoteSent?.();
                          onBack();
                        },
                      },
                    ]
                  );
                }
              } catch (error) {
                console.error('Erreur ouverture WhatsApp:', error);
                Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erreur envoi devis:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.detail || error.message || 'Impossible d\'envoyer le devis. Veuillez réessayer.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="document-text" size={24} color="#ff6b47" />
            <Text style={styles.headerTitle}>Créer un devis</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Form */}
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Client Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="person" size={16} color="#ff6b47" /> Informations client
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du client *</Text>
            <TextInput
              style={styles.input}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Ex: Jean Dupont"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone *</Text>
            <TextInput
              style={styles.input}
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="Ex: 06 12 34 56 78"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Trip Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="car" size={16} color="#ff6b47" /> Détails de la course
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Départ *</Text>
            <TextInput
              style={styles.input}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Adresse de départ"
              placeholderTextColor="#64748b"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Arrivée *</Text>
            <TextInput
              style={styles.input}
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
              placeholder="Adresse d'arrivée"
              placeholderTextColor="#64748b"
              multiline
            />
          </View>

          {/* Date & Time */}
          <View style={styles.dateTimeRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={20} color="#ff6b47" />
                <Text style={styles.dateTimeText}>{formatDateDisplay(selectedDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Heure *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time" size={20} color="#ff6b47" />
                <Text style={styles.dateTimeText}>{formatTimeDisplay(selectedDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cash" size={16} color="#ff6b47" /> Prix
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Montant TTC (€) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Ex: 45.00"
              placeholderTextColor="#64748b"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="create" size={16} color="#ff6b47" /> Notes (optionnel)
          </Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ex: Bagages, attente courte offerte, etc."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0ea5e9" />
          <Text style={styles.infoText}>
            Le client recevra un message WhatsApp avec un lien pour consulter et accepter ce devis.
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendQuote}
          disabled={sending}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={sending ? ['#64748b', '#475569'] : ['#ff6b47', '#ff8a6d']}
            style={styles.sendButtonGradient}
          >
            {sending ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.sendButtonText}>Envoi en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.sendButtonText}>Envoyer le devis</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date & Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          is24Hour={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#e2e8f0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#e2e8f0',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#7dd3fc',
    lineHeight: 18,
  },
  sendButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

