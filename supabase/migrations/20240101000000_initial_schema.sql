-- Reveal App Initial Schema Migration
-- This creates all tables, indexes, RLS policies, and functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE tier AS ENUM ('free', 'pro', 'creator');
CREATE TYPE priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE period AS ENUM ('day', 'week', 'month');
CREATE TYPE share_type AS ENUM ('image', 'video', 'reveal_real');

-- ============================================================
-- TABLES
-- ============================================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User profiles
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  streak_count INTEGER DEFAULT 0 NOT NULL,
  pro_tier tier DEFAULT 'free' NOT NULL,
  timezone TEXT DEFAULT 'UTC' NOT NULL,
  last_completed_at TIMESTAMPTZ,
  streak_insurance_used_at TIMESTAMPTZ,
  leaderboard_opt_in BOOLEAN DEFAULT true NOT NULL,
  camera_opt_in BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  priority priority DEFAULT 'medium' NOT NULL,
  due_date DATE,
  period period NOT NULL,
  period_key TEXT NOT NULL, -- Format: YYYY-MM-DD for day, YYYY-Www for week, YYYY-MM for month
  category TEXT,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT tasks_period_key_format CHECK (
    (period = 'day' AND period_key ~ '^\d{4}-\d{2}-\d{2}$') OR
    (period = 'week' AND period_key ~ '^\d{4}-W\d{2}$') OR
    (period = 'month' AND period_key ~ '^\d{4}-\d{2}$')
  )
);

-- AI Images
CREATE TABLE public.ai_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period period NOT NULL,
  period_key TEXT NOT NULL,
  community_seed TEXT NOT NULL,
  user_variation_seed TEXT,
  style_pack TEXT DEFAULT 'starter' NOT NULL,
  storage_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Boards (represents a period's task collection)
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  period period NOT NULL,
  period_key TEXT NOT NULL,
  ai_image_id UUID REFERENCES public.ai_images(id) ON DELETE SET NULL,
  progress FLOAT DEFAULT 0.0 NOT NULL CHECK (progress >= 0 AND progress <= 1),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, period, period_key)
);

-- Reveals (tracks which tiles have been revealed)
CREATE TABLE public.reveals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  tile_index INTEGER NOT NULL,
  revealed BOOLEAN DEFAULT false NOT NULL,
  revealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(board_id, task_id)
);

-- Leaderboards
CREATE TABLE public.leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period period NOT NULL,
  period_key TEXT NOT NULL,
  top_users JSONB DEFAULT '[]'::jsonb NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(period, period_key)
);

-- Shares
CREATE TABLE public.shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  type share_type NOT NULL,
  storage_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Settings (global app configuration)
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_tasks_user_period ON public.tasks(user_id, period, period_key);
CREATE INDEX idx_tasks_completed ON public.tasks(completed, completed_at);
CREATE INDEX idx_boards_user_period ON public.boards(user_id, period, period_key);
CREATE INDEX idx_ai_images_period ON public.ai_images(period, period_key);
CREATE INDEX idx_reveals_board ON public.reveals(board_id);
CREATE INDEX idx_shares_user ON public.shares(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: Own data only
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles: Own data only
CREATE POLICY "Profiles are viewable by owner" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Profiles are insertable by owner" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles are updatable by owner" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Tasks: Own tasks only
CREATE POLICY "Tasks are viewable by owner" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tasks are insertable by owner" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tasks are updatable by owner" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Tasks are deletable by owner" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Boards: Own boards only
CREATE POLICY "Boards are viewable by owner" ON public.boards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Boards are insertable by owner" ON public.boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Boards are updatable by owner" ON public.boards
  FOR UPDATE USING (auth.uid() = user_id);

-- AI Images: Readable by all authenticated users (community images)
CREATE POLICY "AI images are viewable by authenticated users" ON public.ai_images
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "AI images are insertable by service role" ON public.ai_images
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Reveals: Own board reveals only
CREATE POLICY "Reveals are viewable by board owner" ON public.reveals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = reveals.board_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Reveals are insertable by board owner" ON public.reveals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = reveals.board_id
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Reveals are updatable by board owner" ON public.reveals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = reveals.board_id
      AND boards.user_id = auth.uid()
    )
  );

