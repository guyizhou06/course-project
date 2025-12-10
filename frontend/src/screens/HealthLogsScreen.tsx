import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Alert, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiGet, apiPost } from '@/api/client';
import GradientBackground from '@/components/GradientBackground';
import { RootStackParamList } from 'App';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

type Log = {
  id: number;
  metric_type: string;
  value1: number;
  unit: string;
  logged_at?: string;
};

type HealthLogsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HealthLogs'>;
type HealthLogsScreenRouteProp = RouteProp<RootStackParamList, 'HealthLogs'>;

const metricConfigMap: { [key: string]: { 
  title: string; 
  placeholder: string; 
  unit: string; 
  icon: any; 
  color: string;
  label: string;
  quickValues?: number[];
} } = {
  weight: { 
    title: '体重记录', 
    placeholder: '输入体重', 
    unit: 'kg', 
    icon: 'scale-outline',
    color: '#4F46E5',
    label: '体重',
    quickValues: [65, 66, 67, 68, 69, 70]
  },
  heartRate: { 
    title: '心率记录', 
    placeholder: '输入心率', 
    unit: 'bpm', 
    icon: 'heart-outline',
    color: '#DC2626',
    label: '心率',
    quickValues: [70, 75, 80, 85, 90, 95]
  },
  steps: { 
    title: '步数记录', 
    placeholder: '输入步数', 
    unit: '步', 
    icon: 'walk-outline',
    color: '#10B981',
    label: '步数',
    quickValues: [5000, 6000, 7000, 8000, 9000, 10000]
  },
  sleep: { 
    title: '睡眠记录', 
    placeholder: '输入睡眠时长', 
    unit: '小时', 
    icon: 'moon-outline',
    color: '#8B5CF6',
    label: '睡眠',
    quickValues: [6, 6.5, 7, 7.5, 8, 8.5]
  },
  water: { 
    title: '饮水记录', 
    placeholder: '输入饮水量', 
    unit: '杯', 
    icon: 'water-outline',
    color: '#0EA5E9',
    label: '饮水',
    quickValues: [4, 5, 6, 7, 8, 9]
  },
};

