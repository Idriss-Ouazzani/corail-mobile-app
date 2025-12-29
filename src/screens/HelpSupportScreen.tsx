import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface HelpSupportScreenProps {
  onBack: () => void;
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ onBack }) => {
  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Vous allez être redirigé vers notre support');
  };

  const handleOpenEmail = () => {
    Linking.openURL('mailto:support@corail-app.com');
  };

  const handleOpenPhone = () => {
    Linking.openURL('tel:+33612345678');
  };

  const handleOpenFAQ = () => {
    Alert.alert('FAQ', 'Ouverture de la FAQ en ligne...');
  };

  const handleOpenChat = () => {
    Alert.alert('Chat', 'Lancement du chat en ligne...');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Support rapide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Besoin d'aide ?</Text>
          <Text style={styles.sectionSubtitle}>
            Notre équipe est là pour vous assister
          </Text>

          <View style={styles.supportGrid}>
            <TouchableOpacity
              style={styles.supportCard}
              onPress={handleOpenChat}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#ff6b47', '#ff8a6d']}
                style={styles.supportCardGradient}
              >
                <Ionicons name="chatbubbles" size={28} color="#fff" />
                <Text style={styles.supportCardTitle}>Chat en direct</Text>
                <Text style={styles.supportCardSubtitle}>Réponse immédiate</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportCard}
              onPress={handleOpenEmail}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#0ea5e9', '#38bdf8']}
                style={styles.supportCardGradient}
              >
                <Ionicons name="mail" size={28} color="#fff" />
                <Text style={styles.supportCardTitle}>Email</Text>
                <Text style={styles.supportCardSubtitle}>Sous 24h</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenPhone}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="call" size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Téléphone</Text>
              <Text style={styles.menuSubtitle}>+33 6 12 34 56 78</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenEmail}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="mail" size={20} color="#0ea5e9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Email</Text>
              <Text style={styles.menuSubtitle}>support@corail-app.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>
        </View>

        {/* Ressources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ressources</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleOpenFAQ}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="help-circle" size={20} color="#8b5cf6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>FAQ</Text>
              <Text style={styles.menuSubtitle}>Questions fréquentes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Guide', 'Ouverture du guide utilisateur...')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="book" size={20} color="#fbbf24" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Guide d'utilisation</Text>
              <Text style={styles.menuSubtitle}>Tutoriels et astuces</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Vidéos', 'Ouverture des vidéos tutoriels...')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="play-circle" size={20} color="#ff6b47" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Vidéos tutoriels</Text>
              <Text style={styles.menuSubtitle}>Apprenez visuellement</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>
        </View>

        {/* Légal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations légales</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('CGU', 'Ouverture des Conditions Générales...')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="document-text" size={20} color="#64748b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Conditions générales</Text>
              <Text style={styles.menuSubtitle}>CGU & CGV</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Confidentialité', 'Ouverture de la politique...')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Politique de confidentialité</Text>
              <Text style={styles.menuSubtitle}>Protection de vos données</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Corail VTC</Text>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
          <Text style={styles.appInfoText}>© 2025 Corail. Tous droits réservés.</Text>
        </View>

        <View style={{ height: 40 }} />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  supportGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  supportCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  supportCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  supportCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  supportCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff6b47',
    marginBottom: 8,
  },
  appInfoText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
});

export default HelpSupportScreen;


