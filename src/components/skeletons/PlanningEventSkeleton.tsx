/**
 * PlanningEventSkeleton - Skeleton loader pour les événements du planning
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBase } from './SkeletonBase';

export const PlanningEventSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Date/Heure */}
      <View style={styles.header}>
        <SkeletonBase width={120} height={20} />
        <SkeletonBase width={80} height={16} />
      </View>
      
      {/* Event card */}
      <View style={styles.event}>
        <SkeletonBase width={40} height={40} borderRadius={20} />
        <View style={styles.content}>
          <SkeletonBase width="70%" height={18} style={styles.mb} />
          <SkeletonBase width="90%" height={14} style={styles.mb} />
          <SkeletonBase width="50%" height={14} />
        </View>
      </View>
      
      {/* Event card */}
      <View style={styles.event}>
        <SkeletonBase width={40} height={40} borderRadius={20} />
        <View style={styles.content}>
          <SkeletonBase width="60%" height={18} style={styles.mb} />
          <SkeletonBase width="80%" height={14} style={styles.mb} />
          <SkeletonBase width="40%" height={14} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  event: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  mb: {
    marginBottom: 6,
  },
});