export default function HealthLogsScreen() {
  const [items, setItems] = useState<Log[]>([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<HealthLogsScreenNavigationProp>();
  const route = useRoute<HealthLogsScreenRouteProp>();
  const { metric } = route.params || { metric: 'weight' };

  const currentMetricConfig = metricConfigMap[metric || 'weight'];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载特定指标的数据
      const data = await apiGet(`/health-logs/?metric_type=${metric}`);
      setItems(data);

      // 加载今日所有健康数据的摘要
      const today = format(new Date(), 'yyyy-MM-dd');
      const allData = await apiGet('/health-logs/');
      const todayData = allData.filter((item: Log) => 
        item.logged_at && item.logged_at.startsWith(today)
      );
      
      const stats: any = {};
      todayData.forEach((item: Log) => {
        stats[item.metric_type] = {
          value: item.value1,
          unit: item.unit,
          time: item.logged_at
        };
      });
      setTodayStats(stats);

    } catch (e: any) {
      Alert.alert('加载失败', e?.message || '未知错误');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [metric]);

  const addRecord = async () => {
    const v = Number(value);
    if (!v || v <= 0) {
      Alert.alert('提示', `请输入有效的${currentMetricConfig.title.replace('记录', '')}`);
      return;
    }
    setLoading(true);
    try {
      await apiPost('/health-logs/', { 
        metric_type: metric, 
        value1: v, 
        unit: currentMetricConfig.unit 
      });
      setValue('');
      await loadData();
      Alert.alert('成功', `${currentMetricConfig.label}记录已保存`);
    } catch (e: any) {
      Alert.alert('提交失败', e?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const quickAdd = async (quickValue: number) => {
    setValue(quickValue.toString());
    setLoading(true);
    try {
      await apiPost('/health-logs/', { 
        metric_type: metric, 
        value1: quickValue, 
        unit: currentMetricConfig.unit 
      });
      await loadData();
    } catch (e: any) {
      Alert.alert('提交失败', e?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* 顶部导航 */}
        <View style={styles.topNav}>
          <Text style={styles.pageTitle}>健康记录</Text>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => navigation.navigate('Statistics')}
          >
            <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
            <Text style={styles.statsButtonText}>查看统计</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* 今日健康概览 */}
          <View style={styles.todaySummary}>
            <Text style={styles.summaryTitle}>今日健康概览</Text>
            <View style={styles.summaryGrid}>
              {Object.entries(metricConfigMap).map(([key, config]) => {
                const todayData = todayStats[key];
                return (
                  <TouchableOpacity 
                    key={key}
                    style={[styles.summaryItem, { borderLeftColor: config.color }]}
                    onPress={() => navigation.setParams({ metric: key })}
                  >
                    <View style={styles.summaryHeader}>
                      <Ionicons name={config.icon as any} size={16} color={config.color} />
                      <Text style={styles.summaryLabel}>{config.label}</Text>
                    </View>
                    <Text style={styles.summaryValue}>
                      {todayData ? `${todayData.value} ${todayData.unit}` : '未记录'}
                    </Text>
                    <Text style={styles.summaryTime}>
                      {todayData ? format(new Date(todayData.time), 'HH:mm') : '点击记录'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 当前指标记录区域 */}
          <View style={styles.currentMetricSection}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIcon, { backgroundColor: currentMetricConfig.color + '20' }]}>
                <Ionicons name={currentMetricConfig.icon as any} size={24} color={currentMetricConfig.color} />
              </View>
              <View>
                <Text style={styles.metricTitle}>{currentMetricConfig.title}</Text>
                <Text style={styles.metricSubtitle}>记录您的{currentMetricConfig.label}变化</Text>
              </View>
            </View>

            {/* 快速记录按钮 */}
            {currentMetricConfig.quickValues && (
              <View style={styles.quickActions}>
                <Text style={styles.quickActionsTitle}>快捷记录</Text>
                <View style={styles.quickButtons}>
                  {currentMetricConfig.quickValues.map((quickValue) => (
                    <TouchableOpacity
                      key={quickValue}
                      style={[styles.quickButton, { backgroundColor: currentMetricConfig.color + '20' }]}
                      onPress={() => quickAdd(quickValue)}
                    >
                      <Text style={[styles.quickButtonText, { color: currentMetricConfig.color }]}>
                        {quickValue}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 手动输入 */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>手动输入</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={`${currentMetricConfig.placeholder} (${currentMetricConfig.unit})`}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={setValue}
                />
                <TouchableOpacity 
                  style={[styles.addButton, loading && styles.addButtonDisabled]} 
                  onPress={addRecord} 
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>{loading ? '...' : '记录'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 今日记录列表 */}
            <Text style={styles.listTitle}>今日记录</Text>
            {items.filter(item => {
              const today = format(new Date(), 'yyyy-MM-dd');
              return item.logged_at && item.logged_at.startsWith(today);
            }).length > 0 ? (
              <FlatList
                data={items.filter(item => {
                  const today = format(new Date(), 'yyyy-MM-dd');
                  return item.logged_at && item.logged_at.startsWith(today);
                })}
                keyExtractor={(it) => String(it.id)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <View style={[styles.cardIcon, { backgroundColor: currentMetricConfig.color + '20' }]}>
                      <Ionicons name={currentMetricConfig.icon as any} size={24} color={currentMetricConfig.color} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardValue}>{item.value1} <Text style={styles.cardUnit}>{item.unit}</Text></Text>
                      <Text style={styles.cardDate}>
                        {format(new Date(item.logged_at || ''), 'HH:mm')}
                      </Text>
                    </View>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyToday}>
                <Ionicons name={currentMetricConfig.icon as any} size={48} color="#D1D5DB" />
                <Text style={styles.emptyTodayText}>今日暂无记录</Text>
                <Text style={styles.emptyTodaySubtext}>使用快捷记录或手动输入添加第一条记录</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(249,250,251,0.2)',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  todaySummary: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    width: '30%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  summaryTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  currentMetricSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent:'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardValue: { 
    fontSize: 18, 
    fontWeight: '700',
    color: '#111827',
  },
  cardUnit: {
    fontSize: 14, 
    fontWeight: '600',
    color: '#6B7280',
  },
  cardDate: { 
    fontSize: 13, 
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyToday: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyTodayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyTodaySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
