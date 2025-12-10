import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '@/api/client';
import { format, subDays, parseISO, startOfWeek, endOfWeek } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

// 修复1: 使用 const 断言定义指标类型
const METRIC_TYPES = ['weight', 'heartRate', 'steps', 'sleep', 'water'] as const;
type MetricType = typeof METRIC_TYPES[number];

// 类型守卫函数
const isValidMetric = (metric: string): metric is MetricType => {
  return METRIC_TYPES.includes(metric as MetricType);
};

// 安全获取指标配置
const getMetricConfig = (metric: string) => {
  if (isValidMetric(metric)) {
    return metricConfig[metric];
  }
  return metricConfig.weight;
};

// 指标配置
const metricConfig: Record<MetricType, {
  label: string;
  unit: string;
  color: string;
  icon: any;
  chartType: 'line' | 'bar';
}> = {
  weight: {
    label: '体重',
    unit: 'kg',
    color: '#4F46E5',
    icon: 'scale-outline',
    chartType: 'line'
  },
  heartRate: {
    label: '心率',
    unit: 'bpm',
    color: '#DC2626',
    icon: 'heart-outline',
    chartType: 'line'
  },
  steps: {
    label: '步数',
    unit: '步',
    color: '#10B981',
    icon: 'walk-outline',
    chartType: 'bar'
  },
  sleep: {
    label: '睡眠',
    unit: '小时',
    color: '#8B5CF6',
    icon: 'moon-outline',
    chartType: 'line'
  },
  water: {
    label: '饮水',
    unit: '杯',
    color: '#0EA5E9',
    icon: 'water-outline',
    chartType: 'bar'
  },
};

