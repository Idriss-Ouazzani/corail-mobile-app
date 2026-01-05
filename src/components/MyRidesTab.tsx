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
  pickup_address: string;
  dropoff_address: string;
  scheduled_at: string;
  price_cents: number;
  status: string;
  visibility?: string;
  creator_id?: string;
  picker_id?: string;
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

  // Filter rides where current user is the creator
  const createdByMe = rides.filter((ride) => ride.creator_id === currentUserId);
  
  // Published rides = PUBLIC + GROUP only (excluant PERSONAL)
  const publishedByMe = createdByMe.filter((ride) => 
    ride.visibility === 'PUBLIC' || ride.visibility === 'GROUP'
  );
  
  // Personal rides = utiliser l'état personalRides directement
  const personalByMe = personalRides;
  
  // Active published: PUBLISHED status + date future (non expirées)
  const activePublished = publishedByMe.filter((ride) => {
    if (ride.status !== 'PUBLISHED') return false;
    if (ride.status === 'EXPIRED') return false;
    // Vérifier que la date n'est pas passée
    const scheduledTime = new Date(ride.scheduled_at).getTime();
    const now = Date.now();
    return scheduledTime >= now;
  });
  
  const claimedPublished = publishedByMe.filter((ride) => ride.status === 'CLAIMED' || ride.status === 'COMPLETED');
  
  // Personal rides actives (SCHEDULED ou sans statut, non expirées)
  const activePersonal = personalByMe.filter((ride) => {
    if (ride.status === 'COMPLETED' || ride.status === 'EXPIRED') return false;
    const scheduledTime = new Date(ride.scheduled_at).getTime();
    const now = Date.now();
    return scheduledTime >= now;
  });

  // 📜 HISTORIQUE: Courses passées (max 10, triées par date décroissante)
  // Pour claimed: courses terminées dans le passé
  const historyClaimed = claimedByMe.filter((ride) => {
    if (ride.status !== 'COMPLETED') return false;
    const scheduledTime = new Date(ride.scheduled_at).getTime();
    return scheduledTime < Date.now();
  }).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()).slice(0, 10);

  // Pour published: courses passées ou expirées
  const historyPublished = publishedByMe.filter((ride) => {
    if (ride.status === 'PUBLISHED') {
      const scheduledTime = new Date(ride.scheduled_at).getTime();
      return scheduledTime < Date.now(); // Publiées dont la date est passée
    }
    return ride.status === 'EXPIRED' || ride.status === 'COMPLETED';
  }).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()).slice(0, 10);

  // Pour personal: courses passées (COMPLETED, EXPIRED, ou date passée)
  const historyPersonal = personalByMe.filter((ride) => {
    if (ride.status === 'COMPLETED' || ride.status === 'EXPIRED') return true;
    const scheduledTime = new Date(ride.scheduled_at).getTime();
    return scheduledTime < Date.now();
  }).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()).slice(0, 10);

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
        onPersonalRidePress={onPersonalRidePress}
        onPublishPersonalRide={onPublishPersonalRide}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContentCourses: {
    paddingBottom: 100,
  },
});
