import React, { useState, useRef } from 'react';
import { Alert, Text, TouchableOpacity, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { theme } from '../theme';
import Button from '../components/common/Button';
import AuthLayout from './AuthLayout';
import TextInput from '../../src/components/common/TextInput';

type SignInScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;

export default function SignInScreen(): React.ReactElement {
  const navigation = useNavigation<SignInScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Tạo một ref để tham chiếu đến ô nhập mật khẩu
  const passwordInputRef = useRef<RNTextInput>(null);

  const handleSignIn = async () => {
    if (loading) return;
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

  // Hàm để chuyển focus đến ô mật khẩu
  const focusPasswordInput = () => {
    passwordInputRef.current?.focus();
  };

  const renderFooter = () => (
    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
      <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký</Text>
    </TouchableOpacity>
  );

  return (
    <AuthLayout title="Đăng nhập" footer={renderFooter()} showLogo={true}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Nhập email của bạn"
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next" // Hiển thị nút "Next" hoặc "Tiếp" trên bàn phím
        onSubmitEditing={focusPasswordInput} // Khi nhấn Enter, chuyển focus
        blurOnSubmit={false} // Ngăn bàn phím tự động đóng
      />
      <TextInput
        ref={passwordInputRef} // Gán ref cho ô mật khẩu
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        placeholder="Nhập mật khẩu"
        secureTextEntry={true}
        returnKeyType="go" // Hiển thị nút "Go" hoặc "Đăng nhập" trên bàn phím
        onSubmitEditing={handleSignIn} // Khi nhấn Enter, gọi hàm đăng nhập
      />
      <Button
        title={loading ? 'Đang xử lý...' : 'Đăng nhập'}
        onPress={handleSignIn}
        loading={loading}
        disabled={loading}
        variant="primary"
        style={{ marginTop: theme.spacing['level-6'] }}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  linkText: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.primary,
    textAlign: 'center',
    padding: theme.spacing['level-2'],
  },
});