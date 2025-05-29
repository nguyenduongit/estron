// src/screens/InputTab/components/AggregatedEntryRow.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../../theme';
import IndividualEntryDetailRow from './IndividualEntryDetailRow';

type ProductionItem = {
  id: string;
  stageCode: string;
  quantity: number;
  workAmount?: number;
  po?: string | null;
  box?: string | null;
  batch?: string | null;
};

interface AggregatedEntryRowProps {
  stageCode: string;
  totalQuantity: number;
  items: ProductionItem[];
  disabled?: boolean;
}

const AggregatedEntryRow: React.FC<AggregatedEntryRowProps> = ({
  stageCode,
  totalQuantity,
  items,
  disabled,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpansion} style={styles.mainRowTouchable} disabled={disabled}>
        <View style={[styles.mainRowContainer, disabled && styles.disabledVisual]}>
          <View style={styles.mainInfo}>
            <Text style={[styles.stageCodeText, disabled && styles.disabledText]}>{stageCode}</Text>
            <Text style={[styles.totalQuantityText, disabled && styles.disabledText]}>
              Tổng: {totalQuantity.toLocaleString()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: theme.spacing['level-4'],
    paddingVertical: theme.spacing['level-2'],
    backgroundColor: theme.colors.cardBackground,
  },
  mainInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: theme.spacing['level-2'],
  },
  stageCodeText: {
    fontSize: theme.typography['level-3'].fontSize,
    fontWeight: theme.typography['level-3-bold'].fontWeight,
    color: theme.colors.text,
    paddingLeft: theme.spacing['level-2'],
  },
  totalQuantityText: {
    fontSize: theme.typography['level-3'].fontSize,
    fontWeight: theme.typography['level-3-bold'].fontWeight,
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
    fontSize: theme.typography['level-2'].fontSize,
    fontWeight: theme.typography['level-2-bold'].fontWeight,
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
