/**
 * MapNavigationCard - Composant de navigation vers apps de cartes
 * 
 * Affiche une carte floutée (si disponible) avec boutons pour ouvrir
 * Google Maps, Waze ou Apple Plans
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface MapNavigationCardProps {
  pickupAddress: string;
  dropoffAddress: string;
  distance?: string;
  duration?: string;
}

// Chargement sécurisé de l'image
const getMapImage = () => {
  try {
    return require('../../assets/map-background.png');
  } catch {
    return null;
  }
};

const MAP_IMAGE = getMapImage();

type NavigationApp = 'google' | 'waze' | 'apple';

export const MapNavigationCard: React.FC<MapNavigationCardProps> = ({
  pickupAddress,
  dropoffAddress,
  distance,
  duration,
}) => {
  
  const openInMaps = (app: NavigationApp) => {
    const pickup = encodeURIComponent(pickupAddress);
    const dropoff = encodeURIComponent(dropoffAddress);
    
    const urls: Record<NavigationApp, string> = {
      google: `https://www.google.com/maps/dir/${pickup}/${dropoff}`,
      waze: `https://waze.com/ul?ll=${pickup}&navigate=yes`,
      apple: `http://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}`,
    };
    
    Linking.openURL(urls[app]).catch(() => 
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application')
    );
  };

  const renderButtons = () => (
    <>
      <Text style={styles.title}>Ouvrir l'itinéraire dans :</Text>
      
      <View style={styles.buttonsRow}>
        {/* Google Maps */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => openInMaps('google')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#4285F4', '#357AE8']}
            style={styles.iconContainer}
          >
            <Ionicons name="location" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.buttonText}>Google Maps</Text>
        </TouchableOpacity>
        
        {/* Waze */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => openInMaps('waze')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#33CCFF', '#00A0E3']}
            style={styles.iconContainer}
          >
            <Ionicons name="navigate" size={26} color="#fff" />
          </LinearGradient>
          <Text style={styles.buttonText}>Waze</Text>
        </TouchableOpacity>
        
        {/* Apple Plans */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => openInMaps('apple')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#007AFF', '#0051D5']}
            style={styles.iconContainer}
          >
            <Ionicons name="map" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.buttonText}>Apple Plans</Text>
        </TouchableOpacity>
      </View>
      
      {/* Distance/Durée */}
      {(distance || duration) && (
        <View style={styles.routeInfo}>
          {distance && (
            <View style={styles.routeInfoItem}>
              <Ionicons name="navigate-outline" size={14} color="#94a3b8" />
              <Text style={styles.routeInfoText}>{distance}</Text>
            </View>
          )}
          {distance && duration && <View style={styles.separator} />}
          {duration && (
            <View style={styles.routeInfoItem}>
              <Ionicons name="time-outline" size={14} color="#94a3b8" />
              <Text style={styles.routeInfoText}>{duration}</Text>
            </View>
          )}
        </View>
      )}
    </>
  );

  const renderContent = () => (
    <LinearGradient
      colors={['rgba(15, 23, 42, 0.7)', 'rgba(15, 23, 42, 0.9)']}
      style={styles.overlay}
    >
      {renderButtons()}
    </LinearGradient>
  );

  // Avec image de fond
  if (MAP_IMAGE) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={MAP_IMAGE}
          style={styles.background}
          resizeMode="cover"
        >
          <BlurView intensity={50} tint="dark" style={styles.blur}>
            {renderContent()}
          </BlurView>
        </ImageBackground>
      </View>
    );
  }

  // Fallback sans image
  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={styles.fallbackIcon}>
          <Ionicons name="map-outline" size={120} color="rgba(148, 163, 184, 0.2)" />
        </View>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 280,
  },
  background: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
  },
  blur: {
    width: '100%',
    height: '100%',
  },
  fallbackIcon: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: '#475569',
    marginHorizontal: 12,
  },
});

