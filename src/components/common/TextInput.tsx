// components/common/TextInput.tsx
import React from "react";
import { TextInput as RNTextInput, StyleSheet, View, Text, Platform } from "react-native";
import { theme } from "../../theme";

interface TextInputProps extends React.ComponentProps<typeof RNTextInput> {
  label?: string;
  error?: string;
  touched?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ label, error, touched, style, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          // Thêm outline: 'none' cho web để loại bỏ đường viền mặc định của trình duyệt khi focus
          Platform.OS === 'web' && ({ outline: 'none' } as any),
          (touched && error) && styles.inputError,
          style
        ]}
        placeholderTextColor={theme.colors.grey} // Giữ nguyên, theme.colors.grey phù hợp cho placeholder trên nền tối
        {...props}
      />
      {touched && error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing['level-4'], // md -> level-4
  },
  label: {
    fontSize: theme.typography.fontSize['level-3'], // bodySmall.fontSize (14) -> level-3 (14)
    color: theme.colors.textSecondary, // Giữ nguyên, textSecondary phù hợp cho label
    marginBottom: theme.spacing['level-1'], // xs -> level-1
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderColor, // Giữ nguyên, borderColor đã được định nghĩa cho nền tối
    borderRadius: theme.borderRadius['level-2'], // sm -> level-2
    paddingHorizontal: theme.spacing['level-2'], // sm -> level-2
    paddingVertical: theme.spacing['level-2'], // sm -> level-2
    fontSize: theme.typography.fontSize['level-4'], // body.fontSize (16) -> level-4 (16)
    color: theme.colors.text, // Giữ nguyên, text là màu sáng cho nền tối
    backgroundColor: theme.colors.cardBackground, // white -> cardBackground (màu nền tối cho input)
    minHeight: 44,
  },
  inputError: {
    borderColor: theme.colors.danger, // Giữ nguyên
  },
  errorText: {
    fontSize: theme.typography.fontSize['level-2'], // caption.fontSize (12) -> level-2 (12)
    color: theme.colors.danger, // Giữ nguyên
    marginTop: theme.spacing['level-1'], // xs -> level-1
  },
});

export default TextInput;