// src/screens/StatisticsTab/StatisticsScreen.tsx
import React, { useState, useLayoutEffect, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  LayoutChangeEvent
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PieChart } from "react-native-gifted-charts";
import * as Clipboard from 'expo-clipboard';

import { BottomTabNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { EstronMonthPeriod, getToday, getEstronMonthPeriod, calculateStandardWorkdays, formatToYYYYMMDD } from '../../utils/dateUtils';
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

type StatisticsScreenNavigationProp = BottomTabNavigationProp<BottomTabNavigatorParamList, 'StatisticsTab'>;

const AUTHOR_NAME = "Nguyễn Quốc Dương";
const DONATE_INFO = {
  bank: "Ngân hàng Vietcombank",
  accountNumber: "0421000518940",
  accountHolder: "NGUYEN QUOC DUONG"
};

export default function StatisticsScreen() {
  const navigation = useNavigation<StatisticsScreenNavigationProp>();

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentEstronMonth, setCurrentEstronMonth] = useState<EstronMonthPeriod | null>(null);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const [standardWorkdaysForMonth, setStandardWorkdaysForMonth] = useState<number>(0);
  const [standardWorkdaysToCurrent, setStandardWorkdaysToCurrent] = useState<number>(0);
  const [totalProductWorkDone, setTotalProductWorkDone] = useState<number>(0);
  const [targetProductWork, setTargetProductWork] = useState<number>(0);
  const [totalOvertimeHours, setTotalOvertimeHours] = useState<number>(0);
  const [totalLeaveDays, setTotalLeaveDays] = useState<number>(0);
  const [totalMeetingHours, setTotalMeetingHours] = useState<number>(0);
  const [isAuthorModalVisible, setIsAuthorModalVisible] = useState(false);

  const [contentWidth, setContentWidth] = useState(
    Platform.OS === 'web' ? 0 : Dimensions.get('window').width
  );
  const [layoutKey, setLayoutKey] = useState('initialKey');


  const handleShowAuthorModal = useCallback(() => setIsAuthorModalVisible(true), []);
  const handleCloseAuthorModal = useCallback(() => setIsAuthorModalVisible(false), []);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Đã sao chép", `${text} đã được sao chép vào bộ nhớ tạm.`);
  };

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setErrorLoading(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        console.warn("StatisticsScreen: Không tìm thấy user.");
        setErrorLoading("Không thể tải thống kê do chưa xác thực người dùng.");
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);


  useLayoutEffect(() => {
    navigation.setOptions({
      title: currentEstronMonth?.estronMonth
        ? `Thống kê tháng ${currentEstronMonth.estronMonth}`
        : 'Thống Kê Chung',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShowAuthorModal}
          style={{
            marginRight : Platform.OS === 'ios' ? theme.spacing['level-4'] : theme.spacing['level-4'], // md -> level-4
            padding: theme.spacing['level-1'], // xs -> level-1
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
    // ... (logic không đổi)
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

        const [
            userProfile,
            userSelectedQuotas,
            productionEntries,
            supplementaryData
        ] = await Promise.all([
            getUserProfile(userId),
            getUserSelectedQuotas(userId),
            getProductionEntriesByDateRange(userId, startDateStr, endDateStr),
            getSupplementaryDataByDateRange(userId, startDateStr, endDateStr),
        ]);

        let calculatedTotalProductWorkDone = 0;
        if (userProfile && userProfile.salary_level && userSelectedQuotas.length > 0 && productionEntries.length > 0) {
            const productDailyQuotaMap = new Map<string, number>();
            await Promise.all(userSelectedQuotas.map(async (usq) => {
                const qs = await getQuotaSettingByProductCode(usq.product_code);
                if (qs) {
                    const dailyQuota = getQuotaValueBySalaryLevel(qs, userProfile.salary_level!);
                    if (dailyQuota > 0) {
                        productDailyQuotaMap.set(usq.product_code, dailyQuota);
                    }
                }
            }));

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

        const finalTotalOvertimeHours = parseFloat(currentTotalOvertime.toFixed(2));
        const finalTotalLeaveDays = parseFloat((currentTotalLeaveHours / 8).toFixed(2));
        const finalTotalMeetingHours = parseFloat((currentTotalMeetingMinutes / 60).toFixed(2));

        setTotalOvertimeHours(finalTotalOvertimeHours);
        setTotalLeaveDays(finalTotalLeaveDays);
        setTotalMeetingHours(finalTotalMeetingHours);

        const calculatedTargetProductWork = workdaysToCurrent + (finalTotalOvertimeHours / 8) - finalTotalLeaveDays - (finalTotalMeetingHours / 8);
        setTargetProductWork(parseFloat(Math.max(0, calculatedTargetProductWork).toFixed(2)));
        setErrorLoading(null);
      } else {
        setErrorLoading("Không thể xác định thông tin tháng Estron hiện tại.");
      }
    } catch (error) {
      console.error("Error loading statistics data:", error);
      setErrorLoading("Đã có lỗi xảy ra khi tải dữ liệu thống kê.");
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
      if (Platform.OS === 'web') { setContentWidth(0); setLayoutKey(`layoutKey-${Date.now()}`); }
      else { setContentWidth(Dimensions.get('window').width); }
    }, [userId, loadStatisticsData])
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: newWidth } = event.nativeEvent.layout;
    if (newWidth > 0 && newWidth !== contentWidth) { setContentWidth(newWidth); }
    else if (newWidth > 0 && contentWidth === 0 && Platform.OS === 'web') { setContentWidth(newWidth); }
  };

  // Sử dụng theme.spacing['level-4'] (tương đương md cũ)
  const chartBlockSize = useMemo(() => { if (contentWidth < 1) return 0; const calculated = (contentWidth - theme.spacing['level-4'] * 3) / 2; return Math.max(0, calculated); }, [contentWidth]);
  const smallBlockSize = useMemo(() => { if (contentWidth < 1) return 0; const calculated = (contentWidth - theme.spacing['level-4'] * 4) / 3; return Math.max(0, calculated); }, [contentWidth]);

  const renderProgressChart = useCallback((value: number, maxValue: number, title: string, defaultColor: string, unit: string = "", isProductWorkChart: boolean = false) => {
    const percentage = maxValue > 0 ? Math.min(100, Math.max(0, (value / maxValue) * 100)) : (value > 0 ? 100 : 0);
    const displayValue = value >= 0 ? value : 0;
    let ringColor = defaultColor;
    if (isProductWorkChart) { ringColor = value >= maxValue ? theme.colors.success : theme.colors.danger; }
    const currentChartBlockSize = Math.max(chartBlockSize, 50);
    return ( <View style={[styles.chartBlockBase, { width: currentChartBlockSize, height: currentChartBlockSize * 1.1 }]}> <PieChart donut radius={Math.max(currentChartBlockSize / 2.8, 20)} innerRadius={Math.max(currentChartBlockSize / 4, 15)} data={[{ value: percentage, color: ringColor, focused: true }, { value: 100 - percentage, color: theme.colors.darkGrey }]} // lightGrey -> darkGrey
    centerLabelComponent={() => ( <View style={styles.chartCenterLabel}><Text style={[styles.chartValueTextMain, { fontSize: Math.max(currentChartBlockSize / 5.5, 10) }]}>{`${displayValue.toLocaleString()}`}</Text><Text style={[styles.chartValueTextUnit, { fontSize: Math.max(currentChartBlockSize / 10, 8) }]}>{unit}</Text></View> )} /> <Text style={styles.chartTitleText}>{title}</Text> <Text style={styles.chartSubText}>{`Mục tiêu: ${maxValue.toLocaleString()}${unit}`}</Text> </View> );
  }, [chartBlockSize]);

  const renderSmallInfoBlock = useCallback((iconName: React.ComponentProps<typeof Ionicons>['name'], value: number, label: string, unit: string, iconColor: string) => {
    const currentSmallBlockSize = Math.max(smallBlockSize, 40);
    return ( <View style={[styles.smallBlockBase, { width: currentSmallBlockSize, height: currentSmallBlockSize * 1.1 }]}><Ionicons name={iconName} size={Math.max(currentSmallBlockSize / 3.5, 18)} color={iconColor} style={styles.smallBlockIcon} /><Text style={[styles.smallBlockValue, {fontSize: Math.max(currentSmallBlockSize / 5, 10)}]}>{value.toLocaleString()} <Text style={styles.smallBlockUnit}>{unit}</Text></Text><Text style={styles.smallBlockLabel}>{label}</Text></View> );
  }, [smallBlockSize]);

  if (isLoading) { return ( <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>{userId ? "Đang tải dữ liệu thống kê..." : "Đang xác thực người dùng..."}</Text></View> ); }
  if (errorLoading) { return ( <View style={styles.centered}><Ionicons name="warning-outline" size={48} color={theme.colors.danger} /><Text style={styles.errorText}>{errorLoading}</Text><Button title="Thử Lại" onPress={() => { if (!userId) { const fetchUser = async () => { setIsLoading(true); setErrorLoading(null); const { data: { user } } = await supabase.auth.getUser(); if (user) { setUserId(user.id); } else { setErrorLoading("Chưa xác thực người dùng."); setIsLoading(false); } }; fetchUser(); } else { setIsLoading(true); setErrorLoading(null); loadStatisticsData(); } }} style={{marginTop: theme.spacing['level-4']}}/> </View> ); }
  if (!userId) { return ( <View style={styles.centered}><Ionicons name="person-circle-outline" size={48} color={theme.colors.textSecondary} /><Text style={styles.errorText}>Vui lòng đăng nhập để xem thống kê.</Text></View> ) }

  return (
    <ScrollView key={layoutKey} style={styles.container} contentContainerStyle={styles.contentContainer} onLayout={handleLayout} >
      {(Platform.OS === 'web' && contentWidth === 0) ? ( <View style={styles.centeredFullHeight}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>Đang xác định kích thước...</Text></View> ) : (chartBlockSize > 0 && smallBlockSize > 0) ? ( <> <View style={styles.rowContainer}> {renderProgressChart(standardWorkdaysToCurrent, standardWorkdaysForMonth, "Ngày công làm việc", theme.colors.success, "ngày")} {renderProgressChart(totalProductWorkDone, targetProductWork, "Công sản phẩm", theme.colors.info, "công", true)} </View> <View style={[styles.rowContainer, { marginTop: theme.spacing['level-4'] }]}> {renderSmallInfoBlock("time-outline", totalOvertimeHours, "Giờ tăng ca", "giờ", theme.colors.success)} {renderSmallInfoBlock("walk-outline", totalLeaveDays, "Ngày nghỉ", "ngày", theme.colors.danger)} {renderSmallInfoBlock("people-outline", totalMeetingHours, "Giờ họp/đào tạo", "giờ", theme.colors.warning)} </View> </> ) : (contentWidth > 0) ? ( <View style={styles.centeredFullHeight}><Text>Kích thước nội dung quá nhỏ.</Text><Text>(Rộng: {contentWidth.toFixed(0)}px)</Text></View> ) : null }
      <ModalWrapper visible={isAuthorModalVisible} onClose={handleCloseAuthorModal} >
        <View style={styles.authorModalContainer}><View style={styles.authorModalHeader}><Text style={styles.authorModalTitle}>Thông tin tác giả</Text><TouchableOpacity onPress={handleCloseAuthorModal} style={styles.customCloseButton}><Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} /></TouchableOpacity></View><Text style={styles.authorText}>Ứng dụng được phát triển bởi:</Text><Text style={styles.authorName}>{AUTHOR_NAME}</Text><View style={styles.divider} /><Text style={styles.donateTitle}>Ủng hộ tác giả:</Text><Text style={styles.donateText}>Nếu bạn thấy ứng dụng này hữu ích, bạn có thể ủng hộ một ly cafe cho tác giả qua:</Text><View style={styles.donateInfoRow}><Text style={styles.donateBank}>{DONATE_INFO.bank}</Text></View><View style={styles.donateInfoRow}><Text style={styles.donateAccountLabel}>Chủ TK:</Text><Text style={styles.donateAccountValue}>{DONATE_INFO.accountHolder}</Text></View><View style={styles.donateInfoRow}><Text style={styles.donateAccountLabel}>Số TK:</Text><Text style={styles.donateAccountValue}>{DONATE_INFO.accountNumber}</Text><TouchableOpacity onPress={() => copyToClipboard(DONATE_INFO.accountNumber)} style={styles.copyButton}><Ionicons name="copy-outline" size={20} color={theme.colors.primary} /></TouchableOpacity></View><Button title="Đóng" onPress={handleCloseAuthorModal} style={styles.closeModalButton} /></View>
      </ModalWrapper>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background2, }, // background -> background2
  contentContainer: { padding: theme.spacing['level-4'], flexGrow: 1, }, // md -> level-4
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing['level-6'], }, // lg -> level-6
  centeredFullHeight: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing['level-6'], minHeight: 200, }, // lg -> level-6
  loadingText: { marginTop: theme.spacing['level-4'], fontSize: theme.typography['level-4'].fontSize, color: theme.colors.textSecondary, }, // md -> level-4, body.fontSize -> level-4
  errorText: { marginTop: theme.spacing['level-4'], fontSize: theme.typography['level-4'].fontSize, color: theme.colors.danger, textAlign: 'center', }, // md -> level-4, body.fontSize -> level-4
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing['level-4'], }, // md -> level-4
  chartBlockBase: { backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius['level-7'], padding: theme.spacing['level-2'], alignItems: 'center', justifyContent: 'space-around', ...theme.shadow.md, }, // lg -> level-7, sm -> level-2
  chartCenterLabel: { justifyContent: 'center', alignItems: 'center', },
  chartValueTextMain: { fontWeight: 'bold', color: theme.colors.text, }, // Giữ nguyên
  chartValueTextUnit: { color: theme.colors.textSecondary, marginTop: -theme.spacing['level-1'] / 2, }, // xs -> level-1
  chartTitleText: { fontSize: theme.typography['level-3'].fontSize * 0.9, fontWeight: '600', color: theme.colors.text, textAlign: 'center', marginTop: theme.spacing['level-1'], }, // bodySmall.fontSize -> level-3, xs -> level-1
  chartSubText: { fontSize: theme.typography['level-2'].fontSize * 0.9, color: theme.colors.textSecondary, textAlign: 'center', }, // caption.fontSize -> level-2
  smallBlockBase: { backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius['level-7'], padding: theme.spacing['level-1'], alignItems: 'center', justifyContent: 'center', ...theme.shadow.sm, }, // lg -> level-7, xs -> level-1
  smallBlockIcon: { marginBottom: theme.spacing['level-1'] / 2, }, // xs -> level-1
  smallBlockValue: { fontWeight: 'bold', color: theme.colors.text, textAlign: 'center', },
  smallBlockUnit: { fontSize: theme.typography['level-2'].fontSize * 0.9, fontWeight: 'normal', color: theme.colors.textSecondary, }, // caption.fontSize -> level-2
  smallBlockLabel: { fontSize: theme.typography['level-2'].fontSize * 0.85, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing['level-1'] / 2, }, // caption.fontSize -> level-2, xs -> level-1
  authorModalContainer: { alignItems: 'center', paddingHorizontal: theme.spacing['level-2'], }, // sm -> level-2
  authorModalHeader: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing['level-6'], paddingBottom: theme.spacing['level-4'], borderBottomWidth: 1, borderBottomColor: theme.colors.borderColor, position: 'relative', }, // lg -> level-6, md -> level-4
  authorModalTitle: { fontSize: theme.typography['level-6'].fontSize, fontWeight: theme.typography['level-6-bold'].fontWeight, color: theme.colors.text, }, // h3 -> level-6
  customCloseButton: { position: 'absolute', right: -theme.spacing['level-2'], top: -theme.spacing['level-2'], padding: theme.spacing['level-1'], }, // sm -> level-2, xs -> level-1; color for Ionicons updated in render
  authorText: { fontSize: theme.typography['level-4'].fontSize, color: theme.colors.textSecondary, marginBottom: theme.spacing['level-1'], }, // body.fontSize -> level-4, xs -> level-1
  authorName: { fontSize: theme.typography['level-5'].fontSize, fontWeight: theme.typography['level-5-bold'].fontWeight, color: theme.colors.primary, marginBottom: theme.spacing['level-4'], }, // h4 -> level-5, md -> level-4
  divider: { height: 1, backgroundColor: theme.colors.borderColor, width: '80%', marginVertical: theme.spacing['level-4'], }, // md -> level-4
  donateTitle: { fontSize: theme.typography['level-5'].fontSize, fontWeight: theme.typography['level-5-bold'].fontWeight, color: theme.colors.text, marginBottom: theme.spacing['level-2'], }, // h4 -> level-5, sm -> level-2
  donateText: { fontSize: theme.typography['level-3'].fontSize, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing['level-2'], paddingHorizontal: theme.spacing['level-2'], }, // bodySmall.fontSize -> level-3, sm -> level-2
  donateInfoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing['level-1'], }, // xs -> level-1
  donateBank: { fontSize: theme.typography['level-4'].fontSize, fontWeight: 'bold', color: theme.colors.success, marginBottom: theme.spacing['level-1'], }, // body.fontSize -> level-4, xs -> level-1
  donateAccountLabel: { fontSize: theme.typography['level-3'].fontSize, color: theme.colors.textSecondary, marginRight: theme.spacing['level-1'], }, // bodySmall.fontSize -> level-3, xs -> level-1
  donateAccountValue: { fontSize: theme.typography['level-4'].fontSize, color: theme.colors.text, fontWeight: '500', }, // body.fontSize -> level-4
  copyButton: { marginLeft: theme.spacing['level-4'], padding: theme.spacing['level-1'], }, // md -> level-4, xs -> level-1
  closeModalButton: { marginTop: theme.spacing['level-6'], width: '60%', } // lg -> level-6
});