-- Leaderboards: Public read, service role write
CREATE POLICY "Leaderboards are viewable by all" ON public.leaderboards
  FOR SELECT USING (true);

CREATE POLICY "Leaderboards are writable by service role" ON public.leaderboards
  FOR ALL USING (auth.role() = 'service_role');

-- Shares: Own shares only
CREATE POLICY "Shares are viewable by owner" ON public.shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Shares are insertable by owner" ON public.shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Settings: Public read, service role write
CREATE POLICY "Settings are viewable by all" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Settings are writable by service role" ON public.settings
  FOR ALL USING (auth.role() = 'service_role');

-- Audit logs: Service role only
CREATE POLICY "Audit logs are viewable by service role" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "Audit logs are insertable by authenticated" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate board progress
CREATE OR REPLACE FUNCTION public.calculate_board_progress(board_uuid UUID)
RETURNS FLOAT AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tasks
  FROM public.tasks
  WHERE tasks.user_id = (SELECT user_id FROM public.boards WHERE id = board_uuid)
    AND tasks.period = (SELECT period FROM public.boards WHERE id = board_uuid)
    AND tasks.period_key = (SELECT period_key FROM public.boards WHERE id = board_uuid);

  IF total_tasks = 0 THEN
    RETURN 0.0;
  END IF;

  SELECT COUNT(*) INTO completed_tasks
  FROM public.tasks
  WHERE tasks.user_id = (SELECT user_id FROM public.boards WHERE id = board_uuid)
    AND tasks.period = (SELECT period FROM public.boards WHERE id = board_uuid)
    AND tasks.period_key = (SELECT period_key FROM public.boards WHERE id = board_uuid)
    AND tasks.completed = true;

  RETURN completed_tasks::FLOAT / total_tasks::FLOAT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak on board completion
CREATE OR REPLACE FUNCTION public.update_streak_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  last_completion TIMESTAMPTZ;
  days_diff INTEGER;
  profile_rec RECORD;
BEGIN
  -- Only process when board is being marked as complete
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at != NEW.completed_at) THEN
    -- Get profile info
    SELECT * INTO profile_rec FROM public.profiles WHERE user_id = NEW.user_id;

    IF profile_rec.last_completed_at IS NULL THEN
      -- First completion ever
      UPDATE public.profiles
      SET streak_count = 1, last_completed_at = NEW.completed_at
      WHERE user_id = NEW.user_id;
    ELSE
      -- Calculate days difference
      days_diff := EXTRACT(DAY FROM NEW.completed_at - profile_rec.last_completed_at);

      IF days_diff = 1 THEN
        -- Consecutive day
        UPDATE public.profiles
        SET streak_count = streak_count + 1, last_completed_at = NEW.completed_at
        WHERE user_id = NEW.user_id;
      ELSIF days_diff = 2 AND profile_rec.pro_tier IN ('pro', 'creator')
            AND (profile_rec.streak_insurance_used_at IS NULL
                 OR profile_rec.streak_insurance_used_at < NOW() - INTERVAL '30 days') THEN
        -- Missed one day but has streak insurance
        UPDATE public.profiles
        SET streak_count = streak_count + 1,
            last_completed_at = NEW.completed_at,
            streak_insurance_used_at = NOW()
        WHERE user_id = NEW.user_id;
      ELSIF days_diff > 1 THEN
        -- Streak broken
        UPDATE public.profiles
        SET streak_count = 1, last_completed_at = NEW.completed_at
        WHERE user_id = NEW.user_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_board_completed
  AFTER UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_streak_on_completion();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('weights', '{"high": 3, "medium": 2, "low": 1}'::jsonb),
  ('today_bias_weight', '1.2'::jsonb),
  ('shared_daily_seed_enabled', 'true'::jsonb),
  ('watermark_enabled_free', 'true'::jsonb),
  ('daily_community_seed', '"default-seed-2024"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create storage buckets (Note: This should be run separately via Supabase CLI or Dashboard)
-- Storage bucket for AI images: ai-images
-- Storage bucket for user shares: user-shares
-- Storage bucket for reveal-real captures: reveal-real
