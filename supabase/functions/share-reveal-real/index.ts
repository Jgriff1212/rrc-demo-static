// Supabase Edge Function: share-reveal-real
// Composites user selfie/environment photo with AI-generated reveal image

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevealRealRequest {
  board_id: string;
  selfie_url?: string;
  environment_url?: string;
  layout: 'split' | 'pip' | 'blend';
  opacity?: number;
}

interface RevealRealResponse {
  composite_url: string;
  share_id: string;
}

/**
 * Composite two images together
 * In production, this would use Canvas API or image processing library
 */
async function compositeImages(
  revealImageUrl: string,
  userImageUrl: string,
  layout: string,
  opacity: number
): Promise<string> {
  console.log('Compositing images:', { layout, opacity });

  // Simulate image processing time
  await new Promise(resolve => setTimeout(resolve, 800));

  // In production, this would:
  // 1. Fetch both images
  // 2. Use Canvas API or sharp/jimp to composite
  // 3. Apply layout: split (side-by-side), pip (picture-in-picture), or blend (overlay)
  // 4. Add opacity if blend mode
  // 5. Upload result to Supabase Storage
  // 6. Return path

  const timestamp = Date.now();
  const path = `reveal-real/${timestamp}-composite.jpg`;

  // Mock - return path
  return path;
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

    const body: RevealRealRequest = await req.json();
    const { board_id, selfie_url, environment_url, layout = 'split', opacity = 0.7 } = body;

    if (!board_id || (!selfie_url && !environment_url)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: board_id and at least one image URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
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

    // Verify camera opt-in
    const { data: profile } = await supabase
      .from('profiles')
      .select('camera_opt_in')
      .eq('user_id', user.id)
      .single();

    if (!profile?.camera_opt_in) {
      return new Response(
        JSON.stringify({ error: 'Camera feature not enabled. Please enable in settings.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get board and AI image
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select(`
        *,
        ai_images (
          storage_path,
          metadata
        )
      `)
      .eq('id', board_id)
      .eq('user_id', user.id)
      .single();

    if (boardError || !board) {
      return new Response(
        JSON.stringify({ error: 'Board not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!board.ai_images) {
      return new Response(
        JSON.stringify({ error: 'AI image not found for this board' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get reveal image URL
    const revealImageUrl = board.ai_images.metadata?.url ||
      `https://storage.supabase.co/${board.ai_images.storage_path}`;

    // Use selfie or environment photo
    const userImageUrl = selfie_url || environment_url!;

    // Composite images
    const compositePath = await compositeImages(
      revealImageUrl,
      userImageUrl,
      layout,
      opacity
    );

    // Create share record
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .insert({
        user_id: user.id,
        board_id,
        type: 'reveal_real',
        storage_path: compositePath,
        metadata: {
          layout,
          opacity,
          has_selfie: !!selfie_url,
          has_environment: !!environment_url,
        },
      })
      .select()
      .single();

    if (shareError) {
      throw new Error(`Failed to create share: ${shareError.message}`);
    }

    // Generate signed URL
    const compositeUrl = `https://storage.supabase.co/${compositePath}?token=mock-signed-token`;

    console.log('Reveal+Real composite created:', share.id);

    return new Response(
      JSON.stringify({
        composite_url: compositeUrl,
        share_id: share.id,
      } as RevealRealResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in share-reveal-real:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
