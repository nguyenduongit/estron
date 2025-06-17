import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { theme } from '../theme';
import Button from '../components/common/Button';
import AuthLayout from './AuthLayout';
import TextInput from '../../src/components/common/TextInput';

type SignUpScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [salaryLevel, setSalaryLevel] = useState('');
  const [loading, setLoading] = useState(false);

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
          full_name: fullname.trim(),
          salary_level: salaryLevel.trim(),
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Lỗi đăng ký', error.message);
    } else if (data.user && !data.session) {
      Alert.alert(
        'Xác thực Email',
        'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.'
      );
      navigation.navigate('SignIn');
    } else if (data.user && data.session) {
        Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
    }
  };

  const renderFooter = () => (
    <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
      <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
    </TouchableOpacity>
  );

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Bắt đầu với Estron" footer={renderFooter()}>
      <TextInput
        label="Họ và Tên"
        value={fullname}
        onChangeText={setFullname}
        placeholder="Nhập họ và tên"
        autoCapitalize="words"
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Nhập email của bạn"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        label="Mã nhân viên"
        value={username}
        onChangeText={setUsername}
        placeholder="Nhập mã nhân viên (ví dụ: P306)"
        autoCapitalize="sentences"
      />
      <TextInput
        label="Bậc lương"
        value={salaryLevel}
        onChangeText={setSalaryLevel}
        placeholder="Nhập bậc lương (ví dụ: 2.0)"
      />
      <TextInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        placeholder="Ít nhất 6 ký tự"
        secureTextEntry={true}
      />
      <TextInput
        label="Xác nhận Mật khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Nhập lại mật khẩu"
        secureTextEntry={true}
      />
      <Button
        title={loading ? 'Đang xử lý...' : 'Đăng ký'}
        onPress={handleSignUp}
        loading={loading}
        disabled={loading}
        variant="primary"
        style={{ marginTop: theme.spacing['level-4'] }}
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
