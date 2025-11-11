/**
 * Board data hook with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Board, Period, AIImage } from '@reveal/shared';
import { getCurrentPeriodKey } from '@reveal/shared';
import { requestImage } from '@/lib/api';

export function useBoard(period: Period, periodKey?: string) {
  const queryClient = useQueryClient();
  const key = periodKey || getCurrentPeriodKey(period);

  // Fetch board for period
  const { data: board, isLoading, error } = useQuery<Board & { ai_images?: AIImage }>({
    queryKey: ['boards', period, key],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get or create board
      let { data: existingBoard, error: fetchError } = await supabase
        .from('boards')
        .select(`
          *,
          ai_images (*)
        `)
        .eq('user_id', user.id)
        .eq('period', period)
        .eq('period_key', key)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Board doesn't exist, create it
        const { data: newBoard, error: createError } = await supabase
          .from('boards')
          .insert({
            user_id: user.id,
            period,
            period_key: key,
            progress: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        return newBoard as Board;
      }

      if (fetchError) throw fetchError;
      return existingBoard as Board & { ai_images?: AIImage };
    },
  });

  // Generate AI image
  const generateImage = useMutation({
    mutationFn: async (params: { task_themes?: string[]; style_pack?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = await requestImage({
        period,
        period_key: key,
        user_id: user.id,
        ...params,
      });

      // Update board with AI image ID
      const { error } = await supabase
        .from('boards')
        .update({ ai_image_id: result.ai_image_id })
        .eq('user_id', user.id)
        .eq('period', period)
        .eq('period_key', key);

      if (error) throw error;

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', period, key] });
    },
  });

  // Update board progress
  const updateProgress = useMutation({
    mutationFn: async (progress: number) => {
      if (!board) throw new Error('Board not found');

      const completed_at = progress >= 1 ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('boards')
        .update({ progress, completed_at })
        .eq('id', board.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', period, key] });
    },
  });

  return {
    board,
    isLoading,
    error,
    generateImage: generateImage.mutateAsync,
    updateProgress: updateProgress.mutateAsync,
    isCompleted: (board?.progress || 0) >= 1,
  };
}
