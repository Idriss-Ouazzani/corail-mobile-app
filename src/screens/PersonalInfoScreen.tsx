import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PersonalInfoScreenProps {
  onBack: () => void;
}

export const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({ onBack }) => {
  const [fullName, setFullName] = useState('Hassan Al Masri');
  const [email, setEmail] = useState('hassan.almasri@vtcpro.fr');
  const [phone, setPhone] = useState('+33 6 12 34 56 78');
  const [address, setAddress] = useState('15 Rue de la République, 31000 Toulouse');
  const [siret, setSiret] = useState('123 456 789 00012');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    Alert.alert('Succès', 'Informations mises à jour avec succès !');
    setIsEditing(false);
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
        <Text style={styles.headerTitle}>Informations personnelles</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
          <Ionicons name={isEditing ? "close" : "create"} size={22} color="#ff6b47" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>HA</Text>
            </LinearGradient>
            {isEditing && (
              <TouchableOpacity style={styles.changePhotoButton}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Personal Info Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>
              <Ionicons name="person" size={14} color="#0ea5e9" /> Nom complet
            </Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={fullName}
              onChangeText={setFullName}
              editable={isEditing}
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              <Ionicons name="mail" size={14} color="#10b981" /> Email
            </Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              keyboardType="email-address"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              <Ionicons name="call" size={14} color="#fbbf24" /> Téléphone
            </Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              keyboardType="phone-pad"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              <Ionicons name="location" size={14} color="#ff6b47" /> Adresse
            </Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={address}
              onChangeText={setAddress}
              editable={isEditing}
              multiline
              placeholderTextColor="#64748b"
            />
          </View>
        </View>

        {/* Professional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations professionnelles</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>
              <Ionicons name="business" size={14} color="#8b5cf6" /> SIRET
            </Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={siret}
              onChangeText={setSiret}
              editable={isEditing}
              keyboardType="numeric"
              placeholderTextColor="#64748b"
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#10b981" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoCardTitle}>Compte vérifié</Text>
              <Text style={styles.infoCardText}>
                Votre profil professionnel a été vérifié le 15/01/2024
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button (only visible when editing) */}
      {isEditing && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b47', '#ff8a6d']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Enregistrer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.15)',
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
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ff6b47',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
    paddingLeft: 4,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginTop: 8,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  infoCardText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
});

export default PersonalInfoScreen;

