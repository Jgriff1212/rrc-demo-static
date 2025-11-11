// Supabase Edge Function: leaderboard
// Fetches and generates daily leaderboard data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaderboardEntry {
  rank: number;
  display_name: string;
  completion_time_minutes: number;
  streak: number;
  anonymized: boolean;
}

interface LeaderboardResponse {
  period: string;
  period_key: string;
  top_users: LeaderboardEntry[];
  user_rank?: number;
  user_percentile?: number;
  total_participants: number;
  generated_at: string;
}

/**
 * Calculate completion time in minutes from period start
 */
function calculateCompletionTime(completedAt: string, periodKey: string): number {
  const completed = new Date(completedAt);
  const periodStart = new Date(periodKey + 'T00:01:00Z'); // Start at 12:01 AM
  const diffMs = completed.getTime() - periodStart.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

/**
 * Anonymize display name for privacy
 */
function anonymizeDisplayName(name: string): string {
  if (!name || name.length < 2) return 'User***';
  return name.charAt(0) + '*'.repeat(Math.min(name.length - 1, 5));
}

/**
 * Generate or fetch leaderboard
 */
async function getLeaderboard(
  supabase: any,
  period: string,
  periodKey: string,
  userId?: string
): Promise<LeaderboardResponse> {
  // Check if leaderboard already generated for this period
  const { data: existingLeaderboard } = await supabase
    .from('leaderboards')
    .select('*')
    .eq('period', period)
    .eq('period_key', periodKey)
    .single();

  // If exists and recent (< 1 hour old), return cached version
  if (existingLeaderboard) {
    const generatedAt = new Date(existingLeaderboard.generated_at);
    const now = new Date();
    const ageMinutes = (now.getTime() - generatedAt.getTime()) / (1000 * 60);

    if (ageMinutes < 60) {
      console.log('Returning cached leaderboard');

      const topUsers = existingLeaderboard.top_users as LeaderboardEntry[];
      let userRank, userPercentile;

      if (userId) {
        const userIndex = topUsers.findIndex((u: any) => u.user_id === userId);
        if (userIndex !== -1) {
          userRank = userIndex + 1;
          userPercentile = Math.round((userRank / topUsers.length) * 100);
        }
      }

      return {
        period,
        period_key: periodKey,
        top_users: topUsers.map(u => ({ ...u, anonymized: true })),
        user_rank: userRank,
        user_percentile: userPercentile,
        total_participants: topUsers.length,
        generated_at: existingLeaderboard.generated_at,
      };
    }
  }

  // Generate new leaderboard
  console.log('Generating new leaderboard for:', { period, periodKey });

  // Fetch all completed boards for this period
  const { data: completedBoards, error } = await supabase
    .from('boards')
    .select(`
      id,
      user_id,
      completed_at,
      profiles:user_id (
        display_name,
        streak_count,
        leaderboard_opt_in
      )
    `)
    .eq('period', period)
    .eq('period_key', periodKey)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch boards: ${error.message}`);
  }

  // Filter users who opted in and calculate completion times
  const entries: LeaderboardEntry[] = completedBoards
    .filter((board: any) => board.profiles?.leaderboard_opt_in !== false)
    .map((board: any, index: number) => ({
      rank: index + 1,
      user_id: board.user_id,
      display_name: anonymizeDisplayName(board.profiles?.display_name || 'User'),
      completion_time_minutes: calculateCompletionTime(board.completed_at, periodKey),
      streak: board.profiles?.streak_count || 0,
      anonymized: true,
    }))
    .slice(0, 100); // Top 100 only

  // Store leaderboard
  const { error: insertError } = await supabase
    .from('leaderboards')
    .upsert({
      period,
      period_key: periodKey,
      top_users: entries,
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'period,period_key',
    });

  if (insertError) {
    console.error('Failed to store leaderboard:', insertError);
  }

  let userRank, userPercentile;
  if (userId) {
    const userIndex = entries.findIndex((u: any) => u.user_id === userId);
    if (userIndex !== -1) {
      userRank = userIndex + 1;
      userPercentile = Math.round((userRank / entries.length) * 100);
    }
  }

  return {
    period,
    period_key: periodKey,
    top_users: entries.map(({ user_id, ...rest }: any) => rest),
    user_rank: userRank,
    user_percentile: userPercentile,
    total_participants: entries.length,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse URL params
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'day';
    const periodKey = url.searchParams.get('period_key');

    if (!periodKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: period_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID if authenticated
    let userId: string | undefined;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const leaderboard = await getLeaderboard(supabase, period, periodKey, userId);

    return new Response(
      JSON.stringify(leaderboard),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in leaderboard:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
