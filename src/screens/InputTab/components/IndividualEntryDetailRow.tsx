// src/screens/InputTab/components/IndividualEntryDetailRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

interface IndividualEntryDetailRowProps {
  item: {
    id: string;
    quantity?: number | null; // Allow quantity to be number, null, or undefined
    po?: string | null;
    box?: string | null;
    batch?: string | null;
  };
  disabled?: boolean;
}

const IndividualEntryDetailRow: React.FC<IndividualEntryDetailRowProps> = ({ item, disabled }) => {
  // Handle potential null/undefined quantity by defaulting to 0 for display
  const displayQuantity = item.quantity ?? 0;

  return (
    <View style={styles.detailRowContainer}>
      <Text style={[styles.detailText, styles.columnPo, disabled && styles.disabledText]}>{item.po || '-'}</Text>
      <Text style={[styles.detailText, styles.columnBox, disabled && styles.disabledText]}>{item.box || '-'}</Text>
      <Text style={[styles.detailText, styles.columnBatch, disabled && styles.disabledText]}>{item.batch || '-'}</Text>
      <Text style={[styles.detailText, styles.columnQuantity, disabled && styles.disabledText]}>
        {displayQuantity.toLocaleString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  detailRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing['level-1'], // xs -> level-1
    paddingHorizontal: theme.spacing['level-2'], // sm -> level-2
    backgroundColor: theme.colors.cardBackground, // white -> cardBackground
  },
  detailText: {
    fontSize: theme.typography.fontSize['level-2'], // caption.fontSize -> level-2
    color: theme.colors.textSecondary, // Giữ nguyên
    textAlign: 'center',
  },
  columnPo: { flex: 2, textAlign: 'left' },
  columnBox: { flex: 1, textAlign: 'center' },
  columnBatch: { flex: 1, textAlign: 'center' },
  columnQuantity: { flex: 2, textAlign: 'right', fontWeight: 'bold' }, // Giữ nguyên fontWeight
  disabledText: {
    color: theme.colors.grey, // Giữ nguyên
  },
});

export default IndividualEntryDetailRow;