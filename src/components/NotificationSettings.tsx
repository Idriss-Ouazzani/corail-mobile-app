/**
 * Composant de gestion des préférences de notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  sendTestNotification,
  getScheduledNotificationsCount,
  NotificationPreferences,
} from '../services/notifications';

export const NotificationSettings: React.FC = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    enabled: true,
    rideReminders: true,
    dailySummary: true,
    newRidesAvailable: true,
    lowCredits: true,
    badgesEarned: true,
    groupInvitations: true,
    rideCompleted: true,
  });
  const [loading, setLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadPreferences();
    loadScheduledCount();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPrefs = await getNotificationPreferences();
      setPrefs(savedPrefs);
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledCount = async () => {
    const count = await getScheduledNotificationsCount();
    setScheduledCount(count);
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    await saveNotificationPreferences(newPrefs);
    
    // Recharger le compteur
    loadScheduledCount();
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert(
        '✅ Notification envoyée',
        'Vérifiez votre centre de notifications !',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        '❌ Erreur',
        'Impossible d\'envoyer la notification test',
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Ionicons name="notifications" size={48} color="#FF6B47" />
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          {scheduledCount} notification{scheduledCount > 1 ? 's' : ''} planifiée{scheduledCount > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Activer/Désactiver tout */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color="#FF6B47" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Activer les notifications</Text>
              <Text style={styles.settingDescription}>
                Désactiver toutes les notifications
              </Text>
            </View>
          </View>
          <Switch
            value={prefs.enabled}
            onValueChange={(value) => updatePreference('enabled', value)}
            trackColor={{ false: '#E5E7EB', true: '#FF6B47' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Paramètres individuels */}
      {prefs.enabled && (
        <>
          {/* Courses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 Courses</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="alarm-outline" size={22} color="#64748B" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Rappels de courses</Text>
                  <Text style={styles.settingDescription}>
                    1h avant le début
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.rideReminders}
                onValueChange={(value) => updatePreference('rideReminders', value)}
                trackColor={{ false: '#E5E7EB', true: '#FF6B47' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="calendar-outline" size={22} color="#64748B" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Résumé quotidien</Text>
                  <Text style={styles.settingDescription}>
                    Courses prévues aujourd'hui (8h)
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.dailySummary}
                onValueChange={(value) => updatePreference('dailySummary', value)}
                trackColor={{ false: '#E5E7EB', true: '#FF6B47' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#64748B" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Terminer une course</Text>
                  <Text style={styles.settingDescription}>
                    Rappel 2h après la course
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.rideCompleted}
                onValueChange={(value) => updatePreference('rideCompleted', value)}
                trackColor={{ false: '#E5E7EB', true: '#FF6B47' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Marketplace */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛒 Marketplace</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="sparkles-outline" size={22} color="#64748B" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Nouvelles courses</Text>
                  <Text style={styles.settingDescription}>
                    Courses disponibles près de vous
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.newRidesAvailable}
                onValueChange={(value) => updatePreference('newRidesAvailable', value)}
                trackColor={{ false: '#E5E7EB', true: '#FF6B47' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Compte */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Compte</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="warning-outline" size={22} color="#64748B" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Crédits faibles</Text>
                  <Text style={styles.settingDescription}>
                    Moins de 2 crédits restants
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.lowCredits}
                onValueChange={(value) => updatePreference('lowCredits', value)}
                trackColor={{ false: '#E5E7EB', true: '#FF6B47' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="trophy-outline" size={22} color="#64748B" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Nouveaux badges</Text>
                  <Text style={styles.settingDescription}>
                    Badge débloqué
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.badgesEarned}
                onValueChange={(value) => updatePreference('badgesEarned', value)}
                trackColor={{ false: '#E5E7EB', true: '#FF6B47' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Social */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Social</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="people-outline" size={22} color="#64748B" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Invitations groupes</Text>
                  <Text style={styles.settingDescription}>
                    Invitation à rejoindre un groupe
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.groupInvitations}
                onValueChange={(value) => updatePreference('groupInvitations', value)}
                trackColor={{ false: '#E5E7EB', true: '#FF6B47' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </>
      )}

      {/* Bouton test */}
      <TouchableOpacity 
        style={styles.testButton}
        onPress={handleTestNotification}
      >
        <Ionicons name="send-outline" size={20} color="#FFFFFF" />
        <Text style={styles.testButtonText}>Envoyer une notification test</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Les notifications vous aident à ne rien manquer. Vous pouvez les personnaliser à tout moment.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B47',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FF6B47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

