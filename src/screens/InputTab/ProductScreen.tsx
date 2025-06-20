// src/screens/InputTab/ProductScreen.tsx
import React, { useState, useCallback, useLayoutEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, FlatList } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { addDays } from 'date-fns';

import { InputStackNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { ProductionEntry } from '../../types/data';
import { getToday, getEstronMonthPeriod } from '../../utils/dateUtils'; // <<< THAY ĐỔI: IMPORT THÊM
import DailyCard from './components/DailyCard';
import Button from '../../components/common/Button';
import AlertModal, { AlertButtonType } from '../../components/common/AlertModal';
import { useProductionStore } from '../../stores/productionStore';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';

type ProductScreenNavigationProp = StackNavigationProp<InputStackNavigatorParamList, 'ProductList'>;

export default function ProductScreen() {
  const navigation = useNavigation<ProductScreenNavigationProp>();

  // Tối ưu bằng cách sử dụng selectors riêng lẻ
  const isLoading = useProductionStore(state => state.isLoading);
  const processedDaysData = useProductionStore(state => state.processedDaysData);
  const estronWeekInfo = useProductionStore(state => state.estronWeekInfo);
  const initialize = useProductionStore(state => state.initialize);
  const cleanup = useProductionStore(state => state.cleanup);
  const setTargetDate = useProductionStore(state => state.setTargetDate);
  const userSelectedQuotas = useProductionStore(state => state.userSelectedQuotas);
  
  const activeUserId = useAuthStore(state => state.authUser?.profile.id);
  const showSunday = useSettingsStore(state => state.showSunday);

  const [isCustomAlertVisible, setIsCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButtonType[]>([]);

  const showAlert = (message: string, buttons?: AlertButtonType[]) => {
    setCustomAlertMessage(message);
    setCustomAlertButtons(buttons || [{ text: 'OK', onPress: () => setIsCustomAlertVisible(false) }]);
    setIsCustomAlertVisible(true);
  };
  const closeAlert = () => setIsCustomAlertVisible(false);

  const filteredDaysData = useMemo(() => {
    if (showSunday) {
      return processedDaysData;
    }
    return processedDaysData.filter(day => day.dayOfWeek !== 'Chủ Nhật');
  }, [processedDaysData, showSunday]);
  
  useFocusEffect(
    useCallback(() => {
      if (activeUserId) {
        initialize(activeUserId);
      }
      return () => {
        cleanup();
      };
    }, [activeUserId, initialize, cleanup])
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
    // Lấy thông tin tháng Estron của ngày hôm nay để làm mốc so sánh
    const currentEstronMonth = getEstronMonthPeriod(getToday());
    // So sánh tên (định danh duy nhất) của tháng đang hiển thị với tháng hiện tại
    const isViewingPreviousMonth = estronWeekInfo?.estronMonth.name !== currentEstronMonth.name;
    // <<< END: LOGIC SỬA LỖI >>>
    
    if (estronWeekInfo) {
      navigation.setOptions({
        title: `Sản lượng tháng ${estronWeekInfo.estronMonth.estronMonth}`,
        headerLeft: () => (
          <TouchableOpacity
            onPress={handleNavigateToPreviousMonth}
            // Mũi tên lùi sẽ bị vô hiệu hóa khi đang xem tháng trước đó
            disabled={isViewingPreviousMonth}
            style={{ marginLeft: Platform.OS === 'ios' ? theme.spacing['level-2'] : theme.spacing['level-4'], padding: theme.spacing['level-1'] }}
          >
            <Ionicons
              name={'caret-back'}
              size={26}
              color={isViewingPreviousMonth ? theme.colors.grey : theme.colors.textOnPrimary}
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
            <TouchableOpacity
              onPress={handleNavigateToCurrentMonth}
              // Mũi tên tiến chỉ bật khi đang xem tháng trước
              disabled={!isViewingPreviousMonth}
              style={{ marginRight: Platform.OS === 'ios' ? theme.spacing['level-2'] : theme.spacing['level-4'], padding: theme.spacing['level-1'] }}
            >
              <Ionicons
                name={'caret-forward'}
                size={26}
                color={!isViewingPreviousMonth ? theme.colors.grey : theme.colors.textOnPrimary}
              />
            </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({ title: 'Sản Lượng Estron', headerLeft: () => null, headerRight: () => null });
    }
  }, [navigation, estronWeekInfo, handleNavigateToPreviousMonth, handleNavigateToCurrentMonth]);

  const handleAddProduction = (date: string) => {
    navigation.navigate('InputDetails', { date });
  };
  
  const handleEditEntry = (entry: ProductionEntry) => {
    if (entry.verified) {
      showAlert('Mục này đã được xác nhận và không thể sửa.');
      return;
    }
    navigation.navigate('InputDetails', { entryId: entry.id });
  };

  if (isLoading && processedDaysData.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing['level-2'] }}>
          Đang tải dữ liệu...
        </Text>
      </View>
    );
  }
  if (!activeUserId && !isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Không thể tải dữ liệu do chưa xác thực người dùng.</Text>
      </View>
    );
  }
  if (activeUserId && !isLoading && (!estronWeekInfo || filteredDaysData.length === 0)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Không có dữ liệu ngày để hiển thị cho tháng này.</Text>
        <Button title="Tải lại" onPress={() => initialize(activeUserId)} style={{ marginTop: theme.spacing['level-4'] }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activeUserId && filteredDaysData.length > 0 && (
        <FlatList
          data={filteredDaysData}
          renderItem={({ item }) => (
            <DailyCard
              userId={activeUserId}
              dailyInfo={item}
              weekHasData={userSelectedQuotas.length > 0}
              onAddProduction={handleAddProduction}
              onEditEntry={handleEditEntry}
            />
          )}
          keyExtractor={(item) => item.date}
          style={styles.listStyle}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
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
  container: { flex: 1, backgroundColor: theme.colors.background1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing['level-6'] },
  emptyText: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['level-2'],
  },
  listStyle: {
    paddingHorizontal: theme.spacing['level-2'],
  },
  listContentContainer: {
    paddingBottom: theme.spacing['level-8'],
  },
});