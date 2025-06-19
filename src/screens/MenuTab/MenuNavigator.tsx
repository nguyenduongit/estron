// src/screens/MenuTab/MenuNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../../theme';
import { MenuStackNavigatorParamList } from '../../navigation/types';

// Import screens
import MenuScreen from './MenuScreen';
import SettingScreen from '../InputTab/SettingScreen'; // Path to existing SettingScreen
import LookupNormsScreen from './LookupNormsScreen';
import LookupErrorsScreen from './LookupErrorsScreen';
import GeneralSettingsScreen from './GeneralSettingsScreen';

const MenuStack = createStackNavigator<MenuStackNavigatorParamList>();

const commonStackScreenOptions = {
    headerStyle: { backgroundColor: theme.colors.primary },
    headerTintColor: theme.colors.textOnPrimary,
    headerTitleStyle: { fontWeight: 'bold' as 'bold', fontSize: theme.typography.fontSize['level-3'] },
    headerTitleAlign: 'center' as 'center',
  };

export default function MenuNavigator() {
  return (
    <MenuStack.Navigator screenOptions={commonStackScreenOptions}>
      <MenuStack.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu' }} />
      <MenuStack.Screen name="Setting" component={SettingScreen} options={{ title: 'Công đoạn chuyên môn' }} />
      <MenuStack.Screen name="LookupNorms" component={LookupNormsScreen} options={{ title: 'Tra cứu định mức' }} />
      <MenuStack.Screen name="LookupErrors" component={LookupErrorsScreen} options={{ title: 'Tra cứu mã lỗi' }} />
      <MenuStack.Screen name="GeneralSettings" component={GeneralSettingsScreen} options={{ title: 'Cài đặt' }} />
    </MenuStack.Navigator>
  );
}