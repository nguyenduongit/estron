// src/screens/StatisticsTab/StatisticsScreen.tsx
import React, { useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { addDays } from 'date-fns';

import { BottomTabNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import {
  formatDate,
  getToday,
  getEstronMonthPeriod, // <<< THAY ĐỔI: IMPORT THÊM
} from '../../utils/dateUtils';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../stores/authStore';
import { 
  useProductionStore, 
  WeeklyStatistics, 
  WeeklyProductStat 
} from '../../stores/productionStore';

if (Platform.OS === 'web') {
  const styleId = 'hide-statistics-scrollbar-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-testid="statistics-scroll-view"]::-webkit-scrollbar {
        display: none;
      }
      [data-testid="statistics-scroll-view"] {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
  }
}

type StatisticsScreenNavigationProp = BottomTabNavigationProp<
  BottomTabNavigatorParamList,
  'StatisticsTab'
>;

export default function StatisticsScreen() {
  const navigation = useNavigation<StatisticsScreenNavigationProp>();
  const activeUserId = useAuthStore(state => state.authUser?.profile.id);
  
  const isLoading = useProductionStore(state => state.isLoading);
  const error = useProductionStore(state => state.error);
  const statistics = useProductionStore(state => state.statistics);
  const estronWeekInfo = useProductionStore(state => state.estronWeekInfo);
  const initialize = useProductionStore(state => state.initialize);
  const setTargetDate = useProductionStore(state => state.setTargetDate);

  useFocusEffect(
    useCallback(() => {
      if (activeUserId) {
        initialize(activeUserId);
      }
    }, [activeUserId, initialize])
  );

  const handleNavigateToPreviousMonth = useCallback(() => {
    if (estronWeekInfo) {
      const previousMonthDate = addDays(estronWeekInfo.estronMonth.startDate, -1);
      setTargetDate(previousMonthDate);
    }
  }, [estronWeekInfo, setTargetDate]);

  const handleNavigateToCurrentMonth = useCallback(() => {
    setTargetDate(getToday());
  }, [setTargetDate]);

  useLayoutEffect(() => {
    // <<< START: LOGIC SỬA LỖI >>>
    const currentEstronMonth = getEstronMonthPeriod(getToday());
    const isViewingPreviousMonth = estronWeekInfo?.estronMonth.name !== currentEstronMonth.name;
    // <<< END: LOGIC SỬA LỖI >>>

    navigation.setOptions({
      title: estronWeekInfo
        ? `Thống kê tháng ${estronWeekInfo.estronMonth.estronMonth}`
        : 'Thống Kê Sản Lượng',
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleNavigateToPreviousMonth}
          disabled={isViewingPreviousMonth} // Vô hiệu hóa khi đang ở tháng trước
          style={{ marginLeft: Platform.OS === 'ios' ? 10 : 20, padding: 5 }}
        >
          <Ionicons name={'caret-back'} size={26} color={isViewingPreviousMonth ? theme.colors.grey : theme.colors.textOnPrimary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNavigateToCurrentMonth}
          disabled={!isViewingPreviousMonth} // Vô hiệu hóa khi đang ở tháng hiện tại
          style={{ marginRight: Platform.OS === 'ios' ? 10 : 20, padding: 5 }}
        >
          <Ionicons
            name={'caret-forward'}
            size={26}
            color={!isViewingPreviousMonth ? theme.colors.grey : theme.colors.textOnPrimary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, estronWeekInfo, handleNavigateToPreviousMonth, handleNavigateToCurrentMonth]);

  const renderStatRow = (label: string, value: string | number, unit?: string) => (
    <View style={styles.statsRow}>
      <Text style={styles.statsLabel}>{label}</Text>
      <View style={styles.statsValueContainer}>
        <Text style={styles.statsValue}>{typeof value === 'number' ? value.toFixed(2) : value}</Text>
        {unit && <Text style={styles.statsUnit}>{unit}</Text>}
      </View>
    </View>
  );

  if (isLoading && !statistics) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning-outline" size={48} color={theme.colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Thử Lại"
          onPress={() => activeUserId && initialize(activeUserId)}
          style={{ marginTop: theme.spacing['level-4'] }}
        />
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={styles.centered}>
        <Ionicons name="information-circle-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Không có dữ liệu thống kê để hiển thị.</Text>
      </View>
    );
  }

  const {
    standardWorkdaysForMonth,
    standardWorkdaysToCurrent,
    totalProductWorkDone,
    monthlyTargetWork,
    totalLeaveDays,
    totalOvertimeHours,
    totalMeetingMinutes,
    weeklyStatistics,
  } = statistics;

  return (
    <ScrollView
      testID="statistics-scroll-view"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.statsContainer}>
        {renderStatRow(`Ngày công chuẩn tháng ${estronWeekInfo?.estronMonth.estronMonth || ''}`, standardWorkdaysForMonth.toFixed(1), 'ngày')}
        {renderStatRow('Ngày công tính đến hiện tại', standardWorkdaysToCurrent.toFixed(1), 'ngày')}
        {renderStatRow('Công sản phẩm cần thực hiện', monthlyTargetWork, 'công')}
        {renderStatRow('Công sản phẩm đã thực hiện', totalProductWorkDone, 'công')}
        {renderStatRow('Số ngày nghỉ', totalLeaveDays.toFixed(1), 'ngày')}
        {renderStatRow('Số giờ tăng ca', totalOvertimeHours.toFixed(0), 'giờ')}
        {renderStatRow('Hỗ trợ', totalMeetingMinutes.toFixed(0), 'phút')}
        
        <View style={styles.footerContainer}>
          {(() => {
            const diff = totalProductWorkDone - monthlyTargetWork;
            if (diff >= 0) {
              return <Text style={[styles.footerText, styles.footerTextSuccess]}>Bạn đang dư {diff.toFixed(3)} công</Text>;
            }
            return <Text style={[styles.footerText, styles.footerTextDanger]}>Bạn đang thiếu {Math.abs(diff).toFixed(3)} công</Text>;
          })()}
        </View>
      </View>

      <View style={styles.weeklyStatsSection}>
        <Text style={styles.sectionTitle}>THỐNG KÊ TUẦN</Text>
        {weeklyStatistics.map((weekStat: WeeklyStatistics) => {
          const weeklyTarget = weekStat.weeklyTarget ?? 0;
          const totalWorkInWeek = weekStat.totalWorkInWeek ?? 0;
          const isTargetMet = totalWorkInWeek >= weeklyTarget;

          return (
            <View key={weekStat.weekInfo.name} style={styles.weekCard}>
              <View style={styles.weekCardTop}>
                <Text style={styles.weekCardTitle} numberOfLines={1}>
                  {`${weekStat.weekInfo.name} `}
                  <Text style={styles.dateRangeText}>
                    {`(${formatDate(new Date(weekStat.weekInfo.startDate), 'dd/MM')} - ${formatDate(new Date(weekStat.weekInfo.endDate), 'dd/MM')})`}
                  </Text>
                </Text>
                <View style={styles.targetContainer}>
                  <Text style={styles.targetLabel}>Mục tiêu: </Text>
                  <Text style={styles.targetValue}>{weeklyTarget.toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.weekCardBody}>
                {(weekStat.productStats && weekStat.productStats.length > 0) || (weekStat.totalMeetingMinutesInWeek ?? 0) > 0 ? (
                  <>
                    {weekStat.productStats?.map((prodStat: WeeklyProductStat, index: number) => (
                      <View key={prodStat.product_code} style={[styles.productStatRow, index !== 0 && styles.rowBorderTop]}>
                        <Text style={[styles.columnText, styles.columnCode]}>{prodStat.product_code}</Text>
                        <View style={styles.columnQuantityContainer}>
                            <Text style={styles.quantityValue}>{prodStat.total_quantity.toLocaleString()}</Text>
                            <Text style={styles.quantityUnit}>pcs</Text>
                        </View>
                        <Text style={[styles.columnText, styles.columnWork]}>{prodStat.total_work_done.toFixed(3)}</Text>
                      </View>
                    ))}
                    {(weekStat.totalMeetingMinutesInWeek ?? 0) > 0 && (
                      <View style={[styles.productStatRow, (weekStat.productStats && weekStat.productStats.length > 0) && styles.rowBorderTop]}>
                        <Text style={[styles.columnText, styles.columnCode]}>Hỗ trợ</Text>
                        <View style={styles.columnQuantityContainer}>
                            <Text style={styles.quantityValue}>{weekStat.totalMeetingMinutesInWeek}</Text>
                            <Text style={styles.quantityUnit}>phút</Text>
                        </View>
                        <Text style={[styles.columnText, styles.columnWork]}>{((weekStat.totalMeetingMinutesInWeek ?? 0) / 480).toFixed(3)}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.noDataText}>Không có dữ liệu sản phẩm trong tuần</Text>
                )}
              </View>

              <View style={styles.weekCardFooter}>
                <Text style={styles.weekCardTotalWorkLabel}>Tổng công tuần</Text>
                <Text style={[styles.weekCardTotalWorkValue, { color: isTargetMet ? theme.colors.success : theme.colors.danger }]}>
                  {totalWorkInWeek.toFixed(3)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ... styles không thay đổi ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background1 },
  contentContainer: { flexGrow: 1, paddingBottom: theme.spacing['level-7'] },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['level-6'],
  },
  loadingText: {
    marginTop: theme.spacing['level-4'],
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: theme.spacing['level-4'],
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.danger,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: theme.colors.background2,
    ...theme.shadow.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing['level-3'],
    paddingHorizontal: theme.spacing['level-4'],
    borderBottomWidth: 0.3,
    borderBottomColor: theme.colors.borderColor,
  },
  statsLabel: {
    flex: 2,
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    // marginBottom: theme.spacing['level-2'],
  },
  statsValueContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsValue: {
    flex:1,
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight['bold'],
    textAlign: 'right',
    paddingRight: theme.spacing['level-2'],
  },
  statsUnit: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    fontStyle: 'italic',
    textAlign: 'left',
    minWidth: 40,
  },
  footerContainer: {
    paddingVertical: theme.spacing['level-4'],
    paddingHorizontal: theme.spacing['level-4'],
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize['level-5'],
    fontWeight: theme.typography.fontWeight['bold'],
  },
  footerTextSuccess: { color: theme.colors.success },
  footerTextDanger: { color: theme.colors.danger },
  footerTextNeutral: { color: theme.colors.text },
  weeklyStatsSection: {
    marginTop: theme.spacing['level-6'],
    paddingHorizontal: theme.spacing['level-3'],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    marginBottom: theme.spacing['level-4'],
    textAlign: 'center'
  },
   weekCard: {
    backgroundColor: theme.colors.background2,
    borderRadius: theme.borderRadius['level-4'],
    marginBottom: theme.spacing['level-4'],
    ...theme.shadow.md,
    overflow: 'hidden', // << Thêm dòng này
  },
  weekCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing['level-3'],
    paddingHorizontal: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    backgroundColor: theme.colors.background3, // << Thêm dòng này
  },
  weekCardTitle: {
    flexShrink: 1,
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    marginRight: theme.spacing['level-2'],
  },
  dateRangeText: {
    fontStyle: 'italic',
    fontWeight: 'normal',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize['level-3'],

  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  targetLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    fontStyle:theme.typography.fontStyle['italic'],
    color: theme.colors.textSecondary,
  },
  targetValue: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  weekCardBody: {
    paddingHorizontal: theme.spacing['level-4'],
  },
  noDataText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing['level-4'],
  },
  productStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing['level-3'],
  },
  rowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  columnText: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
  },
  columnCode: {
    flex: 2,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  columnQuantityContainer: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityValue: {
    flex: 1,
    textAlign: 'right',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize['level-3'],
    paddingRight: theme.spacing['level-1'],
  },
  quantityUnit: {
    flex: 1,
    textAlign: 'left',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize['level-2'],
    fontStyle: 'italic',
    paddingLeft: theme.spacing['level-1'],
  },
  columnWork: {
    flex: 2,
    textAlign: 'right',
    fontWeight: 'bold',
  },
   weekCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background3, // << Thay đổi ở đây
    paddingVertical: theme.spacing['level-3'],
    paddingHorizontal: theme.spacing['level-4'],
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  weekCardTotalWorkLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  weekCardTotalWorkValue: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: 'bold',
  },
});
