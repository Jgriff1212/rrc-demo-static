/**
 * Reveal Screen - Shows AI-generated image and share options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share as RNShare,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getCurrentPeriodKey } from '@reveal/shared';
import { useAppStore } from '@/store';
import { useBoard } from '@/hooks/useBoard';
import { composeVideo } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export function RevealScreen() {
  const { selectedPeriod, profile } = useAppStore();
  const periodKey = getCurrentPeriodKey(selectedPeriod);
  const { board, isCompleted } = useBoard(selectedPeriod, periodKey);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const router = useRouter();

  const aiImage = board?.ai_images;
  const watermarkEnabled = profile?.pro_tier === 'free';

  const handleGenerateVideo = async () => {
    if (!board) return;

    setGeneratingVideo(true);
    try {
      const result = await composeVideo({
        board_id: board.id,
        include_checkmarks: true,
        include_outro: true,
        watermark: watermarkEnabled,
      });

      Alert.alert(
        'Video Ready!',
        'Your reveal animation has been created.',
        [
          {
            text: 'Share',
            onPress: () => handleShare(result.video_url),
          },
          { text: 'OK' },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate video');
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleShare = async (url?: string) => {
    const imageUrl = url || aiImage?.metadata?.url;
    if (!imageUrl) return;

    try {
      await RNShare.share({
        message: `Check out my completed tasks! #DailyReveal`,
        url: imageUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRevealReal = () => {
    if (!profile?.camera_opt_in) {
      Alert.alert(
        'Camera Access Required',
        'Please enable camera access in settings to use Reveal+Real feature.',
        [
          { text: 'Cancel' },
          {
            text: 'Go to Settings',
            onPress: () => router.push('/(tabs)/settings'),
          },
        ]
      );
      return;
    }

    // Navigate to camera screen (not implemented in this scaffold)
    Alert.alert('Coming Soon', 'Reveal+Real feature will be available soon!');
  };

  if (!isCompleted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>Complete your tasks</Text>
          <Text style={styles.emptySubtitle}>
            Finish all tasks on your board to unlock your reveal
          </Text>
          <Button
            title="Back to Tasks"
            onPress={() => router.push('/(tabs)/home')}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🎉 Your Reveal</Text>
        <Text style={styles.subtitle}>
          You completed {selectedPeriod === 'day' ? 'today' : `this ${selectedPeriod}`}'s board!
        </Text>

        {aiImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: aiImage.metadata?.url }}
              style={styles.image}
              resizeMode="cover"
            />
            {watermarkEnabled && (
              <View style={styles.watermark}>
                <Text style={styles.watermarkText}>Reveal</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Generating your reveal...</Text>
          </View>
        )}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round((board?.progress || 0) * 100)}%</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.streak_count || 0} 🔥</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{aiImage?.style_pack || 'starter'}</Text>
            <Text style={styles.statLabel}>Style</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Share Image"
            onPress={() => handleShare()}
            disabled={!aiImage}
            style={styles.actionButton}
          />
          <Button
            title="Generate Video"
            onPress={handleGenerateVideo}
            variant="outline"
            loading={generatingVideo}
            disabled={!board}
            style={styles.actionButton}
          />
          <Button
            title="Reveal + Real 📸"
            onPress={handleRevealReal}
            variant="outline"
            style={styles.actionButton}
          />
        </View>

        {watermarkEnabled && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Remove Watermark</Text>
            <Text style={styles.upgradeSubtitle}>
              Upgrade to Pro to share without watermarks and unlock premium styles
            </Text>
            <Button
              title="Upgrade to Pro"
              onPress={() => Alert.alert('Coming Soon', 'Pro subscription will be available soon!')}
              size="small"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  watermark: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  watermarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748b',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: '100%',
  },
  upgradeCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4338ca',
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  backButton: {
    width: '100%',
  },
});
