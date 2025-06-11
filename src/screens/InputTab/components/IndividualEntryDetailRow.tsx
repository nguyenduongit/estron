import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../../theme';
import { ProductionEntry } from '../../../types/data';

interface IndividualEntryDetailRowProps {
  item: ProductionEntry;
  disabled?: boolean;
  onEdit: (item: ProductionEntry) => void;
}

const IndividualEntryDetailRow: React.FC<IndividualEntryDetailRowProps> = ({ item, disabled, onEdit }) => {
  const displayQuantity = item.quantity ?? 0;
  
  // THAY ĐỔI: Cập nhật logic cho icon và màu sắc để nhất quán
  const iconName = item.verified === true ? "checkmark-circle" : "checkmark-circle-outline";
  const iconColor = item.verified === true ? theme.colors.success : theme.colors.grey;
  const showIcon = item.verified !== null && item.verified !== undefined;

  return (
    <TouchableOpacity onPress={() => onEdit(item)} disabled={disabled}>
        <View style={[styles.detailRowContainer, disabled && styles.disabledVisual]}>
            {showIcon && (
                <Ionicons name={iconName as any} size={14} color={iconColor} style={styles.verificationIcon} />
            )}
            {!showIcon && <View style={styles.iconPlaceholder} />}
            
            <View style={styles.infoContainer}>
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
        </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  detailRowContainer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing['level-2'],
    marginLeft:theme.spacing['level-7'], 
    backgroundColor: theme.colors.cardBackground,
    borderTopColor: theme.colors.borderColor,
    borderTopWidth: 1,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationIcon: {
    marginRight: theme.spacing['level-2'],
  },
  iconPlaceholder: {
    width: 14 + theme.spacing['level-2'], 
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
    fontSize: theme.typography.fontSize['level-2'],
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