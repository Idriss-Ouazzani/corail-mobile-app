/**
 * Bandeau accueil : annonces groupe encore disponibles (PUBLISHED, pas les miennes).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface GroupNewRideRow {
  groupId: string;
  groupName: string;
  count: number;
}

interface GroupNewRidesBannerProps {
  rows: GroupNewRideRow[];
  onPress: () => void;
}

export const GroupNewRidesBanner: React.FC<GroupNewRidesBannerProps> = ({ rows, onPress }) => {
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total === 0 || rows.length === 0) return null;
  const totalLabel = total > 99 ? '99+' : String(total);
  const severalGroups = rows.length > 1;
  // Une seule métrique « chiffre » en évidence : le total. Les pilules par groupe n’apparaissent
  // que s’il y a plusieurs groupes (sinon même bandeau = total + pilule identiques → confusion).

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.wrap}>
      <LinearGradient
        colors={['#0d9488', '#0ea5e9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.left}>
          <View style={styles.iconBox}>
            <Ionicons name="megaphone" size={20} color="#fff" />
          </View>
          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
                Nouvelles courses dans vos groupes
              </Text>
              <View style={styles.totalPill} accessibilityLabel={`${total} annonces groupe`}>
                <Text style={styles.totalPillText}>{totalLabel}</Text>
              </View>
            </View>
            <Text style={styles.subtitleHint} numberOfLines={2}>
              {severalGroups
                ? `${total} annonce${total > 1 ? 's' : ''} chez d’autres chauffeurs · répartition par groupe`
                : rows[0]?.groupName && rows[0].groupName !== 'Groupe sans nom'
                  ? `« ${rows[0].groupName} » · ${total} annonce${total > 1 ? 's' : ''} d’autres chauffeurs`
                  : `${total} annonce${total > 1 ? 's' : ''} dans un de vos groupes · autres chauffeurs`}
            </Text>
            <View style={styles.rows}>
              {rows.map((r, i) => (
                <View key={r.groupId} style={[styles.groupRow, i > 0 && styles.groupRowSpaced]}>
                  <Text style={styles.groupName} numberOfLines={1}>
                    « {r.groupName} »
                  </Text>
                  {severalGroups && (
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>{r.count}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.85)" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    flex: 1,
    minWidth: 0,
  },
  totalPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    flexShrink: 0,
  },
  totalPillText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitleHint: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  rows: {},
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  groupRowSpaced: {
    marginTop: 6,
  },
  groupName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  pill: {
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pillText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
  },
});
