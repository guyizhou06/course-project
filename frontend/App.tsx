import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Screens
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import HealthTrackerDashboard from '@/screens/HealthTrackerDashboard';
import HealthLogsScreen from '@/screens/HealthLogsScreen';
import AssistantScreen from '@/screens/AssistantScreen';
import AchievementsScreen from '@/screens/AchievementsScreen';
import TrendsScreen from '@/screens/TrendsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import StatisticsScreen from '@/screens/StatisticsScreen';
import { StatusBar } from 'react-native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  HealthTrackerDashboard: undefined;
  HealthLogs: { metric?: any } | undefined;
  Assistant: undefined;
  Achievements: undefined;
  Trends: undefined;
  Profile: undefined;
  Statistics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: '登录' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '注册' }} />
          <Stack.Screen name="HealthTrackerDashboard" component={HealthTrackerDashboard} options={{ title: '健康仪表盘', headerShown: false }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: '健康仪表盘', headerShown: false }} />
          <Stack.Screen name="HealthLogs" component={HealthLogsScreen} options={{ title: '健康日志' }} />
          <Stack.Screen name="Assistant" component={AssistantScreen} options={{ title: '健康助手' }} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: '健康成就' }} />
          <Stack.Screen name="Trends" component={TrendsScreen} options={{ title: '体重趋势' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
          <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: '健康统计' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
