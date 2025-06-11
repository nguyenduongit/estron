// src/screens/StatisticsTab/StatisticsScreen.tsx
import React, { useState, useLayoutEffect, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';

import { BottomTabNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import {
  EstronMonthPeriod,
  getToday,
  getEstronMonthPeriod,
  calculateStandardWorkdays,
  formatToYYYYMMDD,
} from '../../utils/dateUtils';
import {
  getProductionEntriesByDateRange,
  getSupplementaryDataByDateRange,
  getUserProfile,
  getUserSelectedQuotas,
  getQuotaSettingByProductCode,
  getQuotaValueBySalaryLevel,
} from '../../services/storage';
import { supabase } from '../../services/supabase';
import Button from '../../components/common/Button';
import ModalWrapper from '../../components/common/ModalWrapper';
import { Profile } from '../../types/data';

type StatisticsScreenNavigationProp = BottomTabNavigationProp<BottomTabNavigatorParamList, 'StatisticsTab'>;

const AUTHOR_NAME = 'Nguyễn Quốc Dương';
const DONATE_INFO = {
  bank: 'Ngân hàng Vietcombank',
  accountNumber: '0421000518940',
  accountHolder: 'NGUYEN QUOC DUONG',
};

export default function StatisticsScreen() {
  const navigation = useNavigation<StatisticsScreenNavigationProp>();

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [currentEstronMonth, setCurrentEstronMonth] = useState<EstronMonthPeriod | null>(null);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const [standardWorkdaysForMonth, setStandardWorkdaysForMonth] = useState<number>(0);
  const [standardWorkdaysToCurrent, setStandardWorkdaysToCurrent] = useState<number>(0);
  const [totalProductWorkDone, setTotalProductWorkDone] = useState<number>(0);
  const [targetProductWork, setTargetProductWork] = useState<number>(0);
  const [totalOvertimeHours, setTotalOvertimeHours] = useState<number>(0);
  const [totalLeaveDays, setTotalLeaveDays] = useState<number>(0);
  const [totalMeetingHours, setTotalMeetingHours] = useState<number>(0);
  const [totalMeetingMinutes, setTotalMeetingMinutes] = useState<number>(0);
  const [isAuthorModalVisible, setIsAuthorModalVisible] = useState(false);

  const handleShowAuthorModal = useCallback(() => setIsAuthorModalVisible(true), []);
  const handleCloseAuthorModal = useCallback(() => setIsAuthorModalVisible(false), []);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Đã sao chép', `${text} đã được sao chép vào bộ nhớ tạm.`);
  };

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setErrorLoading(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        console.warn('StatisticsScreen: Không tìm thấy user.');
        setErrorLoading('Không thể tải thống kê do chưa xác thực người dùng.');
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: currentEstronMonth?.estronMonth ? `Thống kê tháng ${currentEstronMonth.estronMonth}` : 'Thống Kê Chung',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShowAuthorModal}
          style={{
            marginRight: Platform.OS === 'ios' ? theme.spacing['level-4'] : theme.spacing['level-4'],
            padding: theme.spacing['level-1'],
          }}
        >
          <Ionicons name="information-circle-outline" size={26} color={theme.colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, currentEstronMonth, handleShowAuthorModal]);

  const loadStatisticsData = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      const today = getToday();
      const monthInfo = getEstronMonthPeriod(today);
      setCurrentEstronMonth(monthInfo);

      if (monthInfo && monthInfo.startDate && monthInfo.endDate) {
        const startDateStr = formatToYYYYMMDD(monthInfo.startDate);
        const endDateStr = formatToYYYYMMDD(monthInfo.endDate);

        const workdaysForMonth = calculateStandardWorkdays(monthInfo.startDate, monthInfo.endDate);
        setStandardWorkdaysForMonth(workdaysForMonth);
        const cappedToday = today > monthInfo.endDate ? monthInfo.endDate : today;
        const workdaysToCurrent = calculateStandardWorkdays(monthInfo.startDate, cappedToday);
        setStandardWorkdaysToCurrent(workdaysToCurrent);

        const [profileData, userSelectedQuotas, productionEntries, supplementaryData] = await Promise.all([
          getUserProfile(userId),
          getUserSelectedQuotas(userId),
          getProductionEntriesByDateRange(userId, startDateStr, endDateStr),
          getSupplementaryDataByDateRange(userId, startDateStr, endDateStr),
        ]);

        setUserProfile(profileData);

        let calculatedTotalProductWorkDone = 0;
        if (profileData && profileData.salary_level && userSelectedQuotas.length > 0 && productionEntries.length > 0) {
          const productDailyQuotaMap = new Map<string, number>();
          await Promise.all(
            userSelectedQuotas.map(async usq => {
              const qs = await getQuotaSettingByProductCode(usq.product_code);
              if (qs) {
                const dailyQuota = getQuotaValueBySalaryLevel(qs, profileData.salary_level!);
                if (dailyQuota > 0) {
                  productDailyQuotaMap.set(usq.product_code, dailyQuota);
                }
              }
            })
          );

          productionEntries.forEach(entry => {
            if (entry.quantity != null && entry.product_code) {
              const dailyQuota = productDailyQuotaMap.get(entry.product_code);
              if (dailyQuota && dailyQuota > 0) {
                calculatedTotalProductWorkDone += entry.quantity / dailyQuota;
              }
            }
          });
        }
        setTotalProductWorkDone(parseFloat(calculatedTotalProductWorkDone.toFixed(2)));

        let currentTotalOvertime = 0;
        let currentTotalLeaveHours = 0;
        let currentTotalMeetingMinutes = 0;
        supplementaryData.forEach(item => {
          if (item.overtimeHours != null) currentTotalOvertime += item.overtimeHours;
          if (item.leaveHours != null) currentTotalLeaveHours += item.leaveHours;
          if (item.meetingMinutes != null) currentTotalMeetingMinutes += item.meetingMinutes;
        });

        setTotalMeetingMinutes(currentTotalMeetingMinutes);

        const finalTotalOvertimeHours = parseFloat(currentTotalOvertime.toFixed(2));
        const finalTotalLeaveDays = parseFloat((currentTotalLeaveHours / 8).toFixed(2));
        const finalTotalMeetingHours = parseFloat((currentTotalMeetingMinutes / 60).toFixed(2));

        setTotalOvertimeHours(finalTotalOvertimeHours);
        setTotalLeaveDays(finalTotalLeaveDays);
        setTotalMeetingHours(finalTotalMeetingHours);

        const calculatedTargetProductWork =
          workdaysToCurrent + finalTotalOvertimeHours / 8 - finalTotalLeaveDays - finalTotalMeetingHours / 8;
        setTargetProductWork(parseFloat(Math.max(0, calculatedTargetProductWork).toFixed(2)));
        setErrorLoading(null);
      } else {
        setErrorLoading('Không thể xác định thông tin tháng Estron hiện tại.');
      }
    } catch (error) {
      console.error('Error loading statistics data:', error);
      setErrorLoading('Đã có lỗi xảy ra khi tải dữ liệu thống kê.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        setIsLoading(true);
        setErrorLoading(null);
        loadStatisticsData();
      }
    }, [userId, loadStatisticsData])
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
          {userId ? 'Đang tải dữ liệu thống kê...' : 'Đang xác thực người dùng...'}
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
          onPress={() => {
            if (!userId) {
              const fetchUser = async () => {
                setIsLoading(true);
                setErrorLoading(null);
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (user) {
                  setUserId(user.id);
                } else {
                  setErrorLoading('Chưa xác thực người dùng.');
                  setIsLoading(false);
                }
              };
              fetchUser();
            } else {
              setIsLoading(true);
              setErrorLoading(null);
              loadStatisticsData();
            }
          }}
          style={{ marginTop: theme.spacing['level-4'] }}
        />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-circle-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>Vui lòng đăng nhập để xem thống kê.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.statsContainer}>
        {userProfile && (
          <View style={styles.profileHeader}>
            <Text style={styles.profileHeaderText}>
              {`${userProfile.full_name || ''} - ${(userProfile.username || '').toUpperCase()}`}
            </Text>
          </View>
        )}
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
      </View>

      <ModalWrapper visible={isAuthorModalVisible} onClose={handleCloseAuthorModal}>
        <View style={styles.authorModalContainer}>
          <View style={styles.authorModalHeader}>
            <Text style={styles.authorModalTitle}>Thông tin tác giả</Text>
            <TouchableOpacity onPress={handleCloseAuthorModal} style={styles.customCloseButton}>
              <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.authorText}>Ứng dụng được phát triển bởi:</Text>
          <Text style={styles.authorName}>{AUTHOR_NAME}</Text>
          <View style={styles.divider} />
          <Text style={styles.donateTitle}>Ủng hộ tác giả:</Text>
          <Text style={styles.donateText}>
            Nếu bạn thấy ứng dụng này hữu ích, bạn có thể ủng hộ một ly cafe cho tác giả qua:
          </Text>
          <View style={styles.donateInfoRow}>
            <Text style={styles.donateBank}>{DONATE_INFO.bank}</Text>
          </View>
          <View style={styles.donateInfoRow}>
            <Text style={styles.donateAccountLabel}>Chủ TK:</Text>
            <Text style={styles.donateAccountValue}>{DONATE_INFO.accountHolder}</Text>
          </View>
          <View style={styles.donateInfoRow}>
            <Text style={styles.donateAccountLabel}>Số TK:</Text>
            <Text style={styles.donateAccountValue}>{DONATE_INFO.accountNumber}</Text>
            <TouchableOpacity onPress={() => copyToClipboard(DONATE_INFO.accountNumber)} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <Button title="Đóng" onPress={handleCloseAuthorModal} style={styles.closeModalButton} />
        </View>
      </ModalWrapper>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background1 },
  contentContainer: { padding: theme.spacing['level-3'], flexGrow: 1 },
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
    borderRadius: theme.borderRadius['level-4'],
    ...theme.shadow.md,
  },
  profileHeader: {
    paddingVertical: theme.spacing['level-3'],
    paddingHorizontal: theme.spacing['level-4'],
    backgroundColor: theme.colors.background3,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    borderTopLeftRadius: theme.borderRadius['level-4'],
    borderTopRightRadius: theme.borderRadius['level-4'],
  },
  profileHeaderText: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.primary,
    textAlign: 'center',
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
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderColor,
    marginTop: theme.spacing['level-3'],
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
  footerTextSuccess: {
    color: theme.colors.success,
  },
  footerTextDanger: {
    color: theme.colors.danger,
  },
  footerTextNeutral: {
    color: theme.colors.text,
  },
  authorModalContainer: { alignItems: 'center', paddingHorizontal: theme.spacing['level-2'] },
  authorModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing['level-6'],
    paddingBottom: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    position: 'relative',
  },
  authorModalTitle: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  customCloseButton: {
    position: 'absolute',
    right: -theme.spacing['level-2'],
    top: -theme.spacing['level-2'],
    padding: theme.spacing['level-1'],
  },
  authorText: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['level-1'],
  },
  authorName: {
    fontSize: theme.typography.fontSize['level-5'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.primary,
    marginBottom: theme.spacing['level-4'],
  },
  donateTitle: {
    fontSize: theme.typography.fontSize['level-5'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    marginBottom: theme.spacing['level-2'],
  },
  donateText: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['level-2'],
    paddingHorizontal: theme.spacing['level-2'],
  },
  donateInfoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing['level-1'] },
  donateBank: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing['level-1'],
  },
  donateAccountLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    marginRight: theme.spacing['level-1'],
  },
  donateAccountValue: { fontSize: theme.typography.fontSize['level-4'], color: theme.colors.text, fontWeight: '500' },
  copyButton: { marginLeft: theme.spacing['level-4'], padding: theme.spacing['level-1'] },
  closeModalButton: { marginTop: theme.spacing['level-6'], width: '60%' },
});