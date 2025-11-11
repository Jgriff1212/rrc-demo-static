/**
 * Home Screen - Main task board view
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Period, Task } from '@reveal/shared';
import { getCurrentPeriodKey } from '@reveal/shared';
import { useTasks } from '@/hooks/useTasks';
import { useBoard } from '@/hooks/useBoard';
import { useAppStore } from '@/store';
import { TreemapBoard } from '@/components/board/TreemapBoard';
import { ProgressHeader } from '@/components/board/ProgressHeader';
import { TaskModal } from '@/components/task/TaskModal';
import { Button } from '@/components/ui/Button';

export function HomeScreen() {
  const router = useRouter();
  const { selectedPeriod, setSelectedPeriod, profile } = useAppStore();
  const periodKey = getCurrentPeriodKey(selectedPeriod);

  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleTask } = useTasks(
    selectedPeriod,
    periodKey
  );
  const { board, generateImage, updateProgress, isCompleted } = useBoard(
    selectedPeriod,
    periodKey
  );

  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const progress = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    // React Query will refetch automatically
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleTaskPress = async (task: Task) => {
    if (task.completed) {
      // Uncomment task
      await toggleTask({ id: task.id, completed: false });
    } else {
      // Complete task
      await toggleTask({ id: task.id, completed: true });

      // Update board progress
      const newProgress = (completedTasks.length + 1) / tasks.length;
      await updateProgress(newProgress);

      // If all tasks complete, generate image if not already done
      if (newProgress >= 1 && !board?.ai_image_id) {
        const themes = tasks.map(t => t.category).filter(Boolean) as string[];
        await generateImage({ task_themes: themes, style_pack: 'starter' });
      }
    }
  };

  const handleAddTask = () => {
    setSelectedTask(undefined);
    setTaskModalVisible(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await updateTask({ id: selectedTask.id, ...taskData });
    } else {
      await createTask(taskData);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {profile?.display_name ? `Hey, ${profile.display_name}!` : 'Welcome!'}
          </Text>
          <Text style={styles.subtitle}>
            {isCompleted ? '🎉 Board completed!' : "Let's get things done"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ProgressHeader
          progress={progress}
          streak={profile?.streak_count || 0}
          completedTasks={completedTasks.length}
          totalTasks={tasks.length}
        />

        <TreemapBoard
          tasks={tasks}
          onTaskPress={handleTaskPress}
          revealedTasks={new Set(completedTasks.map(t => t.id))}
        />

        {isCompleted && board?.ai_image_id && (
          <View style={styles.completedCard}>
            <Text style={styles.completedTitle}>🎉 All tasks completed!</Text>
            <Text style={styles.completedSubtitle}>
              Your reveal is ready to share
            </Text>
            <Button
              title="View Reveal"
              onPress={() => router.push('/(tabs)/reveal')}
              style={styles.revealButton}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={handleAddTask}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <TaskModal
        visible={taskModalVisible}
        task={selectedTask}
        onClose={() => setTaskModalVisible(false)}
        onSave={handleSaveTask}
        onDelete={selectedTask ? deleteTask : undefined}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  completedCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#86efac',
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#16a34a',
    marginBottom: 16,
  },
  revealButton: {
    width: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
