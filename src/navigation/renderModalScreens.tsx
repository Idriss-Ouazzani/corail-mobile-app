/**
 * renderModalScreens - Fonction helper pour le routing des écrans modaux
 * 
 * ✅ Bonne pratique : Fonction pure qui retourne JSX | null
 * ❌ Pas un composant React (pas de hooks, pas de state)
 * 
 * Baby step 5 (FINAL) : Ajout de CreateRide et RideDetail
 */

import React from 'react';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import BadgesScreen from '../screens/BadgesScreen';
import GroupInvitationsScreen from '../screens/GroupInvitationsScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import PersonalRidesScreen from '../screens/PersonalRidesScreen';
import CreateQuoteScreen from '../screens/CreateQuoteScreen';
import MyQuotesScreen from '../screens/MyQuotesScreen';
import MyInvoicesScreen from '../screens/MyInvoicesScreen';
import PlanningScreen from '../screens/PlanningScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import GroupsScreen from '../screens/GroupsScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import CreateRideScreen from '../screens/CreateRideScreen';
import RideDetailScreen from '../screens/RideDetailScreen';
import { VTCPublicProfileScreen } from '../screens/VTCPublicProfileScreen';
import DriverRequestsScreen from '../screens/DriverRequestsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import LegalNoticeScreen from '../screens/LegalNoticeScreen';
import PrivacyDataScreen from '../screens/PrivacyDataScreen';

interface ModalScreensProps {
  // User data
  user: any; // Supabase user
  userFullName: string;
  userEmail: string;
  userPhone: string;
  userPhotoUrl: string;
  userSiren: string;
  userProfessionalCard: string;
  currentUserId: string;
  verificationStatus: string | null;
  
  // Personal Info
  showPersonalInfo: boolean;
  setShowPersonalInfo: (show: boolean) => void;
  
  // Notifications
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  
  // Help & Support
  showHelpSupport: boolean;
  setShowHelpSupport: (show: boolean) => void;
  
  // Badges
  showBadges: boolean;
  setShowBadges: (show: boolean) => void;
  
  // Group Invitations
  showGroupInvitations: boolean;
  setShowGroupInvitations: (show: boolean) => void;
  loadGroups: () => void;
  loadPendingInvitations: () => void;
  
  // QR Code
  showQRCode: boolean;
  setShowQRCode: (show: boolean) => void;
  
  // Personal Rides
  showPersonalRides: boolean;
  setShowPersonalRides: (show: boolean) => void;
  
  // Quotes
  showCreateQuote: boolean;
  setShowCreateQuote: (show: boolean) => void;
  showMyQuotes: boolean;
  setShowMyQuotes: (show: boolean) => void;
  
  // Invoices
  showMyInvoices: boolean;
  setShowMyInvoices: (show: boolean) => void;
  
  // Planning
  showPlanning: boolean;
  setShowPlanning: (show: boolean) => void;
  
  // Admin Panel
  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
  
  // VTC Profile
  showVTCProfile: boolean;
  setShowVTCProfile: (show: boolean) => void;
  // Driver requests (from public page)
  showDriverRequests: boolean;
  setShowDriverRequests: (show: boolean) => void;
  
  // Legal Pages
  showPrivacyPolicy: boolean;
  setShowPrivacyPolicy: (show: boolean) => void;
  showTermsOfService: boolean;
  setShowTermsOfService: (show: boolean) => void;
  showLegalNotice: boolean;
  setShowLegalNotice: (show: boolean) => void;
  showPrivacyData: boolean;
  setShowPrivacyData: (show: boolean) => void;
  
  // Groups
  showGroups: boolean;
  setShowGroups: (show: boolean) => void;
  selectedGroup: any; // Group type
  setSelectedGroup: (group: any) => void;
  
  // Create Ride
  showCreateRide: boolean;
  setShowCreateRide: (show: boolean) => void;
  createRideMode: 'create' | 'publish';
  handleCreateRide: (ride: any) => Promise<void>;
  
