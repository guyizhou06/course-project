import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import GradientBackground from '@/components/GradientBackground';
import HealthCard from '@/components/HealthCard';
import HealthChart from '@/components/HealthChart';
import HealthCheckIn from '@/components/HealthCheckIn';
import AchievementBadge from '@/components/AchievementBadge';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import FamilyHealthCare from '@/components/FamilyHealthCare';
import { achievementManager } from '@/utils/achievements';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const [weightData, setWeightData] = useState<any[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 模拟数据加载
      const mockWeightData = [
        { date: '2024-01-01', value: 75 },
        { date: '2024-01-08', value: 74.5 },
        { date: '2024-01-15', value: 74.2 },
        { date: '2024-01-22', value: 73.8 },
        { date: '2024-01-29', value: 73.5 },
      ];
      setWeightData(mockWeightData);

      // 更新成就进度
      await achievementManager.updateWeightRecordProgress(mockWeightData, 70);

      // 获取成就数据
      const achievements = achievementManager.getUnlockedAchievements().slice(0, 3);
      setRecentAchievements(achievements);

      const stats = achievementManager.getAchievementStats();
      setStreak(Math.floor(stats.unlocked / 2)); // 模拟连续打卡天数

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleCheckIn = async (data: any) => {
    try {
      // 保存打卡数据
      setTodayCheckIn(data);

      // 更新体重数据
      if (data.weight) {
        const newData = {
          date: new Date().toISOString().split('T')[0],
          value: data.weight
        };
        setWeightData(prev => [...prev, newData]);

        // 更新成就
        await achievementManager.updateWeightRecordProgress([...weightData, newData], 70);

        // 刷新成就显示
        const achievements = achievementManager.getUnlockedAchievements().slice(0, 3);
        setRecentAchievements(achievements);
      }

      setStreak(prev => prev + 1);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  const goToTestBackground = () => {
    // TODO: Fix navigation - TestBackground disabled
    // navigation.navigate('TestBackground');
  };

  return (
    <GradientBackground>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>你好 👋</Text>
          <Text style={styles.title}>健康仪表盘</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>退出</Text>
        </TouchableOpacity>
      </View>

      {/* 健康打卡区域 */}
      <HealthCheckIn
        onCheckIn={handleCheckIn}
        todayData={todayCheckIn}
        streak={streak}
      />

      {/* 体重趋势图表 */}
      {weightData.length > 0 && (
        <HealthChart
          data={weightData}
          type="weight"
          height={200}
          targetValue={70}
          color="#10B981"
        />
      )}

      {/* 最新成就展示 */}
      {recentAchievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>🏆 最新成就</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
            {recentAchievements.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                badge={achievement}
                size="medium"
                onPress={(badge) => {
                  navigation.navigate('Achievements');
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* 个性化推荐 */}
      <PersonalizedRecommendations
        healthData={{
          currentWeight: weightData.length > 0 ? weightData[weightData.length - 1].value : undefined,
          targetWeight: 70,
          weightRecords: weightData.map(d => ({ date: d.date, weight: d.value })),
          steps: todayCheckIn?.steps || 8000,
          sleep: todayCheckIn?.sleep || 7,
          mood: todayCheckIn?.mood || 4,
          lastCheckIn: todayCheckIn ? new Date().toISOString() : undefined,
        }}
        onActionPress={(recommendation) => {
          if (recommendation.id === 'check_in') {
            // 滚动到打卡区域
            // 这里可以添加滚动逻辑
          }
        }}
      />

      {/* 家庭成员健康关注 */}
      <FamilyHealthCare
        currentUser="current_user_id"
        onMemberPress={(member) => {
          Alert.alert('成员详情', `查看${member.name}的详细健康数据`);
        }}
        onSendMessage={(memberId, message) => {
          Alert.alert('提醒已发送', `消息：${message}`);
        }}
      />

      {/* 健康提示轮播 */}
      <View style={styles.healthTipsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
          <View style={styles.tipCard}>
            <Image
              source={{ uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/51e6fb961a294259be6dee3da41f6104.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763237036&Signature=txb8A83yNO5onK7TOxcdaYPuUr8%3D' }}
              style={styles.tipImage}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>智能健康监测</Text>
              <Text style={styles.tipText}>全面掌握您的健康数据趋势</Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Image
              source={{ uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/1f687cb9116622567e69a7c318098c85.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763237393&Signature=HtbmvJMuqE/WZzUI1bcEU6CGZSc%3D' }}
              style={styles.tipImage}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>健康生活方式</Text>
              <Text style={styles.tipText}>科学饮食，均衡营养每一天</Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Image
              source={{ uri: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/33622150ed264bc312c1df46d082ed36.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763237393&Signature=Zwjfa2rE7mNWQwEkeJxDaIme0Yk%3D' }}
              style={styles.tipImage}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>专业医疗咨询</Text>
              <Text style={styles.tipText}>AI智能助手为您提供健康建议</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>今日概览</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8,432</Text>
            <Text style={styles.statLabel}>步数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>7.5h</Text>
            <Text style={styles.statLabel}>睡眠</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>65kg</Text>
            <Text style={styles.statLabel}>体重</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsGrid}>
        <HealthCard
          title="健康助手"
          subtitle="AI 智能问答"
          iconType="assistant"
          variant="primary"
          onPress={() => navigation.navigate('Assistant')}
        />
        <HealthCard
          title="体重日志"
          subtitle="记录与管理"
          iconType="weight"
          variant="secondary"
          onPress={() => navigation.navigate('HealthLogs')}
        />
      </View>

      <View style={styles.actionsGrid}>
        <HealthCard
          title="运动追踪"
          subtitle="日常活动记录"
          iconType="activity"
          variant="tertiary"
          onPress={() => {/* TODO: 导航到运动页面 */}}
        />
        <HealthCard
          title="睡眠分析"
          subtitle="睡眠质量监测"
          iconType="sleep"
          variant="tertiary"
          onPress={() => {/* TODO: 导航到睡眠页面 */}}
        />
        <HealthCard
          title="健康商城"
          subtitle="购买健康产品"
          iconType="store"
          variant="tertiary"
          onPress={() => navigation.navigate('Store')}
        />
      </View>

      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>健康趋势</Text>
          <Text style={styles.trendBadge}>即将推出</Text>
        </View>
        <Text style={styles.trendSubtitle}>体重变化曲线图将在此展示</Text>
      </View>

      {/* 🌟 现代化界面重构 */}
      <HealthCard
        title="🎨 现代化界面"
        subtitle="专业级Web3风格设计"
        iconType="assistant"
        variant="primary"
        onPress={() => {/* TODO: Fix navigation - ModernDashboard disabled */}}
      />

      {/* 新组件测试入口 */}
      <HealthCard
        title="🎨 组件测试"
        subtitle="测试所有新的UI组件"
        iconType="activity"
        variant="tertiary"
        onPress={() => {/* TODO: Fix navigation - ComponentTest disabled */}}
      />
      <HealthCard
        title="📊 健康日志 V2"
        subtitle="查看美化版健康日志页面"
        iconType="weight"
        variant="primary"
        onPress={() => {/* TODO: Fix navigation - HealthLogsV2 disabled */}}
      />
      <HealthCard
        title="🤖 AI助手 V2"
        subtitle="查看现代化聊天界面"
        iconType="assistant"
        variant="secondary"
        onPress={() => {/* TODO: Fix navigation - AssistantV2Test disabled */}}
      />

      {/* 功能按钮区域 */}
      <View style={styles.featureButtonsSection}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={goToTestBackground}
          activeOpacity={0.8}
        >
          <Text style={styles.testButtonText}>🎨 测试渐变背景</Text>
          <Text style={styles.testButtonSubtitle}>查看流动渐变背景效果</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.galleryButton]}
          onPress={() => {/* TODO: Fix navigation - ImageGallery disabled */}}
          activeOpacity={0.8}
        >
          <Text style={styles.testButtonText}>🖼️ 健康图片库</Text>
          <Text style={styles.testButtonSubtitle}>浏览健康主题图片</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  // 半透明允许渐变背景渗透
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(249,250,251,0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#111827',
    letterSpacing: -0.5,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  healthTipsSection: {
    marginBottom: 20,
  },
  tipsScroll: {
    paddingHorizontal: 24,
  },
  tipCard: {
    width: 280,
    height: 120,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipImage: {
    width: '100%',
    height: 80,
  },
  tipContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  trendBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  featureButtonsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  testButton: {
    backgroundColor: '#8B5CF6',
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  galleryButton: {
    backgroundColor: '#10B981',
    marginBottom: 0,
  },
  testButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  testButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  achievementsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 24,
  },
  achievementsScroll: {
    paddingHorizontal: 24,
  },
});
