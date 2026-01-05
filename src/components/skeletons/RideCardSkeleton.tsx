/**
 * RideCardSkeleton - Skeleton loader pour les cartes de courses
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBase } from './SkeletonBase';

export const RideCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Header avec badge et distance */}
      <View style={styles.header}>
        <SkeletonBase width={80} height={24} borderRadius={12} />
        <SkeletonBase width={60} height={20} borderRadius={10} />
      </View>

      {/* Itinéraire */}
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <SkeletonBase width={16} height={16} borderRadius={8} />
          <SkeletonBase width="85%" height={18} style={styles.ml} />
        </View>
        <View style={styles.routeRow}>
          <SkeletonBase width={16} height={16} borderRadius={8} />
          <SkeletonBase width="75%" height={18} style={styles.ml} />
        </View>
      </View>

      {/* Footer avec date, distance, prix */}
      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <SkeletonBase width={100} height={16} />
          <SkeletonBase width={80} height={16} />
        </View>
        <SkeletonBase width={70} height={28} borderRadius={14} style={styles.mt} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  route: {
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ml: {
    marginLeft: 12,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mt: {
    marginTop: 12,
  },
});

