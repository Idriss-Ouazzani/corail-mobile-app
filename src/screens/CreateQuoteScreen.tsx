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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient } from '../services/api';
import { formatPhoneInput, formatPhoneForSubmit } from '../utils/phoneFormat';
import { ShareQuoteModal } from '../components/ShareQuoteModal';
import { LegalInfoModal } from '../components/LegalInfoModal';
import { useAuth } from '../contexts/AuthContext';
import { getQuoteUrl } from '../constants/urls';

interface CreateQuoteScreenProps {
  onBack: () => void;
  onQuoteSent?: () => void;
}

export default function CreateQuoteScreen({ onBack, onQuoteSent }: CreateQuoteScreenProps) {
  const { user } = useAuth();
  
  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdQuote, setCreatedQuote] = useState<any>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [pendingQuoteData, setPendingQuoteData] = useState<any>(null);

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

  const doCreateQuoteAndShowShare = async (quoteData: any) => {
    const response = await apiClient.createQuote(quoteData);
    if (!response || !response.token) throw new Error('Token manquant');
    const quoteUrl = getQuoteUrl(response.token);
    const d = new Date(quoteData.scheduled_date + 'T' + quoteData.scheduled_time);
    const dateFormatted = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' });
    const timeFormatted = `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
    setCreatedQuote({
      quoteUrl,
      clientName: quoteData.client_name?.trim(),
      clientEmail: quoteData.client_email?.trim() || undefined,
      clientPhone: quoteData.client_phone?.trim() || undefined,
      price: (quoteData.price_cents / 100).toFixed(2),
      date: dateFormatted,
      time: timeFormatted,
      pickupAddress: quoteData.pickup_address?.trim(),
      dropoffAddress: quoteData.dropoff_address?.trim(),
    });
    setShowShareModal(true);
  };

  const handleSendQuote = async () => {
    // Validation
    if (!clientName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du client');
      return;
    }
    if (!clientPhone.trim() && !clientEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner au moins un email OU un téléphone pour contacter le client');
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
        client_phone: formatPhoneForSubmit(clientPhone).trim() || undefined,
        pickup_address: pickupAddress.trim(),
        dropoff_address: dropoffAddress.trim(),
        scheduled_date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD
        scheduled_time: `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}:00`, // HH:MM:SS
        price_cents: Math.round(parseFloat(price) * 100),
        notes: notes.trim() || null,
      };

      console.log('📤 Envoi du devis:', quoteData);

      let profile: any = null;
      try {
        profile = await apiClient.getMyVTCProfile();
      } catch (_e) {}
      if (!profile?.legal_info_configured) {
        setPendingQuoteData(quoteData);
        setShowLegalModal(true);
        return;
      }

      await doCreateQuoteAndShowShare(quoteData);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un devis</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Form */}
      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.intro}>
          <Ionicons name="document-text-outline" size={24} color="#0ea5e9" />
          <Text style={styles.introText}>
            Renseignez les informations client et les détails de la course. Un lien unique sera généré pour que le client consulte et accepte le devis en ligne. Vous pourrez ensuite le partager par WhatsApp ou email.
          </Text>
        </View>

        {/* Client Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations client</Text>

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
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={clientPhone}
              onChangeText={(t) => setClientPhone(formatPhoneInput(t))}
              placeholder="Ex: 06 12 34 56 78"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={clientEmail}
              onChangeText={setClientEmail}
              placeholder="Ex: client@email.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.contactNote}>
            <Ionicons name="information-circle-outline" size={16} color="#94a3b8" />
            <Text style={styles.contactNoteText}>
              Au moins un contact (téléphone ou email) est requis
            </Text>
          </View>
        </View>

        {/* Trip Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la course</Text>

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
                <Ionicons name="calendar" size={20} color="#0ea5e9" />
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
                <Ionicons name="time" size={20} color="#0ea5e9" />
                <Text style={styles.dateTimeText}>{formatTimeDisplay(selectedDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix</Text>

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
          <Text style={styles.sectionTitle}>Notes (optionnel)</Text>

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
            Après création, vous pourrez copier le lien ou l'envoyer par WhatsApp / email. Le client pourra consulter et accepter le devis en ligne.
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
            colors={sending ? ['#64748b', '#475569'] : ['#0ea5e9', '#06b6d4']}
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

      {/* Modal de partage du devis */}
      {createdQuote && (
        <ShareQuoteModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            onQuoteSent?.();
            onBack();
          }}
          quoteUrl={createdQuote.quoteUrl}
          quoteData={{
            clientName: createdQuote.clientName,
            clientEmail: createdQuote.clientEmail,
            clientPhone: createdQuote.clientPhone,
            price: createdQuote.price,
            date: createdQuote.date,
            time: createdQuote.time,
            pickupAddress: createdQuote.pickupAddress,
            dropoffAddress: createdQuote.dropoffAddress,
          }}
          driverName={user?.displayName || user?.email?.split('@')[0]}
        />
      )}

      <LegalInfoModal
        visible={showLegalModal}
        onClose={() => { setShowLegalModal(false); setPendingQuoteData(null); }}
        initialBusinessName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''}
        onSaved={() => {
          if (pendingQuoteData) {
            doCreateQuoteAndShowShare(pendingQuoteData).catch((e: any) =>
              Alert.alert('Erreur', e.message || 'Impossible d\'envoyer le devis')
            );
            setPendingQuoteData(null);
          }
          setShowLegalModal(false);
        }}
        onLater={() => {
          Alert.alert(
            'Infos légales requises',
            'Pour envoyer un devis conforme, renseignez vos infos légales (SIRET, adresse) depuis Mes outils.'
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerRight: {
    width: 40,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#f8fafc',
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
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
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
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  sendButton: {
    marginTop: 16,
    borderRadius: 18,
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
  contactNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  contactNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
});

