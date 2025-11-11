// Supabase Edge Function: image-moderate
// Moderates user-provided prompts and task themes for safety

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  text: string;
  type?: 'task' | 'prompt';
}

interface ModerationResponse {
  safe: boolean;
  flagged_terms?: string[];
  reason?: string;
}

/**
 * Simple keyword-based content filter
 * In production, integrate with OpenAI Moderation API or similar
 */
const BLOCKED_KEYWORDS = [
  'nsfw',
  'explicit',
  'violent',
  'gore',
  'sexual',
  'nude',
  'naked',
  'porn',
  'xxx',
  'drug',
  'weapon',
  'hate',
  'racist',
  'offensive',
  // Add more as needed
];

/**
 * Check text against blocked keywords
 */
function moderateText(text: string): ModerationResponse {
  const lowerText = text.toLowerCase();
  const flaggedTerms: string[] = [];

  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      flaggedTerms.push(keyword);
    }
  }

  if (flaggedTerms.length > 0) {
    return {
      safe: false,
      flagged_terms: flaggedTerms,
      reason: 'Content contains inappropriate terms',
    };
  }

  return { safe: true };
}

/**
 * Call external moderation API (stub)
 */
async function moderateWithExternalAPI(text: string): Promise<ModerationResponse> {
  const moderationProvider = Deno.env.get('MODERATION_PROVIDER') || 'none';

  if (moderationProvider === 'none') {
    return moderateText(text);
  }

  // Stub for external API integration
  const apiUrl = Deno.env.get('MODERATION_API_URL');
  const apiKey = Deno.env.get('MODERATION_API_KEY');

  if (!apiUrl || !apiKey) {
    console.warn('External moderation configured but missing credentials, using keyword filter');
    return moderateText(text);
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      throw new Error(`Moderation API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Adapt response based on your moderation provider
    // This is a generic structure
    return {
      safe: !data.flagged,
      flagged_terms: data.categories || [],
      reason: data.reason,
    };
  } catch (error) {
    console.error('External moderation failed, falling back to keyword filter:', error);
    return moderateText(text);
  }
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
    const body: ModerationRequest = await req.json();
    const { text, type = 'task' } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await moderateWithExternalAPI(text);

    console.log('Moderation result:', { type, safe: result.safe, text: text.slice(0, 50) });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in image-moderate:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
