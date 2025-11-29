import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { apiGet } from '@/api/client';
import GradientBackground from '@/components/GradientBackground';

// API响应的类型定义
interface TrendPoint {
  date: string;
  avg: number;
}

interface TrendsData {
  points: TrendPoint[];
  trend?: 'up' | 'down' | 'stable';
  weekly_change?: number;
  unit?: string;
}

const screenWidth = Dimensions.get('window').width;

export default function TrendsScreen() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        setError(null);
        const trendsData = await apiGet('/health-logs/trends');
        if (!trendsData.points || trendsData.points.length === 0) {
          setError('没有足够的数据来显示趋势。');
        } else {
          setData(trendsData);
        }
      } catch (e: any) {
        setError(e.message || '加载趋势数据失败');
        Alert.alert('加载失败', e.message || '未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#10B981" />;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (data) {
      const chartData = {
        labels: data.points.map(p => {
          const date = new Date(p.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [
          {
            data: data.points.map(p => p.avg),
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };

      return (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>趋势分析</Text>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>整体趋势</Text>
                <Text style={[styles.summaryValue, styles.trendValue]}>{data.trend === 'up' ? '上升' : data.trend === 'down' ? '下降' : '稳定'}</Text>
            </View>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>周变化</Text>
                <Text style={styles.summaryValue}>{data.weekly_change?.toFixed(2) ?? 'N/A'} {data.unit}</Text>
            </View>
          </View>
          <LineChart
            data={chartData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </>
      );
    }

    return null;
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>体重趋势</Text>
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </GradientBackground>
  );
}

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#10B981',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: screenWidth - 48,
    shadowColor: "#000",
    shadowOffset: {
	    width: 0,
	    height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  trendValue: {
    fontWeight: 'bold',
  }
});
