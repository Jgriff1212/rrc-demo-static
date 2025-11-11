/**
 * Progress Header Component
 * Shows board completion progress and streak info
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressHeaderProps {
  progress: number;
  streak: number;
  completedTasks: number;
  totalTasks: number;
}

export function ProgressHeader({
  progress,
  streak,
  completedTasks,
  totalTasks,
}: ProgressHeaderProps) {
  const progressPercentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{progressPercentage}%</Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {completedTasks}/{totalTasks}
          </Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak} 🔥</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
});
