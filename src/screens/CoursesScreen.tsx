/**
 * CoursesScreen - Toutes les courses (Marketplace + Mes Courses + Historique)
 * 3 tabs : Marketplace Corail, Mes Courses Corail, Historique complet
 */

import React from 'react';
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
  activeTab: 'marketplace' | 'myrides' | 'history';
  onTabChange: (tab: 'marketplace' | 'myrides' | 'history') => void;
  marketplaceContent: React.ReactNode;
  myRidesContent: React.ReactNode;
  historyContent: React.ReactNode;
}

export default function CoursesScreen({
  activeTab,
  onTabChange,
  marketplaceContent,
  myRidesContent,
  historyContent,
}: CoursesScreenProps) {

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

      {/* Tabs - Style épuré */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'marketplace' && styles.tabActive]}
            onPress={() => onTabChange('marketplace')}
          >
            <Ionicons 
              name="storefront" 
              size={20} 
              color={activeTab === 'marketplace' ? '#fff' : '#94a3b8'} 
            />
            <Text style={[styles.tabText, activeTab === 'marketplace' && styles.tabTextActive]}>
              Market
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'myrides' && styles.tabActive]}
            onPress={() => onTabChange('myrides')}
          >
            <Ionicons 
              name="car" 
              size={20} 
              color={activeTab === 'myrides' ? '#fff' : '#94a3b8'} 
            />
            <Text style={[styles.tabText, activeTab === 'myrides' && styles.tabTextActive]}>
              Courses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => onTabChange('history')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={activeTab === 'history' ? '#fff' : '#94a3b8'} 
            />
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Activité
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Ligne élégante sous les tabs */}
        <View style={styles.separator} />
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  tabsWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
});
