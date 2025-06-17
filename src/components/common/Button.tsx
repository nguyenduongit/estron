// src/components/common/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { theme } from '../../theme';

// Hợp nhất các props từ cả hai component
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled,
  loading,
  ...props
}) => {
  // Xác định các style dựa trên variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'danger':
        return styles.dangerButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'outline':
        return styles.outlineText;
      default:
        return styles.primaryText;
    }
  };
  
  // Xác định màu cho ActivityIndicator
  const spinnerColor = (variant === 'primary' || variant === 'danger') 
    ? theme.colors.textOnPrimary 
    : theme.colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        getButtonStyles(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.textBase, getTextStyles(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Style cơ bản cho tất cả các nút
  buttonBase: {
    paddingVertical: theme.spacing['level-2'],
    paddingHorizontal: theme.spacing['level-4'],
    borderRadius: theme.borderRadius['level-4'],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  textBase: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
  },
  // Styles cho từng variant
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: theme.colors.textOnPrimary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.darkGrey,
  },
  secondaryText: {
    color: theme.colors.text,
  },
  dangerButton: {
    backgroundColor: theme.colors.danger,
  },
  dangerText: {
    color: theme.colors.textOnPrimary,
  },
  outlineButton: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  // Style cho trạng thái vô hiệu hóa
  disabled: {
    opacity: 0.6,
  },
});

export default Button;