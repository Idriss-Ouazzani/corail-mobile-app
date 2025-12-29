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
    siren?: string;
    professionalCardNumber?: string;
  };
  size?: number;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ userData, size = 250 }) => {
  // Données à encoder dans le QR code (format vCard pour ajout automatique aux contacts)
  // ⚠️ Important : Contact direct chauffeur (B2B), Corail n'est pas intermédiaire
  const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${userData.name}
TEL;TYPE=CELL:${userData.phone || ''}
EMAIL:${userData.email}
${userData.company ? `ORG:${userData.company}` : ''}
${userData.siren ? `NOTE:SIREN ${userData.siren}` : ''}
${userData.professionalCardNumber ? `NOTE:Carte professionnelle ${userData.professionalCardNumber}` : ''}
END:VCARD`;

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
              value={vCardData}
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
          {userData.siren && (
            <View style={styles.infoRow}>
              <Ionicons name="business" size={16} color="#94a3b8" />
              <Text style={styles.infoText}>SIREN: {userData.siren}</Text>
            </View>
          )}
        </View>

        {/* Footer instruction */}
        <View style={styles.footer}>
          <Ionicons name="scan" size={20} color="#ff6b47" />
          <Text style={styles.footerText}>Scannez pour m'ajouter à vos contacts</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
    borderRadius: 20,
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
    backgroundColor: 'rgba(255, 107, 71, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 71, 0.2)',
  },
  footerText: {
    fontSize: 13,
    color: '#ff6b47',
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default QRCodeCard;

