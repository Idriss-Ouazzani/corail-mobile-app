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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Intro */}
      <View style={styles.intro}>
        <Ionicons name="notifications-outline" size={24} color="#0ea5e9" />
        <View style={styles.introTextBlock}>
          <Text style={styles.introText}>
            Choisissez les alertes que vous souhaitez recevoir. Les notifications « Nouvelles annonces » vous préviennent lorsqu'une course est publiée sur le réseau public ou dans vos groupes.
          </Text>
          <Text style={styles.introSubtext}>
            {scheduledCount} notification{scheduledCount > 1 ? 's' : ''} planifiée{scheduledCount > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Activer/Désactiver tout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Général</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrapper}>
              <Ionicons name="notifications-outline" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Activer les notifications</Text>
              <Text style={styles.settingDescription}>Désactiver pour couper toutes les alertes</Text>
            </View>
          </View>
          <Switch
            value={prefs.enabled}
            onValueChange={(value) => updatePreference('enabled', value)}
            trackColor={{ false: '#334155', true: '#0ea5e9' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {prefs.enabled && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Courses</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrapper, styles.settingIconMuted]}>
                  <Ionicons name="alarm-outline" size={20} color="#64748b" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Rappels de courses</Text>
                  <Text style={styles.settingDescription}>1h avant le début</Text>
                </View>
              </View>
              <Switch
                value={prefs.rideReminders}
                onValueChange={(value) => updatePreference('rideReminders', value)}
                trackColor={{ false: '#334155', true: '#0ea5e9' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrapper, styles.settingIconMuted]}>
                  <Ionicons name="calendar-outline" size={20} color="#64748b" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Résumé quotidien</Text>
                  <Text style={styles.settingDescription}>Courses prévues aujourd'hui (8h)</Text>
                </View>
              </View>
              <Switch
                value={prefs.dailySummary}
                onValueChange={(value) => updatePreference('dailySummary', value)}
                trackColor={{ false: '#334155', true: '#0ea5e9' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrapper, styles.settingIconMuted]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#64748b" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Terminer une course</Text>
                  <Text style={styles.settingDescription}>Rappel 2h après la course</Text>
                </View>
              </View>
              <Switch
                value={prefs.rideCompleted}
                onValueChange={(value) => updatePreference('rideCompleted', value)}
                trackColor={{ false: '#334155', true: '#0ea5e9' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Annonces & réseau public</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconWrapper}>
                  <Ionicons name="megaphone-outline" size={20} color="#0ea5e9" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Nouvelles annonces</Text>
                  <Text style={styles.settingDescription}>
                    Alerte lorsqu'une course est publiée (réseau public ou vos groupes)
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs.newRidesAvailable}
                onValueChange={(value) => updatePreference('newRidesAvailable', value)}
                trackColor={{ false: '#334155', true: '#0ea5e9' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compte</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrapper, styles.settingIconMuted]}>
                  <Ionicons name="warning-outline" size={20} color="#64748b" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Équilibre faible</Text>
                  <Text style={styles.settingDescription}>Moins de 2 en solde</Text>
                </View>
              </View>
              <Switch
                value={prefs.lowCredits}
                onValueChange={(value) => updatePreference('lowCredits', value)}
                trackColor={{ false: '#334155', true: '#0ea5e9' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrapper, styles.settingIconMuted]}>
                  <Ionicons name="trophy-outline" size={20} color="#64748b" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Nouveaux badges</Text>
                  <Text style={styles.settingDescription}>Badge débloqué</Text>
                </View>
              </View>
              <Switch
                value={prefs.badgesEarned}
                onValueChange={(value) => updatePreference('badgesEarned', value)}
                trackColor={{ false: '#334155', true: '#0ea5e9' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconWrapper, styles.settingIconMuted]}>
                  <Ionicons name="people-outline" size={20} color="#64748b" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Invitations groupes</Text>
                  <Text style={styles.settingDescription}>Invitation à rejoindre un groupe</Text>
                </View>
              </View>
              <Switch
                value={prefs.groupInvitations}
                onValueChange={(value) => updatePreference('groupInvitations', value)}
                trackColor={{ false: '#334155', true: '#0ea5e9' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.testButton} onPress={handleTestNotification} activeOpacity={0.8}>
        <Ionicons name="send-outline" size={20} color="#fff" />
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
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#64748b',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  introTextBlock: {
    flex: 1,
  },
  introText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  introSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconMuted: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    marginTop: 8,
    paddingVertical: 18,
    borderRadius: 18,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

