/**
 * useGroups - Custom Hook pour gérer les groupes
 * 
 * 🎯 Gère les groupes utilisateur (liste, création, invitations)
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../services/api';

interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  memberCount?: number;
  creator_id?: string;
}

export function useGroups(currentUserId: string | null) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      console.log('👥 Chargement groupes...');
      const data = await apiClient.listGroups();
      setGroups(data);
      console.log('✅ Groupes chargés:', data.length);
    } catch (err: any) {
      console.error('❌ Erreur chargement groupes:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const createGroup = useCallback(async (groupData: { name: string; description?: string }) => {
    try {
      console.log('➕ Création groupe...');
      await apiClient.createGroup(groupData);
      await loadGroups();
      Alert.alert('Succès', 'Groupe créé !');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur création groupe:', err);
      Alert.alert('Erreur', 'Impossible de créer le groupe');
      return false;
    }
  }, [loadGroups]);

  const inviteToGroup = useCallback(async (groupId: string, identifier: string) => {
    try {
      console.log('📧 Invitation au groupe...');
      await apiClient.inviteToGroup(groupId, identifier);
      Alert.alert('Succès', 'Invitation envoyée !');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur invitation:', err);
      Alert.alert('Erreur', err.message || 'Impossible d\'envoyer l\'invitation');
      return false;
    }
  }, []);

  const leaveGroup = useCallback(async (groupId: string) => {
    try {
      console.log('🚪 Quitter groupe...');
      await apiClient.leaveGroup(groupId);
      await loadGroups();
      Alert.alert('Succès', 'Vous avez quitté le groupe');
      return true;
    } catch (err: any) {
      console.error('❌ Erreur quitter groupe:', err);
      Alert.alert('Erreur', 'Impossible de quitter le groupe');
      return false;
    }
  }, [loadGroups]);

  useEffect(() => {
    if (currentUserId) {
      loadGroups();
    }
  }, [currentUserId, loadGroups]);

  return {
    groups,
    loading,
    loadGroups,
    createGroup,
    inviteToGroup,
    leaveGroup,
  };
}

