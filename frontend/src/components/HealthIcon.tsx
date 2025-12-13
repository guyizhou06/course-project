import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface HealthIconProps {
  type: 'heart' | 'weight' | 'activity' | 'sleep' | 'nutrition' | 'assistant' | 'store';
  size?: number;
  style?: ViewStyle;
}

const HealthIcon: React.FC<HealthIconProps> = ({ type, size = 24, style }) => {
  const getIconSource = () => {
    switch (type) {
      case 'heart':
        return { uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077034.png' };
      case 'weight':
        return { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' };
      case 'activity':
        return { uri: 'https://cdn-icons-png.flaticon.com/512/2994/2994970.png' };
      case 'sleep':
        return { uri: 'https://cdn-icons-png.flaticon.com/512/3614/3614393.png' };
      case 'nutrition':
        return { uri: 'https://cdn-icons-png.flaticon.com/512/3239/3239945.png' };
      case 'assistant':
        return { uri: 'https://cdn-icons-png.flaticon.com/512/3522/3522047.png' };
      case 'store':
        return { uri: 'https://cdn-icons-png.flaticon.com/512/5208/5208813.png' };
      default:
        return { uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077034.png' };
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={getIconSource()}
        style={[styles.icon, { width: size * 0.8, height: size * 0.8 }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    tintColor: '#6366F1', // 统一的图标颜色
  },
});

export default HealthIcon;