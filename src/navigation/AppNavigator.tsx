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

const InputTabStack = createStackNavigator<InputStackNavigatorParamList>();
const StatisticsTabStack = createStackNavigator(); // Không dùng generic type nếu không có param list cụ thể cho stack này
const Tab = createBottomTabNavigator<BottomTabNavigatorParamList>();

const commonStackScreenOptions = {
  headerStyle: { backgroundColor: theme.colors.primary }, // Giữ nguyên
  headerTintColor: theme.colors.textOnPrimary, // white -> textOnPrimary
  headerTitleStyle: { fontWeight: 'bold' as 'bold' }, // Giữ nguyên
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
          title: 'Sản Lượng Estron', // Có thể thay đổi dựa trên logic của ProductScreen
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{
                marginRight: Platform.OS === 'ios' ? theme.spacing['level-2'] : theme.spacing['level-4'], // sm -> level-2, md -> level-4
                padding: theme.spacing['level-1'], // xs -> level-1
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
        // options={{ title: 'Thêm Sản Lượng' }} // Title có thể được set trong InputScreen
      />
      <InputTabStack.Screen
        name="Settings"
        component={SettingScreen}
        options={{ title: 'Cài Đặt Định Mức' }}
      />
    </InputTabStack.Navigator>
  );
}

function StatisticsStack() {
  return (
    <StatisticsTabStack.Navigator
      screenOptions={commonStackScreenOptions}
    >
      <StatisticsTabStack.Screen
        name="StatisticsRoot" // Đổi tên để tránh trùng với Tab name nếu có
        component={StatisticsScreen}
        options={{ title: 'Thống Kê Chung' }} // Title có thể được set trong StatisticsScreen
      />
    </StatisticsTabStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'alert-circle-outline'; // Default icon

          if (route.name === 'InputTab') {
            iconName = focused ? 'create' : 'create-outline';
          } else if (route.name === 'StatisticsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary, // Giữ nguyên
        tabBarInactiveTintColor: theme.colors.textSecondary, // secondary -> textSecondary
        headerShown: false, // Quan trọng: các stack tự quản lý header của chúng
        tabBarStyle: {
          backgroundColor: theme.colors.background1, // white -> background1
          borderTopColor: theme.colors.borderColor, // Giữ nguyên
          // Cân nhắc thêm borderTopWidth nếu cần thiết
          // borderTopWidth: 1, 
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