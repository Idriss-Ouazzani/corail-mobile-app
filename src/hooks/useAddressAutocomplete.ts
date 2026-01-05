/**
 * useAddressAutocomplete - Hook pour l'autocomplétion d'adresses
 * 
 * Gère le debouncing et l'état des suggestions
 */

import { useState, useEffect, useCallback } from 'react';
import { searchAddress, AddressSuggestion } from '../services/addressApi';
import { logger } from '../services/logger';

interface UseAddressAutocompleteOptions {
  debounceMs?: number; // Délai avant de lancer la recherche (défaut: 300ms)
  minLength?: number; // Longueur minimale pour déclencher la recherche (défaut: 3)
  limit?: number; // Nombre de suggestions (défaut: 5)
}

export const useAddressAutocomplete = (options: UseAddressAutocompleteOptions = {}) => {
  const {
    debounceMs = 300,
    minLength = 3,
    limit = 8, // Plus de résultats par défaut
  } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recherche avec debouncing
  useEffect(() => {
    // Reset si la requête est trop courte
    if (query.length < minLength) {
      setSuggestions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Debounce : attendre avant de faire l'appel API
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchAddress(query, limit);
        setSuggestions(results);
        
        // Ne pas afficher d'erreur si l'utilisateur tape encore
        if (results.length === 0) {
          // Pas d'erreur, juste des suggestions vides
          // L'utilisateur peut continuer à taper
        }
      } catch (err: any) {
        logger.error('[useAddressAutocomplete] Erreur recherche', err, { query });
        setError('Erreur de recherche');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    // Cleanup : annuler la recherche si l'utilisateur continue de taper
    return () => {
      clearTimeout(timeoutId);
      setLoading(false);
    };
  }, [query, debounceMs, minLength, limit]);

  // Fonction pour mettre à jour la requête
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  // Fonction pour réinitialiser
  const reset = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    query,
    suggestions,
    loading,
    error,
    updateQuery,
    reset,
  };
};

