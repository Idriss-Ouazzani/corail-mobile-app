/**
 * CoursesScreen - Toutes les courses (Marketplace + Mes Courses + Historique)
 * 3 tabs : Marketplace Corail, Mes Courses Corail, Historique complet
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CoursesScreenProps {
  // Props pour passer les composants des différents tabs
  marketplaceContent: React.ReactNode;
  myRidesContent: React.ReactNode;
  historyContent: React.ReactNode;
}

export default function CoursesScreen({
  marketplaceContent,
  myRidesContent,
  historyContent,
}: CoursesScreenProps) {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'myrides' | 'history'>('marketplace');

  const renderContent = () => {
    switch (activeTab) {
      case 'marketplace':
        return marketplaceContent;
      case 'myrides':
        return myRidesContent;
      case 'history':
        return historyContent;
      default:
        return marketplaceContent;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Courses</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'marketplace' && styles.tabActive]}
          onPress={() => setActiveTab('marketplace')}
        >
          <Ionicons 
            name="storefront" 
            size={18} 
            color={activeTab === 'marketplace' ? '#fff' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'marketplace' && styles.tabTextActive]}>
            Marketplace
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'myrides' && styles.tabActive]}
          onPress={() => setActiveTab('myrides')}
        >
          <Ionicons 
            name="car" 
            size={18} 
            color={activeTab === 'myrides' ? '#fff' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'myrides' && styles.tabTextActive]}>
            Mes Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time" 
            size={18} 
            color={activeTab === 'history' ? '#fff' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
});

