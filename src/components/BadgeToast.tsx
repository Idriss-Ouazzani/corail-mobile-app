import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface BadgeToastProps {
  badge: {
    name: string;
    icon: string;
    rarity: string;
  };
  visible: boolean;
  onHide: () => void;
}

export const BadgeToast: React.FC<BadgeToastProps> = ({ badge, visible, onHide }) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide après 4 secondes
      const timer = setTimeout(() => {
        // Animation de sortie
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const getRarityGradient = (rarity: string): string[] => {
    switch (rarity) {
      case 'LEGENDARY':
        return ['#fbbf24', '#f59e0b'];
      case 'EPIC':
        return ['#a855f7', '#9333ea'];
      case 'RARE':
        return ['#0ea5e9', '#0284c7'];
      case 'COMMON':
      default:
        return ['#64748b', '#475569'];
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <LinearGradient
        colors={getRarityGradient(badge.rarity)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <Ionicons name={badge.icon as any} size={40} color="#fff" />
            {/* Sparkle effect for legendary */}
            {badge.rarity === 'LEGENDARY' && (
              <>
                <View style={[styles.sparkle, styles.sparkle1]} />
                <View style={[styles.sparkle, styles.sparkle2]} />
                <View style={[styles.sparkle, styles.sparkle3]} />
              </>
            )}
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Nouveau badge !</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.rarity}>{badge.rarity}</Text>
          </View>

          {/* Trophy Icon */}
          <Ionicons name="trophy" size={32} color="rgba(255, 255, 255, 0.9)" />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  gradient: {
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  sparkle1: {
    top: -4,
    right: 10,
  },
  sparkle2: {
    top: 10,
    right: -4,
  },
  sparkle3: {
    bottom: -4,
    left: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  rarity: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});


