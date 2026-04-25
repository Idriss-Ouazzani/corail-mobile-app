/**
 * MyRidesTab - Onglet Mes Courses complet
 * Assemble tous les sous-composants de Mes Courses
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { isSameCorailUser } from '../utils/isSameCorailUser';
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
  publicUsersRowId?: string | null;
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
  publicUsersRowId = null,
  activeTab,
  onTabChange,
  onCreateRide,
  onRidePress,
  onPersonalRidePress,
  onPublishPersonalRide,
}: MyRidesTabProps) {
  const now = Date.now();

  // Filter rides where current user is the picker (claimed rides)
  const claimedByMe = rides.filter((ride) => ride.picker_id === currentUserId);
  const claimedRides = claimedByMe.filter((ride) => ride.status === 'CLAIMED');
  const completedRides = claimedByMe.filter((ride) => ride.status === 'COMPLETED');

  // Filter rides where current user is the creator (auth / public.users.id)
  const createdByMe = rides.filter(
    (ride) => currentUserId && isSameCorailUser(ride.creator_id, currentUserId, publicUsersRowId)
  );
  
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
    return Number.isNaN(scheduledTime) || scheduledTime >= now;
  });
  
  const claimedPublished = publishedByMe.filter((ride) => ride.status === 'CLAIMED' || ride.status === 'COMPLETED');
  const claimedPublishedActive = claimedPublished.filter((ride) => {
    if ((ride.status || '').toUpperCase() === 'COMPLETED') return false;
    const scheduledTime = ride.scheduled_at ? new Date(ride.scheduled_at).getTime() : NaN;
    return Number.isNaN(scheduledTime) || scheduledTime >= now;
  });
  
  // Personal rides actives (SCHEDULED avec date future uniquement)
  const activePersonal = personalByMe.filter((ride) => {
    // Exclure les courses terminées/annulées/expirées
    if (ride.status === 'COMPLETED' || ride.status === 'EXPIRED' || ride.status === 'CANCELLED') {
      return false;
    }
    // Pour les courses SCHEDULED, vérifier que la date est future
    const scheduledTime = new Date(ride.scheduled_at ?? 0).getTime();
    return scheduledTime >= now;
  });

  // 📜 HISTORIQUE (claimed : section « Passées » = completedRides dans MyRidesList)

  // Pour published : annonces passées non prises (pas CLAIMED/COMPLETED → déjà dans « Prises ») + EXPIRED
  const historyPublished = publishedByMe.filter((ride) => {
    const st = (ride.status || '').toUpperCase();
    if (st === 'CLAIMED' || st === 'COMPLETED') return false;
    if (st === 'PUBLISHED') {
      const scheduledTime = new Date(ride.scheduled_at ?? 0).getTime();
      return !Number.isNaN(scheduledTime) && scheduledTime < Date.now();
    }
    return st === 'EXPIRED';
  }).sort((a, b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime());

  // Pour personal: courses explicitement terminées/annulées/expirées OU courses avec date passée
  const historyPersonal = personalByMe.filter((ride) => {
    // Courses terminées/annulées/expirées
    if (ride.status === 'COMPLETED' || ride.status === 'EXPIRED' || ride.status === 'CANCELLED') {
      return true;
    }
    // Courses SCHEDULED mais dont la date est passée
    const scheduledTime = new Date(ride.scheduled_at ?? 0).getTime();
    return scheduledTime < now;
  }).sort((a, b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime());

  const pendingQuotesCount = claimedRides.filter((ride) => {
    if ((ride.source || '').toLowerCase() !== 'client') return false;
    const quoteStatus = String((ride as any).quote_status || '').toUpperCase();
    return quoteStatus === 'SENT' || quoteStatus === 'VIEWED';
  }).length;

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
        publishedCount={activePublished.length + claimedPublishedActive.length}
        personalCount={activePersonal.length}
        pendingQuotesCount={pendingQuotesCount}
        onTabChange={onTabChange}
      />

      <MyRidesList
        activeTab={activeTab}
        claimedRides={claimedRides}
        completedRides={completedRides}
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
