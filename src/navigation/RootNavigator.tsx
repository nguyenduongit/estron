// src/navigation/RootNavigator.tsx
import React, { useState, useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { AuthNavigator } from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { Session } from '@supabase/supabase-js';
import { theme } from '../theme';
import { getUserProfile } from '../services/storage';
import { AdminNavigator } from './AdminNavigator';
import { Profile } from '../types/data';

const WEB_MAX_WIDTH = 450;

const AppLayout: React.FC<{ children: React.ReactNode; isConstrained: boolean }> = ({ children, isConstrained }) => {
  const wrapperDynamicStyle = Platform.OS === 'web' && isConstrained 
    ? styles.constrainedWrapper 
    : {};

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.appWrapper, wrapperDynamicStyle]}>
        {children}
      </View>
    </View>
  );
};

export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Luôn cập nhật session vì nó có thể chứa token mới
        setSession(session);

        // ================== LOGIC SỬA LỖI QUAN TRỌNG ==================
        // Chỉ fetch profile cho các sự kiện quan trọng, không fetch khi chỉ làm mới token.
        // TOKEN_REFRESHED là sự kiện xảy ra khi focus lại tab.

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (session?.user) {
            const userProfile = await getUserProfile(session.user.id);
            setProfile(userProfile);
          } else {
            setProfile(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        // Với sự kiện 'TOKEN_REFRESHED', chúng ta không làm gì cả.
        // Việc này ngăn `setProfile` được gọi, do đó ngăn re-render và re-mount toàn bộ navigator.
        // =============================================================

        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // useEffect vẫn chỉ chạy 1 lần

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

  if (loading) {
    return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background2 }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu người dùng...</Text>
        </View>
    );
  }

  let navigatorComponent;
  let isLayoutConstrained = true;

  if (session && session.user) {
    if (profile?.role === 'admin') {
      navigatorComponent = <AdminNavigator />;
      isLayoutConstrained = false;
    } else {
      navigatorComponent = <AppNavigator />;
    }
  } else {
    navigatorComponent = <AuthNavigator />;
  }

  return (
    <AppLayout isConstrained={isLayoutConstrained}>
      <NavigationContainer theme={navigationTheme}>
        {navigatorComponent}
      </NavigationContainer>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize['level-3'],
    },
    outerContainer: {
        flex: 1,
        height: '100%',
        ...Platform.select({
          web: {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background1,
          },
          native: {
            backgroundColor: theme.colors.background2,
          },
        }),
      },
      appWrapper: {
        backgroundColor: theme.colors.background2,
        height: '100%',
        width: '100%',
        ...Platform.select({
            web: {
                borderWidth: 1,
                borderColor: theme.colors.borderColor,
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            },
            native: {
                flex: 1,
            },
        })
      },
      constrainedWrapper: {
        ...Platform.select({
            web: {
                maxWidth: WEB_MAX_WIDTH,
            },
        })
      },
});