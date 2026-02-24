import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ShareQuoteModal } from '../components/ShareQuoteModal';
import { LegalInfoModal } from '../components/LegalInfoModal';
import { PriceHintChauffeur } from '../components/PriceHintChauffeur';
import { apiClient } from '../services/api';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { AddressSuggestion } from '../services/addressApi';
import { calculateRoute } from '../services/routingApi';
import { formatDateWithLocalTimezone } from '../utils/dateFormat';
import { formatPhoneInput, formatPhoneForSubmit } from '../utils/phoneFormat';
import { useAuth } from '../contexts/AuthContext';
import { getQuoteUrl } from '../constants/urls';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  color: string;
  icon: string;
}

// Couleurs prédéfinies pour les groupes
const GROUP_COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

interface CreateRideScreenProps {
  onBack: () => void;
  onCreate: (ride: any) => void;
  mode?: 'create' | 'publish';
  /** Profil chauffeur vérifié – requis pour "Publier sur le réseau" */
  isDriverVerified?: boolean;
}

export const CreateRideScreen: React.FC<CreateRideScreenProps> = ({ onBack, onCreate, mode = 'publish', isDriverVerified = false }) => {
  const { user } = useAuth();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [price, setPrice] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'GROUP' | 'PERSONAL'>(mode === 'create' ? 'PERSONAL' : 'PUBLIC');
  const [publishToMarketplace, setPublishToMarketplace] = useState(false); // Pour mode 'create'
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [generateQuote, setGenerateQuote] = useState(false); // Toggle pour générer un devis
  const [showClientSection, setShowClientSection] = useState(mode === 'publish');
  const [notes, setNotes] = useState('');
  const [calculatingRoute, setCalculatingRoute] = useState(false); // Calcul de l'itinéraire en cours
  const [showShareQuoteModal, setShowShareQuoteModal] = useState(false);
  const [createdQuoteData, setCreatedQuoteData] = useState<any>(null);
  const [pendingRideData, setPendingRideData] = useState<any>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [pendingQuoteData, setPendingQuoteData] = useState<any>(null);

  // Charger les groupes de l'utilisateur au montage
  useEffect(() => {
    loadGroups();
  }, []);

  // Désactiver le toggle si les champs client sont vidés
  useEffect(() => {
    if ((!clientName || (!clientPhone && !clientEmail)) && generateQuote) {
      setGenerateQuote(false);
    }
  }, [clientName, clientPhone, clientEmail]);

  // Calculer automatiquement la distance et la durée quand les 2 adresses sont saisies
  useEffect(() => {
    const computeRoute = async () => {
      if (pickupCoords && dropoffCoords) {
        setCalculatingRoute(true);
        try {
          const routeDetails = await calculateRoute(
            pickupCoords.lon,
            pickupCoords.lat,
            dropoffCoords.lon,
            dropoffCoords.lat
          );

          if (routeDetails) {
            // Pré-remplir automatiquement les champs
            setDistance(routeDetails.distance_km.toString());
            setDuration(routeDetails.duration_minutes.toString());
            
            console.log('✅ Itinéraire calculé:', routeDetails);
          } else {
            console.warn('⚠️ Impossible de calculer l\'itinéraire');
          }
        } catch (error) {
          console.error('❌ Erreur calcul itinéraire:', error);
        } finally {
          setCalculatingRoute(false);
        }
      }
    };

    computeRoute();
  }, [pickupCoords, dropoffCoords]);

  const loadGroups = async () => {
    try {
      const response = await apiClient.listMyGroups();
      // Mapper les groupes de l'API au format local avec couleur et icône par défaut
      const mappedGroups: Group[] = response.data.map((g: any, index: number) => ({
        id: g.id,
        name: g.name,
        description: g.description || '',
        memberCount: (g as any).memberCount ?? g.member_count ?? 1,
        color: GROUP_COLORS[index % GROUP_COLORS.length],
        icon: g.icon || 'people',
      }));
      setGroups(mappedGroups);
    } catch (error: any) {
      console.error('Error loading groups:', error);
      setGroups([]);
    }
  };


  // Date courte sans année (ex: lun. 31 déc.)
  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Formater l'heure pour l'affichage (ex: 14:30)
  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const onDateChange = (event: any, selected?: Date) => {
    // Sur Android, fermer automatiquement après sélection ou annulation
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      // event.type peut être "set" (OK) ou "dismissed" (Cancel)
      if (event.type === 'set' && selected) {
        setSelectedDate(selected);
      }
    } else if (selected) {
      // Sur iOS, juste mettre à jour la date (le modal reste ouvert jusqu'au clic sur "Valider")
      setSelectedDate(selected);
    }
  };

  const onTimeChange = (event: any, selected?: Date) => {
    // Sur Android, fermer automatiquement après sélection ou annulation
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      // event.type peut être "set" (OK) ou "dismissed" (Cancel)
      if (event.type === 'set' && selected) {
        const newDate = new Date(selectedDate);
        newDate.setHours(selected.getHours());
        newDate.setMinutes(selected.getMinutes());
        setSelectedDate(newDate);
      }
    } else if (selected) {
      // Sur iOS, juste mettre à jour l'heure (le modal reste ouvert jusqu'au clic sur "Valider")
      const newDate = new Date(selectedDate);
      newDate.setHours(selected.getHours());
      newDate.setMinutes(selected.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const handleCreate = async () => {
    if (!pickup || !dropoff || !price) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (visibility === 'GROUP' && selectedGroups.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un groupe');
      return;
    }

    if (visibility === 'PUBLIC' && !isDriverVerified) {
      Alert.alert(
        'Profil vérifié requis',
        'Pour accéder aux opportunités réseau, votre profil doit être vérifié.'
      );
      return;
    }

    // Annonce : nom + email OU téléphone (1 des 2 suffit)
    if ((mode === 'publish' || visibility === 'PUBLIC') && (!clientName || (!clientPhone && !clientEmail))) {
      Alert.alert('Erreur', 'Nom du client et au moins un contact (email ou téléphone) sont obligatoires pour une annonce.');
      return;
    }

    // Validation pour le devis
    if (generateQuote && (!clientName || (!clientPhone && !clientEmail))) {
      Alert.alert('Erreur', 'Le nom du client et au moins un contact (téléphone ou email) sont requis pour générer un devis');
      return;
    }

    try {
      let quoteId = null;
      let quoteToken = null;
      let shouldShowShareModal = false;

      if (generateQuote && clientName && (clientPhone || clientEmail)) {
        const scheduledDate = new Date(selectedDate);
        const quoteData = {
          client_name: clientName,
          client_phone: formatPhoneForSubmit(clientPhone) || undefined,
          client_email: clientEmail || undefined,
          pickup_address: pickup,
          dropoff_address: dropoff,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          scheduled_time: `${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}:00`,
          price_cents: parseFloat(price) * 100,
          notes: distance ? `Distance: ${distance} km` : undefined,
        };
        let profile: any = null;
        try {
          profile = await apiClient.getMyVTCProfile();
        } catch (_e) {}
        if (!profile?.legal_info_configured) {
          setPendingQuoteData(quoteData);
          setShowLegalModal(true);
          return;
        }
        try {
          const quote = await apiClient.createQuote(quoteData);
          quoteId = quote.id;
          quoteToken = quote.token;
          shouldShowShareModal = true;
        } catch (quoteError: any) {
          console.error('❌ Erreur création devis:', quoteError);
          Alert.alert('Attention', 'Erreur lors de la création du devis, la course sera créée sans devis');
        }
      }

      // Créer la course avec le quote_id si disponible
      const rideData = {
        pickup_address: pickup,
        dropoff_address: dropoff,
        price_cents: parseFloat(price) * 100,
        scheduled_at: formatDateWithLocalTimezone(selectedDate),
        visibility,
        group_ids: selectedGroups.map(g => g.id),
        vehicle_type: 'STANDARD',
        distance_km: distance ? parseFloat(distance) : undefined,
        duration_minutes: duration ? parseInt(duration) : undefined,
        client_name: clientName || undefined,
        client_phone: formatPhoneForSubmit(clientPhone) || undefined,
        client_email: clientEmail || undefined,
        quote_id: quoteId,
        quote_token: quoteToken,
        quote_status: quoteId ? 'SENT' : undefined,
        notes: notes.trim() || undefined,
      };

      // Si un devis a été créé, afficher le modal de partage
      if (shouldShowShareModal && quoteToken) {
        const scheduledDate = new Date(selectedDate);
        const dateFormatted = scheduledDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'numeric',
        });
        const timeFormatted = `${scheduledDate.getHours().toString().padStart(2, '0')}h${scheduledDate.getMinutes().toString().padStart(2, '0')}`;
        
        // Stocker les données pour les utiliser après la fermeture du modal
        setPendingRideData(rideData);
        setCreatedQuoteData({
          quoteUrl: getQuoteUrl(quoteToken),
          clientName: clientName,
          clientEmail: clientEmail || undefined,
          clientPhone: clientPhone || undefined,
          price: price,
          date: dateFormatted,
          time: timeFormatted,
          pickupAddress: pickup,
          dropoffAddress: dropoff,
        });
        setShowShareQuoteModal(true);
      } else {
        // Sinon, créer la course immédiatement et fermer
        onCreate(rideData);
        Alert.alert('Succès', 'Course créée avec succès !');
        onBack();
      }
    } catch (error: any) {
      console.error('❌ Erreur création course:', error);
      Alert.alert('Erreur', 'Impossible de créer la course');
    }
  };

  const toggleGroup = (group: Group) => {
    if (selectedGroups.find(g => g.id === group.id)) {
      // Remove group
      setSelectedGroups(selectedGroups.filter(g => g.id !== group.id));
    } else {
      // Add group
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const isGroupSelected = (groupId: string) => {
    return selectedGroups.some(g => g.id === groupId);
  };

  const priceNum = parseFloat((price || '').replace(',', '.')) || 0;
  const distanceNum = parseFloat(distance) || 0;
  const pricePerKmLabel =
    price && distanceNum > 0 && !Number.isNaN(priceNum) && priceNum > 0
      ? (priceNum / distanceNum).toFixed(2)
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'create' ? 'Créer une course' : 'Publier une course'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. Itinéraire en haut — puis Prix + Date/heure en dessous */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Itinéraire</Text>
          <AddressAutocomplete
            label="Départ"
            placeholder="Adresse de prise en charge"
            value={pickup}
            onSelectAddress={(address: AddressSuggestion) => { setPickup(address.label); setPickupCoords(address.coordinates); }}
            onChangeText={setPickup}
          />
          <View style={styles.formCardSpacer} />
          <AddressAutocomplete
            label="Arrivée"
            placeholder="Adresse de destination"
            value={dropoff}
            onSelectAddress={(address: AddressSuggestion) => { setDropoff(address.label); setDropoffCoords(address.coordinates); }}
            onChangeText={setDropoff}
          />
          {(pickupCoords && dropoffCoords) && (
            <View style={styles.routeWrap}>
              {calculatingRoute ? (
                <View style={styles.routeCalculating}>
                  <ActivityIndicator size="small" color="#0ea5e9" />
                  <Text style={styles.routeCalculatingText}>Calcul en cours…</Text>
                </View>
              ) : (distance && duration) ? (
                <View style={styles.routeRow}>
                  <View style={styles.routeRowCenter}>
                    <Text style={styles.routeValue}>{distance} km</Text>
                    <Text style={styles.routeDot}>·</Text>
                    <Text style={styles.routeValue}>{duration} min</Text>
                  </View>
                  <Text style={styles.routeHint}>La durée dépend des conditions de circulation et n'est qu'indicative.</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Fourchette indicative : sous km et durée, avec barre et repère */}
          <PriceHintChauffeur
            distanceKm={distance ? parseFloat(distance) : null}
            priceEur={price ? parseFloat((price || '').replace(',', '.')) : null}
          />

          <View style={styles.priceWrap}>
            <Text style={styles.priceLabel}>Prix (€)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInputGold}
                placeholder="Ex: 45,00"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
              {pricePerKmLabel !== null && (
                <View style={styles.pricePerKmWrap}>
                  <Text style={styles.pricePerKmValue}>{pricePerKmLabel}</Text>
                  <Text style={styles.pricePerKmUnit}> €/km</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateTimeHalf} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={22} color="#0ea5e9" />
              <Text style={styles.dateTimeText} numberOfLines={1}>{formatDateDisplay(selectedDate)}</Text>
            </TouchableOpacity>
            <View style={styles.dateTimeDivider} />
            <TouchableOpacity style={styles.dateTimeHalf} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
              <Ionicons name="time-outline" size={22} color="#0ea5e9" />
              <Text style={styles.dateTimeText}>{formatTimeDisplay(selectedDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Personnelle ou Annonce (en dessous de Prix et horaire) */}
        {mode === 'create' && (
          <View style={styles.typeCard}>
            <Text style={styles.typeCardLabel}>Type de course</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeOption, !publishToMarketplace && styles.typeOptionActive]}
                onPress={() => { setPublishToMarketplace(false); setVisibility('PERSONAL'); setSelectedGroups([]); }}
                activeOpacity={0.85}
              >
                <Ionicons name="person-outline" size={20} color={!publishToMarketplace ? '#fff' : '#94a3b8'} />
                <Text style={[styles.typeOptionText, !publishToMarketplace && styles.typeOptionTextActive]}>Personnelle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, publishToMarketplace && styles.typeOptionActive]}
                onPress={() => { setPublishToMarketplace(true); setVisibility('PUBLIC'); }}
                activeOpacity={0.85}
              >
                <Ionicons name="megaphone-outline" size={20} color={publishToMarketplace ? '#fff' : '#94a3b8'} />
                <Text style={[styles.typeOptionText, publishToMarketplace && styles.typeOptionTextActive]}>Annonce</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4a. Annonce : Client (obligatoire) + Visibilité */}
        {(publishToMarketplace || mode === 'publish') && (
          <>
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>Client</Text>
              <Text style={styles.formCardHint}>Nom obligatoire. Email ou téléphone (1 des 2 suffit).</Text>
              <TextInput style={[styles.input, styles.inputSpaced]} placeholder="Nom du client" placeholderTextColor="#64748b" value={clientName} onChangeText={setClientName} />
              <TextInput style={[styles.input, styles.inputSpaced]} placeholder="Ex: 06 12 34 56 78" placeholderTextColor="#64748b" keyboardType="phone-pad" value={clientPhone} onChangeText={(t) => setClientPhone(formatPhoneInput(t))} />
              <TextInput style={[styles.input, styles.inputSpacedLast]} placeholder="Email" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={clientEmail} onChangeText={setClientEmail} />
              <TouchableOpacity style={[styles.quoteToggle, (!clientName || (!clientPhone && !clientEmail)) && styles.quoteToggleDisabled]} onPress={() => { if (!clientName || (!clientPhone && !clientEmail)) { Alert.alert('Informations manquantes', 'Nom et au moins un contact (téléphone ou email) requis pour le devis.'); return; } setGenerateQuote(!generateQuote); }} activeOpacity={0.7}>
                <View style={styles.quoteToggleLeft}>
                  <Ionicons name="document-text" size={20} color={(!clientName || (!clientPhone && !clientEmail)) ? '#64748b' : '#f59e0b'} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quoteToggleTitle, (!clientName || (!clientPhone && !clientEmail)) && styles.quoteToggleTitleDisabled]}>Générer un devis</Text>
                    <Text style={[styles.quoteToggleSubtitle, (!clientName || (!clientPhone && !clientEmail)) && styles.quoteToggleSubtitleDisabled]}>Envoi par email ou WhatsApp</Text>
                  </View>
                </View>
                <View style={[styles.quoteToggleSwitchBox, generateQuote && (clientName && (clientPhone || clientEmail)) && styles.quoteToggleSwitchActive, (!clientName || (!clientPhone && !clientEmail)) && styles.quoteToggleSwitchDisabled]}>
                  <View style={[styles.quoteToggleThumb, generateQuote && (clientName && (clientPhone || clientEmail)) && styles.quoteToggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>Visibilité</Text>
              <View style={styles.visibilityRow}>
                <TouchableOpacity style={[styles.visibilityButton, visibility === 'PUBLIC' && styles.visibilityButtonActive]} onPress={() => { setVisibility('PUBLIC'); setSelectedGroups([]); }} activeOpacity={0.7}>
                  <Ionicons name="globe" size={18} color={visibility === 'PUBLIC' ? '#fff' : '#64748b'} />
                  <Text style={[styles.visibilityText, visibility === 'PUBLIC' && styles.visibilityTextActive]}>Public</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.visibilityButton, visibility === 'GROUP' && styles.visibilityButtonActive]} onPress={() => setVisibility('GROUP')} activeOpacity={0.7}>
                  <Ionicons name="people" size={18} color={visibility === 'GROUP' ? '#fff' : '#64748b'} />
                  <Text style={[styles.visibilityText, visibility === 'GROUP' && styles.visibilityTextActive]}>Groupe</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* 4b. Personnelle : Client & devis optionnel (repliable) */}
        {mode === 'create' && !publishToMarketplace && (
          <View style={styles.formCard}>
            <TouchableOpacity style={styles.cardRowHeader} onPress={() => setShowClientSection(!showClientSection)} activeOpacity={0.7}>
              <Text style={styles.formCardTitle}>Client & devis (optionnel)</Text>
              {(clientName || clientPhone || clientEmail) && <View style={styles.collapseBadge}><Text style={styles.collapseBadgeText}>Rempli</Text></View>}
              <Ionicons name={showClientSection ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
            </TouchableOpacity>
            {showClientSection && (
              <View style={styles.collapseContent}>
                <TextInput style={[styles.input, styles.collapseInput]} placeholder="Nom du client" placeholderTextColor="#64748b" value={clientName} onChangeText={setClientName} />
                <TextInput style={[styles.input, styles.collapseInput]} placeholder="Ex: 06 12 34 56 78" placeholderTextColor="#64748b" keyboardType="phone-pad" value={clientPhone} onChangeText={(t) => setClientPhone(formatPhoneInput(t))} />
                <TextInput style={[styles.input, styles.collapseInputLast]} placeholder="Email" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={clientEmail} onChangeText={setClientEmail} />
                <TouchableOpacity style={[styles.quoteToggle, (!clientName || (!clientPhone && !clientEmail)) && styles.quoteToggleDisabled]} onPress={() => { if (!clientName || (!clientPhone && !clientEmail)) { Alert.alert('Informations manquantes', 'Nom et au moins un contact requis pour le devis.'); return; } setGenerateQuote(!generateQuote); }} activeOpacity={0.7}>
                  <View style={styles.quoteToggleLeft}>
                    <Ionicons name="document-text" size={20} color={(!clientName || (!clientPhone && !clientEmail)) ? '#64748b' : '#f59e0b'} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.quoteToggleTitle, (!clientName || (!clientPhone && !clientEmail)) && styles.quoteToggleTitleDisabled]}>Générer un devis</Text>
                      <Text style={[styles.quoteToggleSubtitle, (!clientName || (!clientPhone && !clientEmail)) && styles.quoteToggleSubtitleDisabled]}>Envoi par email ou WhatsApp</Text>
                    </View>
                  </View>
                  <View style={[styles.quoteToggleSwitchBox, generateQuote && (clientName && (clientPhone || clientEmail)) && styles.quoteToggleSwitchActive, (!clientName || (!clientPhone && !clientEmail)) && styles.quoteToggleSwitchDisabled]}>
                    <View style={[styles.quoteToggleThumb, generateQuote && (clientName && (clientPhone || clientEmail)) && styles.quoteToggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Commentaire — infos importantes (bagages, nb personnes, etc.) */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Commentaire</Text>
          <Text style={styles.formCardHint}>Ex: 3 personnes, bagages volumineux, vol à récupérer…</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Notes pour le chauffeur…"
            placeholderTextColor="#64748b"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Group Selection (only visible when GROUP is selected) */}
        {visibility === 'GROUP' && (
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>Sélectionner vos groupes</Text>
            
            {/* Selected Groups Display */}
            {selectedGroups.length > 0 && (
              <View style={styles.selectedGroupsContainer}>
                {selectedGroups.map((group) => (
                  <View 
                    key={group.id} 
                    style={[styles.selectedGroupChip, { backgroundColor: group.color + '20', borderColor: group.color }]}
                  >
                    <View style={[styles.chipIconWrapper, { backgroundColor: group.color }]}>
                      <Ionicons name={group.icon as any} size={14} color="#fff" />
                    </View>
                    <Text style={styles.chipText}>{group.name}</Text>
                    <TouchableOpacity onPress={() => toggleGroup(group)}>
                      <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* All Groups List */}
            <View style={styles.groupsList}>
              {groups.map((group) => {
                const isSelected = isGroupSelected(group.id);
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.groupCard,
                      isSelected && { backgroundColor: group.color + '15', borderColor: group.color, borderWidth: 2 }
                    ]}
                    onPress={() => toggleGroup(group)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.groupIconWrapper, { backgroundColor: group.color }]}>
                      <Ionicons name={group.icon as any} size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupMembers}>{group.memberCount} membres</Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={group.color} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color="#64748b" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0ea5e9', '#06b6d4']}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>
              {mode === 'create' ? 'Créer la course' : 'Publier la course'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Date Picker - Android utilise le dialog natif directement, iOS utilise un Modal custom */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
          locale="fr-FR"
        />
      )}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner la date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close-circle" size={28} color="#64748b" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
                locale="fr-FR"
                textColor="#fff"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDatePicker(false)}
              >
                <LinearGradient
                  colors={['#0ea5e9', '#06b6d4']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Valider</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker - Android utilise le dialog natif directement, iOS utilise un Modal custom */}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          onChange={onTimeChange}
          locale="fr-FR"
        />
      )}
      {showTimePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner l'heure</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close-circle" size={28} color="#64748b" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                locale="fr-FR"
                textColor="#fff"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowTimePicker(false)}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#a78bfa']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Valider</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de partage du devis */}
      {createdQuoteData && (
        <ShareQuoteModal
          visible={showShareQuoteModal}
          onClose={() => {
            // Fermer le modal
            setShowShareQuoteModal(false);
            setCreatedQuoteData(null);
            
            // Créer la course maintenant que le modal est fermé
            if (pendingRideData) {
              onCreate(pendingRideData);
              setPendingRideData(null);
            }
            
            // Fermer l'écran
            onBack();
          }}
          quoteUrl={createdQuoteData.quoteUrl}
          quoteData={{
            clientName: createdQuoteData.clientName,
            clientEmail: createdQuoteData.clientEmail,
            clientPhone: createdQuoteData.clientPhone,
            price: createdQuoteData.price,
            date: createdQuoteData.date,
            time: createdQuoteData.time,
            pickupAddress: createdQuoteData.pickupAddress,
            dropoffAddress: createdQuoteData.dropoffAddress,
          }}
          driverName={user?.displayName || user?.email?.split('@')[0]}
        />
      )}

      <LegalInfoModal
        visible={showLegalModal}
        onClose={() => { setShowLegalModal(false); setPendingQuoteData(null); }}
        initialBusinessName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''}
        onSaved={() => {
          if (!pendingQuoteData) return;
          apiClient.createQuote(pendingQuoteData).then((quote: any) => {
            const rideData = {
              pickup_address: pickup,
              dropoff_address: dropoff,
              price_cents: parseFloat(price) * 100,
              scheduled_at: formatDateWithLocalTimezone(selectedDate),
              visibility,
              group_ids: selectedGroups.map((g: Group) => g.id),
              vehicle_type: 'STANDARD',
              distance_km: distance ? parseFloat(distance) : undefined,
              duration_minutes: duration ? parseInt(duration) : undefined,
              client_name: clientName || undefined,
              client_phone: formatPhoneForSubmit(clientPhone) || undefined,
              client_email: clientEmail || undefined,
              quote_id: quote.id,
              quote_token: quote.token,
              quote_status: 'SENT',
              notes: notes.trim() || undefined,
            };
            const scheduledDate = new Date(selectedDate);
            setPendingRideData(rideData);
            setCreatedQuoteData({
              quoteUrl: getQuoteUrl(quote.token),
              clientName,
              clientEmail: clientEmail || undefined,
              clientPhone: clientPhone || undefined,
              price,
              date: scheduledDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }),
              time: `${scheduledDate.getHours().toString().padStart(2, '0')}h${scheduledDate.getMinutes().toString().padStart(2, '0')}`,
              pickupAddress: pickup,
              dropoffAddress: dropoff,
            });
            setShowShareQuoteModal(true);
            setPendingQuoteData(null);
            setShowLegalModal(false);
          }).catch((e: any) => {
            Alert.alert('Erreur', e.message || 'Impossible de créer le devis');
          });
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  typeCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeOptionActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  typeOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  formCardHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  formCardSpacer: {
    height: 12,
  },
  routeWrap: {
    marginTop: 14,
    marginBottom: 4,
  },
  routeCalculating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  routeCalculatingText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  routeRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  routeDot: {
    fontSize: 16,
    color: '#38bdf8',
    marginHorizontal: 2,
  },
  routeHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
  priceWrap: {
    marginTop: 16,
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputGold: {
    width: 120,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#fbbf24',
  },
  pricePerKmWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  pricePerKmValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  pricePerKmUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fcd34d',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
  },
  dateTimeHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 10,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    flex: 1,
  },
  dateTimeDivider: {
    width: 1,
    backgroundColor: '#475569',
    marginVertical: 12,
  },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#e2e8f0',
    minHeight: 88,
    textAlignVertical: 'top',
  },
  cardRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputSpaced: {
    marginBottom: 10,
  },
  inputSpacedLast: {
    marginBottom: 14,
  },
  collapseBadge: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  collapseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6ee7b7',
  },
  collapseContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  collapseInput: {
    marginBottom: 10,
  },
  collapseInputLast: {
    marginBottom: 14,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  labelBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  labelSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  publishToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.3)',
  },
  publishToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  publishToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  toggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#64748b',
  },
  toggleKnobActive: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-end',
  },
  visibilityOptionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#e2e8f0',
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  visibilityButtonActive: {
    backgroundColor: '#ff6b47',
    borderColor: '#ff6b47',
  },
  visibilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  visibilityTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vehicleTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    minWidth: '47%',
  },
  vehicleTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  row: {
    flexDirection: 'row',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  dateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  dateSeparator: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  creditsRewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  creditsRewardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditsRewardIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  creditsRewardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  creditsRewardText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  selectedGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectedGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
    marginRight: 6,
  },
  groupIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  groupMembers: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  moreOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moreOptionsContent: {
    marginTop: 12,
  },
  moreOptionsSection: {
    marginBottom: 16,
  },
  moreOptionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Quote Toggle Styles
  quoteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  quoteToggleDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.2)',
    opacity: 0.7,
  },
  quoteToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quoteToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  quoteToggleTitleDisabled: {
    color: '#94a3b8',
  },
  quoteToggleSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  quoteToggleSubtitleDisabled: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  quoteToggleSwitchBox: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    padding: 2,
    justifyContent: 'center',
  },
  quoteToggleSwitchActive: {
    backgroundColor: '#f59e0b',
  },
  quoteToggleSwitchDisabled: {
    backgroundColor: '#1e293b',
  },
  quoteToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quoteToggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  // Route Info Styles (Distance & Duration)
  routeInfoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748b',
    marginHorizontal: 8,
  },
  routeInfoSection: {
    marginTop: -4,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  routeInfoCalculating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  routeInfoCalculatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6ee7b7',
  },
  routeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  routeInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6ee7b7',
  },
});

export default CreateRideScreen;

