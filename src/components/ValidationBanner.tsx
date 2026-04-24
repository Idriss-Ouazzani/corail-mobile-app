import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ValidationBannerProps {
  verificationStatus: 'PENDING' | 'REJECTED';
  onRefresh?: () => void;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({ 
  verificationStatus,
  onRefresh 
}) => {
  const isPending = verificationStatus === 'PENDING';
  const isRejected = verificationStatus === 'REJECTED';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isPending ? ['#f59e0b', '#f97316'] : ['#ef4444', '#dc2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Ionicons 
            name={isPending ? "time-outline" : "alert-circle-outline"} 
            size={20} 
            color="#fff" 
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isPending ? 'Profil en cours de validation' : 'Profil rejeté'}
            </Text>
            <Text style={styles.subtitle}>
              {isPending 
                ? 'Accès limité au réseau public'
                : 'Contactez le support'}
            </Text>
          </View>
          {onRefresh && isPending && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  gradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ValidationBanner;

