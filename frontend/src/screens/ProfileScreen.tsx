import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '@/api/client';
import { RootStackParamList } from 'App';
import { useTheme } from '@/contexts/ThemeContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface User {
  id: number;
  email: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, themeMode, toggleTheme, isDark } = useTheme();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiGet('/me');
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "退出登录",
      "您确定要退出登录吗？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.replace('Login');
          },
          style: "destructive"
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>我的</Text>
      </View>

      {/* 用户信息卡片 */}
      <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.email?.[0].toUpperCase() ?? 'U'}</Text>
        </View>
        <Text style={[styles.email, { color: colors.text }]}>{user?.email ?? '加载中...'}</Text>
        <Text style={[styles.memberText, { color: colors.primary }]}>高级会员</Text>
      </View>

      {/* 设置列表 */}
      <View style={[styles.card, { backgroundColor: colors.backgroundCard, marginTop: 24 }]}>
        <View style={styles.settingRow}>
          <Ionicons name="moon-outline" size={22} color={colors.textSecondary} style={styles.icon} />
          <Text style={[styles.settingText, { color: colors.text }]}>夜间模式</Text>
          <Switch
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
            onValueChange={toggleTheme}
            value={isDark}
          />
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} style={styles.icon} />
          <Text style={[styles.settingText, { color: colors.text }]}>通知设置</Text>
          <Ionicons name="chevron-forward-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} style={styles.icon} />
          <Text style={[styles.settingText, { color: colors.text }]}>账户与安全</Text>
          <Ionicons name="chevron-forward-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* 退出登录按钮 */}
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: colors.backgroundCard }]} 
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={[styles.logoutButtonText, { color: colors.error }]}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  memberText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  icon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB', // Should use theme color
    marginVertical: 4,
  },
  logoutButton: {
    margin: 24,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
