/**
 * MultiSelectInput - Sélection multiple avec options prédéfinies + ajout custom
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_ACCENT = '#6366f1';

interface MultiSelectInputProps {
  label: string;
  selectedItems: string[];
  predefinedOptions: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  accentColor?: string;
}

export default function MultiSelectInput({
  label,
  selectedItems,
  predefinedOptions,
  onItemsChange,
  placeholder = 'Ajouter...',
  accentColor = DEFAULT_ACCENT,
}: MultiSelectInputProps) {
  const accentBg = accentColor + '30';
  const [customInput, setCustomInput] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const toggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      onItemsChange(selectedItems.filter((i) => i !== item));
    } else {
      onItemsChange([...selectedItems, item]);
    }
  };

  const addCustomItem = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selectedItems.includes(trimmed)) {
      onItemsChange([...selectedItems, trimmed]);
      setCustomInput('');
    }
  };

  const removeItem = (item: string) => {
    onItemsChange(selectedItems.filter((i) => i !== item));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Items sélectionnés */}
      {selectedItems.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedItems.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.selectedBadge, { backgroundColor: accentColor }]}
              onPress={() => removeItem(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectedBadgeText}>{item}</Text>
              <Ionicons name="close-circle" size={16} color="#e2e8f0" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bouton pour afficher les options */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowOptions(!showOptions)}
          activeOpacity={0.7}
        >
        <Ionicons name="add-circle-outline" size={20} color={accentColor} />
        <Text style={[styles.toggleButtonText, { color: accentColor }]}>
          {showOptions ? 'Masquer les options' : 'Choisir dans la liste'}
        </Text>
        <Ionicons
          name={showOptions ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={accentColor}
        />
      </TouchableOpacity>

      {/* Options prédéfinies */}
      {showOptions && (
        <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
          {predefinedOptions.map((option) => {
            const isSelected = selectedItems.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={[styles.option, isSelected && { backgroundColor: accentBg }]}
                onPress={() => toggleItem(option)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={accentColor} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Input custom */}
      <View style={styles.customInputContainer}>
        <TextInput
          style={styles.customInput}
          value={customInput}
          onChangeText={setCustomInput}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          onSubmitEditing={addCustomItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addCustomItem}
          disabled={!customInput.trim()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add-circle"
            size={28}
            color={customInput.trim() ? accentColor : '#64748b'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    maxHeight: 200,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  optionText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#e2e8f0',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#334155',
  },
  addButton: {
    padding: 4,
  },
});



