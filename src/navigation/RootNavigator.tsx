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

  // Tùy chỉnh theme cho NavigationContainer từ theme của bạn
  // Bỏ baseNavigationTheme vì theme đã có cấu trúc mong muốn
  const navigationTheme = {
    ...NavigationDefaultTheme, // Bắt đầu với theme mặc định của React Navigation
    dark: true, // Theme của chúng ta là dark theme
    colors: {
      ...NavigationDefaultTheme.colors, // Giữ lại các màu mặc định khác nếu cần
      primary: theme.colors.primary,
      background: theme.colors.background2, // Màu nền chính của app
      card: theme.colors.cardBackground,   // Màu nền cho card/header của navigator
      text: theme.colors.text,           // Màu chữ chính
      border: theme.colors.borderColor,    // Màu viền (ví dụ: viền header)
      notification: theme.colors.primary,  // Màu cho notification badges, etc.
    },
    // fonts không có trong theme.ts nên giữ nguyên từ NavigationDefaultTheme.fonts
    // Nếu bạn muốn tùy chỉnh font, bạn có thể định nghĩa trong theme.ts và tham chiếu ở đây.
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