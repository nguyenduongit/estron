// components/common/Button.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { theme } from "../../theme";

// Props cho Button
interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "danger";
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, type = "primary", style, textStyle, disabled }) => {
  const buttonStyles = [
    styles.button,
    styles[type], // type sẽ là 'primary', 'secondary', hoặc 'danger'
    disabled && styles.disabled,
    style, // Cho phép ghi đè style từ props
  ];
  const textStyles = [
    styles.text,
    styles[`${type}Text`], // Sẽ là 'primaryText', 'secondaryText', hoặc 'dangerText'
    textStyle, // Cho phép ghi đè textStyle từ props
  ];

  return (
    <TouchableOpacity onPress={onPress} style={buttonStyles} disabled={disabled}>
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing['level-2'], // sm -> level-2
    paddingHorizontal: theme.spacing['level-4'], // md -> level-4
    borderRadius: theme.borderRadius['level-4'], // md -> level-4
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  text: {
    fontSize: theme.typography.fontSize['level-4'], // button.fontSize (16) -> level-4 (16)
    fontWeight: theme.typography.fontWeight['bold'], // button.fontWeight ('500') -> level-4-bold
  },
  primary: {
    backgroundColor: theme.colors.primary, // Giữ nguyên
  },
  primaryText: {
    color: theme.colors.textOnPrimary, // white -> textOnPrimary
  },
  secondary: {
    backgroundColor: theme.colors.darkGrey, // secondary -> darkGrey (màu phù hợp cho dark theme)
  },
  secondaryText: {
    color: theme.colors.text, // white -> text (màu text sáng trên nền tối)
  },
  danger: {
    backgroundColor: theme.colors.danger, // Giữ nguyên
  },
  dangerText: {
    color: theme.colors.textOnPrimary, // white -> textOnPrimary (giả định text trắng trên nền danger)
  },
  disabled: {
    backgroundColor: theme.colors.grey, // Giữ nguyên
    opacity: 0.7,
  },
});

export default Button;