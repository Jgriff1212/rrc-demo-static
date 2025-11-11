/**
 * Treemap Board Component
 * Renders tasks as a squarified treemap layout
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { Task } from '@reveal/shared';
import { treemap, TreemapItem, priorityToWeight, truncate } from '@reveal/shared';

interface TreemapBoardProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  revealedTasks?: Set<string>;
}

export function TreemapBoard({ tasks, onTaskPress, revealedTasks = new Set() }: TreemapBoardProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const boardWidth = screenWidth - 32; // 16px padding on each side
  const boardHeight = boardWidth * 1.5; // Portrait aspect ratio

  const tiles = useMemo(() => {
    const items: TreemapItem[] = tasks.map(task => ({
      id: task.id,
      weight: priorityToWeight(task.priority),
      data: task,
    }));

    return treemap(items, boardWidth, boardHeight);
  }, [tasks, boardWidth, boardHeight]);

  if (tasks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { width: boardWidth, height: boardHeight }]}>
        <Text style={styles.emptyText}>No tasks yet</Text>
        <Text style={styles.emptySubtext}>Tap the + button to add your first task</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: boardWidth, height: boardHeight }]}>
      {tiles.map(tile => {
        const task = tile.data as Task;
        const isRevealed = revealedTasks.has(task.id);
        const isCompleted = task.completed;

        return (
          <TouchableOpacity
            key={tile.id}
            style={[
              styles.tile,
              {
                left: tile.x,
                top: tile.y,
                width: tile.width,
                height: tile.height,
              },
              isCompleted && styles.tileCompleted,
            ]}
            onPress={() => onTaskPress(task)}
            activeOpacity={0.7}
          >
            <View style={styles.tileContent}>
              <Text
                style={[
                  styles.tileTitle,
                  isCompleted && styles.tileTitleCompleted,
                ]}
                numberOfLines={2}
              >
                {truncate(task.title, Math.floor(tile.width / 8))}
              </Text>
              <View style={styles.tileBadge}>
                <Text style={styles.tileBadgeText}>
                  {task.priority.charAt(0).toUpperCase()}
                </Text>
              </View>
              {isCompleted && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </View>
            {isRevealed && (
              <View style={styles.revealOverlay} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  emptyContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  tile: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    overflow: 'hidden',
  },
  tileCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  tileContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tileTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 16,
  },
  tileTitleCompleted: {
    color: '#166534',
  },
  tileBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#6366f1',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tileBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  checkmark: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  revealOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
});
