// src/screens/MenuTab/MenuScreen.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MenuStackNavigatorParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { theme } from '../../theme';
import Button from '../../components/common/Button';

type MenuScreenNavigationProp = StackNavigationProp<MenuStackNavigatorParamList, 'Menu'>;

const MenuItem = ({ label, screen, icon, navigation }: { label: string, screen: keyof MenuStackNavigatorParamList, icon: React.ComponentProps<typeof Ionicons>['name'], navigation: MenuScreenNavigationProp }) => (
  <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(screen)}>
    <View style={styles.menuItemIconContainer}>
      <Ionicons name={icon} size={24} color={theme.colors.textSecondary} />
    </View>
    <Text style={styles.menuItemText}>{label}</Text>
    <Ionicons name="chevron-forward-outline" size={22} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

export default function MenuScreen() {
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { signOut, authUser } = useAuthStore();

  const menuItems = [
    { name: 'Công đoạn chuyên môn', screen: 'Setting', icon: 'construct-outline' },
    { name: 'Tra cứu định mức', screen: 'LookupNorms', icon: 'search-circle-outline' },
    { name: 'Tra cứu mã lỗi', screen: 'LookupErrors', icon: 'bug-outline' },
    { name: 'Cài đặt', screen: 'GeneralSettings', icon: 'options-outline' },
  ] as const;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            {/* Thay đổi màu icon người dùng */}
            <Ionicons name="person-circle-outline" size={22} color={theme.colors.primary} style={styles.profileIcon} />
            <Text style={styles.profileName}>
              {`${authUser?.profile.full_name || 'Tên người dùng'} - ${authUser?.profile.username?.toUpperCase() || 'MÃ NV'}`}
            </Text>
          </View>
          <View style={styles.profileRow}>
            {/* Thay đổi màu icon bậc lương */}
            <Ionicons name="ribbon-outline" size={20} color={theme.colors.warning} style={styles.profileIcon} />
            <Text style={styles.profileSalary}>
              {`Bậc lương: ${authUser?.profile.salary_level || 'N/A'}`}
            </Text>
          </View>
      </View>

      <View style={styles.menuItemGroup}>
        {menuItems.map((item) => (
          <MenuItem key={item.name} label={item.name} screen={item.screen} icon={item.icon} navigation={navigation} />
        ))}
      </View>

      <View style={styles.logoutSection}>
        <Button title="Đăng xuất" onPress={signOut} variant="danger" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background1,
  },
  profileSection: {
    paddingVertical: theme.spacing['level-4'],
    paddingHorizontal: theme.spacing['level-5'],
    backgroundColor: theme.colors.background2,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    gap: theme.spacing['level-2'], 
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    marginRight: theme.spacing['level-3'],
  },
  profileName: {
    fontSize: theme.typography.fontSize['level-5'],
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  profileSalary: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  menuItemGroup: {
    marginTop: theme.spacing['level-5'],
    backgroundColor: theme.colors.background2,
    borderColor: theme.colors.borderColor,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['level-4'],
    paddingVertical: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  menuItemIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.text,
    marginLeft: theme.spacing['level-3'],
  },
  logoutSection: {
    padding: theme.spacing['level-6'],
    marginTop: theme.spacing['level-5']
  }
});