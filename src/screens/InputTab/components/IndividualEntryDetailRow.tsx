// src/screens/InputTab/components/IndividualEntryDetailRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; // Import Ionicons
import { theme } from '../../../theme';

interface IndividualEntryDetailRowProps {
  item: {
    id: string;
    quantity?: number | null;
    po?: string | null;
    box?: string | null;
    batch?: string | null;
    verified?: boolean | null; // Đã thêm
  };
  disabled?: boolean;
}

const IndividualEntryDetailRow: React.FC<IndividualEntryDetailRowProps> = ({ item, disabled }) => {
  const displayQuantity = item.quantity ?? 0;

  // Xác định icon và màu sắc dựa trên item.verified
  const iconName = item.verified === true ? "checkmark-circle-outline" : "remove-circle-outline";
  const iconColor = item.verified === true ? theme.colors.success : theme.colors.warning;
  // Nếu verified là null hoặc undefined, có thể chọn một icon/màu mặc định hoặc không hiển thị icon
  const showIcon = item.verified !== null && item.verified !== undefined;

  return (
    <View style={[styles.detailRowContainer, disabled && styles.disabledVisual]}>
      {/* Icon ở đầu dòng */}
      {showIcon && (
        <Ionicons name={iconName as any} size={14} color={iconColor} style={styles.verificationIcon} />
      )}
      {!showIcon && ( // Giữ chỗ nếu không có icon để layout không bị xô lệch
        <View style={styles.iconPlaceholder} />
      )}

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
        <Text style={[styles.value, disabled && styles.disabledText]}>
          {displayQuantity.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  detailRowContainer: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing['level-2'],
    marginLeft:theme.spacing['level-8'], 
    backgroundColor: theme.colors.cardBackground,
    borderTopColor: theme.colors.borderColor,
    borderTopWidth: 1,
  },
  verificationIcon: {
    marginRight: theme.spacing['level-2'], // Khoảng cách giữa icon và PO
  },
  iconPlaceholder: { // Giữ chỗ nếu không có icon
    width: 18 + theme.spacing['level-2'], // Kích thước icon + marginRight
  },
  infoItem_PO: {
    flex: 2.7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem_Box: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem_Batch: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem_Quantity: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: theme.typography.fontSize['level-1'],
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.typography.fontSize['level-1'],
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight['bold'],
  },

  disabledVisual: {
    opacity: 0.6,
  },
  disabledText: {
    color: theme.colors.grey,
  },
});

export default IndividualEntryDetailRow;