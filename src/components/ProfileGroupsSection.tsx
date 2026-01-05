/**
 * ProfileGroupsSection - Section des groupes dans le profil
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Group {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  memberCount?: number;
}

interface ProfileGroupsSectionProps {
  userGroups: Group[];
  onShowGroups: () => void;
  onSelectGroup: (group: Group) => void;
}

export default function ProfileGroupsSection({
  userGroups,
  onShowGroups,
  onSelectGroup,
}: ProfileGroupsSectionProps) {
  if (!userGroups || userGroups.length === 0) {
    return (
      <TouchableOpacity style={styles.emptyGroupCard} onPress={onShowGroups}>
        <Ionicons name="add-circle-outline" size={40} color="#64748b" />
        <Text style={styles.emptyGroupText}>Créer votre premier groupe</Text>
        <Text style={styles.emptyGroupSubtext}>Partagez des courses avec vos collègues</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="people" size={18} color="#0ea5e9" /> Mes Groupes
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onShowGroups}>
          <Text style={styles.seeAllText}>Gérer ({userGroups.length})</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupsScroll}
      >
        {userGroups.map((group, index) => (
          <TouchableOpacity
            key={group.id || `group-${index}`}
            style={[styles.groupCard, { borderColor: group.color || '#0ea5e9' }]}
            onPress={() => onSelectGroup(group)}
            activeOpacity={0.7}
          >
            <View style={[styles.groupIconWrapper, { backgroundColor: `${group.color || '#0ea5e9'}30` }]}>
              <Ionicons name={(group.icon || 'people') as any} size={24} color={group.color || '#0ea5e9'} />
            </View>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupMemberCount}>
              {group.memberCount || 0} membre{(group.memberCount || 0) > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  groupsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    width: 140,
    alignItems: 'center',
    borderWidth: 2,
  },
  groupIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
    textAlign: 'center',
  },
  groupMemberCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyGroupCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  emptyGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyGroupSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

