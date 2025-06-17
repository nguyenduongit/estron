// src/screens/StatisticsTab/StatisticsScreen.tsx
import React, { useState, useLayoutEffect, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { isBefore } from 'date-fns';

import { BottomTabNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import {
  EstronMonthPeriod,
  getToday,
  formatDate,
  EstronWeekPeriod,
  formatToYYYYMMDD,
  getDay,
  eachDayOfInterval,
} from '../../utils/dateUtils';
import {
  getStatisticsRPC,
  getProductionEntriesByDateRange,
  getSupplementaryDataByDateRange,
} from '../../services/storage';
import Button from '../../components/common/Button';
import { Profile } from '../../types/data';
import { useAuthStore } from '../../stores/authStore';

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

type StatisticsScreenNavigationProp = BottomTabNavigationProp<BottomTabNavigatorParamList, 'StatisticsTab'>;

interface WeeklyProductStat {
  product_code: string;
  product_name: string;
  total_quantity: number;
  total_work_done: number;
}

interface WeeklyStatistics {
  weekInfo: EstronWeekPeriod;
  productStats: WeeklyProductStat[] | null;
  totalWorkInWeek: number;
  totalMeetingMinutesInWeek?: number;
}

export default function StatisticsScreen() {
  const navigation = useNavigation<StatisticsScreenNavigationProp>();

  const [isLoading, setIsLoading] = useState(true);
  const activeUserId = useAuthStore(state => state.authUser?.profile.id);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [currentEstronMonth, setCurrentEstronMonth] = useState<EstronMonthPeriod | null>(null);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const [standardWorkdaysForMonth, setStandardWorkdaysForMonth] = useState<number>(0);
  const [standardWorkdaysToCurrent, setStandardWorkdaysToCurrent] = useState<number>(0);
  const [totalProductWorkDone, setTotalProductWorkDone] = useState<number>(0);
  const [targetProductWork, setTargetProductWork] = useState<number>(0);
  const [totalOvertimeHours, setTotalOvertimeHours] = useState<number>(0);
  const [totalLeaveDays, setTotalLeaveDays] = useState<number>(0);
  const [totalMeetingMinutes, setTotalMeetingMinutes] = useState<number>(0);
  const [weeklyStatistics, setWeeklyStatistics] = useState<WeeklyStatistics[]>([]);
  const [missingDataDays, setMissingDataDays] = useState<Date[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: userProfile
        ? `${userProfile.full_name || ''} - ${(userProfile.username || '').toUpperCase()}`
        : 'Thống Kê Chung',
    });
  }, [navigation, userProfile]);

  const loadStatisticsData = useCallback(async () => {
    if (!activeUserId) {
      return;
    }
    setIsLoading(true);
    setErrorLoading(null);
    setMissingDataDays([]);

    const today = getToday();
    const { data: stats, error } = await getStatisticsRPC(activeUserId, today);

    if (error) {
        console.error('Error loading statistics data via RPC:', error);
        setErrorLoading('Đã có lỗi xảy ra: ' + error.message);
    } else if (stats) {
        setUserProfile(stats.userProfile);
        setCurrentEstronMonth(stats.monthInfo);
        setStandardWorkdaysForMonth(stats.standardWorkdaysForMonth);
        setStandardWorkdaysToCurrent(stats.standardWorkdaysToCurrent);
        setTotalProductWorkDone(stats.totalProductWorkDone);
        setTargetProductWork(stats.targetProductWork);
        setTotalOvertimeHours(stats.totalOvertimeHours);
        setTotalLeaveDays(stats.totalLeaveDays);
        setTotalMeetingMinutes(stats.totalMeetingMinutes);
        setWeeklyStatistics(stats.weeklyStatistics || []);

        if (stats.monthInfo) {
          const startDate = stats.monthInfo.startDate;
          const endDate = isBefore(today, stats.monthInfo.endDate) ? today : stats.monthInfo.endDate;

          const [prodRes, suppRes] = await Promise.all([
            getProductionEntriesByDateRange(activeUserId, formatToYYYYMMDD(startDate), formatToYYYYMMDD(endDate)),
            getSupplementaryDataByDateRange(activeUserId, formatToYYYYMMDD(startDate), formatToYYYYMMDD(endDate)),
          ]);

          const productionEntries = prodRes.data || [];
          const supplementaryData = suppRes.data || [];

          const productionDates = new Set(productionEntries.map(e => e.date));
          const supplementaryDates = new Set(supplementaryData.map(d => d.date));
          const allDaysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
          const missingDays: Date[] = [];
          
          for (const day of allDaysInPeriod) {
            if (getDay(day) === 0) continue;
            
            const dateString = formatToYYYYMMDD(day);
            const hasProduction = productionDates.has(dateString);
            const hasSupplementary = supplementaryDates.has(dateString);
            
            if (!hasProduction && !hasSupplementary) {
              missingDays.push(day);
            }
          }
          setMissingDataDays(missingDays);
        }
    }
    setIsLoading(false);
  }, [activeUserId]);

  useFocusEffect(
    useCallback(() => {
      if (activeUserId) {
        loadStatisticsData();
      }
    }, [activeUserId, loadStatisticsData])
  );

  const renderFooter = () => {
    const diff = totalProductWorkDone - targetProductWork;
    if (diff > 0) {
      return <Text style={[styles.footerText, styles.footerTextSuccess]}>Bạn đang dư {diff.toFixed(2)} công</Text>;
    } else if (diff < 0) {
      return <Text style={[styles.footerText, styles.footerTextDanger]}>Bạn đang thiếu {Math.abs(diff).toFixed(2)} công</Text>;
    } else if (targetProductWork > 0) {
      return <Text style={[styles.footerText, styles.footerTextNeutral]}>Bạn đã hoàn thành mục tiêu công</Text>;
    }
    return null;
  };

  const renderStatRow = (label: string, value: string | number, unit?: string) => (
    <View style={styles.statsRow}>
      <Text style={styles.statsLabel}>{label}</Text>
      <View style={styles.statsValueContainer}>
        <Text style={styles.statsValue}>{value.toLocaleString()}</Text>
        {unit && <Text style={styles.statsUnit}>{unit}</Text>}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>
          {activeUserId ? 'Đang tải dữ liệu thống kê...' : 'Đang xác thực người dùng...'}
        </Text>
      </View>
    );
  }

  if (errorLoading) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning-outline" size={48} color={theme.colors.danger} />
        <Text style={styles.errorText}>{errorLoading}</Text>
        <Button
          title="Thử Lại"
          onPress={loadStatisticsData}
          style={{ marginTop: theme.spacing['level-4'] }}
        />
      </View>
    );
  }

  if (!activeUserId) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-circle-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Vui lòng đăng nhập để xem thống kê.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="statistics-scroll-view"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.statsContainer}>
        {renderStatRow(`Ngày công chuẩn tháng ${currentEstronMonth?.estronMonth || ''}:`, standardWorkdaysForMonth.toFixed(1), 'ngày')}
        {renderStatRow('Ngày công tính đến hiện tại:', standardWorkdaysToCurrent.toFixed(1), 'ngày')}
        {renderStatRow('Công sản phẩm cần thực hiện:', targetProductWork.toFixed(2), 'công')}
        {renderStatRow('Công sản phẩm đã thực hiện:', totalProductWorkDone.toFixed(2), 'công')}
        {renderStatRow('Số ngày nghỉ:', totalLeaveDays.toFixed(1), 'ngày')}
        {renderStatRow('Số giờ tăng ca:', totalOvertimeHours.toFixed(1), 'giờ')}
        {renderStatRow('Hỗ trợ:', totalMeetingMinutes, 'phút')}
        <View style={styles.footerContainer}>
          {renderFooter()}
        </View>
        {missingDataDays.length > 0 && (
          <View style={styles.warningContainer}>
            {missingDataDays.map(day => (
              <Text key={day.toISOString()} style={styles.warningText}>
                (Dữ liệu ngày {formatDate(day, 'dd/MM')} chưa được nhập!)
              </Text>
            ))}
          </View>
        )}
      </View>
      {weeklyStatistics.length > 0 && (
        <View style={styles.weeklyStatsSection}>
            <Text style={styles.sectionTitle}>Thống kê sản lượng theo tuần</Text>
            {weeklyStatistics.map(weekStat => (
                <View key={weekStat.weekInfo.name} style={styles.weekCard}>
                    <View style={styles.weekCardHeader}>
                        <Text style={styles.weekCardTitle}>{`${weekStat.weekInfo.name} (${formatDate(weekStat.weekInfo.startDate, 'dd/MM')} - ${formatDate(weekStat.weekInfo.endDate, 'dd/MM')})`}</Text>
                        <Text style={styles.weekCardTotalWork}>Tổng: {weekStat.totalWorkInWeek.toLocaleString()} công</Text>
                    </View>
                    <View style={styles.weekCardBody}>
                        {weekStat.productStats && weekStat.productStats.map((prodStat, index) => (
                            <View
                                key={prodStat.product_code}
                                style={[
                                    styles.productStatRow,
                                    (index < (weekStat.productStats?.length ?? 1) - 1 || (weekStat.totalMeetingMinutesInWeek ?? 0) > 0) && styles.productStatRowBorder
                                ]}
                            >
                                <Text style={styles.productNameText} numberOfLines={1}>{`${prodStat.product_code} `}</Text>
                                <Text style={styles.productValueText}>{`${prodStat.total_quantity.toLocaleString()} pcs (${prodStat.total_work_done.toLocaleString()} công)`}</Text>
                            </View>
                        ))}
                        {(weekStat.totalMeetingMinutesInWeek ?? 0) > 0 && (
                           <View style={styles.productStatRow}>
                                <Text style={styles.productNameText}>Hỗ trợ:</Text>
                                <Text style={styles.productValueText}>
                                    {`${weekStat.totalMeetingMinutesInWeek} phút (${((weekStat.totalMeetingMinutesInWeek ?? 0) / 480).toFixed(2)} công)`}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background1 },
  contentContainer: { flexGrow: 1, paddingBottom: theme.spacing['level-7'] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing['level-6'] },
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
    marginBottom: theme.spacing['level-2'],
  },
  statsValueContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsValue: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight['bold'],
    textAlign: 'right',
    minWidth: 80,
    paddingRight: theme.spacing['level-2'],
  },
  statsUnit: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    fontStyle: 'italic',
    textAlign: 'left',
    minWidth: 50,
  },
  footerContainer: {
    paddingVertical: theme.spacing['level-4'],
    paddingHorizontal: theme.spacing['level-4'],
    alignItems: 'center',
  },
  warningContainer: {
    paddingHorizontal: theme.spacing['level-4'],
    paddingBottom: theme.spacing['level-4'],
    alignItems: 'center',
    width: '100%',
  },
  warningText: {
    color: theme.colors.grey,
    fontStyle: 'italic',
    fontSize: theme.typography.fontSize['level-2'],
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
  },
  weekCard: {
    backgroundColor: theme.colors.background2,
    borderRadius: theme.borderRadius['level-4'],
    marginBottom: theme.spacing['level-4'],
    ...theme.shadow.md,
    overflow: 'hidden',
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background3,
    paddingVertical: theme.spacing['level-3'],
    paddingHorizontal: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  weekCardTitle: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  weekCardTotalWork: {
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.success,
  },
  weekCardBody: {
    padding: theme.spacing['level-4'],
    paddingVertical: 0,
  },
  productStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing['level-3'],
  },
  productStatRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  productNameText: {
    flex: 1.2,
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    marginRight: theme.spacing['level-2'],
  },
  productValueText: {
    flex: 1,
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  signOutButton: {
    marginTop: theme.spacing['level-7'],
    marginHorizontal: theme.spacing['level-3'],
  },
});