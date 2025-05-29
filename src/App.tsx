// App.tsx
import '@expo/metro-runtime';
import 'react-native-gesture-handler'; 
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, Dimensions, View, StyleSheet, ViewStyle } from 'react-native'; 
import RootNavigator from './navigation/RootNavigator'; 
import { theme } from './theme'; 

export default function App() {
  const [appWidth, setAppWidth] = useState<number | string>('100%');

  useEffect(() => {
    const updateLayout = () => {
      if (Platform.OS === 'web') {
        const screenHeight = Dimensions.get('window').height;
        setAppWidth(screenHeight / 2);
      } else {
        setAppWidth('100%');
      }
    };

    updateLayout(); 

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => {
      subscription?.remove();
    };
  }, []);

  // Định nghĩa kiểu rõ ràng cho webSpecificContainerStyle
  const webSpecificContainerStyle: ViewStyle = Platform.OS === 'web' ? {
    width: appWidth as number,
    marginHorizontal: 'auto',
    overflow: 'hidden',
    
  } : {};

  return (
    <SafeAreaProvider style={styles.safeAreaProvider}>
      <View style={[styles.appContainer, webSpecificContainerStyle]}>
        <RootNavigator />
        <StatusBar style="light" backgroundColor={theme.colors.primary} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeAreaProvider: {
    flex: 1,
    backgroundColor: theme.colors.background2,
  },
  appContainer: {
    flex: 1,
  },
  
});