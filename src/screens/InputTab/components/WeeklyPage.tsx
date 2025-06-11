import React from 'react';
import { View, Text, StyleSheet, Platform, ViewStyle } from 'react-native';
import { theme } from '../../../theme';
import { DailyProductionData, ProductionEntry } from '../../../types/data';
import { EstronWeekPeriod, formatDate } from '../../../utils/dateUtils';
import DailyCard from './DailyCard';

interface ProcessedWeekData {
  weekInfo: EstronWeekPeriod;
  dailyData: DailyProductionData[];
  totalWeeklyWork: number;
}

interface WeeklyPageProps {
  userId: string;
  weekData: ProcessedWeekData;
  quotasExist: boolean;
  onAddProduction: (date: string) => void;
  onEditEntry: (entry: ProductionEntry) => void;
}

const WeeklyPage: React.FC<WeeklyPageProps> = ({ userId, weekData, quotasExist, onAddProduction, onEditEntry }) => {
  // SỬA LỖI: Tạo một đối tượng style riêng cho web để xử lý 'position: sticky'
  // Dùng 'as any' để TypeScript bỏ qua việc kiểm tra giá trị 'sticky' chỉ dành cho web
  const stickyHeaderStyle: ViewStyle = Platform.select({
    web: {
      position: 'sticky' as any,
      top: 0,
      zIndex: 10,
    },
    default: {}, // Không áp dụng style đặc biệt cho native
  });

  return (
    <View style={styles.pageStyle}>
      {/* Áp dụng cả style cơ bản và style sticky cho header */}
      <View style={[styles.weekHeader, stickyHeaderStyle]}>
        <View>
          <Text style={styles.weekName}>{weekData.weekInfo.name}</Text>
          <Text style={styles.weekDateRange}>
            ({formatDate(weekData.weekInfo.startDate, 'dd/MM')} - {formatDate(weekData.weekInfo.endDate, 'dd/MM')})
          </Text>
        </View>
        {quotasExist && (
          <View style={styles.totalWeeklyWorkContainer}>
            <Text style={styles.totalWeeklyWorkLabel}>Tổng công tuần:</Text>
            <Text style={styles.totalWeeklyWorkValue}>
              {weekData.totalWeeklyWork != null ? weekData.totalWeeklyWork.toLocaleString() : '0'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardsContainer}>
        {weekData.dailyData.slice().map(day => (
          <DailyCard
            userId={userId}
            key={day.date}
            dailyInfo={day}
            weekHasData={quotasExist}
            onAddProduction={onAddProduction}
            onEditEntry={onEditEntry}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pageStyle: {},
  weekHeader: {
    paddingVertical: theme.spacing['level-4'],
    paddingHorizontal: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background1,
    // Đã xóa 'position: sticky' khỏi đây để tránh lỗi
  },
  cardsContainer: {
    paddingHorizontal: theme.spacing['level-2'],
    paddingBottom: theme.spacing['level-8'],
  },
  weekName: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.primary,
  },
  weekDateRange: {
    fontSize: theme.typography.fontSize['level-2'],
    color: theme.colors.textSecondary,
  },
  totalWeeklyWorkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalWeeklyWorkLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    paddingRight: theme.spacing['level-1'],
  },
  totalWeeklyWorkValue: {
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.success,
  },
});

export default WeeklyPage;
