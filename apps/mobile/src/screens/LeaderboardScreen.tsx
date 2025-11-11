/**
 * Leaderboard Screen - Shows daily/weekly/monthly rankings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Period } from '@reveal/shared';
import { getCurrentPeriodKey } from '@reveal/shared';
import { getLeaderboard, LeaderboardEntry } from '@/lib/api';
import { useAppStore } from '@/store';

export function LeaderboardScreen() {
  const { selectedPeriod, setSelectedPeriod } = useAppStore();
  const periodKey = getCurrentPeriodKey(selectedPeriod);

  const {
    data: leaderboard,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['leaderboard', selectedPeriod, periodKey],
    queryFn: () => getLeaderboard(selectedPeriod, periodKey),
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const getRankEmoji = (rank: number) => {
      if (rank === 1) return '🥇';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return '';
    };

    return (
      <View style={styles.leaderboardItem}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankEmoji}>{getRankEmoji(item.rank)}</Text>
          <Text style={styles.rank}>{item.rank}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.display_name}</Text>
          <Text style={styles.userTime}>{item.completion_time_minutes}m</Text>
        </View>
        <View style={styles.streakContainer}>
          <Text style={styles.streak}>{item.streak} 🔥</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>
          See who's crushing their tasks
        </Text>
      </View>

      <View style={styles.periodSelector}>
        {(['day', 'week', 'month'] as Period[]).map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {leaderboard && leaderboard.user_rank && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankLabel}>Your Rank</Text>
          <View style={styles.userRankRow}>
            <Text style={styles.userRankValue}>#{leaderboard.user_rank}</Text>
            <Text style={styles.userPercentile}>
              Top {leaderboard.user_percentile}%
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={leaderboard?.top_users || []}
        renderItem={renderItem}
        keyExtractor={item => `${item.rank}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No rankings yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              Complete your board to join the leaderboard!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  userRankCard: {
    backgroundColor: '#eef2ff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  userRankLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338ca',
    marginBottom: 8,
  },
  userRankRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  userRankValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4338ca',
  },
  userPercentile: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  userTime: {
    fontSize: 14,
    color: '#64748b',
  },
  streakContainer: {
    paddingHorizontal: 12,
  },
  streak: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
