import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import QRCodeCard from '../components/QRCodeCard';

interface QRCodeScreenProps {
  onBack: () => void;
  userData: {
    name: string;
    phone?: string;
    email: string;
    company?: string;
    siren?: string;
    professionalCardNumber?: string;
  };
}

export const QRCodeScreen: React.FC<QRCodeScreenProps> = ({ onBack, userData }) => {
  const qrCodeRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    try {
      setSharing(true);
      
      // Capturer le QR code comme image
      const uri = await captureRef(qrCodeRef, {
        format: 'png',
        quality: 1,
      });

      // Vérifier si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Partager mon QR Code professionnel',
        });
      } else {
        Alert.alert(
          'Partage non disponible',
          'La fonctionnalité de partage n\'est pas disponible sur cet appareil.'
        );
      }
    } catch (error: any) {
      console.error('Erreur partage QR code:', error);
      Alert.alert('Erreur', 'Impossible de partager le QR code');
    } finally {
      setSharing(false);
    }
  };

  const handleSaveToGallery = async () => {
    try {
      // Capturer le QR code comme image
      const uri = await captureRef(qrCodeRef, {
        format: 'png',
        quality: 1,
      });

      // Sauvegarder dans la galerie
      const safeName = userData.name ? userData.name.replace(/\s+/g, '-').toLowerCase() : 'driver';
      const fileName = `corail-qr-${safeName}.png`;
      const localUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: localUri,
      });

      Alert.alert(
        'QR Code sauvegardé',
        'Votre QR code a été enregistré avec succès !',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Erreur sauvegarde QR code:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le QR code');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon QR Code Pro</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#0ea5e9" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>Partagez vos coordonnées professionnelles</Text>
            <Text style={styles.infoText}>
              Vos clients peuvent scanner ce QR code pour vous contacter directement.
            </Text>
          </View>
        </View>

        {/* QR Code Card */}
        <View ref={qrCodeRef} collapsable={false}>
          <QRCodeCard userData={userData} size={220} />
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Bouton Partager */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.8}
            disabled={sharing}
          >
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>
                {sharing ? 'Partage...' : 'Partager'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bouton Sauvegarder */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSaveToGallery}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0ea5e9', '#06b6d4']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="download" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Sauvegarder</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Conseils d'utilisation */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Conseils d'utilisation</Text>
          
          <View style={styles.tip}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>1</Text>
            </View>
            <Text style={styles.tipText}>
              Imprimez ce QR code sur vos cartes de visite
            </Text>
          </View>

          <View style={styles.tip}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>2</Text>
            </View>
            <Text style={styles.tipText}>
              Partagez-le par WhatsApp ou SMS à vos clients
            </Text>
          </View>

          <View style={styles.tip}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>3</Text>
            </View>
            <Text style={styles.tipText}>
              Affichez-le dans votre véhicule pour que vos clients vous contactent facilement
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 30,
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
  },
  tipsContainer: {
    marginTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff6b47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
});

export default QRCodeScreen;

