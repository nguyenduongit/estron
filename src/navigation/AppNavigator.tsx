// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity, Platform } from 'react-native';

import ProductScreen from '../screens/InputTab/ProductScreen';
import InputScreen from '../screens/InputTab/InputScreen';
import SettingScreen from '../screens/InputTab/SettingScreen';
import StatisticsScreen from '../screens/StatisticsTab/StatisticsScreen';

import { InputStackNavigatorParamList, BottomTabNavigatorParamList } from './types';
import { theme } from '../theme';
import { useAuthStore } from '../stores/authStore';

const InputTabStack = createStackNavigator<InputStackNavigatorParamList>();
const StatisticsTabStack = createStackNavigator(); 
const Tab = createBottomTabNavigator<BottomTabNavigatorParamList>();

const commonStackScreenOptions = {
  headerStyle: { backgroundColor: theme.colors.primary }, 
  headerTintColor: theme.colors.textOnPrimary, 
  headerTitleStyle: { fontWeight: 'bold' as 'bold', fontSize: theme.typography.fontSize['level-3'] }, 
  headerTitleAlign: 'center' as 'center',
};

function InputStack() {
  return (
    <InputTabStack.Navigator
      initialRouteName="ProductList"
      screenOptions={commonStackScreenOptions}
    >
      <InputTabStack.Screen
        name="ProductList"
        component={ProductScreen}
        options={({ navigation }: { navigation: StackNavigationProp<InputStackNavigatorParamList, 'ProductList'> }) => ({
          title: 'Sản Lượng Estron',
          headerRight: () => (
            // Only show settings icon on the Input tab
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{
                marginRight: Platform.OS === 'ios' ? theme.spacing['level-2'] : theme.spacing['level-4'], 
                padding: theme.spacing['level-1'], 
              }}
            >
              <Ionicons name="settings-outline" size={24} color={theme.colors.textOnPrimary} /> 
            </TouchableOpacity>
          ),
        })}
      />
      <InputTabStack.Screen
        name="InputDetails"
        component={InputScreen}
      />
      <InputTabStack.Screen
        name="Settings"
        component={SettingScreen}
        options={{ title: 'Danh Sách Sản Phẩm' }}
      />
    </InputTabStack.Navigator>
  );
}

function StatisticsStack() {
  const { signOut } = useAuthStore();

  return (
    <StatisticsTabStack.Navigator
      screenOptions={commonStackScreenOptions}
    >
      <StatisticsTabStack.Screen
        name="StatisticsRoot" 
        component={StatisticsScreen}
        options={{ 
            title: 'Thống Kê Chung',
            // Replace user switcher with a sign out button
            headerRight: () => (
              <TouchableOpacity
                onPress={signOut}
                style={{
                  marginRight: Platform.OS === 'ios' ? theme.spacing['level-2'] : theme.spacing['level-4'],
                  padding: theme.spacing['level-1'],
                }}
              >
                <Ionicons name="log-out-outline" size={26} color={theme.colors.textOnPrimary} />
              </TouchableOpacity>
            ),
        }} 
      />
    </StatisticsTabStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'alert-circle-outline'; 

          if (route.name === 'InputTab') {
            iconName = focused ? 'create' : 'create-outline';
          } else if (route.name === 'StatisticsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary, 
        tabBarInactiveTintColor: theme.colors.textSecondary, 
        headerShown: false, 
        tabBarStyle: {
          backgroundColor: theme.colors.background2, 
          borderTopColor: theme.colors.borderColor, 
        }
      })}
    >
      <Tab.Screen
        name="InputTab"
        component={InputStack}
        options={{ title: 'Nhập liệu' }}
      />
      <Tab.Screen
        name="StatisticsTab"
        component={StatisticsStack}
        options={{ title: 'Thống kê' }}
      />
    </Tab.Navigator>
  );
}