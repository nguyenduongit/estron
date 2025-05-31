// src/screens/InputTab/components/AggregatedEntryRow.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../../theme';
import IndividualEntryDetailRow from './IndividualEntryDetailRow';
// Không cần import ProductionEntry trực tiếp ở đây nữa nếu ProductionItem được định nghĩa đầy đủ
// import { ProductionEntry } from '../../../types/data';

// Định nghĩa lại ProductionItem để khớp với cấu trúc dữ liệu được truyền từ DailyCard
// (dữ liệu này có nguồn gốc từ DailyProductionData.entries)
type ProductionItem = {
  id: string;
  stageCode: string;        // Trường này chứa giá trị mã sản phẩm cho mỗi item con
  quantity?: number | null;  // Khớp với IndividualEntryDetailRow và DailyProductionData
  po?: string | null;
  box?: string | null;
  batch?: string | null;
  verified?: boolean | null; // Giữ lại trường này cho logic xác minh
  workAmount?: number;       // Trường này có trong dữ liệu nguồn (DailyProductionData.entries)
  // Không có trường 'product_code' ở đây vì dữ liệu truyền vào sử dụng 'stageCode'
};


interface AggregatedEntryRowProps {
  stageCode: string; // Mã công đoạn chung cho cả hàng này
  totalQuantity: number;
  items: ProductionItem[]; // Mảng các mục con, mỗi mục có cấu trúc ProductionItem ở trên
  disabled?: boolean;
  isDayFullyVerified?: boolean;
}

const AggregatedEntryRow: React.FC<AggregatedEntryRowProps> = ({
  stageCode,
  totalQuantity,
  items,
  disabled,
  isDayFullyVerified,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  };

  const iconName = isDayFullyVerified ? "checkmark-circle" : "remove-circle";
  const iconColor = isDayFullyVerified ? theme.colors.success : theme.colors.warning;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpansion} style={styles.mainRowTouchable} disabled={disabled}>
        <View style={[styles.mainRowContainer, disabled && styles.disabledVisual]}>
          <Ionicons name={iconName} size={16} color={iconColor} style={styles.verificationIcon} />
          <View style={styles.mainInfo}>
            <Text style={[styles.stageCodeText, disabled && styles.disabledText]}>{stageCode}</Text>
            <Text style={[styles.totalQuantityText, disabled && styles.disabledText]}>
               {totalQuantity.toLocaleString()} pcs
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && !disabled && (
        <View style={styles.detailsListContainer}>
          <View style={styles.detailHeaderContainer}>
            <Text style={[styles.detailHeaderText, styles.columnPo]}>PO</Text>
            <Text style={[styles.detailHeaderText, styles.columnBox]}>Hộp</Text>
            <Text style={[styles.detailHeaderText, styles.columnBatch]}>Batch</Text>
            <Text style={[styles.detailHeaderText, styles.columnQuantity]}>SL</Text>
          </View>
          {items.map(item => (
            <IndividualEntryDetailRow key={item.id} item={item} disabled={disabled} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  mainRowTouchable: {},
  mainRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: theme.spacing['level-6'],
    paddingRight: theme.spacing['level-4'],
    paddingVertical: theme.spacing['level-2'],
    backgroundColor: theme.colors.cardBackground,
  },
  verificationIcon: {
    marginRight: theme.spacing['level-2'],
  },
  mainInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageCodeText: {
    fontSize: theme.typography.fontSize['level-2'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  totalQuantityText: {
    fontSize: theme.typography.fontSize['level-2'],
    color: theme.colors.text,
  },
  detailsListContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  detailHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing['level-1'],
    paddingHorizontal: theme.spacing['level-2'],
    backgroundColor: theme.colors.background1,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  detailHeaderText: {
    fontSize: theme.typography.fontSize['level-2'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  columnPo: { flex: 2, textAlign: 'left' },
  columnBox: { flex: 1, textAlign: 'center' },
  columnBatch: { flex: 1, textAlign: 'center' },
  columnQuantity: { flex: 2, textAlign: 'right' },
  disabledVisual: {
    opacity: 0.6,
  },
  disabledText: {
    color: theme.colors.grey,
  },
});

export default AggregatedEntryRow;