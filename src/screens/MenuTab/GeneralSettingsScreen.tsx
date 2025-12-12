// src/screens/MenuTab/GeneralSettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import ThemedPicker from '../../components/common/Picker';
import { updateSalaryLevel } from '../../services/storage';

const SALARY_LEVELS = [
  { label: 'Bậc 0.9', value: '0.9' },
  { label: 'Bậc 1.0', value: '1.0' },
  { label: 'Bậc 1.1', value: '1.1' },
  { label: 'Bậc 2.0', value: '2.0' },
  { label: 'Bậc 2.1', value: '2.1' },
  { label: 'Bậc 2.2', value: '2.2' },
  { label: 'Bậc 2.5', value: '2.5' },
];

export default function GeneralSettingsScreen() {
  const { showSunday, toggleShowSunday } = useSettingsStore();
  const { authUser, updateProfileSalary } = useAuthStore();
  const [updating, setUpdating] = useState(false);

  // Lấy bậc lương hiện tại từ store, mặc định là 1.0 nếu chưa có
  const currentSalary = authUser?.profile.salary_level || '1.0';

  const handleSalaryChange = async (value: string | number) => {
    const newLevel = value.toString();
    if (newLevel === currentSalary) return;

    if (!authUser?.profile.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      return;
    }

    setUpdating(true);
    // Gọi API cập nhật xuống DB
    const { error } = await updateSalaryLevel(authUser.profile.id, newLevel);
    setUpdating(false);

    if (error) {
      Alert.alert('Thất bại', 'Không thể cập nhật bậc lương. Vui lòng thử lại.');
    } else {
      // Cập nhật store để UI toàn app (ví dụ màn hình Menu) tự đổi theo
      updateProfileSalary(newLevel);
      Alert.alert('Thành công', `Đã chuyển sang bậc lương ${newLevel}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cài đặt hiển thị */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Hiển thị</Text>
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Hiển thị ngày Chủ Nhật</Text>
        <Switch
          trackColor={{ false: theme.colors.darkGrey, true: theme.colors.primary }}
          thumbColor={showSunday ? theme.colors.white : theme.colors.lightGrey}
          ios_backgroundColor={theme.colors.darkGrey}
          onValueChange={toggleShowSunday}
          value={showSunday}
        />
      </View>

      {/* Cài đặt tài khoản - Chọn bậc lương */}
      <View style={[styles.sectionHeader, { marginTop: theme.spacing['level-4'] }]}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>
      </View>

      <View style={styles.pickerContainer}>
        <ThemedPicker
          label="Bậc lương hiện tại"
          selectedValue={currentSalary}
          onValueChange={handleSalaryChange}
          items={SALARY_LEVELS}
          enabled={!updating}
        />
        {updating && (
          <ActivityIndicator style={styles.loading} size="small" color={theme.colors.primary} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background2,
    paddingTop: theme.spacing['level-4'],
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing['level-4'],
    marginBottom: theme.spacing['level-2'],
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing['level-4'],
    paddingVertical: theme.spacing['level-3'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  settingLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['level-4'],
  },
  pickerContainer: {
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing['level-4'],
    paddingVertical: theme.spacing['level-2'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  loading: {
    position: 'absolute',
    right: 40,
    top: 45,
  },
});
