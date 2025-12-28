import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CoralLogo from '../components/CoralLogo';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#0c4a6e', '#075985', '#0284c7']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <CoralLogo size={120} />
        <View style={{ height: 20 }} />
        <Text style={styles.title}>Corail</Text>
        <View style={{ height: 20 }} />
        <Text style={styles.subtitle}>VTC Marketplace</Text>
      </Animated.View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Connecter les chauffeurs VTC</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#b9e6fe',
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '300',
  },
});

export default SplashScreen;

