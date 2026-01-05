/**
 * BetaContactBanner - Bannière de contact bien visible pour la version Beta
 * Affichée en haut de l'écran pour encourager les retours
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BetaContactBanner() {
  const handleEmailPress = () => {
    Linking.openURL('mailto:corail.platform@gmail.com?subject=Feedback Beta Corail');
  };

  const handleTelegramPress = () => {
    Linking.openURL('https://t.me/corailapp');
  };

  return (
    <LinearGradient
      colors={['rgba(79, 70, 229, 0.15)', 'rgba(99, 102, 241, 0.15)']}
      style={styles.banner}
    >
      <View style={styles.content}>
        {/* Badge Beta */}
        <View style={styles.betaBadge}>
          <Text style={styles.betaBadgeText}>BETA</Text>
        </View>

        {/* Message */}
        <Text style={styles.title}>Version Beta - Vos retours sont précieux !</Text>
        <Text style={styles.subtitle}>
          Des bugs ? Des idées ? Contactez-nous :
        </Text>

        {/* Boutons de contact */}
        <View style={styles.buttonRow}>
          {/* Email */}
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleEmailPress}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={16} color="#4f46e5" />
            <Text style={styles.buttonText}>Email</Text>
          </TouchableOpacity>

          {/* Telegram */}
          <TouchableOpacity 
            style={[styles.contactButton, styles.telegramButton]}
            onPress={handleTelegramPress}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={16} color="#0088cc" />
            <Text style={[styles.buttonText, styles.telegramButtonText]}>Telegram</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  content: {
    padding: 16,
  },
  betaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  betaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.3)',
  },
  telegramButton: {
    backgroundColor: 'rgba(0, 136, 204, 0.15)',
    borderColor: 'rgba(0, 136, 204, 0.3)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  telegramButtonText: {
    color: '#0088cc',
  },
});

