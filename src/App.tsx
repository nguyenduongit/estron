import '@expo/metro-runtime';
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useEffect } from 'react';
import RootNavigator from './navigation/RootNavigator';
import { theme } from './theme';

const WEB_MAX_WIDTH = 450;

export default function App() {
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // inject root manifest and PWA meta tags if not present
    try {
      const head = document.head;
      if (!head.querySelector('link[rel="manifest"][href="/manifest.webmanifest"]')) {
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = '/manifest.webmanifest';
        head.appendChild(link);
      }

      if (!head.querySelector('link[rel="apple-touch-icon"]')) {
        const appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.sizes = '180x180';
        appleIcon.href = '/apple-touch-icon.png';
        head.appendChild(appleIcon);
      }

      if (!head.querySelector('link[rel="mask-icon"]')) {
        const maskIcon = document.createElement('link');
        maskIcon.rel = 'mask-icon';
        maskIcon.href = '/icons/maskable-icon-512.png';
        maskIcon.color = '#0a84ff';
        head.appendChild(maskIcon);
      }

      if (!head.querySelector('meta[name="theme-color"][content="#0a84ff"]')) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#0a84ff';
        head.appendChild(meta);
      }

      if (!head.querySelector('meta[name="mobile-web-app-capable"][content="yes"]')) {
        const meta = document.createElement('meta');
        meta.name = 'mobile-web-app-capable';
        meta.content = 'yes';
        head.appendChild(meta);
      }

      if (!head.querySelector('meta[name="apple-mobile-web-app-capable"][content="yes"]')) {
        const meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-capable';
        meta.content = 'yes';
        head.appendChild(meta);
      }

      if (!head.querySelector('meta[name="apple-mobile-web-app-status-bar-style"][content="default"]')) {
        const meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-status-bar-style';
        meta.content = 'default';
        head.appendChild(meta);
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // registration failed (likely on non-https). ignore silently.
        });
      }
    } catch (e) {
      // ignore DOM errors in non-browser env
    }
  }, []);

  const webAppWrapperStyle = Platform.OS === 'web'
    ? {
        maxHeight: height,
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: 'env(safe-area-inset-top)',
      }
    : {};

  return (
    <SafeAreaProvider>
      <View style={styles.outerContainer}>
        <View style={[styles.appWrapper, webAppWrapperStyle]}>
          <RootNavigator />
          <StatusBar style="light" backgroundColor={theme.colors.primary} />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
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
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: WEB_MAX_WIDTH,
        height: '100%',
        // borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      },
      native: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.borderColor,
      },
    }),
  },
});