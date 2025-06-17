// src/navigation/RootNavigator.tsx
import React, { useState, useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme, 
} from '@react-navigation/native';
import { NavigationIndependentTree } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import { AuthNavigator } from './AuthNavigator';
import  AppNavigator  from './AppNavigator';
import { Session } from '@supabase/supabase-js';
import { theme } from '../theme'; 
import { useAuthStore } from '../stores/authStore';
import { getUserProfile } from '../services/storage';


export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const setAuthUser = useAuthStore(state => state.setAuthUser);

  useEffect(() => {
    const setupUserSession = async (currentSession: Session | null) => {
        if (currentSession?.user) {
            const { data: profile, error } = await getUserProfile(currentSession.user.id);
            if (profile) {
                // Set the single authenticated user
                setAuthUser({ profile, session: currentSession });
            } else {
                console.error("Could not fetch profile for active session:", error);
                // If profile fails, sign out to clear inconsistent state
                await supabase.auth.signOut();
                setAuthUser(null);
            }
        } else {
            // No session, ensure authUser is null
            setAuthUser(null);
        }
        setSession(currentSession);
        setLoading(false);
    };

    if (!supabase) {
      console.error('[RootNavigator.tsx] Supabase client is not initialized.');
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setupUserSession(currentSession);
    }).catch((error) => {
      console.error("Error getting session:", error);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setupUserSession(currentSession);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setAuthUser]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background2 }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const navigationTheme = {
    ...NavigationDefaultTheme,
    dark: true,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background2,
      card: theme.colors.cardBackground,
      text: theme.colors.text,
      border: theme.colors.borderColor,
      notification: theme.colors.primary,
    },
  };

  return (
    <NavigationIndependentTree>
      <NavigationContainer theme={navigationTheme}>
        {(session && session.user) ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});