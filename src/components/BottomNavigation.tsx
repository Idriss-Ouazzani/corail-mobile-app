/**
 * BottomNavigation - Barre de navigation inférieure
 * 
 * Extrait de App.tsx pour améliorer la lisibilité
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '../services/haptic';
import { appStyles } from '../styles/App.styles';

type Screen = 'dashboard' | 'courses' | 'tools' | 'profile';

interface BottomNavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onCreateRide: () => void;
  marketplaceAvailableCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentScreen,
  onNavigate,
  onCreateRide,
  marketplaceAvailableCount = 0,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(marketplaceAvailableCount);

  useEffect(() => {
    const prev = prevCountRef.current;
    if (marketplaceAvailableCount > prev) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.16,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCountRef.current = marketplaceAvailableCount;
  }, [marketplaceAvailableCount, pulseAnim]);

  return (
    <View style={appStyles.bottomNavWrapper}>
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.90)']}
        style={appStyles.bottomNavGradient}
      >
        <View style={appStyles.bottomNavContent}>
          {/* Accueil */}
          <TouchableOpacity
            style={appStyles.navItem}
            onPress={() => {
              haptic.light();
              onNavigate('dashboard');
            }}
            activeOpacity={0.7}
          >
            <View style={[appStyles.navIconBox, currentScreen === 'dashboard' && appStyles.navIconBoxActive]}>
              <Ionicons
                name={currentScreen === 'dashboard' ? 'home-sharp' : 'home-outline'}
                size={22}
                color={currentScreen === 'dashboard' ? '#fff' : '#94a3b8'}
              />
            </View>
            <Text style={[appStyles.navText, currentScreen === 'dashboard' && appStyles.navTextActive]}>
              Accueil
            </Text>
          </TouchableOpacity>

          {/* Courses */}
          <TouchableOpacity
            style={appStyles.navItem}
            onPress={() => {
              haptic.light();
              onNavigate('courses');
            }}
            activeOpacity={0.7}
          >
            <View style={[appStyles.navIconBox, currentScreen === 'courses' && appStyles.navIconBoxActive]}>
              <Ionicons
                name={currentScreen === 'courses' ? 'car-sport' : 'car-sport-outline'}
                size={22}
                color={currentScreen === 'courses' ? '#fff' : '#94a3b8'}
              />
              {marketplaceAvailableCount > 0 && (
                <Animated.View style={[styles.marketBadge, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.marketBadgeText}>{marketplaceAvailableCount > 99 ? '99+' : marketplaceAvailableCount}</Text>
                </Animated.View>
              )}
            </View>
            <Text style={[appStyles.navText, currentScreen === 'courses' && appStyles.navTextActive]}>
              Courses
            </Text>
          </TouchableOpacity>

          {/* Center FAB - Integrated */}
          <TouchableOpacity
            style={appStyles.centerFABIntegrated}
            onPress={onCreateRide}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              style={appStyles.centerFABGradient}
            >
              <Ionicons name="add" size={28} color="#fff" style={{ fontWeight: 'bold' }} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Suivi */}
          <TouchableOpacity
            style={appStyles.navItem}
            onPress={() => {
              haptic.light();
              onNavigate('tools');
            }}
            activeOpacity={0.7}
          >
            <View style={[appStyles.navIconBox, currentScreen === 'tools' && appStyles.navIconBoxActive]}>
              <Ionicons
                name={currentScreen === 'tools' ? 'analytics' : 'analytics-outline'}
                size={22}
                color={currentScreen === 'tools' ? '#fff' : '#94a3b8'}
              />
            </View>
            <Text style={[appStyles.navText, currentScreen === 'tools' && appStyles.navTextActive]}>
              Suivi
            </Text>
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={appStyles.navItem}
            onPress={() => {
              haptic.light();
              onNavigate('profile');
            }}
            activeOpacity={0.7}
          >
            <View style={[appStyles.navIconBox, currentScreen === 'profile' && appStyles.navIconBoxActive]}>
              <Ionicons
                name={currentScreen === 'profile' ? 'person' : 'person-outline'}
                size={22}
                color={currentScreen === 'profile' ? '#fff' : '#94a3b8'}
              />
            </View>
            <Text style={[appStyles.navText, currentScreen === 'profile' && appStyles.navTextActive]}>
              Profil
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  marketBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  marketBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});



