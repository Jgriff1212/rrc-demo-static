/**
 * Global state management with Zustand
 */

import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { Profile, Period } from '@reveal/shared';

interface AppState {
  // Auth
  session: Session | null;
  profile: Profile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;

  // UI State
  selectedPeriod: Period;
  setSelectedPeriod: (period: Period) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;

  // Loading states
  isLoadingTasks: boolean;
  setIsLoadingTasks: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  session: null,
  profile: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),

  // UI State
  selectedPeriod: 'day',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  // Onboarding
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),

  // Loading states
  isLoadingTasks: false,
  setIsLoadingTasks: (loading) => set({ isLoadingTasks: loading }),
}));
