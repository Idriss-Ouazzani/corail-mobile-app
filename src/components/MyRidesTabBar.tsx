/**
 * MyRidesTabBar - Barre d'onglets pour Mes Courses
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MyRidesTabBarProps {
  activeTab: 'claimed' | 'published' | 'personal';
  claimedCount: number;
  publishedCount: number;
  personalCount: number;
  onTabChange: (tab: 'claimed' | 'published' | 'personal') => void;
}

export default function MyRidesTabBar({
  activeTab,
  claimedCount,
  publishedCount,
  personalCount,
  onTabChange,
}: MyRidesTabBarProps) {
  return (
    <View style={styles.tabsRow}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'claimed' && styles.tabActive]}
        onPress={() => onTabChange('claimed')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="hand-right"
          size={16}
          color={activeTab === 'claimed' ? '#fff' : '#64748b'}
          style={{ marginBottom: 4 }}
        />
        <View style={styles.tabTextContainer}>
          <Text style={[styles.tabText, activeTab === 'claimed' && styles.tabTextActive]}>
            Prises
          </Text>
          <Text style={[styles.tabCount, activeTab === 'claimed' && styles.tabCountActive]}>
            ({claimedCount})
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'published' && styles.tabActive]}
        onPress={() => onTabChange('published')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="megaphone"
          size={16}
          color={activeTab === 'published' ? '#fff' : '#64748b'}
          style={{ marginBottom: 4 }}
        />
        <View style={styles.tabTextContainer}>
          <Text style={[styles.tabText, activeTab === 'published' && styles.tabTextActive]}>
            Publiées
          </Text>
          <Text style={[styles.tabCount, activeTab === 'published' && styles.tabCountActive]}>
            ({publishedCount})
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'personal' && styles.tabActive]}
        onPress={() => onTabChange('personal')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="lock-closed"
          size={16}
          color={activeTab === 'personal' ? '#fff' : '#64748b'}
          style={{ marginBottom: 4 }}
        />
        <View style={styles.tabTextContainer}>
          <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>
            Perso
          </Text>
          <Text style={[styles.tabCount, activeTab === 'personal' && styles.tabCountActive]}>
            ({personalCount})
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'column', // Changé à column pour layout vertical
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 70, // Hauteur minimale pour le layout vertical
  },
  tabActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  tabTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabCount: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tabCountActive: {
    color: '#fff',
    opacity: 0.9,
  },
});

