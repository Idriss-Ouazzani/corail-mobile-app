import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const [newRides, setNewRides] = useState(true);
  const [rideUpdates, setRideUpdates] = useState(true);
  const [groupInvites, setGroupInvites] = useState(true);
  const [messages, setMessages] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications des courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Courses</Text>
          <Text style={styles.sectionSubtitle}>
            Recevez des alertes pour les nouvelles opportunités
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="car-sport" size={20} color="#ff6b47" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Nouvelles courses</Text>
                <Text style={styles.settingDescription}>
                  Notification pour chaque nouvelle course publiée
                </Text>
              </View>
            </View>
            <Switch
              value={newRides}
              onValueChange={setNewRides}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={newRides ? '#ff6b47' : '#64748b'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="refresh" size={20} color="#0ea5e9" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Mises à jour de courses</Text>
                <Text style={styles.settingDescription}>
                  Modifications, annulations, acceptations
                </Text>
              </View>
            </View>
            <Switch
              value={rideUpdates}
              onValueChange={setRideUpdates}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={rideUpdates ? '#ff6b47' : '#64748b'}
            />
          </View>
        </View>

        {/* Notifications des groupes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groupes</Text>
          <Text style={styles.sectionSubtitle}>
            Restez informé de l'activité de vos groupes
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="people" size={20} color="#8b5cf6" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Invitations aux groupes</Text>
                <Text style={styles.settingDescription}>
                  Quand vous êtes invité à rejoindre un groupe
                </Text>
              </View>
            </View>
            <Switch
              value={groupInvites}
              onValueChange={setGroupInvites}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={groupInvites ? '#ff6b47' : '#64748b'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubble" size={20} color="#10b981" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Messages</Text>
                <Text style={styles.settingDescription}>
                  Nouveaux messages des membres
                </Text>
              </View>
            </View>
            <Switch
              value={messages}
              onValueChange={setMessages}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={messages ? '#ff6b47' : '#64748b'}
            />
          </View>
        </View>

        {/* Canaux de notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Canaux de notification</Text>
          <Text style={styles.sectionSubtitle}>
            Choisissez comment vous souhaitez être contacté
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={20} color="#ff6b47" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Notifications Push</Text>
                <Text style={styles.settingDescription}>
                  Alertes instantanées sur votre téléphone
                </Text>
              </View>
            </View>
            <Switch
              value={pushNotif}
              onValueChange={setPushNotif}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={pushNotif ? '#ff6b47' : '#64748b'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail" size={20} color="#0ea5e9" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Email</Text>
                <Text style={styles.settingDescription}>
                  Récapitulatifs par email
                </Text>
              </View>
            </View>
            <Switch
              value={emailNotif}
              onValueChange={setEmailNotif}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={emailNotif ? '#ff6b47' : '#64748b'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbox" size={20} color="#10b981" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>SMS</Text>
                <Text style={styles.settingDescription}>
                  Messages texte pour alertes urgentes
                </Text>
              </View>
            </View>
            <Switch
              value={smsNotif}
              onValueChange={setSmsNotif}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={smsNotif ? '#ff6b47' : '#64748b'}
            />
          </View>
        </View>

        {/* Marketing & Rapports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing & Rapports</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="megaphone" size={20} color="#fbbf24" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Emails marketing</Text>
                <Text style={styles.settingDescription}>
                  Offres spéciales et nouveautés
                </Text>
              </View>
            </View>
            <Switch
              value={marketingEmail}
              onValueChange={setMarketingEmail}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={marketingEmail ? '#ff6b47' : '#64748b'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="bar-chart" size={20} color="#8b5cf6" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Rapport hebdomadaire</Text>
                <Text style={styles.settingDescription}>
                  Résumé de votre activité chaque lundi
                </Text>
              </View>
            </View>
            <Switch
              value={weeklyReport}
              onValueChange={setWeeklyReport}
              trackColor={{ false: '#334155', true: '#ff6b4750' }}
              thumbColor={weeklyReport ? '#ff6b47' : '#64748b'}
            />
          </View>
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default NotificationsScreen;