  // Ride Detail
  selectedRide: any; // Ride type
  setSelectedRide: (ride: any) => void;
  selectedPersonalRide: any; // PersonalRide type
  setSelectedPersonalRide: (ride: any) => void;
  showPublishModal: boolean;
  setShowPublishModal: (show: boolean) => void;
  userCredits: number;
  handleClaimRide: (ride: any) => Promise<any>;
  handleDeleteRide: (rideId: string, visibility: string, ride?: { picker_id?: string; pickup_address?: string; dropoff_address?: string }) => Promise<void>;
  handleCompleteRide: (rideId: string, priceCents: number, distanceKm?: number, durationMinutes?: number, rating?: { stars: number; comment?: string | null }) => Promise<void>;
  loadPersonalRides: () => Promise<void>;
  loadRides: () => Promise<void>;
  loadCredits: () => Promise<void>;
}

/**
 * Retourne le premier écran modal actif, ou null si aucun
 * Cette fonction est appelée directement dans le render de App
 */
export function renderModalScreens(props: ModalScreensProps): React.ReactElement | null {
  const {
    user,
    userFullName,
    userEmail,
    userPhone,
    userPhotoUrl,
    userSiren,
    userProfessionalCard,
    currentUserId,
    verificationStatus,
    showPersonalInfo,
    setShowPersonalInfo,
    showNotifications,
    setShowNotifications,
    showHelpSupport,
    setShowHelpSupport,
    showBadges,
    setShowBadges,
    showGroupInvitations,
    setShowGroupInvitations,
    loadGroups,
    loadPendingInvitations,
    showQRCode,
    setShowQRCode,
    showPersonalRides,
    setShowPersonalRides,
    showCreateQuote,
    setShowCreateQuote,
    showMyInvoices,
    setShowMyInvoices,
    showMyQuotes,
    setShowMyQuotes,
    showPlanning,
    setShowPlanning,
    showAdminPanel,
    setShowAdminPanel,
    showVTCProfile,
    setShowVTCProfile,
    showDriverRequests,
    setShowDriverRequests,
    showPrivacyPolicy,
    setShowPrivacyPolicy,
    showTermsOfService,
    setShowTermsOfService,
    showLegalNotice,
    setShowLegalNotice,
    showPrivacyData,
    setShowPrivacyData,
    showGroups,
    setShowGroups,
    selectedGroup,
    setSelectedGroup,
    showCreateRide,
    setShowCreateRide,
    createRideMode,
    handleCreateRide,
    selectedRide,
    setSelectedRide,
    selectedPersonalRide,
    setSelectedPersonalRide,
    showPublishModal,
    setShowPublishModal,
    userCredits,
    handleClaimRide,
    handleDeleteRide,
    handleCompleteRide,
    loadPersonalRides,
    loadRides,
    loadCredits,
  } = props;

  // 👤 Personal Info Screen
  if (showPersonalInfo) {
    return (
      <PersonalInfoScreen 
        onBack={() => setShowPersonalInfo(false)}
        fullName={userFullName}
        email={userEmail}
        phone={userPhone}
        siret={userSiren}
        vtcCard={userProfessionalCard}
      />
    );
  }

  // 🔔 Notifications Screen
  if (showNotifications) {
    return <NotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  // ❓ Help & Support Screen
  if (showHelpSupport) {
    return <HelpSupportScreen onBack={() => setShowHelpSupport(false)} />;
  }

  // 🏆 Badges Screen
  if (showBadges) {
    return <BadgesScreen onBack={() => setShowBadges(false)} currentUserId={currentUserId} />;
  }

  // 📨 Group Invitations Screen
  if (showGroupInvitations) {
    return (
      <GroupInvitationsScreen
        onBack={() => {
          setShowGroupInvitations(false);
          loadGroups(); // Recharger les groupes après avoir traité les invitations
          loadPendingInvitations(); // Recharger le compteur de badge
        }}
      />
    );
  }

  // 📬 Demandes reçues (page publique)
  if (showDriverRequests) {
    return (
      <DriverRequestsScreen
        onBack={() => setShowDriverRequests(false)}
        onRequestAccepted={() => {
          setShowDriverRequests(false);
          loadPersonalRides();
        }}
      />
    );
  }

  // 📱 QR Code Screen
  if (showQRCode) {
    return (
      <QRCodeScreen
        onBack={() => setShowQRCode(false)}
        onNavigateToProfile={() => {
          setShowQRCode(false);
          setShowVTCProfile(true);
        }}
        userData={{
          name: userFullName || user?.displayName || 'Utilisateur',
          email: userEmail,
          phone: userPhone || undefined,
          company: undefined, // B2B: Pas d'intermédiaire, contact direct chauffeur
          professionalCardNumber: userProfessionalCard || undefined,
        }}
      />
    );
  }

  // 🚗 Personal Rides Screen
  if (showPersonalRides) {
    return <PersonalRidesScreen onClose={() => setShowPersonalRides(false)} />;
  }

  // ✍️ Create Quote Screen
  if (showCreateQuote) {
    return (
      <CreateQuoteScreen
        onBack={() => setShowCreateQuote(false)}
        onQuoteSent={() => setShowCreateQuote(false)}
      />
    );
  }

  // 🧾 My Invoices Screen
  if (showMyInvoices) {
    return (
      <MyInvoicesScreen
        onBack={() => setShowMyInvoices(false)}
      />
    );
  }

  // 📋 My Quotes Screen
  if (showMyQuotes) {
    return (
      <MyQuotesScreen
        onBack={() => setShowMyQuotes(false)}
        onCreateQuote={() => {
          setShowMyQuotes(false);
          setShowCreateQuote(true);
        }}
      />
    );
  }

  if (showVTCProfile) {
    return (
      <VTCPublicProfileScreen 
        onBack={() => setShowVTCProfile(false)}
        currentUserId={currentUserId}
        currentUserEmail={userEmail}
        currentUserName={userFullName}
        currentUserPhone={userPhone}
        currentUserProfessionalCard={userProfessionalCard}
        currentUserPhotoUrl={userPhotoUrl}
      />
    );
  }

  // 📅 Planning Screen
  if (showPlanning) {
    return (
      <PlanningScreen 
        onBack={() => setShowPlanning(false)}
        onRidePress={async (rideId) => {
          // Charger la course complète et ouvrir le détail
          try {
            const { apiClient } = await import('../services/api');
            const ride = await apiClient.getRide(rideId);
            setSelectedRide(ride);
            setShowPlanning(false); // Fermer le planning pour voir le détail
          } catch (error) {
            console.error('Erreur chargement course:', error);
          }
        }}
        onPersonalRidePress={async (rideId) => {
          // Charger la course personnelle complète et ouvrir le détail
          try {
            const { apiClient } = await import('../services/api');
            const ride = await apiClient.getPersonalRide(rideId);
            setSelectedPersonalRide(ride);
            setShowPlanning(false); // Fermer le planning pour voir le détail
          } catch (error) {
            console.error('Erreur chargement course personnelle:', error);
          }
        }}
      />
    );
  }

  // 👨‍💼 Admin Panel Screen
  if (showAdminPanel) {
    return <AdminPanelScreen onBack={() => setShowAdminPanel(false)} />;
  }

  // 👥 Group Detail Screen (avant Groups pour priorité)
  if (selectedGroup) {
    return (
      <GroupDetailScreen
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  // 👥 Groups Screen
  if (showGroups) {
    return (
      <GroupsScreen
        onBack={() => {
          setShowGroups(false);
          loadGroups(); // Recharger les groupes après fermeture
        }}
        onSelectGroup={(group) => setSelectedGroup(group)}
      />
    );
  }

  // ➕ Create Ride Screen
  if (showCreateRide) {
    return (
      <CreateRideScreen
        mode={createRideMode}
        verificationStatus={verificationStatus}
        onBack={() => setShowCreateRide(false)}
        onCreate={async (ride) => {
          try {
            await handleCreateRide(ride);
            // Fermer le modal après succès
            setShowCreateRide(false);
          } catch (error) {
            // L'erreur est déjà loggée et affichée par le hook
          }
        }}
      />
    );
  }

  // 🚗 Personal Ride Detail (priorité sur Ride Detail)
  if (selectedPersonalRide && !showPublishModal) {
    return (
      <RideDetailScreen
        key={`personal-${selectedPersonalRide.id}-${selectedPersonalRide.status}`}
        ride={selectedPersonalRide}
        currentUserId={currentUserId}
        userCredits={userCredits}
        onBack={() => setSelectedPersonalRide(null)}
        onPublish={() => {
          // Ouvrir le modal de publication
          setShowPublishModal(true);
        }}
        onDelete={async () => {
          try {
            const apiClient = require('../services/api').apiClient;
            await apiClient.deletePersonalRide(selectedPersonalRide.id);
            console.log('✅ Course personnelle supprimée');
            setSelectedPersonalRide(null);
            await loadPersonalRides();
          } catch (error: any) {
            const logger = require('../services/logger').logger;
            const toast = require('../services/toast').toast;
            logger.error('Erreur suppression course personnelle', error, {
              action: 'deletePersonalRide'
            });
            toast.error('Erreur', 'Impossible de supprimer la course');
          }
        }}
      />
    );
  }

  // 🚗 Ride Detail
  if (selectedRide) {
    return (
      <RideDetailScreen
        key={`${selectedRide.id}-${selectedRide.picker_id}-${selectedRide.status}`}
        ride={selectedRide}
        currentUserId={currentUserId}
        userCredits={userCredits}
        onBack={() => setSelectedRide(null)}
        onClaim={async () => {
          try {
            const updatedRide = await handleClaimRide(selectedRide);
            if (updatedRide) {
              setSelectedRide(updatedRide);
              return;
            }
            // Si handleClaimRide a retourné null (ex. vérification), refetch quand même au cas où le claim aurait réussi
            const apiClient = require('../services/api').apiClient;
            const refetched = await apiClient.getRide(selectedRide.id);
            if (refetched && String(refetched.status).toUpperCase() === 'CLAIMED' && refetched.picker_id) {
              setSelectedRide(refetched);
            }
          } catch (error) {
            // En cas d'erreur, refetch pour afficher l'état réel (boutons Accepter/Proposer si claim a réussi)
            try {
              const apiClient = require('../services/api').apiClient;
              const refetched = await apiClient.getRide(selectedRide.id);
              if (refetched && String(refetched.status).toUpperCase() === 'CLAIMED' && refetched.picker_id) {
                setSelectedRide(refetched);
              }
            } catch (_) {}
          }
        }}
        onDelete={async () => {
          try {
            await handleDeleteRide(selectedRide.id, selectedRide.visibility || 'PUBLIC', selectedRide);
            // Fermer le modal après succès
            setSelectedRide(null);
          } catch (error) {
            // L'erreur est déjà loggée et affichée par le hook
          }
        }}
        onComplete={async (rating) => {
          try {
            await handleCompleteRide(
              selectedRide.id,
              selectedRide.price_cents,
              selectedRide.distance_km,
              selectedRide.duration_minutes,
              rating ? { stars: rating.stars, comment: rating.comment ?? null } : undefined
            );
            setSelectedRide(null);
          } catch (error) {
            // L'erreur est déjà loggée et affichée par le hook
          }
        }}
        onRideUpdated={(updatedRide) => setSelectedRide(updatedRide)}
        onConvertToPersonal={async () => {
          try {
            const apiClient = require('../services/api').apiClient;
            await apiClient.convertPublishedToPersonal(selectedRide.id);
            const toast = require('../services/toast').toast;
            const logger = require('../services/logger').logger;
            
            console.log('✅ Course convertie en personnelle');
            toast.success('Course convertie', 'La course est maintenant dans vos courses personnelles');
            logger.info('Course convertie en personnelle', { rideId: selectedRide.id });
            
            // Délai pour laisser l'Edge Function + DB se propager
            console.log('⏳ [convertToPersonal] Attente 1500ms...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Recharger les données (marketplace + personnelles + CRÉDITS)
            setSelectedRide(null);
            console.log('🔄 [convertToPersonal] Rechargement de toutes les données...');
            await Promise.all([loadRides(), loadPersonalRides(), loadCredits()]);
            console.log('✅ [convertToPersonal] Tout rechargé !');
          } catch (error: any) {
            const toast = require('../services/toast').toast;
            const logger = require('../services/logger').logger;
            console.error('❌ Erreur conversion course:', error);
            logger.error('Erreur conversion course', error, { action: 'convertPublishedToPersonal' });
            toast.error('Erreur', error.message || 'Impossible de convertir la course');
          }
        }}
      />
    );
  }

  // ======================================================================
  // 📜 LEGAL PAGES
  // ======================================================================

  if (showPrivacyPolicy) {
    return <PrivacyPolicyScreen onBack={() => setShowPrivacyPolicy(false)} />;
  }

  if (showTermsOfService) {
    return <TermsOfServiceScreen onBack={() => setShowTermsOfService(false)} />;
  }

  if (showLegalNotice) {
    return <LegalNoticeScreen onBack={() => setShowLegalNotice(false)} />;
  }

  if (showPrivacyData) {
    return (
      <PrivacyDataScreen
        onBack={() => setShowPrivacyData(false)}
        currentUserId={currentUserId}
        currentUserEmail={userEmail}
      />
    );
  }

  // Aucun écran modal actif
  return null;
}

