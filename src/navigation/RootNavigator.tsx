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

export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.error('[RootNavigator.tsx] Supabase client is not initialized.');
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    }).catch((error) => {
      console.error("Error getting session:", error);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        if (_event === 'INITIAL_SESSION') {
            setLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

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
        {session && session.user ? <AppNavigator /> : <AuthNavigator />}
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