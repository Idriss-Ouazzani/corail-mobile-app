/**
 * MyRidesTab - Onglet Mes Courses complet
 * Assemble tous les sous-composants de Mes Courses
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import MyRidesHeader from './MyRidesHeader';
import MyRidesTabBar from './MyRidesTabBar';
import MyRidesList from './MyRidesList';

interface Ride {
  id: string;
  pickup_address?: string;
  dropoff_address?: string;
  scheduled_at?: string;
  price_cents?: number;
  status: string;
  visibility?: string;
  creator_id?: string;
  picker_id?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  [key: string]: any;
}

interface PersonalRide {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  price_cents: number;
  status: string;
  [key: string]: any;
}

interface MyRidesTabProps {
  verificationStatus: string | null;
  onRefreshVerification: () => Promise<void>;
  rides: Ride[];
  personalRides: PersonalRide[];
  currentUserId: string | null;
  activeTab: 'claimed' | 'published' | 'personal';
  onTabChange: (tab: 'claimed' | 'published' | 'personal') => void;
  onCreateRide: () => void;
  onRidePress: (ride: Ride) => void;
  onPersonalRidePress: (ride: PersonalRide) => void;
  onPublishPersonalRide: (ride: PersonalRide) => void; // Nouveau: publier une course perso
}

export default function MyRidesTab({
  verificationStatus,
  onRefreshVerification,
  rides,
  personalRides,
  currentUserId,
  activeTab,
  onTabChange,
  onCreateRide,
  onRidePress,
  onPersonalRidePress,
  onPublishPersonalRide,
}: MyRidesTabProps) {
  // Filter rides where current user is the picker (claimed rides)
  const claimedByMe = rides.filter((ride) => ride.picker_id === currentUserId);
  const claimedRides = claimedByMe.filter((ride) => ride.status === 'CLAIMED');
  const completedRides = claimedByMe.filter((ride) => ride.status === 'COMPLETED');

  // Filter rides where current user is the creator (comparaison robuste)
  const createdByMe = rides.filter((ride) => currentUserId && String(ride.creator_id) === String(currentUserId));
  
  // Published rides = PUBLIC + GROUP (ou non défini, considéré comme PUBLIC)
  const publishedByMe = createdByMe.filter((ride) => {
    const v = (ride.visibility || 'PUBLIC').toUpperCase();
    return v === 'PUBLIC' || v === 'GROUP';
  });
  
  // Personal rides = utiliser l'état personalRides directement
  const personalByMe = personalRides;
  
  // Active published: PUBLISHED status + date future (non expirées)
  const activePublished = publishedByMe.filter((ride) => {
    if ((ride.status || '').toUpperCase() !== 'PUBLISHED') return false;
    const scheduledTime = ride.scheduled_at ? new Date(ride.scheduled_at).getTime() : NaN;
    return Number.isNaN(scheduledTime) || scheduledTime >= Date.now();
  });
  
  const claimedPublished = publishedByMe.filter((ride) => ride.status === 'CLAIMED' || ride.status === 'COMPLETED');
  
  // Personal rides actives (SCHEDULED avec date future uniquement)
  const activePersonal = personalByMe.filter((ride) => {
    // Exclure les courses terminées/annulées/expirées
    if (ride.status === 'COMPLETED' || ride.status === 'EXPIRED' || ride.status === 'CANCELLED') {
      return false;
    }
    // Pour les courses SCHEDULED, vérifier que la date est future
    const scheduledTime = new Date(ride.scheduled_at ?? 0).getTime();
    return scheduledTime >= Date.now();
  });

  // 📜 HISTORIQUE: Courses passées (max 10, triées par date décroissante)
  // Pour claimed: courses terminées dans le passé
  const historyClaimed = claimedByMe.filter((ride) => {
    if (ride.status !== 'COMPLETED') return false;
    const scheduledTime = new Date(ride.scheduled_at ?? 0).getTime();
    return scheduledTime < Date.now();
  }).sort((a, b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime()).slice(0, 10);

  // Pour published: courses passées ou expirées
  const historyPublished = publishedByMe.filter((ride) => {
    if (ride.status === 'PUBLISHED') {
      const scheduledTime = new Date(ride.scheduled_at ?? 0).getTime();
      return scheduledTime < Date.now(); // Publiées dont la date est passée
    }
    return ride.status === 'EXPIRED' || ride.status === 'COMPLETED';
  }).sort((a, b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime()).slice(0, 10);

  // Pour personal: courses explicitement terminées/annulées/expirées OU courses avec date passée
  const historyPersonal = personalByMe.filter((ride) => {
    // Courses terminées/annulées/expirées
    if (ride.status === 'COMPLETED' || ride.status === 'EXPIRED' || ride.status === 'CANCELLED') {
      return true;
    }
    // Courses SCHEDULED mais dont la date est passée
    const scheduledTime = new Date(ride.scheduled_at ?? 0).getTime();
    return scheduledTime < Date.now();
  }).sort((a, b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime()).slice(0, 10);

  const totalCount = activeTab === 'claimed' ? claimedByMe.length : activeTab === 'published' ? publishedByMe.length : personalByMe.length;

  return (
    <ScrollView contentContainerStyle={styles.scrollContentCourses} showsVerticalScrollIndicator={false}>
      <MyRidesHeader
        totalCount={totalCount}
        onCreateRide={onCreateRide}
      />

      <MyRidesTabBar
        activeTab={activeTab}
        claimedCount={claimedRides.length}
        publishedCount={activePublished.length}
        personalCount={activePersonal.length}
        onTabChange={onTabChange}
      />

      <MyRidesList
        activeTab={activeTab}
        claimedRides={claimedRides}
        completedRides={completedRides}
        historyClaimed={historyClaimed}
        activePublished={activePublished}
        claimedPublished={claimedPublished}
        historyPublished={historyPublished}
        activePersonal={activePersonal}
        historyPersonal={historyPersonal}
        onRidePress={onRidePress}
        onPersonalRidePress={(ride) => onPersonalRidePress(ride as PersonalRide)}
        onPublishPersonalRide={(ride) => onPublishPersonalRide(ride as PersonalRide)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContentCourses: {
    paddingBottom: 100,
  },
});
