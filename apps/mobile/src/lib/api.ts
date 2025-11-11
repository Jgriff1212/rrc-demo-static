/**
 * API client for Supabase Edge Functions
 */

import { supabase } from './supabase';
import Constants from 'expo-constants';

const functionsUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_FUNCTIONS_URL ||
                     process.env.EXPO_PUBLIC_FUNCTIONS_URL ||
                     `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

/**
 * Base function invoker with auth
 */
async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, any>
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${functionsUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Function ${functionName} failed`);
  }

  return response.json();
}

/**
 * Request AI image generation
 */
export interface ImageRequestParams {
  period: 'day' | 'week' | 'month';
  period_key: string;
  task_themes?: string[];
  style_pack?: string;
  user_id?: string;
}

export interface ImageRequestResponse {
  ai_image_id: string;
  cached: boolean;
}

export async function requestImage(params: ImageRequestParams): Promise<ImageRequestResponse> {
  return invokeFunction<ImageRequestResponse>('image-request', params);
}

/**
 * Moderate content
 */
export interface ModerateRequest {
  text: string;
  type?: 'task' | 'prompt';
}

export interface ModerateResponse {
  safe: boolean;
  flagged_terms?: string[];
  reason?: string;
}

export async function moderateContent(params: ModerateRequest): Promise<ModerateResponse> {
  return invokeFunction<ModerateResponse>('image-moderate', params);
}

/**
 * Compose video
 */
export interface VideoComposeRequest {
  board_id: string;
  include_checkmarks: boolean;
  include_outro: boolean;
  watermark?: boolean;
}

export interface VideoComposeResponse {
  video_url: string;
  share_id: string;
}

export async function composeVideo(params: VideoComposeRequest): Promise<VideoComposeResponse> {
  return invokeFunction<VideoComposeResponse>('video-compose', params);
}

/**
 * Get leaderboard
 */
export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  completion_time_minutes: number;
  streak: number;
  anonymized: boolean;
}

export interface LeaderboardResponse {
  period: string;
  period_key: string;
  top_users: LeaderboardEntry[];
  user_rank?: number;
  user_percentile?: number;
  total_participants: number;
  generated_at: string;
}

export async function getLeaderboard(
  period: string,
  period_key: string
): Promise<LeaderboardResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session ? `Bearer ${session.access_token}` : '';

  const response = await fetch(
    `${functionsUrl}/leaderboard?period=${period}&period_key=${period_key}`,
    {
      headers: authHeader ? { Authorization: authHeader } : {},
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  return response.json();
}

/**
 * Compose Reveal+Real
 */
export interface RevealRealRequest {
  board_id: string;
  selfie_url?: string;
  environment_url?: string;
  layout: 'split' | 'pip' | 'blend';
  opacity?: number;
}

export interface RevealRealResponse {
  composite_url: string;
  share_id: string;
}

export async function composeRevealReal(
  params: RevealRealRequest
): Promise<RevealRealResponse> {
  return invokeFunction<RevealRealResponse>('share-reveal-real', params);
}
