// src/screens/InputTab/InputScreen.tsx
import React, { useState, useLayoutEffect, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseISO } from 'date-fns';

import { InputStackNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { addProductionBoxEntry, updateProductionEntryById, deleteProductionEntry } from '../../services/storage';
import { ProductionEntry } from '../../types/data';
import { formatToYYYYMMDD, formatDate } from '../../utils/dateUtils';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import ThemedPicker from '../../components/common/Picker';
import { useProductionStore } from '../../stores/productionStore';
import AlertModal, { AlertButtonType } from '../../components/common/AlertModal';
import { useAuthStore } from '../../stores/authStore';


type InputScreenRouteProp = RouteProp<InputStackNavigatorParamList, 'InputDetails'>;
type InputScreenNavigationProp = StackNavigationProp<InputStackNavigatorParamList, 'InputDetails'>;

interface Props {
  route: InputScreenRouteProp;
  navigation: InputScreenNavigationProp;
}

const LAST_PRODUCT_KEY = '@last_selected_product_code';
const QUOTA_PERCENTAGE_OPTIONS = [
    { label: '100%', value: 100 }, { label: '95%', value: 95 }, { label: '90%', value: 90 },
    { label: '85%', value: 85 }, { label: '80%', value: 80 }, { label: '75%', value: 75 },
    { label: '70%', value: 70 }, { label: '60%', value: 60 }, { label: '50%', value: 50 },
    { label: '40%', value: 40 },
];

export default function InputScreen({ route, navigation }: Props) {
  const { date: initialDateString, entryId } = route.params;
  const isEditMode = !!entryId;

  const userSelectedQuotas = useProductionStore(state => state.userSelectedQuotas);
  const processedDaysData = useProductionStore(state => state.processedDaysData); // Sửa lỗi: Sử dụng processedDaysData
  const activeUserId = useAuthStore(state => state.authUser?.profile.id);
  
  const [isInitializing, setIsInitializing] = useState(true);
  
  const initialEntry = useMemo(() => {
    if (!isEditMode || !processedDaysData) return null;
    for (const day of processedDaysData) {
        const found = day.entries.find(e => e.id === entryId);
        if (found) {
            return { ...found, product_code: found.stageCode, date: day.date } as ProductionEntry;
        }
    }
    return null;
  }, [isEditMode, entryId, processedDaysData]); // Sửa lỗi: Thêm processedDaysData vào dependency
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProductCode, setSelectedProductCode] = useState<string>('');
  const [quotaPercentage, setQuotaPercentage] = useState<number>(100);
  const [quantity, setQuantity] = useState<string>('');
  const [po, setPo] = useState<string>('');
  const [box, setBox] = useState<string>('');
  const [batch, setBatch] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<AlertButtonType[]>([]);

  const showAlert = (message: string, buttons?: AlertButtonType[]) => {
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setIsAlertVisible(false) }]);
    setIsAlertVisible(true);
  };
  
  useEffect(() => {
    const initializeForm = async () => {
      if (!activeUserId) {
        showAlert("Không thể xác thực người dùng.");
        navigation.goBack();
        return;
      }

      if (isEditMode) {
        // Chờ cho initialEntry được tính toán
        if (initialEntry) {
            const productExists = userSelectedQuotas.some(q => q.product_code === initialEntry.product_code);
            if (productExists) {
                setSelectedProductCode(initialEntry.product_code);
            } else {
                setSelectedProductCode('');
                showAlert(`Sản phẩm "${initialEntry.product_code}" không có trong Cài đặt của bạn.`);
            }
            
            setSelectedDate(parseISO(initialEntry.date));
            
            const savedPercentage = initialEntry.quota_percentage;
            setQuotaPercentage(savedPercentage ? Number(savedPercentage) : 100);
            
            setQuantity(initialEntry.quantity?.toString() ?? '');
            setPo(initialEntry.po ?? '');
            setBox(initialEntry.box ?? '');
            setBatch(initialEntry.batch ?? '');
            
            setIsInitializing(false);
        }
        // Nếu initialEntry chưa có, isInitializing vẫn là true, màn hình loading sẽ hiển thị
      } else {
        setSelectedDate(initialDateString ? parseISO(initialDateString) : new Date());
        setQuotaPercentage(100);
        setQuantity('');
        setPo('');
        setBox('');
        setBatch('');
        const lastUsedCode = await AsyncStorage.getItem(LAST_PRODUCT_KEY);
        if (lastUsedCode && userSelectedQuotas.some(q => q.product_code === lastUsedCode)) {
          setSelectedProductCode(lastUsedCode);
        } else if (userSelectedQuotas.length > 0) {
          setSelectedProductCode(userSelectedQuotas[0].product_code);
        } else {
          setSelectedProductCode('');
        }
        setIsInitializing(false);
      }
    };

    // Chỉ chạy khi initialEntry đã sẵn sàng (ở chế độ sửa) hoặc không ở chế độ sửa
    if (!isEditMode || initialEntry) {
        initializeForm();
    }
  }, [isEditMode, initialEntry, userSelectedQuotas, initialDateString, navigation, activeUserId]);


  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Sửa thông tin sản phẩm' : 'Thêm sản phẩm mới',
    });
  }, [navigation, isEditMode]);

  const productPickerItems = useMemo(() => {
    if (userSelectedQuotas.length === 0) {
        return [{ label: 'Vui lòng thêm SP ở Cài đặt', value: '' }];
    }
    return userSelectedQuotas.map(quota => ({
      label: `${quota.product_code} - ${quota.product_name}`,
      value: quota.product_code,
    }));
  }, [userSelectedQuotas]);

  const validateInput = (): boolean => {
    if (!selectedProductCode) {
      setFormError('Vui lòng chọn một mã sản phẩm.'); return false;
    }
    if (quantity.trim() && (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0)) {
      setFormError('Số lượng phải là một số không âm.'); return false;
    }
    if (!isEditMode && !quantity.trim() && !po.trim() && !box.trim() && !batch.trim()) {
      setFormError('Cần nhập ít nhất một thông tin cho sản phẩm.'); return false;
    }
    setFormError(null);
    return true;
  };
  
  const handleSave = async () => {
    if (!activeUserId || !validateInput()) return;
    setIsLoading(true);

    if (!isEditMode) {
      await AsyncStorage.setItem(LAST_PRODUCT_KEY, selectedProductCode);
    }
    
    const dataPayload = {
      quantity: quantity.trim() ? parseFloat(quantity) : null,
      po: po.trim() || null,
      box: box.trim() || null,
      batch: batch.trim() || null,
      quota_percentage: quotaPercentage
    };

    const { error } = isEditMode
      ? await updateProductionEntryById(entryId!, dataPayload)
      : await addProductionBoxEntry({
          user_id: activeUserId,
          product_code: selectedProductCode,
          date: formatToYYYYMMDD(selectedDate),
          ...dataPayload
      });

    setIsLoading(false);
    if (error) {
      showAlert(`Lỗi: ${error.message}`);
    } else {
      navigation.goBack();
    }
  };

  const handleDelete = () => {
    if (!isEditMode || !initialEntry) return;
    showAlert(`Bạn có chắc muốn xóa mục sản phẩm "${initialEntry.product_code}" này?`, [
        { text: "Hủy", style: 'secondary', onPress: () => setIsAlertVisible(false) },
        { text: "Xóa", style: 'danger', onPress: async () => {
            setIsAlertVisible(false);
            setIsLoading(true);
            const { error } = await deleteProductionEntry(entryId!);
            setIsLoading(false);
            if(error) {
                showAlert(`Lỗi khi xóa: ${error.message}`);
            } else {
                navigation.goBack();
            }
        }}
    ]);
  };

  const onChangeDate = (event: DateTimePickerEvent, newSelectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (newSelectedDate) {
        setShowDatePicker(false);
        setSelectedDate(newSelectedDate);
    }
  };
  
  if (isInitializing) {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Đang chuẩn bị dữ liệu...</Text>
        </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>
      <ThemedPicker 
         label="Mã sản phẩm"
         selectedValue={selectedProductCode}
         onValueChange={(itemValue) => setSelectedProductCode(itemValue as string)}
         items={productPickerItems}
         enabled={!isEditMode && userSelectedQuotas.length > 0}
      />
      
      <TouchableOpacity onPress={() => !isEditMode && setShowDatePicker(true)} style={styles.datePickerButton} disabled={isEditMode}>
        <Ionicons name="calendar-outline" size={20} color={isEditMode ? theme.colors.grey : theme.colors.primary} style={styles.icon} />
        <Text style={[styles.datePickerText, isEditMode && styles.disabledText]}>
          Ngày nhập: {formatDate(selectedDate, 'dd/MM/yyyy')}
        </Text>
      </TouchableOpacity>

      {showDatePicker && !isEditMode && (
        <DateTimePicker value={selectedDate} mode="date" display="default"
          onChange={onChangeDate}
          maximumDate={new Date()} />
      )}

      <ThemedPicker 
         label="Phần trăm định mức"
         selectedValue={quotaPercentage}
         onValueChange={(itemValue) => setQuotaPercentage(itemValue as number)}
         items={QUOTA_PERCENTAGE_OPTIONS}
      />

      <TextInput label="Số lượng" value={quantity} onChangeText={setQuantity} placeholder="Nhập số lượng" keyboardType="numeric" />
      <TextInput label="PO" value={po} onChangeText={setPo} placeholder="Nhập số PO" />
      <TextInput label="Hộp" value={box} onChangeText={setBox} placeholder="Nhập mã hộp" />
      <TextInput label="Batch" value={batch} onChangeText={setBatch} placeholder="Nhập số batch" />

      {formError && <Text style={styles.errorText}>{formError}</Text>}

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.buttonContainer}>
          {isEditMode && <Button title="Xóa" onPress={handleDelete} variant="danger" style={styles.button} />}
          <Button title="Hủy" onPress={() => navigation.goBack()} variant="secondary" style={styles.button} />
          <Button title="Lưu" onPress={handleSave} variant="primary" style={styles.button} />
        </View>
      )}

      <AlertModal visible={isAlertVisible} message={alertMessage} buttons={alertButtons} onClose={() => setIsAlertVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background2 },
  loadingText: { color: theme.colors.textSecondary, marginTop: theme.spacing['level-2'] },
  container: { flex: 1, padding: theme.spacing['level-6'], backgroundColor: theme.colors.background2 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.cardBackground, paddingVertical: theme.spacing['level-4'], paddingHorizontal: theme.spacing['level-2'], borderRadius: theme.borderRadius['level-4'], borderWidth: 1, borderColor: theme.colors.borderColor, marginBottom: theme.spacing['level-4'], minHeight: 46 },
  datePickerText: { fontSize: theme.typography.fontSize['level-4'], color: theme.colors.text },
  disabledText: { color: theme.colors.grey },
  icon: { marginRight: theme.spacing['level-2'] },
  errorText: { fontSize: theme.typography.fontSize['level-2'], color: theme.colors.danger, marginTop: theme.spacing['level-1'], marginBottom: theme.spacing['level-2'], textAlign: 'center' },
  buttonContainer: { marginTop: theme.spacing['level-7'], flexDirection: 'row', justifyContent: 'space-around', gap: theme.spacing['level-2'] },
  button: { flex: 1 },
  loader: { marginTop: theme.spacing['level-7'] }
});