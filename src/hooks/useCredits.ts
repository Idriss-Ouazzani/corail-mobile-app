/**
 * useCredits - Custom Hook pour gérer les crédits
 * 
 * 🎯 Gère le système de crédits (chargement, ajout, déduction)
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export function useCredits(currentUserId: string | null) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCredits = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      console.log('💰 [useCredits] Chargement crédits pour:', currentUserId);
      const response = await apiClient.getCredits();
      // getCredits() retourne { credits: number }
      const balance = typeof response === 'object' && response?.credits !== undefined 
        ? response.credits 
        : (typeof response === 'number' ? response : 0);
      
      console.log('💰 [useCredits] Ancien state:', credits, '→ Nouveau state:', balance);
      setCredits(balance);
      console.log('✅ [useCredits] State mis à jour avec:', balance);
    } catch (err: any) {
      console.error('❌ [useCredits] Erreur chargement crédits:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const addCredits = useCallback((amount: number) => {
    setCredits(prev => prev + amount);
  }, []);

  const deductCredits = useCallback((amount: number) => {
    setCredits(prev => Math.max(0, prev - amount));
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadCredits();
    }
  }, [currentUserId, loadCredits]);

  return {
    credits,
    loading,
    loadCredits,
    addCredits,
    deductCredits,
  };
}

