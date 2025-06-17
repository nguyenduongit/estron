import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminScreen from '../admin/AdminScreen';
import { AdminStackParamList } from './types';

const Stack = createStackNavigator<AdminStackParamList>();

export const AdminNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="AdminDashboard"
      component={AdminScreen}
    />
  </Stack.Navigator>
);