import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoralLogo from '../components/CoralLogo';

export const HomeScreen = ({ navigation }: any) => {
  const stats = [
    { label: 'Courses disponibles', value: '156', icon: '🚗' },
    { label: 'Chauffeurs actifs', value: '89', icon: '👤' },
    { label: 'Gain moyen', value: '850€', icon: '💰' },
  ];

  const quickActions = [
    {
      title: 'Voir le Marketplace',
      description: 'Parcourir les courses disponibles',
      icon: '🔍',
      color: '#ff6b47',
      onPress: () => navigation.navigate('Marketplace'),
    },
    {
      title: 'Mes Courses',
      description: 'Gérer vos courses actives',
      icon: '📋',
      color: '#0ea5e9',
      onPress: () => navigation.navigate('MyRides'),
    },
    {
      title: 'Créer une course',
      description: 'Publier une nouvelle opportunité',
      icon: '➕',
      color: '#10b981',
      onPress: () => navigation.navigate('CreateRide'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0c4a6e', '#075985']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Bonjour 👋</Text>
              <Text style={styles.userName}>Hassan Al Masri</Text>
            </View>
            <CoralLogo size={50} />
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Text style={styles.actionEmoji}>{action.icon}</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Activity */}
          <View style={styles.activityContainer}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Course vers l'aéroport</Text>
                <Text style={styles.activityTime}>Il y a 2 heures</Text>
              </View>
              <Text style={styles.activityAmount}>+35€</Text>
            </View>
            <View style={styles.activityCard}>
              <View style={[styles.activityDot, { backgroundColor: '#0ea5e9' }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Nouvelle course publiée</Text>
                <Text style={styles.activityTime}>Il y a 5 heures</Text>
              </View>
            </View>
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#b9e6fe',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#b9e6fe',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: '#b9e6fe',
  },
  actionArrow: {
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  activityContainer: {
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#7dd3fc',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
});

export default HomeScreen;

