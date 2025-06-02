// src/screens/InputTab/components/AggregatedEntryRow.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../../theme';
import IndividualEntryDetailRow from './IndividualEntryDetailRow';
import { ProductionEntry } from '../../../types/data';

interface AggregatedEntryRowProps {
  stageCode: string;
  totalQuantity: number;
  items: ProductionEntry[];
  disabled?: boolean;
  isDayFullyVerified?: boolean;
  onEdit: (item: ProductionEntry) => void;
}

const AggregatedEntryRow: React.FC<AggregatedEntryRowProps> = ({
  stageCode,
  totalQuantity,
  items,
  disabled,
  isDayFullyVerified,
  onEdit,
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
          {items.map(item => (
            <IndividualEntryDetailRow 
              key={item.id} 
              item={item} 
              disabled={disabled} 
              onEdit={onEdit}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
  },
  mainRowTouchable: {},
  mainRowContainer: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: theme.spacing['level-4'],
    paddingRight: theme.spacing['level-4'],
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
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  totalQuantityText: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
  },
  detailsListContainer: {},
  disabledVisual: {
    opacity: 0.6,
  },
  disabledText: {
    color: theme.colors.grey,
  },
});

export default AggregatedEntryRow;