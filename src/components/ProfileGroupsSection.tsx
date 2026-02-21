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
      <TouchableOpacity style={styles.emptyGroupCard} onPress={onShowGroups} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={36} color="#64748b" />
        <Text style={styles.emptyGroupText}>Créer votre premier groupe</Text>
        <Text style={styles.emptyGroupSubtext}>Partagez des courses avec vos collègues</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes Groupes</Text>
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
            style={[styles.groupCard, { borderLeftColor: group.color || '#0ea5e9' }]}
            onPress={() => onSelectGroup(group)}
            activeOpacity={0.7}
          >
            <View style={[styles.groupIconWrapper, { backgroundColor: `${group.color || '#0ea5e9'}20` }]}>
              <Ionicons name={(group.icon || 'people') as any} size={22} color={group.color || '#0ea5e9'} />
            </View>
            <Text style={styles.groupName} numberOfLines={2}>{group.name}</Text>
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
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  seeAllText: {
    fontSize: 13,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  groupsScroll: {
    paddingRight: 4,
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    width: 130,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 3,
  },
  groupIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    color: '#64748b',
  },
  emptyGroupCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 28,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  emptyGroupText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyGroupSubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
});