export default function StatisticsScreen() {
  // 修复2: 使用 any 类型避免导航类型错误
  const navigation = useNavigation<any>();
  
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Record<MetricType, any>>({
    weight: { current: null, avg: null, min: null, max: null, trend: 'none', change: 0 },
    heartRate: { current: null, avg: null, min: null, max: null, trend: 'none', change: 0 },
    steps: { current: null, avg: null, min: null, max: null, trend: 'none', change: 0 },
    sleep: { current: null, avg: null, min: null, max: null, trend: 'none', change: 0 },
    water: { current: null, avg: null, min: null, max: null, trend: 'none', change: 0 }
  });

  // 修复3: 获取当前指标的安全配置
  const currentMetricConfig = getMetricConfig(selectedMetric);

  // 安全设置选中的指标
  const handleSelectMetric = (metric: string) => {
    if (isValidMetric(metric)) {
      setSelectedMetric(metric);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const data = await apiGet('/health-logs/');
      setRecords(data);
      calculateStats(data);
    } catch (error) {
      console.error('加载数据失败:', error);
      Alert.alert('错误', '加载健康数据失败');
    }
  }, []);

  const calculateStats = (data: any[]) => {
    const newStats = { ...stats };
    
    METRIC_TYPES.forEach(metric => {
      const metricRecords = data.filter(r => r.metric_type === metric);
      
      if (metricRecords.length > 0) {
        const values = metricRecords.map(r => r.value1);
        const current = metricRecords[metricRecords.length - 1]?.value1 || null;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        let trend: 'up' | 'down' | 'stable' | 'none' = 'none';
        let change = 0;
        
        if (metricRecords.length >= 2) {
          const first = metricRecords[0].value1;
          const last = metricRecords[metricRecords.length - 1].value1;
          change = last - first;
          let threshold: number;
        switch (metric) {
          case 'weight':
            threshold = 0.5; // 体重变化0.5kg以上才认为有趋势
            break;
          case 'heartRate':
            threshold = 5; // 心率变化5bpm以上
            break;
          case 'steps':
            threshold = 500; // 步数变化500步以上
            break;
          case 'sleep':
            threshold = 0.5; // 睡眠时间变化0.5小时以上
            break;
          case 'water':
            threshold = 1; // 饮水量变化1杯以上
            break;
          default:
            threshold = 0; // 其他指标
        }
          
          if (change > threshold) trend = 'up';
          else if (change < -threshold) trend = 'down';
          else trend = 'stable';
        }
        
        newStats[metric] = {
          current,
          avg: parseFloat(avg.toFixed(1)),
          min: parseFloat(min.toFixed(1)),
          max: parseFloat(max.toFixed(1)),
          trend,
          change: parseFloat(change.toFixed(1))
        };
      }
    });
    
    setStats(newStats);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const getSelectedDateRecords = () => {
    return records.filter(r => {
      if (!r.logged_at) return false;
      const recordDate = format(parseISO(r.logged_at), 'yyyy-MM-dd');
      return recordDate === selectedDate;
    });
  };

  // 修复4: 在 getChartData 中使用 currentMetricConfig
  const getChartData = useCallback(() => {
    let daysToShow = 7;
    if (timeRange === 'month') daysToShow = 30;
    if (timeRange === 'year') daysToShow = 365;

    const startDate = subDays(new Date(), daysToShow);
    const selectedRecords = records
      .filter(r => {
        if (!r.logged_at) return false;
        const recordDate = parseISO(r.logged_at);
        return recordDate >= startDate && r.metric_type === selectedMetric;
      })
      .sort((a, b) => parseISO(a.logged_at).getTime() - parseISO(b.logged_at).getTime());

    const groupedData: { [key: string]: { sum: number; count: number } } = {};
    selectedRecords.forEach(record => {
      const dateKey = format(parseISO(record.logged_at), 'MM/dd');
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { sum: 0, count: 0 };
      }
      groupedData[dateKey].sum += record.value1;
      groupedData[dateKey].count++;
    });

    const dates = Object.keys(groupedData).sort();
    const values = dates.map(date => 
      groupedData[date].sum / groupedData[date].count
    );

    if (dates.length === 0) {
      return {
        labels: ['暂无数据'],
        datasets: [{ data: [0] }]
      };
    }

    return {
      labels: dates,
      datasets: [{
        data: values,
        color: (opacity = 1) => currentMetricConfig.color,
        strokeWidth: 2
      }]
    };
  }, [records, selectedMetric, timeRange, currentMetricConfig]);

  const getWeekComparison = () => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today);
    const endOfCurrentWeek = endOfWeek(today);
    const startOfLastWeek = startOfWeek(subDays(today, 7));
    const endOfLastWeek = endOfWeek(subDays(today, 7));

    const currentWeekRecords = records.filter(r => {
      if (!r.logged_at) return false;
      const date = parseISO(r.logged_at);
      return date >= startOfCurrentWeek && date <= endOfCurrentWeek && r.metric_type === selectedMetric;
    });

    const lastWeekRecords = records.filter(r => {
      if (!r.logged_at) return false;
      const date = parseISO(r.logged_at);
      return date >= startOfLastWeek && date <= endOfLastWeek && r.metric_type === selectedMetric;
    });

    const currentWeekAvg = currentWeekRecords.length > 0
      ? currentWeekRecords.reduce((sum, r) => sum + r.value1, 0) / currentWeekRecords.length
      : 0;

    const lastWeekAvg = lastWeekRecords.length > 0
      ? lastWeekRecords.reduce((sum, r) => sum + r.value1, 0) / lastWeekRecords.length
      : 0;

    return {
      currentWeekAvg: parseFloat(currentWeekAvg.toFixed(1)),
      lastWeekAvg: parseFloat(lastWeekAvg.toFixed(1)),
      change: parseFloat((currentWeekAvg - lastWeekAvg).toFixed(1))
    };
  };

  // 修复5: 修改 renderMetricCard 函数参数为 MetricType
  const renderMetricCard = (metric: MetricType) => {
    const config = metricConfig[metric];
    const data = stats[metric];
    
    return (
      <TouchableOpacity
        key={metric}
        style={[styles.metricCard, { borderLeftColor: config.color }]}
        onPress={() => setSelectedMetric(metric)}
      >
        <View style={styles.metricHeader}>
          <View style={styles.metricTitle}>
            <Ionicons name={config.icon} size={20} color={config.color} />
            <Text style={styles.metricLabel}>{config.label}</Text>
          </View>
          <Text style={styles.metricUnit}>{config.unit}</Text>
        </View>
        
        {data?.current !== null ? (
          <View style={styles.metricValueContainer}>
            <Text style={styles.metricValue}>
              {data.current.toFixed(metric === 'weight' || metric === 'sleep' ? 1 : 0)} {config.unit}
            </Text>
          </View>
        ) : (
          <Text style={styles.metricEmpty}>暂无数据</Text>
        )}
        
        {data?.avg !== null && (
          <View style={styles.metricStats}>
            <Text style={styles.metricStat}>
              平均: {data.avg} {config.unit}
            </Text>
            {data.trend !== 'none' && (
              <View style={[
                styles.trendBadge, 
                { backgroundColor: data.trend === 'up' ? '#EF4444' : data.trend === 'down' ? '#10B981' : '#F59E0B' }
              ]}>
                <Ionicons 
                  name={data.trend === 'up' ? 'trending-up-outline' : data.trend === 'down' ? 'trending-down-outline' : 'remove-outline'} 
                  size={12} 
                  color="#fff" 
                />
                <Text style={styles.trendText}>
                  {data.trend === 'up' ? '上升' : data.trend === 'down' ? '下降' : '稳定'}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    records.forEach(record => {
      if (!record.logged_at) return;
      const dateKey = format(parseISO(record.logged_at), 'yyyy-MM-dd');
      if (!marked[dateKey]) {
        marked[dateKey] = { marked: true, dotColor: metricConfig[record.metric_type as MetricType]?.color || '#4F46E5' };
      }
    });
    
    marked[selectedDate] = { 
      selected: true, 
      selectedColor: '#4F46E5',
      ...marked[selectedDate] 
    };
    
    return marked;
  };

  const weekComparison = getWeekComparison();

  const renderChart = () => {
    const chartData = getChartData();
    
    if (records.filter(r => r.metric_type === selectedMetric).length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="stats-chart" size={60} color="#D1D5DB" />
          <Text style={styles.noDataText}>暂无数据</Text>
          <Text style={styles.noDataSubtext}>请先记录一些{currentMetricConfig.label}数据</Text>
        </View>
      );
    }
    
    if (currentMetricConfig.chartType === 'line') {
      return (
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 1,
            color: (opacity = 1) => currentMetricConfig.color,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: currentMetricConfig.color
            }
          }}
          bezier
          style={styles.chart}
        />
      );
    } else {
      return (
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 0,
            color: (opacity = 1) => currentMetricConfig.color,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          style={styles.chart}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>健康分析</Text>
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={() => navigation.navigate('HealthLogs')}
          >
            <Ionicons name="add-circle" size={20} color="#4F46E5" />
            <Text style={styles.recordButtonText}>去记录</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeRangeContainer}>
          {(['week', 'month', 'year'] as const).map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive
              ]}>
                {range === 'week' ? '周' : range === 'month' ? '月' : '年'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={getMarkedDates()}
          theme={{
            selectedDayBackgroundColor: '#4F46E5',
            todayTextColor: '#4F46E5',
            arrowColor: '#4F46E5',
            monthTextColor: '#1F2937',
            textMonthFontWeight: '600',
          }}
          style={styles.calendar}
        />

        <View style={styles.dateSummary}>
          <Text style={styles.dateSummaryTitle}>
            {format(parseISO(selectedDate), 'yyyy年MM月dd日')} 数据
          </Text>
          {getSelectedDateRecords().length > 0 ? (
            <View style={styles.dateSummaryGrid}>
              {getSelectedDateRecords().map(record => (
                <View key={record.id} style={styles.dateSummaryItem}>
                  <Text style={styles.dateSummaryLabel}>
                    {metricConfig[record.metric_type as MetricType]?.label || record.metric_type}
                  </Text>
                  <Text style={styles.dateSummaryValue}>
                    {record.value1} {record.unit}
                  </Text>
                  <Text style={styles.dateSummaryTime}>
                    {format(parseISO(record.logged_at), 'HH:mm')}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noDateData}>
              <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
              <Text style={styles.noDateDataText}>该日无记录数据</Text>
              <Text style={styles.noDateDataSubtext}>点击日期查看其他日期的数据</Text>
            </View>
          )}
        </View>

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>本周 vs 上周</Text>
          <View style={styles.comparisonContent}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>本周平均</Text>
              <Text style={styles.comparisonValue}>
                {weekComparison.currentWeekAvg || '--'} {currentMetricConfig.unit}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>上周平均</Text>
              <Text style={styles.comparisonValue}>
                {weekComparison.lastWeekAvg || '--'} {currentMetricConfig.unit}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>变化</Text>
              <Text style={[
                styles.comparisonChange,
                { color: weekComparison.change > 0 ? '#EF4444' : weekComparison.change < 0 ? '#10B981' : '#6B7280' }
              ]}>
                {weekComparison.change > 0 ? '+' : ''}{weekComparison.change || 0} {currentMetricConfig.unit}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {currentMetricConfig.label} 趋势 ({timeRange === 'week' ? '周' : timeRange === 'month' ? '月' : '年'})
            </Text>
          </View>
          
          <View style={styles.metricTabs}>
            {METRIC_TYPES.map(metric => {
              const config = metricConfig[metric];
              return (
                <TouchableOpacity
                  key={metric}
                  style={[
                    styles.metricTab,
                    selectedMetric === metric && { backgroundColor: config.color }
                  ]}
                  onPress={() => handleSelectMetric(metric)}
                >
                  <Ionicons 
                    name={config.icon} 
                    size={16} 
                    color={selectedMetric === metric ? '#FFFFFF' : config.color} 
                  />
                  <Text style={[
                    styles.metricTabText,
                    selectedMetric === metric && styles.metricTabTextActive
                  ]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {renderChart()}
        </View>

        <Text style={styles.sectionTitle}>健康指标概览</Text>
        <View style={styles.metricsGrid}>
          {METRIC_TYPES.map(metric => renderMetricCard(metric))}
        </View>

        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
            <Text style={styles.insightsTitle}>数据分析建议</Text>
          </View>
          <View style={styles.insightsContent}>
            {stats[selectedMetric]?.trend !== 'none' && (
              <Text style={styles.insightText}>
                • {currentMetricConfig.label}趋势{stats[selectedMetric].trend === 'up' ? '上升' : stats[selectedMetric].trend === 'down' ? '下降' : '稳定'}
              </Text>
            )}
            {stats[selectedMetric]?.avg !== null && (
              <Text style={styles.insightText}>
                • 平均{currentMetricConfig.label}: {stats[selectedMetric].avg} {currentMetricConfig.unit}
              </Text>
            )}
            <Text style={styles.insightText}>
              • 保持规律记录以获得更准确的分析
            </Text>
            <Text style={styles.insightText}>
              • 点击"去记录"按钮添加新的健康数据
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  timeRangeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  timeRangeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  calendar: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateSummary: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dateSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dateSummaryItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  dateSummaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateSummaryTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  noDateData: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noDateDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  noDateDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  comparisonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  comparisonChange: {
    fontSize: 20,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  metricTabText: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricTabTextActive: {
    color: '#FFFFFF',
  },
  chart: {
    borderRadius: 12,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  metricsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricUnit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metricValueContainer: {
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricEmpty: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  metricStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  insightsContent: {
    gap: 6,
  },
  insightText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});