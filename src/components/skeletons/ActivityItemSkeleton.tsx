/**
 * ActivityItemSkeleton - Skeleton loader pour les items d'activité
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBase } from './SkeletonBase';

export const ActivityItemSkeleton: React.FC = () => {
  return (
    <View style={styles.item}>
      <SkeletonBase width={40} height={40} borderRadius={20} />
      <View style={styles.content}>
        <SkeletonBase width="70%" height={18} style={styles.mb} />
        <SkeletonBase width="90%" height={14} style={styles.mb} />
        <SkeletonBase width="40%" height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  mb: {
    marginBottom: 6,
  },
});



