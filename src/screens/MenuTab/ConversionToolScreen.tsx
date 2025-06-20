import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../theme';
import ThemedPicker from '../../components/common/Picker';
import { useProductionStore } from '../../stores/productionStore';
import { useAuthStore } from '../../stores/authStore';
import { getQuotaValueBySalaryLevel } from '../../services/storage';

const BASE_QUANTITY = 270;

export default function ConversionToolScreen() {
  const { userSelectedQuotas, quotaSettingsMap } = useProductionStore();
  const { authUser } = useAuthStore();

  const [fromProductCode, setFromProductCode] = useState<string | number>('');
  const [toProductCode, setToProductCode] = useState<string | number>('');
  const [result, setResult] = useState<number | null>(null);
  const [fromQuota, setFromQuota] = useState<number | null>(null);
  const [toQuota, setToQuota] = useState<number | null>(null);

  const userProfile = authUser?.profile;

  const productPickerItems = useMemo(() => {
    if (userSelectedQuotas.length === 0) {
      return [{ label: 'Vui lòng thêm công đoạn ở Cài đặt', value: '' }];
    }
    return userSelectedQuotas.map(quota => {
      const setting = quotaSettingsMap.get(quota.product_code);
      const productName = setting ? setting.product_name : '(Không tìm thấy tên)';
      return {
        label: `${quota.product_code} - ${productName}`,
        value: quota.product_code,
      };
    });
  }, [userSelectedQuotas, quotaSettingsMap]);

  useEffect(() => {
    if (!fromProductCode || !toProductCode || !userProfile?.salary_level) {
      setResult(null);
      setFromQuota(null);
      setToQuota(null);
      return;
    }

    const fromQuotaSetting = quotaSettingsMap.get(fromProductCode.toString());
    const toQuotaSetting = quotaSettingsMap.get(toProductCode.toString());

    if (!fromQuotaSetting || !toQuotaSetting) {
      setResult(null);
      setFromQuota(null);
      setToQuota(null);
      return;
    }

    const fromQuotaValue = getQuotaValueBySalaryLevel(fromQuotaSetting, userProfile.salary_level);
    const toQuotaValue = getQuotaValueBySalaryLevel(toQuotaSetting, userProfile.salary_level);

    setFromQuota(fromQuotaValue > 0 ? fromQuotaValue : null);
    setToQuota(toQuotaValue > 0 ? toQuotaValue : null);

    if (fromQuotaValue > 0 && toQuotaValue > 0) {
      const conversionResult = (BASE_QUANTITY / fromQuotaValue) * toQuotaValue;
      setResult(conversionResult);
    } else {
      setResult(null);
    }
  }, [fromProductCode, toProductCode, userProfile, quotaSettingsMap]);

  const renderResult = () => {
    if (result === null) {
      let message = 'Vui lòng chọn hai công đoạn để xem tỉ lệ quy đổi.';
      if (fromProductCode && toProductCode) {
        message = 'Không thể quy đổi. Vui lòng kiểm tra lại định mức của công đoạn đã chọn.';
      }
      return <Text style={styles.messageText}>{message}</Text>;
    }

    const fromLabel =
      productPickerItems.find(p => p.value === fromProductCode)?.label || fromProductCode;
    const toLabel = productPickerItems.find(p => p.value === toProductCode)?.label || toProductCode;

    return (
      <View style={styles.resultBox}>
        <Text style={styles.resultHeader}>Kết Quả Quy Đổi</Text>

        <View style={styles.conversionFlow}>
          {/* FROM Card */}
          <View style={styles.stageCard}>
            <Text style={styles.stageTitle} numberOfLines={2}>
              {fromLabel}
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Định mức:</Text>
              <Text style={styles.infoValue}>{fromQuota?.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số lượng gốc:</Text>
              <Text style={styles.infoValue}>{BASE_QUANTITY} pcs (1 hộp)</Text>
            </View>
          </View>

          <Ionicons
            name="arrow-down-circle"
            size={40}
            color={theme.colors.primary}
            style={styles.arrowIcon}
          />

          {/* TO Card */}
          <View style={styles.stageCard}>
            <Text style={styles.stageTitle} numberOfLines={2}>
              {toLabel}
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Định mức:</Text>
              <Text style={styles.infoValue}>{toQuota?.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số lượng tương đương:</Text>
              <Text style={[styles.infoValue, styles.resultValue]}>{result.toFixed(0)} pcs</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.summaryText}>
            Giá trị công của <Text style={{ fontWeight: 'bold' }}>1 hộp</Text> công đoạn{' '}
            {fromProductCode} tương đương{' '}
            <Text style={{ fontWeight: 'bold' }}>{result.toFixed(0)} pcs</Text> công đoạn{' '}
            {toProductCode}.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.pickerContainer}>
        <ThemedPicker
          label="Từ công đoạn:"
          selectedValue={fromProductCode}
          onValueChange={itemValue => setFromProductCode(itemValue)}
          items={productPickerItems}
        />
        <ThemedPicker
          label="Tới công đoạn:"
          selectedValue={toProductCode}
          onValueChange={itemValue => setToProductCode(itemValue)}
          items={productPickerItems}
        />
      </View>

      <View style={styles.resultContainer}>{renderResult()}</View>
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
  pickerContainer: {
    marginBottom: theme.spacing['level-4'],
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: theme.spacing['level-4'],
  },
  resultBox: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius['level-4'],
    padding: theme.spacing['level-4'],
    width: '100%',
    ...theme.shadow.md,
  },
  resultHeader: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing['level-5'],
  },
  conversionFlow: {
    alignItems: 'center',
  },
  stageCard: {
    backgroundColor: theme.colors.background1,
    borderRadius: theme.borderRadius['level-3'],
    padding: theme.spacing['level-3'],
    width: '100%',
    marginBottom: theme.spacing['level-3'],
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
  },
  stageTitle: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing['level-3'],
    minHeight: 40,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing['level-2'],
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
    paddingTop: theme.spacing['level-2'],
  },
  infoLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  resultValue: {
    color: theme.colors.success,
    fontSize: theme.typography.fontSize['level-5'],
  },
  arrowIcon: {
    marginVertical: theme.spacing['level-2'],
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing['level-5'],
    padding: theme.spacing['level-3'],
    backgroundColor: theme.colors.background1,
    borderRadius: theme.borderRadius['level-3'],
  },
  summaryText: {
    flex: 1,
    marginLeft: theme.spacing['level-2'],
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize['level-2'],
    fontStyle: 'italic',
    lineHeight: 18,
  },
  messageText: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing['level-4'],
    lineHeight: 24,
  },
});
