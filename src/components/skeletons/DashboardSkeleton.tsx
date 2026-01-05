/**
 * DashboardSkeleton - Skeleton loader pour le dashboard
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SkeletonBase } from './SkeletonBase';

export const DashboardSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBase width="60%" height={32} borderRadius={8} />
        <SkeletonBase width="40%" height={20} style={{ marginTop: 8 }} />
      </View>

      {/* Revenue Cards */}
      <View style={styles.row}>
        <View style={styles.card}>
          <SkeletonBase width={40} height={40} borderRadius={20} />
          <SkeletonBase width="70%" height={28} style={{ marginTop: 12 }} />
          <SkeletonBase width="50%" height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.card}>
          <SkeletonBase width={40} height={40} borderRadius={20} />
          <SkeletonBase width="70%" height={28} style={{ marginTop: 12 }} />
          <SkeletonBase width="50%" height={16} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Today Stats */}
      <View style={styles.row}>
        <View style={styles.card}>
          <SkeletonBase width={40} height={40} borderRadius={20} />
          <SkeletonBase width="60%" height={24} style={{ marginTop: 12 }} />
          <SkeletonBase width="40%" height={16} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.card}>
          <SkeletonBase width={40} height={40} borderRadius={20} />
          <SkeletonBase width="60%" height={24} style={{ marginTop: 12 }} />
          <SkeletonBase width="40%" height={16} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <SkeletonBase width="40%" height={22} style={{ marginBottom: 16 }} />
        <View style={styles.actionRow}>
          <SkeletonBase width="48%" height={80} borderRadius={12} />
          <SkeletonBase width="48%" height={80} borderRadius={12} />
        </View>
        <View style={styles.actionRow}>
          <SkeletonBase width="48%" height={80} borderRadius={12} />
          <SkeletonBase width="48%" height={80} borderRadius={12} />
        </View>
      </View>

      {/* Upcoming Rides */}
      <View style={styles.section}>
        <SkeletonBase width="50%" height={22} style={{ marginBottom: 16 }} />
        <View style={styles.rideCard}>
          <SkeletonBase width="70%" height={18} />
          <SkeletonBase width="50%" height={16} style={{ marginTop: 8 }} />
          <SkeletonBase width="30%" height={20} style={{ marginTop: 12 }} />
        </View>
        <View style={styles.rideCard}>
          <SkeletonBase width="65%" height={18} />
          <SkeletonBase width="55%" height={16} style={{ marginTop: 8 }} />
          <SkeletonBase width="30%" height={20} style={{ marginTop: 12 }} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rideCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
});

