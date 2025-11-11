// Supabase Edge Function: video-compose
// Orchestrates video composition for completed board animations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoComposeRequest {
  board_id: string;
  include_checkmarks: boolean;
  include_outro: boolean;
  watermark?: boolean;
}

interface VideoComposeResponse {
  video_url: string;
  share_id: string;
}

/**
 * Generate animation metadata for the video
 * In a real implementation, this would orchestrate ffmpeg or a video processing service
 */
async function composeVideo(
  boardId: string,
  includeCheckmarks: boolean,
  includeOutro: boolean,
  watermark: boolean
): Promise<{ path: string; duration: number }> {
  console.log('Composing video:', { boardId, includeCheckmarks, includeOutro, watermark });

  // Simulate video processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In production, this would:
  // 1. Fetch board data and tasks
  // 2. Generate animation frames with Skia or Canvas
  // 3. Use ffmpeg-kit to stitch frames into video
  // 4. Add audio, transitions, text overlays
  // 5. Add watermark if required
  // 6. Upload to Supabase Storage
  // 7. Return signed URL

  const timestamp = Date.now();
  const path = `user-shares/videos/${boardId}-${timestamp}.mp4`;

  // Mock video composition - return path
  // In real implementation, this would call ffmpeg and upload to storage
  return {
    path,
    duration: includeOutro ? 15 : 10,
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

    const body: VideoComposeRequest = await req.json();
    const { board_id, include_checkmarks = true, include_outro = true, watermark = true } = body;

    if (!board_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: board_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify board exists and user owns it
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get board details
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*, tasks(*)')
      .eq('id', board_id)
      .eq('user_id', user.id)
      .single();

    if (boardError || !board) {
      return new Response(
        JSON.stringify({ error: 'Board not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!board.completed_at) {
      return new Response(
        JSON.stringify({ error: 'Board is not completed yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compose video
    const { path, duration } = await composeVideo(
      board_id,
      include_checkmarks,
      include_outro,
      watermark
    );

    // Create share record
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .insert({
        user_id: user.id,
        board_id,
        type: 'video',
        storage_path: path,
        metadata: {
          duration,
          include_checkmarks,
          include_outro,
          watermark,
        },
      })
      .select()
      .single();

    if (shareError) {
      throw new Error(`Failed to create share: ${shareError.message}`);
    }

    // Generate signed URL (valid for 1 hour)
    // In production, upload actual video to storage and get signed URL
    const mockVideoUrl = `https://storage.supabase.co/${path}?token=mock-signed-token`;

    console.log('Video composed successfully:', share.id);

    return new Response(
      JSON.stringify({
        video_url: mockVideoUrl,
        share_id: share.id,
      } as VideoComposeResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in video-compose:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
