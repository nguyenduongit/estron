// src/auth/SignInScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Text,
  TouchableOpacity,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { theme } from '../theme';
import CustomButton from './components/CustomButton';

type SignInScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SignIn'
>;

export default function SignInScreen(): React.ReactElement {
  const navigation = useNavigation<SignInScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Lỗi đăng nhập', error.message);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    options?: {
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    }
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, Platform.OS === 'web' && ({outline: 'none'} as any)]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={options?.autoCapitalize || 'sentences'}
        keyboardType={options?.keyboardType || 'default'}
        placeholderTextColor={theme.colors.textSecondary} // Giữ nguyên
      />
    </View>
  );

  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    secureState: boolean,
    toggleSecureState: () => void
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.passwordContainer, Platform.OS === 'web' && ({outline: 'none'} as any)]}>
        <TextInput
          style={[styles.inputPassword, Platform.OS === 'web' && ({outline: 'none'} as any)]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureState}
          placeholderTextColor={theme.colors.textSecondary} // Giữ nguyên
        />
        <TouchableOpacity onPress={toggleSecureState} style={styles.eyeButton}>
          <Text style={styles.eyeButtonText}>{secureState ? 'Hiện' : 'Ẩn'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.webContainer}>
      <View style={styles.headerContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Đăng nhập</Text>
      </View>

      <View style={styles.formContainer}>
        {renderInput("Email", email, setEmail, "Nhập email của bạn", { keyboardType: 'email-address', autoCapitalize: 'none' })}
        {renderPasswordInput("Mật khẩu", password, setPassword, "Nhập mật khẩu", secureTextEntry, () => setSecureTextEntry(!secureTextEntry))}

        <CustomButton
            title={loading ? "Đang xử lý..." : "Đăng nhập"}
            onPress={handleSignIn}
            loading={loading}
            disabled={loading}
            variant="primary"
            buttonStyle={{ marginTop: theme.spacing['level-6'] }} // lg -> level-6
        />
      </View>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['level-6'], // lg -> level-6
    backgroundColor: theme.colors.background2, // background -> background2
    width: '100%',
    marginHorizontal: 'auto',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['level-7'], // xl -> level-7
  },
  logo: {
    width:200,
    height: 100,
    resizeMode: 'contain',
    marginBottom: theme.spacing['level-7'], // xl -> level-7
  },
  title: {
    fontSize: theme.typography['level-8'].fontSize, // h1.fontSize (32) -> level-8 (28)
    fontWeight: theme.typography['level-8-bold'].fontWeight, // h1.fontWeight -> level-8-bold
    color: theme.colors.primary, // Giữ nguyên
    marginBottom: theme.spacing['level-7'], // xl -> level-7
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: theme.spacing['level-4'], // md -> level-4
  },
  label: {
    fontSize: theme.typography['level-3'].fontSize, // bodySmall.fontSize -> level-3
    color: theme.colors.textSecondary, // Giữ nguyên
    marginBottom: theme.spacing['level-1'], // xs -> level-1
    // Giữ nguyên fontWeight mặc định (normal) từ level-3
  },
  input: {
    height: 48,
    backgroundColor: theme.colors.cardBackground, // Giữ nguyên
    borderWidth: 1,
    borderColor: theme.colors.borderColor, // Giữ nguyên
    borderRadius: theme.borderRadius['level-4'], // spacing.sm (8) -> borderRadius.level-4 (8)
    paddingHorizontal: theme.spacing['level-4'], // md -> level-4
    fontSize: theme.typography['level-4'].fontSize, // body.fontSize -> level-4
    color: theme.colors.text, // Giữ nguyên
    width: '100%',
    // Giữ nguyên fontWeight mặc định (normal) từ level-4
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground, // Giữ nguyên
    borderWidth: 1,
    borderColor: theme.colors.borderColor, // Giữ nguyên
    borderRadius: theme.borderRadius['level-4'], // spacing.sm (8) -> borderRadius.level-4 (8)
    width: '100%',
  },
  inputPassword: {
    flex: 1,
    height: 48,
    paddingHorizontal: theme.spacing['level-4'], // md -> level-4
    fontSize: theme.typography['level-4'].fontSize, // body.fontSize -> level-4
    color: theme.colors.text, // Giữ nguyên
    borderWidth: 0,
    // Giữ nguyên fontWeight mặc định (normal) từ level-4
  },
  eyeButton: {
    padding: theme.spacing['level-4'], // md -> level-4
  },
  eyeButtonText: {
    fontSize: theme.typography['level-2'].fontSize, // caption.fontSize -> level-2
    color: theme.colors.primary, // Giữ nguyên
    // Giữ nguyên fontWeight mặc định (normal) từ level-2
  },
  linkButton: {
    marginTop: theme.spacing['level-6'], // lg -> level-6
    alignItems: 'center',
  },
  linkText: {
    fontSize: theme.typography['level-3'].fontSize, // bodySmall.fontSize -> level-3
    color: theme.colors.primary, // Giữ nguyên
    // Giữ nguyên fontWeight mặc định (normal) từ level-3
  },
});