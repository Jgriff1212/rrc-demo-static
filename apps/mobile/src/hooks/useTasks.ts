/**
 * Tasks data hook with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Task, Period, Priority } from '@reveal/shared';
import { getCurrentPeriodKey } from '@reveal/shared';

export function useTasks(period: Period, periodKey?: string) {
  const queryClient = useQueryClient();
  const key = periodKey || getCurrentPeriodKey(period);

  // Fetch tasks for period
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks', period, key],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('period', period)
        .eq('period_key', key)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
  });

  // Create task
  const createTask = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          period,
          period_key: key,
          ...taskData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', period, key] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  // Update task
  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', period, key] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  // Delete task
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', period, key] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  // Toggle task completion
  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', period, key] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask: createTask.mutateAsync,
    updateTask: updateTask.mutateAsync,
    deleteTask: deleteTask.mutateAsync,
    toggleTask: toggleTask.mutateAsync,
  };
}
