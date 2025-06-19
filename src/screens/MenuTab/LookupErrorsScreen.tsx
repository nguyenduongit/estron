// src/screens/MenuTab/LookupErrorsScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';
import ThemedPicker from '../../components/common/Picker';

// Dữ liệu mã lỗi cho từng công đoạn
// (Có thể mở rộng trong tương lai)
const errorData = {
  Solder: [
    { code: '3.1', description: 'Sai thông số yêu cầu, sai dây, sai vị trí' },
    { code: '3.2', description: 'Mối hàn không đạt theo PC, không tan chảy, dơ' },
    { code: '3.3', description: 'Đứt dây, trầy dây, tuột dây, fiber' },
    { code: '3.4', description: 'Biến dạng NVL trong quá trình Solder' },
    { code: '3.5', description: 'Lỗi NVL' },
    { code: '3.6', description: 'Khác' },
  ],
};

// Danh sách các công đoạn cho Picker
const processItems = [
  { label: 'Solder', value: 'Solder' },
  // Thêm các công đoạn khác tại đây
];

export default function LookupErrorsScreen() {
  // State để lưu trữ công đoạn đang được chọn, mặc định là 'Solder'
  const [selectedProcess, setSelectedProcess] = useState<string | number>('Solder');

  // Hàm để render danh sách mã lỗi dựa trên công đoạn đã chọn
  const renderErrorList = () => {
    if (selectedProcess !== 'Solder') {
      // Hiển thị thông báo nếu chưa chọn hoặc chọn công đoạn chưa có dữ liệu
      return <Text style={styles.placeholderText}>Chưa có dữ liệu cho công đoạn này.</Text>;
    }
    
    const errors = errorData.Solder;
    return (
      <View style={styles.resultsContainer}>
        {errors.map((error, index) => (
          <View 
            key={error.code} 
            // Bỏ đường kẻ dưới cho dòng cuối cùng
            style={[styles.errorRow, index === errors.length - 1 && styles.lastErrorRow]}
          >
            <Text style={styles.errorCode}>{error.code}</Text>
            <Text style={styles.errorDescription}>{error.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
    >
      <ThemedPicker
        label="Chọn công đoạn"
        selectedValue={selectedProcess}
        onValueChange={(itemValue) => setSelectedProcess(itemValue)}
        items={processItems}
      />
      <View style={styles.listContainer}>
        {renderErrorList()}
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
  listContainer: {
    marginTop: theme.spacing['level-5'],
  },
  resultsContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius['level-4'],
    ...theme.shadow.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  lastErrorRow: {
    borderBottomWidth: 0,
  },
  errorCode: {
    width: 50,
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.primary,
    marginRight: theme.spacing['level-2'],
  },
  errorDescription: {
    flex: 1,
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    lineHeight: 22, // Tăng khoảng cách dòng để dễ đọc hơn
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing['level-6'],
    fontSize: theme.typography.fontSize['level-4'],
  },
});