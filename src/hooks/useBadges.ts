/**
 * useBadges - Custom Hook pour gérer les badges
 * 
 * 🎯 Gère les badges utilisateur (chargement, vérification conditions)
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { checkAndAwardBadges } from '../services/badgeService';

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

