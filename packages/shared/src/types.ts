/**
 * Shared TypeScript types for Reveal app
 */

export type Tier = 'free' | 'pro' | 'creator';
export type Priority = 'high' | 'medium' | 'low';
export type Period = 'day' | 'week' | 'month';
export type ShareType = 'image' | 'video' | 'reveal_real';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  streak_count: number;
  pro_tier: Tier;
  timezone: string;
  last_completed_at: string | null;
  streak_insurance_used_at: string | null;
  leaderboard_opt_in: boolean;
  camera_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  priority: Priority;
  due_date: string | null;
  period: Period;
  period_key: string;
  category: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  period: Period;
  period_key: string;
  ai_image_id: string | null;
  progress: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIImage {
  id: string;
  period: Period;
  period_key: string;
  community_seed: string;
  user_variation_seed: string | null;
  style_pack: string;
  storage_path: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Reveal {
  id: string;
  board_id: string;
  task_id: string;
  tile_index: number;
  revealed: boolean;
  revealed_at: string | null;
  created_at: string;
}

export interface Share {
  id: string;
  user_id: string;
  board_id: string;
  type: ShareType;
  storage_path: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  completion_time_minutes: number;
  streak: number;
  anonymized: boolean;
}

export interface Settings {
  weights: {
    high: number;
    medium: number;
    low: number;
  };
  today_bias_weight: number;
  shared_daily_seed_enabled: boolean;
  watermark_enabled_free: boolean;
}
