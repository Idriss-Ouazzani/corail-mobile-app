/**
 * BottomNavigation - Barre de navigation inférieure
 * 
 * Extrait de App.tsx pour améliorer la lisibilité
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '../services/haptic';
import { appStyles } from '../styles/App.styles';

type Screen = 'dashboard' | 'courses' | 'tools' | 'profile';

interface BottomNavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onCreateRide: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentScreen,
  onNavigate,
  onCreateRide,
}) => {
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



