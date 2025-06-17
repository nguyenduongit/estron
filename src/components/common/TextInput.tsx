import React, { useState, forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  Text,
  Platform,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TextInputProps extends React.ComponentProps<typeof RNTextInput> {
  label?: string;
  error?: string;
  touched?: boolean;
  containerStyle?: ViewStyle;
}

// Sử dụng forwardRef để component có thể nhận một ref và truyền nó xuống RNTextInput
const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, touched, style, secureTextEntry, containerStyle, ...props }, ref) => {
    const [isSecure, setIsSecure] = useState(secureTextEntry);
    const hasError = touched && error;

    const toggleSecureEntry = () => {
      setIsSecure(!isSecure);
    };

    return (
      <View style={[styles.outerContainer, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputContainer, hasError && styles.inputContainerError]}>
          <RNTextInput
            ref={ref} // Gán ref được truyền vào
            style={[styles.input, Platform.OS === 'web' && ({ outline: 'none' } as any), style]}
            placeholderTextColor={theme.colors.grey}
            secureTextEntry={isSecure}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity onPress={toggleSecureEntry} style={styles.eyeIcon}>
              <Ionicons
                name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        {hasError && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: theme.spacing['level-4'],
  },
  label: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['level-1'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    borderRadius: theme.borderRadius['level-4'],
    backgroundColor: theme.colors.cardBackground,
    minHeight: 44,
  },
  inputContainerError: {
    borderColor: theme.colors.danger,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing['level-2'],
    paddingVertical: theme.spacing['level-2'],
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.text,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: theme.typography.fontSize['level-2'],
    color: theme.colors.danger,
    marginTop: theme.spacing['level-1'],
  },
  eyeIcon: {
    paddingHorizontal: theme.spacing['level-3'],
  },
});

export default TextInput;