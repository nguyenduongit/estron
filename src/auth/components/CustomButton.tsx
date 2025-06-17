import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle, 
  TouchableOpacityProps,
  StyleProp // <<< THÊM IMPORT NÀY
} from 'react-native';
import { theme } from '../../theme';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  // THAY ĐỔI 2 DÒNG DƯỚI ĐÂY
  buttonStyle?: StyleProp<ViewStyle>; 
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'outline';
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading,
  disabled,
  buttonStyle,
  textStyle,
  variant = 'primary',
  ...touchableOpacityProps
}) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        isPrimary ? styles.primaryButton : styles.outlineButton,
        disabled || loading ? styles.disabled : {},
        buttonStyle, // Dòng này vẫn giữ nguyên
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      {...touchableOpacityProps}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.textOnPrimary : theme.colors.primary} />
      ) : (
        <Text style={[
          styles.textBase,
          isPrimary ? styles.primaryText : styles.outlineText,
          textStyle // Dòng này vẫn giữ nguyên
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    width: '100%',
    paddingVertical: theme.spacing['level-4'] - theme.spacing['level-1'] / 2, // 16 - 4/2 = 14
    borderRadius: theme.borderRadius['level-4'], // spacing.sm (8) -> borderRadius['level-4'] (8)
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: theme.spacing['level-4'], // md -> level-4
  },
  primaryButton: {
    backgroundColor: theme.colors.primary, // Giữ nguyên
  },
  outlineButton: {
    backgroundColor: theme.colors.transparent, // 'transparent' -> theme.colors.transparent
    borderWidth: 1,
    borderColor: theme.colors.primary, // Giữ nguyên
  },
  textBase: {
    fontSize: theme.typography.fontSize['level-4'], // Giữ nguyên
    fontWeight: theme.typography.fontWeight.bold, // Giữ nguyên
    textAlign: 'center',
  },
  primaryText: {
    color: theme.colors.textOnPrimary, // white -> textOnPrimary
  },
  outlineText: {
    color: theme.colors.primary, // Giữ nguyên
  },
  disabled: {
    opacity: 0.6, // Giữ nguyên
  },
});

export default CustomButton;