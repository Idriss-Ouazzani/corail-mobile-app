/**
 * useBadges - Custom Hook pour gérer les badges
 * 
 * 🎯 Gère les badges utilisateur (chargement, vérification conditions)
 * Notifie les nouveaux badges débloqués (notification locale).
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';
import { checkAndAwardBadges } from '../services/badgeService';
import * as NotificationService from '../services/notifications';

const SEEN_BADGE_IDS_KEY = '@corail_seen_badge_ids';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: string;
  earned_at?: string;
}

export function useBadges(currentUserId: string | null) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBadges = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      console.log('🏆 Chargement badges...');
      const data = await apiClient.getUserBadges(currentUserId);
      setBadges(data);
      console.log('✅ Badges chargés:', data.length);

      // Détecter les nouveaux badges débloqués et notifier
      const earned = (data || []).filter((b: Badge) => b.earned_at);
      if (earned.length > 0) {
        let seenIds: string[] = [];
        try {
          const raw = await AsyncStorage.getItem(SEEN_BADGE_IDS_KEY);
          if (raw) seenIds = JSON.parse(raw);
        } catch (_) {}
        const newEarned = earned.filter((b: Badge) => !seenIds.includes(b.id));
        for (const badge of newEarned) {
          try {
            await NotificationService.notifyBadgeEarned(badge.name, badge.description || '');
          } catch (_) {}
          seenIds.push(badge.id);
        }
        if (newEarned.length > 0) {
          try {
            await AsyncStorage.setItem(SEEN_BADGE_IDS_KEY, JSON.stringify(seenIds));
          } catch (_) {}
        }
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement badges:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const checkBadges = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      console.log('🔍 Vérification badges...');
      await checkAndAwardBadges(currentUserId);
      await loadBadges();
    } catch (err: any) {
      console.error('❌ Erreur vérification badges:', err);
    }
  }, [currentUserId, loadBadges]);

  useEffect(() => {
    if (currentUserId) {
      loadBadges();
    }
  }, [currentUserId, loadBadges]);

  return {
    badges,
    loading,
    loadBadges,
    checkBadges,
  };
}

