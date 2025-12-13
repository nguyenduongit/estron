// src/screens/InputTab/components/DailyCard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../../theme';
import { DailyProductionData, DailySupplementaryData, ProductionEntry } from '../../../types/data';
import AggregatedEntryRow from './AggregatedEntryRow';
import AdditionalInfo from './AdditionalInfo';

const dayColorMap: { [key: string]: keyof typeof theme.colors } = {
  'Chủ Nhật': 'sunday',
  'Thứ 2': 'monday',
  'Thứ 3': 'tuesday',
  'Thứ 4': 'wednesday',
  'Thứ 5': 'thursday',
  'Thứ 6': 'friday',
  'Thứ 7': 'saturday',
};

interface DailyCardProps {
  userId: string;
  dailyInfo: DailyProductionData;
  weekHasData: boolean;
  onAddProduction: (date: string) => void;
  onEditEntry: (entry: ProductionEntry) => void;
}

const DailyCard: React.FC<DailyCardProps> = ({
  userId,
  dailyInfo,
  weekHasData,
  onAddProduction,
  onEditEntry,
}) => {
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const [suppData, setSuppData] = useState<DailySupplementaryData | null | undefined>(
    dailyInfo.supplementaryData
  );
  const [isFullDayLeave, setIsFullDayLeave] = useState(
    dailyInfo.supplementaryData?.leaveHours === 8
  );

  useEffect(() => {
    setSuppData(dailyInfo.supplementaryData);
    setIsFullDayLeave(dailyInfo.supplementaryData?.leaveHours === 8);
  }, [dailyInfo.supplementaryData]);

  const handleFullDayLeaveChange = (isFullDay: boolean) => {
    setIsFullDayLeave(isFullDay);
  };

  const handleSuppDataChange = (newData: DailySupplementaryData) => {
    setSuppData(newData);
    if (newData.leaveHours === 8) {
      setIsFullDayLeave(true);
    } else {
      if (isFullDayLeave) setIsFullDayLeave(false);
    }
  };

  const dayIsFullyVerified =
    dailyInfo.entries.length > 0 && dailyInfo.entries.every(entry => entry.verified === true);

  const groupedEntries = dailyInfo.entries.reduce(
    (acc, entry) => {
      const key = entry.stageCode;
      if (!acc[key]) {
        acc[key] = {
          totalQuantity: 0,
          items: [],
        };
      }
      acc[key].totalQuantity += entry.quantity || 0;

      const fullEntry: ProductionEntry = {
        ...entry,
        product_code: entry.stageCode,
        date: dailyInfo.date,
      };

      acc[key].items.push(fullEntry);
      return acc;
    },
    {} as Record<string, { totalQuantity: number; items: ProductionEntry[] }>
  );

  const sortedGroupKeys = Object.keys(groupedEntries).sort();

  const dayIndicatorColor = dayColorMap[dailyInfo.dayOfWeek]
    ? theme.colors[dayColorMap[dailyInfo.dayOfWeek]]
    : 'transparent';

  // --- LOGIC MỚI: Xử lý màu sắc cho Tổng công ---
  const totalWork = dailyInfo.totalWorkForDay ?? 0;

  // SỬA ĐỔI: Thứ 7 chỉ tiêu là 0.5 công, các ngày khác (T2-T6) là 1 công
  const standardThreshold = dailyInfo.dayOfWeek === 'Thứ 7' ? 0.5 : 1;

  const totalWorkColor =
    totalWork >= standardThreshold ? theme.colors.success : theme.colors.danger;

  return (
    <View style={styles.dailyCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.slantedCorner, { borderTopColor: dayIndicatorColor }]} />
        <Text style={styles.cardDateText}>
          {`${dailyInfo.dayOfWeek}, ${dailyInfo.formattedDate}`}
        </Text>
        <View style={styles.headerRightContainer}>
          <View style={styles.iconGroup}>
            {suppData?.overtimeHours && suppData.overtimeHours > 0 && (
              <Ionicons
                name="time"
                size={14}
                color={suppData.overtimeVerified ? theme.colors.success : theme.colors.grey}
              />
            )}
            {suppData?.meetingMinutes && suppData.meetingMinutes > 0 && (
              <Ionicons
                name="briefcase"
                size={14}
                color={suppData.meetingVerified ? theme.colors.success : theme.colors.grey}
                style={styles.headerIcon}
              />
            )}
            {suppData?.leaveHours && suppData.leaveHours > 0 && (
              <Ionicons
                name="bed"
                size={14}
                color={suppData.leaveVerified ? theme.colors.success : theme.colors.grey}
                style={styles.headerIcon}
              />
            )}
          </View>
          {weekHasData && (
            <View style={styles.cardTotalWorkContainer}>
              <Text style={styles.cardTotalWorkLabel}>Tổng công: </Text>
              {/* Áp dụng màu sắc động tại đây */}
              <Text style={[styles.cardTotalWorkValue, { color: totalWorkColor }]}>
                {totalWork.toFixed(3)}
              </Text>
            </View>
          )}
        </View>
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
                  isDayFullyVerified={dayIsFullyVerified}
                  onEdit={onEditEntry}
                />
                {sortedGroupKeys.length > 1 && index < sortedGroupKeys.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            );
          })
        ) : (
          <Text style={[styles.noEntryText, isFullDayLeave && styles.disabledText]}>
            Chưa có dữ liệu
          </Text>
        )}
      </View>

      <View style={styles.footerActionContainer}>
        <TouchableOpacity
          style={[styles.addProductionButton, isFullDayLeave && styles.disabledButton]}
          onPress={() => {
            if (!isFullDayLeave) {
              onAddProduction(dailyInfo.date);
            }
          }}
          disabled={isFullDayLeave}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={isFullDayLeave ? theme.colors.grey : theme.colors.primary}
          />
          <Text
            style={[styles.addProductionButtonText, isFullDayLeave && { color: theme.colors.grey }]}
          >
            Thêm sản lượng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded)}
        >
          <Ionicons
            name={isAdditionalInfoExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {isAdditionalInfoExpanded && (
        <AdditionalInfo
          userId={userId}
          date={dailyInfo.date}
          initialData={suppData}
          isFullDayLeave={isFullDayLeave}
          onFullDayLeaveChange={handleFullDayLeaveChange}
          onDataChange={handleSuppDataChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dailyCard: {
    marginVertical: theme.spacing['level-2'],
    borderRadius: theme.borderRadius['level-4'],
    borderWidth: 2,
    borderColor: theme.colors.borderColor,
    backgroundColor: theme.colors.cardBackground,
    ...theme.shadow.lg,
  },
  cardHeader: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    backgroundColor: theme.colors.background3,
    borderTopLeftRadius: theme.borderRadius['level-4'],
    borderTopRightRadius: theme.borderRadius['level-4'],
    overflow: 'hidden',
  },
  slantedCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: 20,
    borderTopWidth: 20,
    borderRightColor: 'transparent',
  },
  headerRightContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: theme.spacing['level-3'],
  },
  headerIcon: {
    marginLeft: theme.spacing['level-2'],
  },
  cardDateText: {
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    marginLeft: theme.spacing['level-2'],
  },
  cardTotalWorkContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cardTotalWorkLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    fontStyle: 'italic',
    color: theme.colors.text,
    textAlign: 'right',
    paddingRight: theme.spacing['level-1'],
  },
  cardTotalWorkValue: {
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: theme.typography.fontWeight['bold'],
    // color: theme.colors.success, // Đã xóa dòng này để dùng inline style
    textAlign: 'right',
  },
  entriesContainer: {},
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
  },
  footerActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['level-4'],
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  addProductionButton: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addProductionButtonText: {
    marginLeft: theme.spacing['level-1'],
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize['level-2'],
    fontWeight: theme.typography.fontWeight['bold'],
  },
  expandButton: {
    height: 36,
    justifyContent: 'center',
    paddingLeft: theme.spacing['level-8'],
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledText: {
    color: theme.colors.grey,
  },
});

export default DailyCard;
