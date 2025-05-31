// src/screens/InputTab/components/DailyCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../../theme';
import { DailyProductionData } from '../../../types/data'; //
import AggregatedEntryRow from './AggregatedEntryRow'; //
import AdditionalInfo from './AdditionalInfo'; //

interface DailyCardProps {
  userId: string;
  dailyInfo: DailyProductionData; //
  weekHasData: boolean;
  onAddProduction: (date: string) => void;
}

const DailyCard: React.FC<DailyCardProps> = ({
  userId,
  dailyInfo,
  weekHasData,
  onAddProduction,
}) => {
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const [isFullDayLeave, setIsFullDayLeave] = useState(false);


  const handleFullDayLeaveChange = (isFullDay: boolean) => {
    setIsFullDayLeave(isFullDay);
  };

  // Tính toán xem tất cả entries trong ngày có được xác minh không
  // Kiểm tra dailyInfo.entries.length > 0 để tránh .every() trên mảng rỗng trả về true
  const dayIsFullyVerified = dailyInfo.entries.length > 0 && dailyInfo.entries.every(entry => entry.verified === true); //

  const groupedEntries = dailyInfo.entries.reduce((acc, entry) => {
    const key = entry.stageCode; //
    if (!acc[key]) {
      acc[key] = {
        totalQuantity: 0,
        items: [],
      };
    }
    acc[key].totalQuantity += entry.quantity; //
    acc[key].items.push(entry);
    return acc;
  }, {} as Record<string, { totalQuantity: number; items: Array<typeof dailyInfo.entries[0]> }>);

  const sortedGroupKeys = Object.keys(groupedEntries).sort();

  return (
    <View style={styles.dailyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDateText}>{`${dailyInfo.dayOfWeek}, ${dailyInfo.formattedDate}`}</Text>
        {weekHasData && <Text style={styles.cardTotalWorkText}>Tổng công: {dailyInfo.totalWorkForDay != null ? dailyInfo.totalWorkForDay.toLocaleString() : '0'}</Text>}
      </View>

      <View style={styles.entriesContainer}>
        {sortedGroupKeys.length > 0 ? (
          sortedGroupKeys.map((stageCode, index) => {
            const groupData = groupedEntries[stageCode];
            return (
              <React.Fragment key={stageCode}>
                <AggregatedEntryRow
                  stageCode={stageCode}
                  totalQuantity={groupData.totalQuantity}
                  items={groupData.items}
                  disabled={isFullDayLeave}
                  isDayFullyVerified={dayIsFullyVerified} // <<< TRUYỀN PROP MỚI
                />
                {sortedGroupKeys.length > 1 && index < sortedGroupKeys.length - 1 && (
                   <View style={styles.divider} />
                )}
              </React.Fragment>
            );
          })
        ) : (
          <Text style={[styles.noEntryText, isFullDayLeave && styles.disabledText]}>Chưa có dữ liệu</Text>
        )}
      </View>

      <View style={styles.footerActionContainer}>
        <TouchableOpacity
          style={[styles.addProductionButton, isFullDayLeave && styles.disabledButton]}
          onPress={() => {
            if (!isFullDayLeave) {
              onAddProduction(dailyInfo.date); //
            }
          }}
          disabled={isFullDayLeave}
        >
          <Ionicons name="add-circle-outline" size={22} color={isFullDayLeave ? theme.colors.grey : theme.colors.primary} />
          <Text style={[styles.addProductionButtonText, isFullDayLeave && { color: theme.colors.grey }]}>Thêm sản lượng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded)}
        >
          <Ionicons
            name={isAdditionalInfoExpanded ? "chevron-up-outline" : "chevron-down-outline"}
            size={24}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {isAdditionalInfoExpanded && (
        <AdditionalInfo
            userId={userId}
            date={dailyInfo.date} //
            isFullDayLeave={isFullDayLeave}
            onFullDayLeaveChange={handleFullDayLeaveChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dailyCard: {
    marginVertical: theme.spacing['level-2'],
    padding: 0, 
    borderRadius: theme.borderRadius['level-4'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing['level-2'],
    paddingTop: theme.spacing['level-2'],
    paddingHorizontal: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    backgroundColor: theme.colors.background1,
  },
  cardDateText: {
    fontSize: theme.typography.fontSize['level-2'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  cardTotalWorkText: {
    fontSize: theme.typography.fontSize['level-2'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.info,
  },
  entriesContainer: {
  },
  noEntryText: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing['level-4'],
    paddingHorizontal: theme.spacing['level-4'],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderColor,
    marginLeft: theme.spacing['level-7'], 
  },
  footerActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing['level-1'],
    paddingHorizontal: theme.spacing['level-4'],
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  addProductionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing['level-1'],
  },
  addProductionButtonText: {
    marginLeft: theme.spacing['level-1'],
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize['level-2'],
    fontWeight: theme.typography.fontWeight['bold'],
  },
  expandButton: {
    padding: theme.spacing['level-2'],
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledText: {
    color: theme.colors.grey,
  },
});

export default DailyCard;