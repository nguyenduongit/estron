// src/components/common/Picker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal, // Sử dụng Modal gốc từ React Native
  TouchableWithoutFeedback, // Dùng để xử lý sự kiện nhấn ra ngoài
} from 'react-native';
import { theme } from '../../theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface PickerItemProps {
  label: string;
  value: string | number;
}

interface PickerProps {
  label?: string;
  selectedValue: string | number;
  onValueChange: (itemValue: string | number, itemIndex: number) => void;
  items: PickerItemProps[];
  enabled?: boolean;
  colorLabel?: string;
}

const ThemedPicker: React.FC<PickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  items,
  enabled = true,
  colorLabel,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find(item => item.value === selectedValue);

  // Cập nhật hàm renderItem
  const renderItem = ({ item, index }: { item: PickerItemProps; index: number }) => {
    // Tách chuỗi label thành product_code và product_name
    const parts = item.label.split(' - ');
    const productCode = parts[0];
    const productName = parts.length > 1 ? parts.slice(1).join(' - ') : '';

    return (
      <TouchableOpacity
        style={styles.modalItem}
        onPress={() => {
          onValueChange(item.value, index);
          setModalVisible(false);
        }}
      >
        {/* Lồng Text để style riêng và giới hạn 1 dòng */}
        <Text numberOfLines={1} ellipsizeMode="tail">
          <Text style={styles.productCodeText}>{productCode}</Text>
          {productName ? <Text style={styles.productNameText}>{` - ${productName}`}</Text> : null}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.outerContainer}>
      {label && (
        <Text
          style={[
            styles.label,
            !enabled && styles.disabledText,
            colorLabel ? { color: colorLabel } : {},
          ]}
        >
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.pickerWrapper, !enabled && styles.disabledContainer]}
        onPress={() => enabled && setModalVisible(true)}
        disabled={!enabled}
      >
        <Text 
          style={[styles.pickerText, !selectedItem && styles.placeholderText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {selectedItem ? selectedItem.label : 'Vui lòng chọn...'}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={enabled ? theme.colors.textSecondary : theme.colors.grey}
        />
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.value.toString()}
                    style={styles.flatList}
                    showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: theme.spacing['level-4'],
  },
  label: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['level-1'],
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    borderRadius: theme.borderRadius['level-4'],
    backgroundColor: theme.colors.cardBackground,
    minHeight: 46,
    paddingHorizontal: theme.spacing['level-3'],
  },
  pickerText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['level-3'],
    marginRight: theme.spacing['level-2'],
  },
  placeholderText: {
      color: theme.colors.grey,
  },
  disabledContainer: {
    backgroundColor: theme.colors.darkGrey,
    borderColor: theme.colors.grey,
    opacity: 0.7,
  },
  disabledText: {
    color: theme.colors.grey,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['level-4'],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '30%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius['level-6'],
    paddingVertical: theme.spacing['level-2'], // Điều chỉnh padding
    paddingHorizontal: theme.spacing['level-5'],
    ...theme.shadow.lg,
  },
  flatList: {
    // style này có thể để trống
  },
  modalItem: {
    paddingVertical: theme.spacing['level-4'], // Tăng padding cho dễ nhấn
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  // Style mới cho mã sản phẩm
  productCodeText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize['level-3'],
  },
  // Style mới cho tên sản phẩm
  productNameText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['level-3'],
  },
});

export default ThemedPicker;