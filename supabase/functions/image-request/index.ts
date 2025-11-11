// Supabase Edge Function: image-request
// Handles AI image generation requests for completed boards

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageRequestBody {
  period: 'day' | 'week' | 'month';
  period_key: string;
  task_themes?: string[];
  style_pack?: string;
  user_id?: string;
}

interface ImageProvider {
  generateImage(prompt: string, seed: string, style: string): Promise<{ url: string; path: string }>;
}

/**
 * Mock Image Provider - Returns placeholder images for development
 */
class MockImageProvider implements ImageProvider {
  async generateImage(prompt: string, seed: string, style: string): Promise<{ url: string; path: string }> {
    console.log('MockImageProvider: Generating image', { prompt, seed, style });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return a placeholder image based on style
    const placeholderImages: Record<string, string> = {
      'starter': 'https://picsum.photos/seed/starter-' + seed + '/800/1200',
      'vibrant': 'https://picsum.photos/seed/vibrant-' + seed + '/800/1200',
      'minimal': 'https://picsum.photos/seed/minimal-' + seed + '/800/1200',
      'dreamy': 'https://picsum.photos/seed/dreamy-' + seed + '/800/1200',
    };

    const url = placeholderImages[style] || placeholderImages['starter'];
    const path = `ai-images/${seed}-${style}-${Date.now()}.jpg`;

    return { url, path };
  }
}

/**
 * HTTP Image Provider - Calls external AI image generation API
 */
class HttpImageProvider implements ImageProvider {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async generateImage(prompt: string, seed: string, style: string): Promise<{ url: string; path: string }> {
    console.log('HttpImageProvider: Generating image', { prompt, seed, style });

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        seed: parseInt(seed.replace(/\D/g, '').slice(0, 10) || '12345'),
        style,
        width: 800,
        height: 1200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const path = `ai-images/${seed}-${style}-${Date.now()}.jpg`;

    return { url: data.url || data.image_url, path };
  }
}

/**
 * Get the appropriate image provider based on environment
 */
function getImageProvider(): ImageProvider {
  const providerType = Deno.env.get('IMAGE_PROVIDER') || 'mock';

  if (providerType === 'http') {
    const apiUrl = Deno.env.get('IMAGE_PROVIDER_URL');
    const apiKey = Deno.env.get('IMAGE_PROVIDER_API_KEY');

    if (!apiUrl || !apiKey) {
      console.warn('HTTP provider configured but missing URL or API key, falling back to mock');
      return new MockImageProvider();
    }

    return new HttpImageProvider(apiUrl, apiKey);
  }

  return new MockImageProvider();
}

/**
 * Generate a prompt from task themes
 */
function generatePrompt(themes: string[], style: string): string {
  const themeStr = themes.length > 0 ? themes.join(', ') : 'productivity, achievement, success';

  const stylePrompts: Record<string, string> = {
    'starter': 'A beautiful abstract artwork representing',
    'vibrant': 'A vibrant, colorful illustration of',
    'minimal': 'A minimalist, clean design showing',
    'dreamy': 'A dreamy, ethereal composition about',
  };

  const stylePrefix = stylePrompts[style] || stylePrompts['starter'];

  return `${stylePrefix} ${themeStr}. High quality, professional, safe for work, inspirational.`;
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

    // Parse request body
    const body: ImageRequestBody = await req.json();
    const { period, period_key, task_themes = [], style_pack = 'starter', user_id } = body;

    if (!period || !period_key) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: period, period_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create community seed for this period
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'daily_community_seed')
      .single();

    let communitySeed = settingsData?.value || `seed-${period_key}`;
    if (typeof communitySeed !== 'string') {
      communitySeed = JSON.stringify(communitySeed);
    }

    // Generate user-specific variation seed
    const userVariationSeed = user_id
      ? `${communitySeed}-${user_id.slice(0, 8)}`
      : communitySeed;

    // Check if image already exists for this period + user variation
    const { data: existingImage } = await supabase
      .from('ai_images')
      .select('*')
      .eq('period', period)
      .eq('period_key', period_key)
      .eq('user_variation_seed', userVariationSeed)
      .single();

    if (existingImage) {
      console.log('Returning existing image:', existingImage.id);
      return new Response(
        JSON.stringify({ ai_image_id: existingImage.id, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new image
    const provider = getImageProvider();
    const prompt = generatePrompt(task_themes, style_pack);
    const { url, path } = await provider.generateImage(prompt, userVariationSeed, style_pack);

    // Store image metadata in database
    const { data: newImage, error: insertError } = await supabase
      .from('ai_images')
      .insert({
        period,
        period_key,
        community_seed: communitySeed,
        user_variation_seed: userVariationSeed,
        style_pack,
        storage_path: path,
        metadata: { prompt, url, themes: task_themes },
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save image: ${insertError.message}`);
    }

    console.log('Created new image:', newImage.id);

    return new Response(
      JSON.stringify({ ai_image_id: newImage.id, cached: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in image-request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
