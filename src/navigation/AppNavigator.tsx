// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity, Platform } from 'react-native';

import ProductScreen from '../screens/InputTab/ProductScreen';
import InputScreen from '../screens/InputTab/InputScreen';
import StatisticsScreen from '../screens/StatisticsTab/StatisticsScreen';
import MenuNavigator from '../screens/MenuTab/MenuNavigator';

import { InputStackNavigatorParamList, BottomTabNavigatorParamList } from './types';
import { theme } from '../theme';

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
        options={{
          title: 'Sản Lượng Estron',
        }}
      />
      <InputTabStack.Screen
        name="InputDetails"
        component={InputScreen}
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
        name="StatisticsRoot" 
        component={StatisticsScreen}
        options={{ 
            title: 'Thống Kê Chung', // Tiêu đề này sẽ được ghi đè bởi màn hình
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
          } else if (route.name === 'MenuTab') {
            iconName = focused ? 'menu' : 'menu-outline';
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
      <Tab.Screen
        name="MenuTab"
        component={MenuNavigator}
        options={{ title: 'Menu' }}
      />
    </Tab.Navigator>
  );
}