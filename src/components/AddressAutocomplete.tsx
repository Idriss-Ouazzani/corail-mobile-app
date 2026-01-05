/**
 * AddressAutocomplete - Composant d'autocomplétion d'adresses
 * 
 * Composant réutilisable avec UI moderne
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete';
import { AddressSuggestion } from '../services/addressApi';

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onSelectAddress: (address: AddressSuggestion) => void;
  onChangeText?: (text: string) => void;
  error?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onSelectAddress,
  onChangeText,
  error: externalError,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const {
    suggestions,
    loading,
    error: apiError,
    updateQuery,
  } = useAddressAutocomplete({
    debounceMs: 300,
    minLength: 3,
    limit: 8, // Plus de résultats
  });

  const handleChangeText = (text: string) => {
    setInputValue(text);
    updateQuery(text);
    setShowSuggestions(true);
    onChangeText?.(text);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.label);
    setShowSuggestions(false);
    onSelectAddress(suggestion);
  };

  const handleClearInput = () => {
    setInputValue('');
    updateQuery('');
    setShowSuggestions(false);
    onChangeText?.('');
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input avec icônes */}
      <View style={[styles.inputContainer, (externalError || apiError) && styles.inputError]}>
        <Ionicons name="location-outline" size={20} color="#64748b" style={styles.icon} />
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          value={inputValue}
          onChangeText={handleChangeText}
          onFocus={() => setShowSuggestions(true)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Loading ou Clear */}
        {loading ? (
          <ActivityIndicator size="small" color="#6366f1" style={styles.rightIcon} />
        ) : inputValue.length > 0 ? (
          <TouchableOpacity onPress={handleClearInput} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Erreur */}
      {(externalError || apiError) && (
        <Text style={styles.errorText}>{externalError || apiError}</Text>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ScrollView 
          style={styles.suggestionsContainer}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map((item, index) => {
            // Icône selon le type
            const iconName = item.isPOI ? 'business' : 'location';
            const iconColor = item.isPOI ? '#10b981' : '#6366f1';
            
            return (
              <View key={`${item.label}-${index}`}>
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={iconName} size={20} color={iconColor} style={styles.suggestionIcon} />
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionLabel} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.suggestionContext} numberOfLines={1}>
                      {item.city && `${item.city}`}
                      {item.postcode && ` • ${item.postcode}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
                {index < suggestions.length - 1 && <View style={styles.separator} />}
              </View>
            );
          })}
        </ScrollView>
      )}
      
      {/* Message quand pas de résultats (seulement si utilisateur a fini de taper) */}
      {showSuggestions && !loading && inputValue.length >= 3 && suggestions.length === 0 && (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={24} color="#64748b" />
          <Text style={styles.noResultsText}>Aucun résultat</Text>
          <Text style={styles.noResultsHint}>Essayez un autre terme de recherche</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#f1f5f9',
    paddingVertical: 0,
  },
  rightIcon: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 320, // Plus grand pour voir plus de suggestions
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  suggestionContext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
  },
  noResultsContainer: {
    marginTop: 8,
    padding: 24,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 8,
  },
  noResultsHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});

