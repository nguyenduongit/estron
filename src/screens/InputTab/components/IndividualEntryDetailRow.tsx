// src/screens/InputTab/components/IndividualEntryDetailRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

interface IndividualEntryDetailRowProps {
  item: {
    id: string;
    quantity?: number | null;
    po?: string | null;
    box?: string | null;
    batch?: string | null;
  };
  disabled?: boolean;
}

const IndividualEntryDetailRow: React.FC<IndividualEntryDetailRowProps> = ({ item, disabled }) => {
  const displayQuantity = item.quantity ?? 0;

  return (
    <View style={[styles.detailRowContainer, disabled && styles.disabledVisual]}>
      <View style={styles.infoItem_PO}>
        <Text style={styles.label}>PO: </Text>
        <Text style={[styles.value, disabled && styles.disabledText]}>{item.po || '-'}</Text>
      </View>
      <View style={styles.infoItem_Box}>
        <Text style={styles.label}>Hộp: </Text>
        <Text style={[styles.value, disabled && styles.disabledText]}>{item.box || '-'}</Text>
      </View>
      <View style={styles.infoItem_Batch}>
        <Text style={styles.label}>Batch: </Text>
        <Text style={[styles.value, disabled && styles.disabledText]}>{item.batch || '-'}</Text>
      </View>
      <View style={styles.infoItem_Quantity}>
        <Text style={styles.label}>SL: </Text>
        <Text style={[styles.value, styles.quantityValue, disabled && styles.disabledText]}>
          {displayQuantity.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  detailRowContainer: {
    height:36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Canh các item theo chiều dọc nếu label và value có chiều cao khác nhau
    paddingVertical: theme.spacing['level-2'], // Tăng padding cho dễ nhìn
    marginLeft: theme.spacing['level-8'], // Giữ khoảng cách với AggregatedEntryRow
    backgroundColor: theme.colors.cardBackground, // Thay đổi màu nền nếu cần để phân biệt với AggregatedEntryRow
    borderTopColor: theme.colors.borderColor,
    borderTopWidth: 1, // Thêm đường viền trên cùng để phân biệt các dòng
  },
  infoItem_PO: {
    flex:2.7,
    flexDirection: 'row',
    alignItems: 'center',
    // marginRight: theme.spacing['level-3'], // Khoảng cách giữa các cặp label-value
  },
  infoItem_Box: {
    flex:2,
    flexDirection: 'row',
    alignItems: 'center',
    // marginRight: theme.spacing['level-3'], // Khoảng cách giữa các cặp label-value
  },
  infoItem_Batch: {
    flex:3,
    flexDirection: 'row',
    alignItems: 'center',
    // marginRight: theme.spacing['level-3'], // Khoảng cách giữa các cặp label-value
  },
  infoItem_Quantity: {
    flex:2,
    flexDirection: 'row',
    alignItems: 'center',
    // marginRight: theme.spacing['level-3'], // Khoảng cách giữa các cặp label-value
  },
  label: {
    fontSize: theme.typography.fontSize['level-2'],
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.typography.fontSize['level-2'],
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight['bold'], // Hoặc 'medium' nếu muốn đậm hơn
  },
  quantityValue: {
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.primary, // Hoặc một màu khác để nổi bật số lượng
  },
  disabledVisual: {
    opacity: 0.6,
  },
  disabledText: {
    color: theme.colors.grey,
  },
  // Các style column cũ không còn cần thiết
});

export default IndividualEntryDetailRow;