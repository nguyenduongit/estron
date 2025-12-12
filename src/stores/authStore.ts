// src/stores/authStore.ts
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Profile } from '../types/data';
import { Session } from '@supabase/supabase-js';

// Interface to hold a user's profile and session
export interface AuthUser {
  profile: Profile;
  session: Session;
}

interface AuthState {
  authUser: AuthUser | null;
  // Actions
  setAuthUser: (user: AuthUser | null) => void;
  signOut: () => Promise<void>;
  // [NEW] Action cập nhật bậc lương
  updateProfileSalary: (newSalary: string) => void;
}

/**
 * NOTE: This store is a foundational implementation.
 * True multi-user account switching requires a custom storage solution
 * to manage multiple refresh tokens securely, which is beyond the scope of
 * Supabase's default AsyncStorage implementation.
 */
export const useAuthStore = create<AuthState>((set) => ({
  authUser: null,

  setAuthUser: (user) => {
    set({ authUser: user });
  },

  signOut: async () => {
    console.log('Signing out active user');
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Sign out error", error);
    }
    set({ authUser: null }); // Clear state
  },

  // [NEW] Implementation cập nhật bậc lương trong state
  updateProfileSalary: (newSalary: string) => {
    set((state) => ({
      authUser: state.authUser
        ? {
            ...state.authUser,
            profile: {
              ...state.authUser.profile,
              salary_level: newSalary,
            },
          }
        : null,
    }));
  },
}));
