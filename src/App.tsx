import '@expo/metro-runtime';
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import RootNavigator from './navigation/RootNavigator';
import { theme } from './theme';

const WEB_MAX_WIDTH = 450;

export default function App() {
  const { height } = useWindowDimensions();

  const webAppWrapperStyle = Platform.OS === 'web'
    ? { maxHeight: height  }
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
        borderWidth: 1,
        borderColor: theme.colors.borderColor,
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      },
      native: {
        flex: 1,
      },
    }),
  },
});