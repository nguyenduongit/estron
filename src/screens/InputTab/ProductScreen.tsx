// src/screens/InputTab/ProductScreen.tsx
import React, { useState, useEffect, useCallback, useLayoutEffect, lazy, Suspense } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

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
import ModalWrapper from '../../components/common/ModalWrapper';
import TextInput from '../../components/common/TextInput';
import AlertModal, { AlertButtonType } from '../../components/common/AlertModal';

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
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDateForInput, setSelectedDateForInput] = useState<string>(formatToYYYYMMDD(getToday()));
  const [userId, setUserId] = useState<string | null>(null);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editPo, setEditPo] = useState('');
  const [editBox, setEditBox] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isCustomAlertVisible, setIsCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButtonType[]>([]);

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
        console.warn('ProductScreen: Không tìm thấy user.');
        showAlert('Không tìm thấy thông tin người dùng để tải dữ liệu.');
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const loadInitialData = useCallback(async () => {
    if (!userId) {
      return;
    }
    setIsLoading(true);
    try {
      const todayForFilter = getToday();
      const currentEstronInfo = getCurrentEstronWeekInfo(todayForFilter);
      setEstronWeekInfo(currentEstronInfo);

      const productionPromise =
        currentEstronInfo.estronMonth.startDate && currentEstronInfo.estronMonth.endDate
          ? getProductionEntriesByDateRange(
              userId,
              formatToYYYYMMDD(currentEstronInfo.estronMonth.startDate),
              formatToYYYYMMDD(currentEstronInfo.estronMonth.endDate)
            )
          : Promise.resolve([]);

      const suppDataPromise =
        currentEstronInfo.estronMonth.startDate && currentEstronInfo.estronMonth.endDate
          ? getSupplementaryDataByDateRange(
              userId,
              formatToYYYYMMDD(currentEstronInfo.estronMonth.startDate),
              formatToYYYYMMDD(currentEstronInfo.estronMonth.endDate)
            )
          : Promise.resolve([]);

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
            const daysInWeekToDisplay = week.days.filter(dayDate => new Date(dayDate) <= todayForFilter);

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
          if (currentEstronInfo.currentWeek) {
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
      console.error('ProductScreen: Error loading initial data:', error);
      showAlert('Không thể tải dữ liệu màn hình sản phẩm.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadInitialData();
      }
    }, [userId, loadInitialData])
  );

  useLayoutEffect(() => {
    if (estronWeekInfo && estronWeekInfo.estronMonth && estronWeekInfo.estronMonth.estronMonth) {
      navigation.setOptions({
        title: `Sản lượng tháng ${estronWeekInfo.estronMonth.estronMonth}`,
      });
    } else {
      navigation.setOptions({ title: 'Sản Lượng Estron' });
    }
  }, [navigation, estronWeekInfo]);

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
    setEditQuantity(entry.quantity?.toString() ?? '');
    setEditPo(entry.po ?? '');
    setEditBox(entry.box ?? '');
    setEditBatch(entry.batch ?? '');
    setIsEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setEditingEntry(null);
    setIsSaving(false);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || editingEntry.verified) {
      if (editingEntry?.verified) showAlert('Không thể lưu mục đã xác nhận.');
      return;
    }

    const quantityValue = editQuantity.trim() ? parseFloat(editQuantity) : null;
    if (editQuantity.trim() && (isNaN(quantityValue!) || quantityValue! < 0)) {
      showAlert('Số lượng phải là một số không âm.');
      return;
    }

    setIsSaving(true);
    const updatedData: Partial<
      Omit<ProductionEntry, 'id' | 'user_id' | 'product_code' | 'date' | 'created_at' | 'verified' | 'quota_percentage'>
    > = {
      quantity: quantityValue,
      po: editPo.trim() || null,
      box: editBox.trim() || null,
      batch: editBatch.trim() || null,
    };

    const result = await updateProductionEntryById(editingEntry.id, updatedData);
    setIsSaving(false);

    if (result) {
      showAlert('Đã cập nhật thông tin sản phẩm.');
      handleCloseEditModal();
      loadInitialData();
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
            loadInitialData();
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
            const fetchUser = async () => {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (user) setUserId(user.id);
              else showAlert('Vẫn không thể xác thực người dùng.');
            };
            fetchUser();
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
        <Button title="Thử Tải Lại" onPress={loadInitialData} style={{ marginTop: theme.spacing['level-4'] }} />
      </View>
    );
  }

  const pagerKey = `${userId}-${processedWeeksData.length}-${currentPage}-${Platform.OS}`;

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
              <SwiperSlide key={weekData.weekInfo.name + weekData.weekInfo.startDate.toISOString()}>
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
            <Suspense
              fallback={
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              }
            >
              <PagerView
                style={styles.pagerView}
                initialPage={currentPage}
                key={pagerKey}
                onPageSelected={e => setCurrentPage(e.nativeEvent.position)}
              >
                {processedWeeksData.map(weekData => (
                  <View
                    key={weekData.weekInfo.name + weekData.weekInfo.startDate.toISOString()}
                    style={styles.fullFlex}
                  >
                    <WeeklyPage
                      userId={userId}
                      weekData={weekData}
                      quotasExist={userSelectedQuotas.length > 0}
                      onAddProduction={openProductModal}
                      onEditEntry={handleOpenEditModal}
                    />
                  </View>
                ))}
              </PagerView>
            </Suspense>
          )
        ))}

      <ModalWrapper visible={isProductModalVisible} onClose={() => setIsProductModalVisible(false)}>
        <View style={styles.customModalHeader}>
          <Text style={styles.customModalTitle}>Chọn sản phẩm</Text>
          <Text style={styles.customModalSubtitle}>
            Ngày nhập: {selectedDateForInput ? formatDate(selectedDateForInput, 'dd/MM/yyyy') : ''}
          </Text>
        </View>
        {userSelectedQuotas.length > 0 ? (
          <FlatList
            data={userSelectedQuotas}
            keyExtractor={item => item.product_code}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productModalItemGrid} onPress={() => handleSelectProduct(item)}>
                <Text style={styles.productStageCodeGrid}>{item.product_code}</Text>
                <Text style={styles.productDailyQuotaGrid} numberOfLines={2}>
                  {item.product_name || '(Chưa có tên SP)'}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.productListGrid}
          />
        ) : (
          <Text style={styles.emptyTextModal}>Không có sản phẩm nào trong cài đặt.</Text>
        )}
      </ModalWrapper>

      {editingEntry && (
        <ModalWrapper visible={isEditModalVisible} onClose={handleCloseEditModal}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={handleCloseEditModal} style={styles.modalHeaderButton}>
              <Ionicons name="close-outline" size={28} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Sửa thông tin</Text>
            <TouchableOpacity
              onPress={() => {
                if (editingEntry.verified) {
                  showAlert('Mục này đã được xác nhận và không thể xóa.');
                } else {
                  handleDeleteEntry(editingEntry);
                }
              }}
              style={styles.modalHeaderButton}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={editingEntry.verified ? theme.colors.grey : theme.colors.danger}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.editModalSubtitle}>
            {editingEntry.product_code} - Ngày: {formatDate(editingEntry.date, 'dd/MM/yyyy')}
          </Text>

          <View
            style={{
              paddingHorizontal: theme.spacing['level-2'],
              marginTop: theme.spacing['level-4'],
            }}
          >
            <TextInput
              label="Số lượng"
              value={editQuantity}
              onChangeText={setEditQuantity}
              placeholder="Nhập số lượng"
              keyboardType="numeric"
              editable={!editingEntry.verified}
            />
            <TextInput
              label="PO"
              value={editPo}
              onChangeText={setEditPo}
              placeholder="Nhập số PO"
              editable={!editingEntry.verified}
            />
            <TextInput
              label="Hộp"
              value={editBox}
              onChangeText={setEditBox}
              placeholder="Nhập mã hộp"
              editable={!editingEntry.verified}
            />
            <TextInput
              label="Batch"
              value={editBatch}
              onChangeText={setEditBatch}
              placeholder="Nhập số batch"
              editable={!editingEntry.verified}
            />
          </View>
          <View style={styles.modalActions}>
            <Button title="Hủy" onPress={handleCloseEditModal} type="secondary" style={styles.modalButton} />
            <Button
              title={isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              onPress={handleUpdateEntry}
              type="primary"
              style={styles.modalButton}
              disabled={isSaving || !!editingEntry?.verified}
            />
          </View>
        </ModalWrapper>
      )}

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
  container: { flex: 1, backgroundColor: theme.colors.background2 },
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
  customModalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing['level-2'],
    paddingBottom: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  customModalTitle: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    marginBottom: theme.spacing['level-1'],
  },
  customModalSubtitle: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
  },
  productListGrid: { maxHeight: 400 },
  productModalItemGrid: {
    minHeight: 50,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: theme.spacing['level-2'],
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius['level-3'],
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  productStageCodeGrid: {
    minWidth: 80,
    paddingHorizontal: theme.spacing['level-3'],
    fontSize: theme.typography.fontSize['level-5'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    textAlign: 'left',
  },
  productDailyQuotaGrid: {
    flex: 1,
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    textAlign: 'left',
    paddingRight: theme.spacing['level-3'],
  },
  emptyTextModal: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing['level-6'],
  },
  editModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing['level-2'],
    marginBottom: theme.spacing['level-1'],
  },
  modalHeaderButton: {
    padding: theme.spacing['level-1'],
  },
  editModalTitle: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    textAlign: 'center',
  },
  editModalSubtitle: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    width: '100%',
    paddingBottom: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing['level-6'],
    marginBottom: theme.spacing['level-2'],
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing['level-2'],
  },
});
