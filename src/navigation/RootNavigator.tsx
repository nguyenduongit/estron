// src/navigation/RootNavigator.tsx
import React, { useState, useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme, 
} from '@react-navigation/native';
import { NavigationIndependentTree } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';
import { AuthNavigator } from './AuthNavigator';
import  AppNavigator  from './AppNavigator';
import { Session } from '@supabase/supabase-js';
import { theme } from '../theme'; 
import { useAuthStore } from '../stores/authStore';
import { getUserProfile } from '../services/storage';
import { useSettingsStore } from '../stores/settingsStore'; // <<< IMPORT THÊM

const prefix = Linking.createURL('/'); 

export default function RootNavigator() {
  // state cho auth
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const setAuthUser = useAuthStore(state => state.setAuthUser);

  // state cho settings
  const hydrateSettings = useSettingsStore(state => state.hydrateSettings);
  const areSettingsHydrated = useSettingsStore(state => state.isHydrated);

  // Tải cài đặt từ AsyncStorage khi component mount
  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);
  
  // Xử lý logic xác thực người dùng
  useEffect(() => {
    const setupUserSession = async (currentSession: Session | null) => {
        if (currentSession?.user) {
            const { data: profile, error } = await getUserProfile(currentSession.user.id);
            if (profile) {
                setAuthUser({ profile, session: currentSession });
            } else {
                console.error("Could not fetch profile for active session:", error);
                await supabase.auth.signOut();
                setAuthUser(null);
            }
        } else {
            setAuthUser(null);
        }
        setSession(currentSession);
        setAuthLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setupUserSession(currentSession);
    }).catch((error) => {
      console.error("Error getting session:", error);
      setAuthLoading(false);
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

  // Màn hình chờ sẽ hiển thị cho đến khi cả auth và settings được tải xong
  if (authLoading || !areSettingsHydrated) {
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