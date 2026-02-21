import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CoralLogo from './CoralLogo';

interface QRCodeCardProps {
  userData: {
    name: string;
    phone?: string;
    email: string;
    company?: string;
    professionalCardNumber?: string;
  };
  /** Contenu encodé dans le QR : URL du profil public OU vCard (coordonnées) */
  qrValue: string;
  /** Texte sous le QR (ex: "Scannez pour voir mon profil" ou "Scannez pour mes coordonnées") */
  footerLabel?: string;
  size?: number;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  userData,
  qrValue,
  footerLabel = 'Scannez pour voir mon profil',
  size = 250,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.card}
      >
        {/* Header avec logo */}
        <View style={styles.header}>
          <CoralLogo size={40} />
          <Text style={styles.headerTitle}>Carte Professionnelle</Text>
        </View>

        {/* QR Code avec fond blanc */}
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

        {/* Infos utilisateur */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userData.name}</Text>
          {userData.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={16} color="#94a3b8" />
              <Text style={styles.infoText}>{userData.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={16} color="#94a3b8" />
            <Text style={styles.infoText}>{userData.email}</Text>
          </View>
          {userData.professionalCardNumber && (
            <View style={styles.infoRow}>
              <Ionicons name="card" size={16} color="#94a3b8" />
              <Text style={styles.infoText}>VTC: {userData.professionalCardNumber}</Text>
            </View>
          )}
        </View>

        {/* Footer instruction */}
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
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  qrContainer: {
    marginBottom: 24,
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
  userInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginLeft: 8,
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

