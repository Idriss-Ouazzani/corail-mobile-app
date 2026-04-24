import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface QRCodeCardProps {
  /** Conservé pour compat API ; plus affiché (carte = QR seul + invite). */
  userData?: {
    name: string;
    phone?: string;
    email: string;
    company?: string;
    professionalCardNumber?: string;
  };
  /** Contenu encodé : URL de la page pro ou vCard. */
  qrValue: string;
  /** Ligne sous le QR (défaut : prochaines courses). */
  footerLabel?: string;
  size?: number;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  qrValue,
  footerLabel = 'Scannez pour vos prochaines courses',
  size = 250,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.card}>
        <View style={styles.qrContainer}>
          <View style={styles.qrBackground}>
            <QRCode
              value={qrValue}
              size={size}
              backgroundColor="white"
              color="#0f172a"
              logo={require('../../assets/icon.png')}
              logoSize={size * 0.2}
              logoBackgroundColor="white"
              logoBorderRadius={10}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="scan" size={20} color="#0ea5e9" />
          <Text style={styles.footerText}>{footerLabel}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    padding: 20,
    alignItems: 'center',
  },
  qrContainer: {
    marginBottom: 16,
  },
  qrBackground: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  footerText: {
    fontSize: 13,
    color: '#0ea5e9',
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default QRCodeCard;
