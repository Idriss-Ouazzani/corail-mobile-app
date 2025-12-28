import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CreditsBadgeProps {
  credits: number;
  onPress: () => void;
}

/**
 * Badge de crédits Corail - Affichage en haut à droite des écrans
 * Petit, élégant, toujours visible
 */
export const CreditsBadge: React.FC<CreditsBadgeProps> = ({ credits, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#ff6b47', '#ff8a6d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Icône C */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>C</Text>
        </View>
        
        {/* Nombre de crédits */}
        <Text style={[styles.creditsText, { marginLeft: 6 }]}>{credits}</Text>
        
        {/* Bouton + */}
        <View style={[styles.addButton, { marginLeft: 6 }]}>
          <Ionicons name="add" size={14} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 8,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  creditsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 2,
  },
  addButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreditsBadge;

