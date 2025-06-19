// src/screens/MenuTab/LookupNormsScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Keyboard, ScrollView } from 'react-native';
import { theme } from '../../theme';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import { getQuotaSettingByProductCode } from '../../services/storage';
import { QuotaSetting } from '../../types/data';

// Hằng số chứa thông tin các bậc lương để render
const SALARY_LEVELS = [
  { key: 'level_0_9', label: 'Bậc 0.9' },
  { key: 'level_1_0', label: 'Bậc 1.0' },
  { key: 'level_1_1', label: 'Bậc 1.1' },
  { key: 'level_2_0', label: 'Bậc 2.0' },
  { key: 'level_2_1', label: 'Bậc 2.1' },
  { key: 'level_2_2', label: 'Bậc 2.2' },
  { key: 'level_2_5', label: 'Bậc 2.5' },
] as const;

export default function LookupNormsScreen() {
  const [productCodeInput, setProductCodeInput] = useState('');
  const [foundQuota, setFoundQuota] = useState<QuotaSetting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>('Nhập mã công đoạn và nhấn "Tra cứu"');

  const handleLookup = async () => {
    Keyboard.dismiss();
    if (!productCodeInput.trim()) {
      setMessage('Vui lòng nhập mã công đoạn.');
      setFoundQuota(null);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setFoundQuota(null);

    // Sử dụng hàm đã có trong storage service
    const { data, error } = await getQuotaSettingByProductCode(productCodeInput.trim().toUpperCase());

    setIsLoading(false);

    if (error) {
      setMessage(`Đã có lỗi xảy ra: ${error.message}`);
    } else if (data) {
      setFoundQuota(data);
    } else {
      setMessage(`Không tìm thấy công đoạn với mã: "${productCodeInput.trim().toUpperCase()}"`);
    }
  };

  // Component để render kết quả tra cứu
  const renderQuotaDetails = () => {
    if (!foundQuota) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.productName} numberOfLines={2}>{foundQuota.product_name}</Text>
        <View style={styles.divider} />
        {SALARY_LEVELS.map((level) => {
          // Lấy giá trị định mức tương ứng với bậc lương
          const quotaValue = foundQuota[level.key as keyof QuotaSetting];
          return (
            <View key={level.key} style={styles.quotaRow}>
              <Text style={styles.levelLabel}>{level.label}:</Text>
              <Text style={styles.levelValue}>
                {typeof quotaValue === 'number' ? quotaValue.toLocaleString() : 'N/A'}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.lookupForm}>
        <TextInput
          label="Mã công đoạn"
          value={productCodeInput}
          onChangeText={setProductCodeInput}
          placeholder="Ví dụ: 5.2"
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={handleLookup}
        />
        <Button
          title={isLoading ? "Đang tìm..." : "Tra cứu"}
          onPress={handleLookup}
          disabled={isLoading}
        />
      </View>

      <View style={styles.resultsArea}>
        {isLoading && <ActivityIndicator size="large" color={theme.colors.primary} />}
        {message && !isLoading && <Text style={styles.messageText}>{message}</Text>}
        {renderQuotaDetails()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background2,
  },
  contentContainer: {
    flexGrow: 1,
    padding: theme.spacing['level-5'],
  },
  lookupForm: {
    marginBottom: theme.spacing['level-6'],
  },
  resultsArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  messageText: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing['level-5'],
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius['level-4'],
    padding: theme.spacing['level-5'],
    ...theme.shadow.md,
  },
  productName: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing['level-4'],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderColor,
    marginBottom: theme.spacing['level-4'],
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing['level-3'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  levelLabel: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
  },
  levelValue: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: 'bold',
    color: theme.colors.text,
  },
});