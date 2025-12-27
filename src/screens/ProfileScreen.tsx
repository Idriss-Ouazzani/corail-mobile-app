import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoralLogo from '../components/CoralLogo';

export const ProfileScreen = ({ navigation }: any) => {
  const user = {
    name: 'Hassan Al Masri',
    email: 'hassan.almasri@vtcpro.fr',
    phone: '+33 6 12 34 56 78',
    rating: 4.8,
    totalRides: 127,
    subscriptionPlan: 'PREMIUM',
  };

  const menuItems = [
    { icon: '👤', title: 'Informations personnelles', screen: 'EditProfile' },
    { icon: '💳', title: 'Abonnement & Facturation', screen: 'Subscription' },
    { icon: '👥', title: 'Mes Groupes', screen: 'Groups' },
    { icon: '🔔', title: 'Notifications', screen: 'Notifications' },
    { icon: '🌍', title: 'Langue & Région', screen: 'Settings' },
    { icon: '❓', title: 'Aide & Support', screen: 'Support' },
    { icon: '📄', title: 'Conditions générales', screen: 'Terms' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0c4a6e', '#075985']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#ff6b47', '#ff8a6d']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>HA</Text>
              </LinearGradient>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⭐ Premium</Text>
              </View>
            </View>
            
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.rating}</Text>
                <Text style={styles.statLabel}>⭐ Note</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.totalRides}</Text>
                <Text style={styles.statLabel}>🚗 Courses</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <Text style={styles.menuEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>

          {/* App Version */}
          <View style={styles.footer}>
            <CoralLogo size={30} />
            <Text style={styles.version}>Corail v1.0.0</Text>
            <Text style={styles.copyright}>© 2025 VTC Marketplace</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c4a6e',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0c4a6e',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#b9e6fe',
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#b9e6fe',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  menuArrow: {
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButton: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  version: {
    fontSize: 12,
    color: '#7dd3fc',
    marginTop: 12,
  },
  copyright: {
    fontSize: 11,
    color: '#7dd3fc',
    opacity: 0.6,
    marginTop: 4,
  },
});

export default ProfileScreen;

