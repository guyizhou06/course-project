import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import HealthIcon from './HealthIcon';

interface HealthCardProps {
  title: string;
  subtitle: string;
  iconType: 'heart' | 'weight' | 'activity' | 'sleep' | 'nutrition' | 'assistant' | 'store';
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  backgroundImage?: string;
}

const HealthCard: React.FC<HealthCardProps> = ({
  title,
  subtitle,
  iconType,
  onPress,
  variant = 'primary',
  backgroundImage,
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.cardPrimary;
      case 'secondary':
        return styles.cardSecondary;
      case 'tertiary':
        return styles.cardTertiary;
      default:
        return styles.cardPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return styles.whiteText;
      case 'tertiary':
        return styles.darkText;
      default:
        return styles.whiteText;
    }
  };

  const CardContent = () => (
    <View style={[styles.card, getCardStyle()]}>
      <HealthIcon type={iconType} size={32} style={styles.icon} />
      <Text style={[styles.title, getTextStyle()]}>{title}</Text>
      <Text style={[styles.subtitle, getTextStyle()]}>{subtitle}</Text>
    </View>
  );

  if (backgroundImage) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <ImageBackground
          source={{ uri: backgroundImage }}
          imageStyle={styles.backgroundImage}
          style={styles.imageContainer}
        >
          <View style={styles.overlay}>
            <CardContent />
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <CardContent />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 120,
  },
  backgroundImage: {
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPrimary: {
    backgroundColor: '#6366F1',
  },
  cardSecondary: {
    backgroundColor: '#10B981',
  },
  cardTertiary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 18,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#111827',
  },
});

export default HealthCard;