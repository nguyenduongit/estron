// src/auth/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { theme } from '../theme';
import CustomButton from './components/CustomButton';

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SignUp'
>;

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [salaryLevel, setSalaryLevel] = useState('');

  const [loading, setLoading] = useState(false);
  const [secureTextEntryPassword, setSecureTextEntryPassword] = useState(true);
  const [secureTextEntryConfirm, setSecureTextEntryConfirm] = useState(true);

  const handleSignUp = async () => {
    if (!email || !password || !username || !fullname || !confirmPassword || !salaryLevel.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username.trim(),
          fullname: fullname.trim(), // Sửa lỗi chính tả: fullname thay vì fullname
          salary_level: salaryLevel.trim(),
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Lỗi đăng ký', error.message);
    } else if (data.user && data.session) {
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
    } else if (data.user && !data.session) {
      Alert.alert(
        'Xác thực Email',
        'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.'
      );
      navigation.navigate('SignIn');
    } else {
      Alert.alert('Thông báo', 'Có lỗi xảy ra hoặc phản hồi không như mong đợi.');
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    options?: {
      secureTextEntry?: boolean;
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
        secureTextEntry={options?.secureTextEntry}
        autoCapitalize={options?.autoCapitalize || 'sentences'}
        keyboardType={options?.keyboardType || 'default'}
        placeholderTextColor={theme.colors.textSecondary}
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
      <View style={[styles.passwordContainerWeb, Platform.OS === 'web' && ({outline: 'none'} as any)]}>
        <TextInput
          style={[styles.inputPasswordWeb, Platform.OS === 'web' && ({outline: 'none'} as any)]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureState}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity onPress={toggleSecureState} style={styles.eyeButtonWeb}>
          <Text style={styles.eyeButtonText}>{secureState ? 'Hiện' : 'Ẩn'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.webContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Bắt đầu với Estron</Text>
      </View>

      <View style={styles.formContainer}>
        {renderInput("Họ và Tên", fullname, setFullname, "Nhập họ và tên", { autoCapitalize: 'words' })}
        {renderInput("Email", email, setEmail, "Nhập email của bạn", { keyboardType: 'email-address', autoCapitalize: 'none' })}
        {renderInput("Mã nhân viên", username, setUsername, "Nhập mã nhân viên (ví dụ: p713)", { autoCapitalize: 'none' })}
        {renderInput("Bậc lương", salaryLevel, setSalaryLevel, "Nhập bậc lương của bạn (ví dụ: 2.0)", { keyboardType: 'numeric' })}
        {renderPasswordInput("Mật khẩu", password, setPassword, "Nhập mật khẩu (ít nhất 6 ký tự)", secureTextEntryPassword, () => setSecureTextEntryPassword(!secureTextEntryPassword))}
        {renderPasswordInput("Xác nhận Mật khẩu", confirmPassword, setConfirmPassword, "Nhập lại mật khẩu", secureTextEntryConfirm, () => setSecureTextEntryConfirm(!secureTextEntryConfirm))}

        <CustomButton
            title={loading ? "Đang xử lý..." : "Đăng ký"}
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            variant="primary"
            buttonStyle={{ marginTop: theme.spacing['level-6'] }} // lg -> level-6
        />
      </View>

      <TouchableOpacity
        style={styles.signInLinkButton}
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text style={styles.signInLinkText}>Đã có tài khoản? Đăng nhập</Text>
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
    marginBottom: theme.spacing['level-6'], // lg (giảm bớt so với xl của SignIn) -> level-6
  },
  title: {
    fontSize: theme.typography['level-8'].fontSize, // h1.fontSize -> level-8
    fontWeight: theme.typography['level-8-bold'].fontWeight, // h1.fontWeight -> level-8-bold
    color: theme.colors.primary, // Giữ nguyên
  },
  subtitle: {
    fontSize: theme.typography['level-4'].fontSize, // body.fontSize -> level-4
    color: theme.colors.textSecondary, // Giữ nguyên
    marginTop: theme.spacing['level-2'], // sm -> level-2
    // Giữ nguyên fontWeight mặc định (normal) từ level-4
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
  passwordContainerWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground, // Giữ nguyên
    borderWidth: 1,
    borderColor: theme.colors.borderColor, // Giữ nguyên
    borderRadius: theme.borderRadius['level-4'], // spacing.sm (8) -> borderRadius.level-4 (8)
    width: '100%',
  },
  inputPasswordWeb: {
    flex: 1,
    height: 48,
    paddingHorizontal: theme.spacing['level-4'], // md -> level-4
    fontSize: theme.typography['level-4'].fontSize, // body.fontSize -> level-4
    color: theme.colors.text, // Giữ nguyên
    borderWidth: 0,
    // Giữ nguyên fontWeight mặc định (normal) từ level-4
  },
  eyeButtonWeb: {
    padding: theme.spacing['level-4'], // md -> level-4
  },
  eyeButtonText: {
    fontSize: theme.typography['level-2'].fontSize, // caption.fontSize -> level-2
    color: theme.colors.primary, // Giữ nguyên
    // Giữ nguyên fontWeight mặc định (normal) từ level-2
  },
  signInLinkButton: {
    marginTop: theme.spacing['level-6'], // lg -> level-6
    alignItems: 'center',
  },
  signInLinkText: {
    fontSize: theme.typography['level-3'].fontSize, // bodySmall.fontSize -> level-3
    color: theme.colors.primary, // Giữ nguyên
    // Giữ nguyên fontWeight mặc định (normal) từ level-3
  },
});