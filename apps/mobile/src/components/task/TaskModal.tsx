/**
 * Task Create/Edit Modal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Task, Priority } from '@reveal/shared';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface TaskModalProps {
  visible: boolean;
  task?: Task;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function TaskModal({ visible, task, onClose, onSave, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [category, setCategory] = useState(task?.category || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        priority,
        category: category.trim() || null,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;

    setLoading(true);
    try {
      await onDelete(task.id);
      handleClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setPriority('medium');
    setCategory('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.container}>
          <ScrollView>
            <View style={styles.header}>
              <Text style={styles.title}>{task ? 'Edit Task' : 'New Task'}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              autoFocus
            />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {(['high', 'medium', 'low'] as Priority[]).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      priority === p && styles.priorityButtonActive,
                      styles[`priority${p.charAt(0).toUpperCase() + p.slice(1)}`],
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        priority === p && styles.priorityTextActive,
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Category (Optional)"
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Work, Personal, Health"
            />

            <View style={styles.actions}>
              <Button
                title={task ? 'Save Changes' : 'Create Task'}
                onPress={handleSave}
                loading={loading}
                disabled={!title.trim()}
                style={styles.saveButton}
              />
              {task && onDelete && (
                <Button
                  title="Delete Task"
                  onPress={handleDelete}
                  variant="outline"
                  loading={loading}
                  style={styles.deleteButton}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  priorityButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  priorityHigh: {},
  priorityMedium: {},
  priorityLow: {},
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  priorityTextActive: {
    color: '#fff',
  },
  actions: {
    marginTop: 8,
  },
  saveButton: {
    marginBottom: 12,
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
});
