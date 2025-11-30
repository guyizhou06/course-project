import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { apiGet } from '../api/client';

const { width } = Dimensions.get('window');

// 导入新的Health Tracker组件
// import HealthCard from '../components/HealthTracker/HealthCard'; // Temporarily disabled
import HealthScore from '../components/HealthTracker/HealthScore';
import DailyCheckIn from '../components/HealthTracker/DailyCheckIn';

type Props = NativeStackScreenProps<RootStackParamList, 'HealthTrackerDashboard'>;

interface HealthData {
  heartRate: number;
  steps: number;
  sleep: number;
  water: number;
  weight: number;
  healthScore: number;
}

export default function HealthTrackerDashboard({ navigation }: Props) {
  const { colors, themeMode, toggleTheme } = useTheme();
  const [healthData, setHealthData] = useState<HealthData>({
    heartRate: 72,
    steps: 8543,
    sleep: 7.5,
    water: 6,
    weight: 65.2,
    healthScore: 85,
  });
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  const loadHealthData = useCallback(async () => {
    try {
      // 从后端加载最新的健康数据摘要
      const summary = await apiGet('/health-logs/summary');
      if (summary) {
        setHealthData(prev => ({
          ...prev,
          heartRate: summary.heartRate?.value1 ?? prev.heartRate,
          steps: summary.steps?.value1 ?? prev.steps,
          sleep: summary.sleep?.value1 ?? prev.sleep,
          water: summary.water?.value1 ?? prev.water,
          weight: summary.weight?.value1 ?? prev.weight,
        }));
      }

      const checkedIn = await AsyncStorage.getItem('checkedIn');
      if (checkedIn) {
        const today = new Date().toDateString();
        const checkedInDate = JSON.parse(checkedIn);
        if (checkedInDate === today) {
          setHasCheckedIn(true);
        }
      }

      const storedStreak = await AsyncStorage.getItem('streak');
      if (storedStreak) {
        setStreak(parseInt(storedStreak, 10));
      }
    } catch (error) {
      console.error('Failed to load health data:', error);
    }
  }, []);

  // 屏幕加载时和每次获得焦点时都刷新数据
  useFocusEffect(
    useCallback(() => {
      loadHealthData();
    }, [loadHealthData])
  );

  useEffect(() => {
    // 3秒后隐藏欢迎信息
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckIn = async (data: any) => {
    try {
      setHasCheckedIn(true);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // 保存打卡数据
      await AsyncStorage.setItem('checkedIn', JSON.stringify(new Date().toDateString()));
      await AsyncStorage.setItem('streak', newStreak.toString());

      // 更新健康评分
      const newScore = Math.min(100, healthData.healthScore + 2);
      setHealthData(prev => ({ ...prev, healthScore: newScore }));
      await AsyncStorage.setItem('healthData', JSON.stringify({ ...healthData, healthScore: newScore }));

    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const HeartRateIcon = () => (
    <View style={styles.iconContainer}>
      <Ionicons name="heart" size={24} color={colors.textWhite} />
    </View>
  );

  const StepsIcon = () => (
    <View style={styles.iconContainer}>
      <Ionicons name="walk" size={24} color={colors.textWhite} />
    </View>
  );

  const SleepIcon = () => (
    <View style={styles.iconContainer}>
      <Ionicons name="moon" size={24} color={colors.textWhite} />
    </View>
  );

  const WaterIcon = () => (
    <View style={styles.iconContainer}>
      <Ionicons name="water" size={24} color={colors.textWhite} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* 欢迎横幅 */}
      {showWelcome && (
        <View style={styles.welcomeBanner}>
          <LinearGradient
            colors={colors.gradientHealth}
            style={styles.welcomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.welcomeText}>欢迎回来！🎉</Text>
            <Text style={styles.welcomeSubtext}>今天感觉怎么样？</Text>
          </LinearGradient>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 头部区域 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              你好 👋
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              健康仪表盘
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* 主题切换按钮 */}
            <TouchableOpacity
              style={[styles.themeButton, { backgroundColor: colors.backgroundCard }]}
              onPress={toggleTheme}
            >
              <Ionicons
                name={themeMode === 'dark' ? 'sunny' : 'moon'}
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* 通知按钮 */}
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: colors.backgroundCard }]}
              onPress={() => {/* TODO: 实现通知功能 */}}
            >
              <Ionicons name="notifications" size={20} color={colors.text} />
              <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 每日打卡区域 */}
        <DailyCheckIn
          onCheckIn={handleCheckIn}
          hasCheckedIn={hasCheckedIn}
          streak={streak}
        />

        {/* 健康评分卡片 */}
        <View style={styles.healthScoreContainer}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.scoreTitle, { color: colors.text }]}>健康评分</Text>
            <Text style={[styles.scoreSubtitle, { color: colors.textSecondary }]}>
              基于今日数据分析
            </Text>
          </View>
          <HealthScore
            score={healthData.healthScore}
            size="large"
            subtitle="Health Score"
          />
        </View>

        {/* 健康数据网格 - 暂时使用简单卡片替代HealthCard */}
        <View style={styles.dataGrid}>
          {/* 心率卡片 */}
          <TouchableOpacity
            style={[styles.simpleCard, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('HealthLogs', { metric: 'heartRate' })}
          >
            <HeartRateIcon />
            <Text style={styles.cardTitle}>心率</Text>
            <Text style={styles.cardValue}>{healthData.heartRate}</Text>
            <Text style={styles.cardUnit}>BPM</Text>
          </TouchableOpacity>

          {/* 步数卡片 */}
          <TouchableOpacity
            style={[styles.simpleCard, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('HealthLogs', { metric: 'steps' })}
          >
            <StepsIcon />
            <Text style={styles.cardTitle}>步数</Text>
            <Text style={styles.cardValue}>{healthData.steps.toLocaleString()}</Text>
            <Text style={styles.cardUnit}>步</Text>
          </TouchableOpacity>

          {/* 睡眠卡片 */}
          <TouchableOpacity
            style={[styles.simpleCard, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('HealthLogs', { metric: 'sleep' })}
          >
            <SleepIcon />
            <Text style={styles.cardTitle}>睡眠</Text>
            <Text style={styles.cardValue}>{healthData.sleep}</Text>
            <Text style={styles.cardUnit}>小时</Text>
          </TouchableOpacity>

          {/* 饮水卡片 */}
          <TouchableOpacity
            style={[styles.simpleCard, { backgroundColor: colors.water }]}
            onPress={() => navigation.navigate('HealthLogs', { metric: 'water' })}
          >
            <WaterIcon />
            <Text style={styles.cardTitle}>饮水</Text>
            <Text style={styles.cardValue}>{healthData.water}</Text>
            <Text style={styles.cardUnit}>杯</Text>
          </TouchableOpacity>
        </View>

        {/* 体重趋势 */}
        <TouchableOpacity
          style={[styles.simpleCardLarge, { backgroundColor: colors.backgroundCard }]}
          onPress={() => navigation.navigate('HealthLogs', { metric: 'weight' })}
        >
          <Text style={styles.cardTitle}>体重记录</Text>
          <Text style={styles.cardValue}>{healthData.weight} kg</Text>
          <Text style={styles.cardSubtitle}>点击查看详细趋势</Text>
        </TouchableOpacity>

        {/* 快速操作区域 */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>快速操作</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.backgroundCard }]}
              onPress={() => navigation.navigate('Assistant')}
            >
              <Ionicons name="chatbox" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                AI助手
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.backgroundCard }]}
              onPress={() => navigation.navigate('HealthLogs')}
            >
              <Ionicons name="fitness" size={24} color={colors.secondary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                健康日志
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.backgroundCard }]}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Ionicons name="trophy" size={24} color={colors.accent} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                成就
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 健康提示 */}
        <View style={[styles.healthTip, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={20} color={colors.accent} />
            <Text style={[styles.tipTitle, { color: colors.text }]}>健康小贴士</Text>
          </View>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            记得每小时站起来活动5分钟，保持身体活力和专注力。
          </Text>
        </View>

      </ScrollView>

      {/* 底部导航栏 - 基于Health Tracker设计 */}
      <View style={[styles.bottomNav, { backgroundColor: colors.backgroundCard }]}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={colors.primary} />
          <Text style={[styles.navLabel, { color: colors.primary }]}>首页</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthLogs')}>
          <Ionicons name="calendar" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>日历</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navAddButton}>
          <View style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={28} color={colors.textWhite} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HealthLogs')}>
          <Ionicons name="bar-chart" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>统计</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>我的</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeBanner: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  welcomeGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  welcomeSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80, // 为欢迎横幅留出空间
    paddingBottom: 100, // 为底部导航留出空间
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthScoreContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  healthTip: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  navAddButton: {
    alignItems: 'center',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  // 临时简单卡片样式
  simpleCard: {
    width: (width - 48) / 2 - 12,
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleCardLarge: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardUnit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
});