import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import GradientBackground from '@/components/GradientBackground';
import HealthCard from '@/components/HealthCard';

// 商品数据类型定义
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Store'>;

export default function StoreScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 模拟商品数据
  const products: Product[] = [
    {
      id: '1',
      name: '智能体重秤',
      description: '精准测量体重，连接APP记录数据',
      price: 199,
      image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      category: 'devices'
    },
    {
      id: '2',
      name: '运动手环',
      description: '24小时健康监测，睡眠分析',
      price: 399,
      image: 'https://cdn-icons-png.flaticon.com/512/2994/2994970.png',
      category: 'devices'
    },
    {
      id: '3',
      name: '健康食谱',
      description: '专业营养师定制的健康饮食方案',
      price: 49,
      image: 'https://cdn-icons-png.flaticon.com/512/3239/3239945.png',
      category: 'nutrition'
    },
    {
      id: '4',
      name: 'AI健康咨询',
      description: '获得专业的AI健康分析和建议',
      price: 99,
      image: 'https://cdn-icons-png.flaticon.com/512/3522/3522047.png',
      category: 'services'
    },
    {
      id: '5',
      name: '瑜伽垫',
      description: '环保材质，防滑设计',
      price: 89,
      image: 'https://cdn-icons-png.flaticon.com/512/1077/1077034.png',
      category: 'equipment'
    },
    {
      id: '6',
      name: '睡眠眼罩',
      description: '遮光透气，提高睡眠质量',
      price: 39,
      image: 'https://cdn-icons-png.flaticon.com/512/3614/3614393.png',
      category: 'sleep'
    }
  ];

  // 分类筛选
  const categories = [
    { id: 'all', name: '全部' },
    { id: 'devices', name: '智能设备' },
    { id: 'nutrition', name: '营养健康' },
    { id: 'services', name: '健康服务' },
    { id: 'equipment', name: '运动装备' },
    { id: 'sleep', name: '睡眠改善' }
  ];

  // 过滤商品
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const handleProductPress = (product: Product) => {
    // 这里可以添加商品详情页导航逻辑
    // navigation.navigate('ProductDetail', { productId: product.id });
    alert(`选择了商品: ${product.name}`);
  };

  return (
    <GradientBackground>
      <ScrollView style={styles.container}>
        {/* 页面头部 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate('HealthTrackerDashboard')}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>健康商城</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 分类筛选 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategory
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 商品列表 - 网格布局 */}
        <View style={styles.productsGrid}>
          {filteredProducts.map(product => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => handleProductPress(product)}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
                <Text style={styles.productPrice}>¥{product.price}</Text>
                <TouchableOpacity style={styles.buyButton}>
                  <Text style={styles.buyButtonText}>立即购买</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(249,250,251,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  placeholder: {
    width: 40,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCategory: {
    backgroundColor: '#6366F1',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '30%', // 一行显示三个商品，考虑间距
  },
  productImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 8,
  },
  buyButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
