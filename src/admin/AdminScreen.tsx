// src/admin/AdminScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../theme';
import Ionicons from '@expo/vector-icons/Ionicons';

import Sidebar from './Sidebar';
import UserManagement from './UserManagement';

// Component MobileAdminView không thay đổi
const MobileAdminView = () => (
  <View style={styles.mobileContainer}>
    <Ionicons name="warning-outline" size={60} color={theme.colors.warning} />
    <Text style={styles.mobileTitle}>Chức năng này không được hỗ trợ</Text>
    <Text style={styles.mobileSubtitle}>
      Nếu bạn là Admin, hãy đăng nhập trên máy tính để sử dụng các công cụ quản trị!
    </Text>
  </View>
);

const DesktopAdminView = () => {
    const [activeScreen, setActiveScreen] = useState('user-management');

    return (
        <View style={styles.desktopContainer}>
            <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
            <View style={styles.mainContent}>
                {/* Màn hình Quản lý nhân viên */}
                <View style={activeScreen === 'user-management' ? styles.visibleScreen : styles.hiddenScreen}>
                    <UserManagement />
                </View>

                <View style={activeScreen === 'dashboard' ? styles.visibleScreen : styles.hiddenScreen}>
                    <View style={styles.placeholderContent}>
                        <Text style={styles.placeholderText}>Chức năng "Dashboard" chưa được triển khai.</Text>
                    </View>
                </View>
                
                <View style={activeScreen === 'quota-settings' ? styles.visibleScreen : styles.hiddenScreen}>
                    <View style={styles.placeholderContent}>
                        <Text style={styles.placeholderText}>Chức năng "Định mức sản phẩm" chưa được triển khai.</Text>
                    </View>
                </View>

                 <View style={activeScreen === 'production-management' ? styles.visibleScreen : styles.hiddenScreen}>
                    <View style={styles.placeholderContent}>
                        <Text style={styles.placeholderText}>Chức năng "Quản lý sản lượng" chưa được triển khai.</Text>
                    </View>
                </View>

                 <View style={activeScreen === 'support-info' ? styles.visibleScreen : styles.hiddenScreen}>
                    <View style={styles.placeholderContent}>
                        <Text style={styles.placeholderText}>Chức năng "Thông tin phụ trợ" chưa được triển khai.</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};


export default function AdminScreen() {
  if (Platform.OS !== 'web') {
    return <MobileAdminView />;
  }
  return <DesktopAdminView />;
}

const styles = StyleSheet.create({
  visibleScreen: {
    flex: 1,
    height: '100%',
  },
  hiddenScreen: {
    display: 'none',
  },
  // Các style còn lại giữ nguyên
  mobileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['level-6'],
    backgroundColor: theme.colors.background2,
  },
  mobileTitle: {
    fontSize: theme.typography.fontSize['level-7'],
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing['level-4'],
  },
  mobileSubtitle: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing['level-2'],
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
  },
  mainContent: {
    flex: 1,
    height: '100%',
  },
  placeholderContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
  },
  placeholderText: {
      fontSize: theme.typography.fontSize['level-5'],
      color: theme.colors.grey,
  }
});