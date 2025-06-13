// src/screens/InputTab/ProductScreen.tsx
import React, { useState, useEffect, useCallback, useLayoutEffect, lazy, Suspense } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { addDays } from 'date-fns';

import { InputStackNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import {
  ProductionEntry,
  DailyProductionData,
  UserSelectedQuota,
  Profile,
  QuotaSetting,
  DailySupplementaryData,
} from '../../types/data';
import { supabase } from '../../services/supabase';
import {
  getProductionEntriesByDateRange,
  getUserSelectedQuotas,
  getUserProfile,
  getQuotaSettingByProductCode,
  getQuotaValueBySalaryLevel,
  getSupplementaryDataByDateRange,
  deleteProductionEntry,
  updateProductionEntryById,
} from '../../services/storage';
import {
  getToday,
  getCurrentEstronWeekInfo,
  EstronWeekPeriod,
  formatDate,
  formatToYYYYMMDD,
  getDayOfWeekVietnamese,
} from '../../utils/dateUtils';
import WeeklyPage from './components/WeeklyPage';
import Button from '../../components/common/Button';
import AlertModal, { AlertButtonType } from '../../components/common/AlertModal';
import SelectProductModal from './components/SelectProductModal';
import EditEntryModal from './components/EditEntryModal';

if (Platform.OS === 'web') {
  const styleId = 'hide-scrollbar-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .scrollable-slide::-webkit-scrollbar { display: none; }
      .scrollable-slide { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
  }
}

const PagerView = Platform.OS !== 'web' ? lazy(() => import('react-native-pager-view')) : null;

type ProductScreenNavigationProp = StackNavigationProp<InputStackNavigatorParamList, 'ProductList'>;

export interface ProcessedWeekData {
  weekInfo: EstronWeekPeriod;
  dailyData: DailyProductionData[];
  totalWeeklyWork: number;
}

export default function ProductScreen() {
  const navigation = useNavigation<ProductScreenNavigationProp>();

  const [isLoading, setIsLoading] = useState(true);
  const [userSelectedQuotas, setUserSelectedQuotas] = useState<UserSelectedQuota[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [estronWeekInfo, setEstronWeekInfo] = useState<ReturnType<typeof getCurrentEstronWeekInfo> | null>(null);
  const [processedWeeksData, setProcessedWeeksData] = useState<ProcessedWeekData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDateForInput, setSelectedDateForInput] = useState<string>(formatToYYYYMMDD(getToday()));
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(null);
  const [isCustomAlertVisible, setIsCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButtonType[]>([]);

  const [targetDate, setTargetDate] = useState<Date>(getToday());
  const [isViewingPreviousMonth, setIsViewingPreviousMonth] = useState(false);

  const showAlert = (message: string, buttons?: AlertButtonType[]) => {
    setCustomAlertMessage(message);
    setCustomAlertButtons(buttons || [{ text: 'OK', onPress: () => setIsCustomAlertVisible(false) }]);
    setIsCustomAlertVisible(true);
  };
  const closeAlert = () => setIsCustomAlertVisible(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        showAlert('Không tìm thấy thông tin người dùng để tải dữ liệu.');
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const loadDataForDate = useCallback(
    async (dateForFilter: Date, isViewingPrev: boolean) => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const currentEstronInfo = getCurrentEstronWeekInfo(dateForFilter);
        setEstronWeekInfo(currentEstronInfo);
        const productionPromise = getProductionEntriesByDateRange(
          userId,
          formatToYYYYMMDD(currentEstronInfo.estronMonth.startDate),
          formatToYYYYMMDD(currentEstronInfo.estronMonth.endDate)
        );
        const suppDataPromise = getSupplementaryDataByDateRange(
          userId,
          formatToYYYYMMDD(currentEstronInfo.estronMonth.startDate),
          formatToYYYYMMDD(currentEstronInfo.estronMonth.endDate)
        );
        const [profileData, selectedQuotasData, productionEntriesFromSupabase, supplementaryDataForMonth] =
          await Promise.all([getUserProfile(userId), getUserSelectedQuotas(userId), productionPromise, suppDataPromise]);
        setUserProfile(profileData);
        setUserSelectedQuotas(selectedQuotasData);
        const supplementaryDataMap = new Map<string, DailySupplementaryData>();
        supplementaryDataForMonth.forEach(data => {
          if (data.date) {
            supplementaryDataMap.set(data.date, data);
          }
        });
        const allQuotaSettingsNeededCodes = selectedQuotasData.map(usq => usq.product_code);
        const quotaSettingsMap = new Map<string, QuotaSetting>();
        if (allQuotaSettingsNeededCodes.length > 0) {
          const settingsPromises = allQuotaSettingsNeededCodes.map(pc => getQuotaSettingByProductCode(pc));
          const settingsResults = await Promise.all(settingsPromises);
          settingsResults.forEach(qs => {
            if (qs) quotaSettingsMap.set(qs.product_code, qs);
          });
        }
        const weeksToProcess = currentEstronInfo.allWeeksInMonth;
        if (weeksToProcess && weeksToProcess.length > 0) {
          const weeksData: ProcessedWeekData[] = weeksToProcess
            .map(week => {
              let totalWeeklyWorkAcc = 0;
              const daysInWeekToDisplay = week.days.filter(dayDate => {
                if (isViewingPrev) {
                  return true;
                }
                return new Date(dayDate) <= getToday();
              });

              const dailyDataForWeek: DailyProductionData[] = daysInWeekToDisplay.map(dayDate => {
                const yyyymmdd = formatToYYYYMMDD(dayDate);
                const entriesForDay = productionEntriesFromSupabase.filter(entry => entry.date === yyyymmdd);
                const suppDataForDay = supplementaryDataMap.get(yyyymmdd);
                let totalDailyWork = 0;
                const dailyEntries = entriesForDay.map(entry => {
                  const quotaSetting = quotaSettingsMap.get(entry.product_code);
                  let workAmount = 0;
                  if (quotaSetting && profileData?.salary_level && entry.quantity != null) {
                    const dailyQuota = getQuotaValueBySalaryLevel(quotaSetting, profileData.salary_level);
                    if (dailyQuota > 0) {
                      workAmount = entry.quantity / dailyQuota;
                    }
                  }
                  totalDailyWork += workAmount;
                  return {
                    id: entry.id,
                    stageCode: entry.product_code,
                    quantity: entry.quantity || 0,
                    workAmount: parseFloat(workAmount.toFixed(2)),
                    po: entry.po,
                    box: entry.box,
                    batch: entry.batch,
                    verified: entry.verified,
                  };
                });
                totalWeeklyWorkAcc += totalDailyWork;
                return {
                  date: yyyymmdd,
                  dayOfWeek: getDayOfWeekVietnamese(dayDate),
                  formattedDate: formatDate(dayDate, 'dd/MM'),
                  entries: dailyEntries,
                  totalWorkForDay: parseFloat(totalDailyWork.toFixed(2)),
                  supplementaryData: suppDataForDay,
                };
              });
              return {
                weekInfo: week,
                dailyData: dailyDataForWeek,
                totalWeeklyWork: parseFloat(totalWeeklyWorkAcc.toFixed(2)),
              };
            })
            .filter(weekData => weekData.dailyData.length > 0);
          setProcessedWeeksData(weeksData);
          if (weeksData.length > 0) {
            if (currentEstronInfo.currentWeek && !isViewingPrev) {
              const todayWeekIndex = weeksData.findIndex(
                w =>
                  w.weekInfo.name === currentEstronInfo.currentWeek!.name &&
                  w.weekInfo.startDate.getTime() === currentEstronInfo.currentWeek!.startDate.getTime()
              );
              setCurrentPage(todayWeekIndex !== -1 ? todayWeekIndex : weeksData.length - 1);
            } else {
              setCurrentPage(weeksData.length - 1);
            }
          } else {
            setProcessedWeeksData([]);
            setCurrentPage(0);
          }
        } else {
          setProcessedWeeksData([]);
        }
      } catch (error) {
        console.error('ProductScreen: Error loading data for date:', error);
        showAlert('Không thể tải dữ liệu màn hình sản phẩm.');
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadDataForDate(targetDate, isViewingPreviousMonth);
      }
    }, [userId, loadDataForDate, targetDate, isViewingPreviousMonth])
  );

  const handleNavigateToPreviousMonth = useCallback(() => {
    if (!estronWeekInfo) return;
    const currentMonthStartDate = estronWeekInfo.estronMonth.startDate;
    const previousMonthDate = addDays(currentMonthStartDate, -1);
    setIsViewingPreviousMonth(true);
    setTargetDate(previousMonthDate);
    loadDataForDate(previousMonthDate, true);
  }, [estronWeekInfo, loadDataForDate]);

  const handleNavigateToCurrentMonth = useCallback(() => {
    const today = getToday();
    setIsViewingPreviousMonth(false);
    setTargetDate(today);
    loadDataForDate(today, false);
  }, [loadDataForDate]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: estronWeekInfo ? `Sản lượng tháng ${estronWeekInfo.estronMonth.estronMonth}` : 'Sản Lượng Estron',
      headerLeft: () => (
        <TouchableOpacity
          onPress={isViewingPreviousMonth ? handleNavigateToCurrentMonth : handleNavigateToPreviousMonth}
          style={{
            marginLeft: Platform.OS === 'ios' ? theme.spacing['level-2'] : theme.spacing['level-4'],
            padding: theme.spacing['level-1'],
          }}
        >
          <Ionicons
            name={isViewingPreviousMonth ? 'arrow-forward-circle-outline' : 'arrow-back-circle-outline'}
            size={28}
            color={theme.colors.textOnPrimary}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={{
            marginRight: Platform.OS === 'ios' ? theme.spacing['level-2'] : theme.spacing['level-4'],
            padding: theme.spacing['level-1'],
          }}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.textOnPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, estronWeekInfo, isViewingPreviousMonth, handleNavigateToCurrentMonth, handleNavigateToPreviousMonth]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const channelFilter = `user_id=eq.${userId}`;
    const entriesChannel = supabase
      .channel('public:entries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries', filter: channelFilter },
        () => loadDataForDate(targetDate, isViewingPreviousMonth)
      )
      .subscribe();

    const additionalChannel = supabase
      .channel('public:additional')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'additional', filter: channelFilter },
        () => loadDataForDate(targetDate, isViewingPreviousMonth)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(entriesChannel);
      supabase.removeChannel(additionalChannel);
    };
  }, [userId, loadDataForDate, targetDate, isViewingPreviousMonth]);

  const handleSelectProduct = async (selectedUserQuota: UserSelectedQuota) => {
    setIsProductModalVisible(false);
    if (!userProfile || !userProfile.salary_level) {
      showAlert('Không tìm thấy thông tin bậc lương người dùng.');
      return;
    }
    if (!selectedUserQuota.product_code) {
      showAlert('Mã sản phẩm không hợp lệ.');
      return;
    }
    setIsLoading(true);
    try {
      const quotaSettingDetails = await getQuotaSettingByProductCode(selectedUserQuota.product_code);
      if (!quotaSettingDetails) {
        showAlert(`Không tìm thấy chi tiết định mức cho sản phẩm '${selectedUserQuota.product_code}'.`);
        setIsLoading(false);
        return;
      }
      const actualQuotaValue = getQuotaValueBySalaryLevel(quotaSettingDetails, userProfile.salary_level);
      navigation.navigate('InputDetails', {
        stageCode: selectedUserQuota.product_code,
        quotaValue: actualQuotaValue,
        date: selectedDateForInput,
      });
    } catch (error) {
      console.error('ProductScreen: Error in handleSelectProduct:', error);
      showAlert('Có lỗi xảy ra khi xử lý sản phẩm đã chọn.');
    } finally {
      setIsLoading(false);
    }
  };

  const openProductModal = (dateForInput: string) => {
    if (userSelectedQuotas.length === 0) {
      showAlert('Bạn chưa chọn sản phẩm nào trong phần Cài Đặt Định Mức.');
      return;
    }
    setSelectedDateForInput(dateForInput);
    setIsProductModalVisible(true);
  };
  const handleOpenEditModal = (entry: ProductionEntry) => {
    if (entry.verified) {
      showAlert('Mục này đã được xác nhận và không thể sửa.');
      return;
    }
    setEditingEntry(entry);
    setIsEditModalVisible(true);
  };
  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setEditingEntry(null);
  };

  const handleUpdateEntry = async (updatedData: Partial<Omit<ProductionEntry, 'id'>>) => {
    if (!editingEntry) return;
    if (
      updatedData.quantity !== undefined &&
      updatedData.quantity !== null &&
      (isNaN(updatedData.quantity) || updatedData.quantity < 0)
    ) {
      showAlert('Số lượng phải là một số không âm.');
      return;
    }
    setIsSaving(true);
    const result = await updateProductionEntryById(editingEntry.id, updatedData);
    setIsSaving(false);
    if (result) {
      showAlert('Đã cập nhật thông tin sản phẩm.');
      handleCloseEditModal();
      // loadDataForDate sẽ được trigger bởi listener supabase
    } else {
      showAlert('Không thể cập nhật. Vui lòng thử lại.');
    }
  };

  const handleDeleteEntry = (entry: ProductionEntry) => {
    if (!entry) return;
    const message = `Xác nhận xóa\n\nBạn có chắc chắn muốn xóa mục sản phẩm "${entry.product_code}" với số lượng ${entry.quantity ?? 'N/A'} không?`;
    showAlert(message, [
      { text: 'Hủy', style: 'secondary', onPress: closeAlert },
      {
        text: 'Xóa',
        style: 'danger',
        onPress: async () => {
          closeAlert();
          const success = await deleteProductionEntry(entry.id);
          if (success) {
            showAlert('Mục sản phẩm đã được xóa.');
            handleCloseEditModal();
             // loadDataForDate sẽ được trigger bởi listener supabase
          } else {
            showAlert('Không thể xóa mục này. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  if (isLoading && !userId) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing['level-2'] }}>
          Đang tải thông tin người dùng...
        </Text>
      </View>
    );
  }
  if (isLoading && userId && processedWeeksData.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing['level-2'] }}>
          Đang tải dữ liệu...
        </Text>
      </View>
    );
  }
  if (!userId && !isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Không thể tải dữ liệu do chưa xác thực người dùng.</Text>
        <Button
          title="Thử Lại"
          onPress={() => {
            /* ... */
          }}
          style={{ marginTop: theme.spacing['level-4'] }}
        />
      </View>
    );
  }
  if (userId && !isLoading && (!estronWeekInfo || processedWeeksData.length === 0)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Không có dữ liệu tuần để hiển thị.</Text>
        <Button title="Thử Tải Lại" onPress={() => loadDataForDate(targetDate, isViewingPreviousMonth)} style={{ marginTop: theme.spacing['level-4'] }} />
      </View>
    );
  }

  const pagerKey = `${userId}-${processedWeeksData.length}-${currentPage}-${Platform.OS}-${targetDate.toISOString()}`;

  return (
    <View style={styles.container}>
      {userId &&
        processedWeeksData.length > 0 &&
        (Platform.OS === 'web' ? (
          <Swiper
            style={styles.pagerView}
            initialSlide={currentPage}
            onSlideChange={swiper => setCurrentPage(swiper.activeIndex)}
            key={pagerKey}
          >
            {processedWeeksData.map(weekData => (
              <SwiperSlide
                key={weekData.weekInfo.name + weekData.weekInfo.startDate.toISOString()}
                className="scrollable-slide"
                style={{ height: '100%', overflow: 'auto' }}
              >
                <WeeklyPage
                  userId={userId}
                  weekData={weekData}
                  quotasExist={userSelectedQuotas.length > 0}
                  onAddProduction={openProductModal}
                  onEditEntry={handleOpenEditModal}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          PagerView && (
            <Suspense fallback={<ActivityIndicator size="large" color={theme.colors.primary} />}>
              <PagerView
                style={styles.pagerView}
                initialPage={currentPage}
                key={pagerKey}
                onPageSelected={e => setCurrentPage(e.nativeEvent.position)}
              >
                {processedWeeksData.map((weekData, index) => (
                  <View key={index} style={styles.fullFlex}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <WeeklyPage
                        userId={userId}
                        weekData={weekData}
                        quotasExist={userSelectedQuotas.length > 0}
                        onAddProduction={openProductModal}
                        onEditEntry={handleOpenEditModal}
                      />
                    </ScrollView>
                  </View>
                ))}
              </PagerView>
            </Suspense>
          )
        ))}

      <SelectProductModal
        visible={isProductModalVisible}
        onClose={() => setIsProductModalVisible(false)}
        userSelectedQuotas={userSelectedQuotas}
        onSelectProduct={handleSelectProduct}
        selectedDate={selectedDateForInput}
      />

      <EditEntryModal
        visible={isEditModalVisible}
        onClose={handleCloseEditModal}
        entry={editingEntry}
        onUpdate={handleUpdateEntry}
        onDelete={handleDeleteEntry}
        isSaving={isSaving}
      />

      <AlertModal
        visible={isCustomAlertVisible}
        message={customAlertMessage}
        buttons={customAlertButtons}
        onClose={closeAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background1 },
  pagerView: { flex: 1, width: '100%' },
  fullFlex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['level-6'],
  },
  emptyText: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['level-2'],
  },
});