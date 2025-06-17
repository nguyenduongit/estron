import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../src/theme';
import { supabase } from '../../src/services/supabase';

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'user-management', label: 'Quản lý nhân viên', icon: 'people-outline' },
  { key: 'quota-settings', label: 'Định mức sản phẩm', icon: 'options-outline' },
  { key: 'production-management', label: 'Quản lý sản lượng', icon: 'podium-outline' },
  { key: 'support-info', label: 'Thông tin phụ trợ', icon: 'information-circle-outline' },
];

interface SidebarProps {
  activeScreen: string;
  setActiveScreen: (screenKey: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setActiveScreen }) => {
  return (
    <View style={styles.sidebarContainer}>
      <View>
        <View style={styles.header}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo}
            />
        </View>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.menuItem, activeScreen === item.key && styles.activeMenuItem]}
            onPress={() => setActiveScreen(item.key)}
          >
            <Ionicons
              name={item.icon as any}
              size={22}
              color={activeScreen === item.key ? theme.colors.white : theme.colors.textSecondary}
              style={styles.icon}
            />
            <Text
              style={[
                styles.menuItemText,
                activeScreen === item.key && styles.activeMenuItemText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={() => supabase.auth.signOut()}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.textSecondary} style={styles.icon}/>
          <Text style={styles.menuItemText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 260,
    backgroundColor: theme.colors.background1,
    padding: theme.spacing['level-2'],
    height: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.borderColor,
  },
  logo: {
    width: 160,
    height: 80,
    resizeMode: 'contain',
  },
  headerText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize['level-7'],
    fontWeight: 'bold',
    marginLeft: theme.spacing['level-3'],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing['level-4'],
    borderRadius: theme.borderRadius['level-4'],
    marginBottom: theme.spacing['level-1'],
  },
  activeMenuItem: {
    backgroundColor: theme.colors.primary,
  },
  icon: {
    marginRight: theme.spacing['level-4'],
  },
  menuItemText: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  activeMenuItemText: {
    color: theme.colors.white,
  },
  logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing['level-4'],
      borderRadius: theme.borderRadius['level-4'],
      marginBottom: theme.spacing['level-3']
  }
});

export default Sidebar;