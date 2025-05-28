// App.tsx
import '@expo/metro-runtime';
import 'react-native-gesture-handler'; // Quan trọng: import ở dòng đầu tiên
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, Dimensions, View, StyleSheet, ViewStyle } from 'react-native'; // Thêm ViewStyle
import RootNavigator from './navigation/RootNavigator'; // Đường dẫn đúng
import { theme } from './theme'; // Import theme

export default function App() {
  const [appWidth, setAppWidth] = useState<number | string>('100%');

  useEffect(() => {
    const updateLayout = () => {
      if (Platform.OS === 'web') {
        const screenHeight = Dimensions.get('window').height;
        // Giữ nguyên logic tính toán chiều rộng cho web nếu cần,
        // hoặc điều chỉnh nếu logic này phụ thuộc vào theme cũ.
        // Hiện tại, nó không trực tiếp dùng theme cho tính toán này.
        setAppWidth(screenHeight / 2);
      } else {
        setAppWidth('100%');
      }
    };

    updateLayout(); // Set initial layout

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => {
      subscription?.remove();
    };
  }, []);

  // Định nghĩa kiểu rõ ràng cho webSpecificContainerStyle
  const webSpecificContainerStyle: ViewStyle = Platform.OS === 'web' ? {
    width: appWidth as number, // Ép kiểu appWidth sang number vì trên web ta tính toán nó là số
    marginHorizontal: 'auto',
    // height: '100%', // ĐÃ LOẠI BỎ
    overflow: 'hidden',
    // Cân nhắc thêm màu nền ở đây nếu muốn vùng app container có màu khác biệt
    // với safeAreaProvider trên web, ví dụ: backgroundColor: theme.colors.background1
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
    // Cập nhật màu nền theo theme mới
    // Sử dụng background2 làm màu nền chính cho cả web và native theo mô tả theme
    backgroundColor: theme.colors.background2,
  },
  appContainer: {
    flex: 1,
    // Nếu webSpecificContainerStyle không đặt màu nền, appContainer sẽ kế thừa từ safeAreaProvider.
    // Nếu muốn appContainer có màu nền khác, ví dụ một card nổi trên nền web,
    // thì có thể thêm vào webSpecificContainerStyle hoặc ở đây cho trường hợp native.
    // Ví dụ: backgroundColor: Platform.OS === 'web' ? theme.colors.background1 : theme.colors.background2,
  },
});