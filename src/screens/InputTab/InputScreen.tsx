// src/screens/InputTab/InputScreen.tsx
import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';

import { InputStackNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { addProductionBoxEntry } from '../../services/storage';
import { supabase } from '../../services/supabase';
import { ProductionEntry } from '../../types/data';
import { formatToYYYYMMDD, formatDate } from '../../utils/dateUtils';
import { parseISO } from 'date-fns'; // parseISO không bị ảnh hưởng bởi theme
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';

type InputScreenRouteProp = RouteProp<InputStackNavigatorParamList, 'InputDetails'>;
type InputScreenNavigationProp = StackNavigationProp<InputStackNavigatorParamList, 'InputDetails'>;

interface Props {
  route: InputScreenRouteProp;
  navigation: InputScreenNavigationProp;
}

export default function InputScreen({ route, navigation }: Props) {
  const { stageCode: productCodeFromRoute, date: initialDateString } = route.params;

  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDateString ? parseISO(initialDateString) : new Date()
  );

  const [quantity, setQuantity] = useState<string>('');
  const [po, setPo] = useState<string>('');
  const [box, setBox] = useState<string>('');
  const [batch, setBatch] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        Alert.alert("Lỗi", "Không thể xác thực người dùng. Vui lòng thử lại.");
        navigation.goBack();
      }
    };
    fetchUser();
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Thêm sản phẩm mới cho ${productCodeFromRoute}`,
    });
  }, [navigation, productCodeFromRoute]);

  const onChangeDate = (event: DateTimePickerEvent, newSelectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (newSelectedDate) {
      setSelectedDate(newSelectedDate);
      setFormError(null);
    }
  };

  const validateInput = (): boolean => {
    if (quantity.trim() && (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0)) {
      setFormError('Số lượng phải là một số không âm.');
      return false;
    }
    if (!quantity.trim() && !po.trim() && !box.trim() && !batch.trim()) {
        setFormError('Cần nhập ít nhất một thông tin cho sản phẩm (Số lượng, PO, Hộp hoặc Batch).');
        return false;
    }
    setFormError(null);
    return true;
  };

  const handleSaveNewBox = async () => {
    if (!userId) {
      Alert.alert("Lỗi", "Không thể xác định người dùng.");
      return;
    }
    if (!validateInput()) {
      return;
    }
    setIsLoading(true);
    const formattedDate = formatToYYYYMMDD(selectedDate);

    const boxPayload: Omit<ProductionEntry, 'id' | 'created_at' | 'verified' | 'quota_percentage'> & { user_id: string } = {
      user_id: userId,
      product_code: productCodeFromRoute,
      date: formattedDate,
      quantity: quantity.trim() ? parseFloat(quantity) : null,
      po: po.trim() || null,
      box: box.trim() || null,
      batch: batch.trim() || null,
    };

    try {
      const result = await addProductionBoxEntry(boxPayload);
      if (result) {
        Alert.alert('Thành công', 'Đã lưu thông tin sản phẩm.');
        navigation.goBack();
      }
    } catch (error) {
      console.error("Save error in InputScreen (handleSaveNewBox):", error);
      Alert.alert('Lỗi nghiêm trọng', 'Đã có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
        <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} style={styles.icon} />
        <Text style={styles.datePickerText}>Ngày nhập: {formatDate(selectedDate, 'dd/MM/yyyy')}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedDate}
          mode="date"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
          maximumDate={new Date()}
          // Cân nhắc thêm style cho DateTimePicker nếu cần, đặc biệt cho dark theme
          // themeVariant={Platform.OS === 'ios' ? "dark" : undefined} // Cho iOS
        />
      )}

      <TextInput
        label="Số lượng"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="Nhập số lượng (ví dụ: 123)"
        keyboardType="numeric"
        error={(formError && !quantity.trim() && !po.trim() && !box.trim() && !batch.trim()) ? formError : (quantity.trim() && (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) ? 'Số lượng không hợp lệ' : undefined)}
        touched={!!formError || !!quantity.trim()}
      />
      <TextInput
        label="PO (Số lệnh sản xuất)"
        value={po}
        onChangeText={setPo}
        placeholder="Nhập số PO (văn bản)"
        keyboardType="default"
      />
       <TextInput
        label="Hộp"
        value={box}
        onChangeText={setBox}
        placeholder="Nhập mã hộp (văn bản)"
        keyboardType="default"
      />
      <TextInput
        label="Batch/Mẻ"
        value={batch}
        onChangeText={setBatch}
        placeholder="Nhập số batch (văn bản)"
        keyboardType="default"
      />

      {formError && (quantity.trim() || po.trim() || box.trim() || batch.trim()) && <Text style={styles.errorText}>{formError}</Text>}

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Hủy" onPress={() => navigation.goBack()} type="secondary" style={styles.button} />
          <Button title="Lưu Sản Phẩm" onPress={handleSaveNewBox} type="primary" style={styles.button} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing['level-6'], // lg -> level-6
    backgroundColor: theme.colors.background2, // background -> background2
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground, // white -> cardBackground
    paddingVertical: theme.spacing['level-4'], // md -> level-4
    paddingHorizontal: theme.spacing['level-2'], // sm -> level-2
    borderRadius: theme.borderRadius['level-4'], // md -> level-4
    borderWidth: 1,
    borderColor: theme.colors.borderColor, // Giữ nguyên
    marginBottom: theme.spacing['level-6'], // lg -> level-6
  },
  datePickerText: {
    fontSize: theme.typography['level-4'].fontSize, // body.fontSize -> level-4
    color: theme.colors.text, // Giữ nguyên
  },
  icon: {
    marginRight: theme.spacing['level-2'], // sm -> level-2
  },
  errorText: {
    fontSize: theme.typography['level-2'].fontSize, // caption.fontSize -> level-2
    color: theme.colors.danger, // Giữ nguyên
    marginTop: theme.spacing['level-1'], // xs -> level-1
    marginBottom: theme.spacing['level-2'], // sm -> level-2 (Thêm vào nếu cần)
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: theme.spacing['level-7'], // xl -> level-7
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: { // Style này áp dụng cho từng button trong container
    flex: 1,
    marginHorizontal: theme.spacing['level-2'], // sm -> level-2
  },
  loader: {
    marginTop: theme.spacing['level-7'], // xl -> level-7
  }
});