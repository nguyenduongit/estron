// App.tsx
import '@expo/metro-runtime';
import 'react-native-gesture-handler'; 
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native'; 
import RootNavigator from './navigation/RootNavigator'; 
import { theme } from './theme'; 

export default function App() {
  

  return (
    <SafeAreaProvider style={styles.safeAreaProvider}>
      <View style={[styles.appContainer, ]}>
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