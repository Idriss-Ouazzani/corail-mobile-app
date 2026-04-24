import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import QRCodeCard from '../components/QRCodeCard';
import { apiClient } from '../services/api';

import { getVtcProfileUrl } from '../constants/urls';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80';

/** Génère un vCard (coordonnées) pour encodage QR quand pas de page publique */
function buildVCard(userData: { name: string; phone?: string; email: string }): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${userData.name.replace(/[,;\n]/g, ' ')}`];
  if (userData.phone) {
    const tel = userData.phone.replace(/\s/g, '');
    lines.push(`TEL;TYPE=CELL:${tel}`);
  }
  if (userData.email) {
    lines.push(`EMAIL:${userData.email.replace(/[,;\n]/g, ' ')}`);
  }
  lines.push('END:VCARD');
  return lines.join('\n');
}

interface QRCodeScreenProps {
  onBack: () => void;
  onNavigateToProfile?: () => void;
  userData: {
    name: string;
    phone?: string;
    email: string;
    company?: string;
    professionalCardNumber?: string;
  };
}

export const QRCodeScreen: React.FC<QRCodeScreenProps> = ({ onBack, onNavigateToProfile, userData }) => {
  const qrCodeRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  /** Si profil public (slug + is_public), on encode l'URL ; sinon on encode le vCard */
  const [hasPublicPage, setHasPublicPage] = useState(false);
  const [vtcSlug, setVtcSlug] = useState<string | null>(null);

  useEffect(() => {
    loadVTCProfile();
  }, []);

  const loadVTCProfile = async () => {
    try {
      const profile = await apiClient.getMyVTCProfile();
      if (profile?.slug) {
        setVtcSlug(profile.slug);
        setHasPublicPage(Boolean(profile.is_public));
      }
    } catch (error) {
      console.log('⚠️ Pas de profil VTC trouvé');
    } finally {
      setLoading(false);
    }
  };

  const qrValue =
    hasPublicPage && vtcSlug
      ? getVtcProfileUrl(vtcSlug)
      : buildVCard(userData);
  const footerLabel = hasPublicPage
    ? 'Scannez pour vos prochaines courses'
    : 'Scannez pour mes coordonnées';

  const handleShare = async () => {
    try {
      setSharing(true);
      const uri = await captureRef(qrCodeRef, {
        format: 'png',
        quality: 1,
      });

      const pageUrl = hasPublicPage && vtcSlug ? getVtcProfileUrl(vtcSlug) : null;
      const message = pageUrl
        ? `Réservez en direct sur ma page pro Corail :\n${pageUrl}`
        : `Corail — mes coordonnées professionnelles. Scannez le QR (image) pour m’enregistrer.`;

      if (Platform.OS === 'ios') {
        await Share.share({
          message,
          url: uri,
        });
      } else {
        await Share.share({
          message: pageUrl
            ? `Réservez en direct — ma page pro Corail :\n${pageUrl}`
            : message,
          title: 'Mon QR Corail',
        });
      }
    } catch (error: any) {
      console.error('Erreur partage QR code:', error);
      Alert.alert('Erreur', 'Impossible de partager');
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

      // Sauvegarder dans le répertoire documents (API legacy)
      const dir = FileSystem.documentDirectory;
      if (!dir) {
        Alert.alert('Erreur', 'Stockage local non disponible sur cet appareil.');
        return;
      }
      const safeName = userData.name ? userData.name.replace(/\s+/g, '-').toLowerCase() : 'driver';
      const fileName = `corail-qr-${safeName}.png`;
      const localUri = `${dir}${fileName}`;

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon QR Code Pro</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header épuré */}
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
        {/* Bandeau hero */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="qr-code" size={26} color="#fff" />
            </View>
            <Text style={styles.heroText}>
              Votre page pro en un scan, ou le lien en un clic.
            </Text>
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#0ea5e9" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>
              {hasPublicPage ? 'Partagez votre profil professionnel' : 'Vos coordonnées en un scan'}
            </Text>
            <Text style={styles.infoText}>
              {hasPublicPage
                ? 'Le partage envoie aussi le lien de votre page (pas seulement l’image du QR).'
                : 'Le QR code contient vos coordonnées. Créez une Page Pro pour y ajouter le lien de votre profil en ligne.'}
            </Text>
          </View>
        </View>

        {/* CTA Page Publique si pas encore créée */}
        {!hasPublicPage && onNavigateToProfile && (
          <TouchableOpacity
            style={styles.ctaPublicPage}
            onPress={onNavigateToProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={20} color="#0ea5e9" />
            <Text style={styles.ctaPublicPageText}>Créer ma Page Pro (lien + profil en ligne)</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}

        {/* QR Code Card */}
        <View ref={qrCodeRef} collapsable={false}>
          <QRCodeCard qrValue={qrValue} footerLabel={footerLabel} size={220} />
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
              colors={['#0ea5e9', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
              colors={['#334155', '#1e293b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0f172a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
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
  heroWrap: {
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#1e293b',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
  ctaPublicPage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.25)',
    gap: 10,
  },
  ctaPublicPageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  actionsContainer: {
    marginTop: 30,
    gap: 12,
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: '#0ea5e9',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createProfileButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  createProfileButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  createProfileButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
});

export default QRCodeScreen;

