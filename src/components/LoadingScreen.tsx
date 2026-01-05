/**
 * LoadingScreen - Écran de chargement ULTRA ÉLÉGANT
 * 
 * Design minimaliste et raffiné avec animations fluides
 * Inspiré par Apple et les meilleures apps premium
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CoralLogo from './CoralLogo';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Chargement' }) => {
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Fade in immédiat pour éviter le cercle vide
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Animation de respiration très subtile et élégante
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Courbe Material Design
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow très subtil et synchronisé
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.15,
          duration: 2000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation des points - séquentielle et élégante
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(350, [
          Animated.sequence([
            Animated.timing(dot1, { 
              toValue: 1, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
            Animated.timing(dot1, { 
              toValue: 0.3, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
          ]),
          Animated.sequence([
            Animated.timing(dot2, { 
              toValue: 1, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
            Animated.timing(dot2, { 
              toValue: 0.3, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
          ]),
          Animated.sequence([
            Animated.timing(dot3, { 
              toValue: 1, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
            Animated.timing(dot3, { 
              toValue: 0.3, 
              duration: 500, 
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true 
            }),
          ]),
        ])
      ).start();
    };
    animateDots();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <LinearGradient 
        colors={['#0a0f1a', '#151b2e', '#0a0f1a']} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          opacity: fadeAnim 
        }}>
          {/* Logo HD avec animation de respiration subtile */}
          <Animated.View
            style={{
              transform: [{ scale: breatheAnim }],
              marginBottom: 60,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Glow effet subtil - Cercles concentriques */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: 'rgba(255, 107, 71, 0.08)',
                opacity: glowAnim,
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: 'rgba(255, 107, 71, 0.12)',
                opacity: glowAnim,
              }}
            />
            
            {/* Logo container HD avec ombre élégante */}
            <View style={styles.logoContainerHD}>
              <CoralLogo size={120} />
            </View>
          </Animated.View>

          {/* Message élégant avec typographie premium */}
          <Text style={styles.loadingTextRefined}>{message}</Text>

          {/* Points de chargement minimalistes */}
          <View style={styles.dotsContainerRefined}>
            <Animated.View style={[styles.dotRefined, { opacity: dot1, transform: [{ scale: dot1 }] }]} />
            <Animated.View style={[styles.dotRefined, { opacity: dot2, transform: [{ scale: dot2 }] }]} />
            <Animated.View style={[styles.dotRefined, { opacity: dot3, transform: [{ scale: dot3 }] }]} />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1 
  },
  logoContainerHD: {
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 60,
  },
  loadingTextRefined: {
    fontSize: 15,
    fontWeight: '400',
    color: '#cbd5e1',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 40,
    opacity: 0.85,
  },
  dotsContainerRefined: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dotRefined: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff6b47',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default LoadingScreen;

