// src/components/common/Picker.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
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

const ITEM_HEIGHT = 48; // Chiều cao cố định cho mỗi mục trong danh sách

const ThemedPicker: React.FC<PickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  items,
  enabled = true,
  colorLabel,
}) => {
  const [isListVisible, setListVisible] = useState(false);
  const [layout, setLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  const pickerRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const toggleList = () => {
    if (isListVisible) {
      setListVisible(false);
    } else {
      pickerRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
        setLayout({ x, y, width, height });
        setListVisible(true);
      });
    }
  };

  const selectedItem = items.find(item => item.value === selectedValue);

  const renderItem = ({ item, index }: { item: PickerItemProps; index: number }) => {
    const parts = item.label.split(' - ');
    const productCode = parts[0];
    const productName = parts.length > 1 ? parts.slice(1).join(' - ') : '';
    const isLastItem = index === items.length - 1;

    return (
      <TouchableOpacity
        style={[styles.modalItem, isLastItem && { borderBottomWidth: 0 }]}
        onPress={() => {
          onValueChange(item.value, index);
          setListVisible(false);
        }}
      >
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
        ref={pickerRef}
        style={[
            styles.pickerWrapper, 
            !enabled && styles.disabledContainer,
            // Áp dụng style khi danh sách được mở
            isListVisible && styles.pickerWrapperOpen
        ]}
        onPress={() => enabled && toggleList()}
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
          name={isListVisible ? "chevron-up" : "chevron-down"}
          size={20}
          color={enabled ? theme.colors.textSecondary : theme.colors.grey}
        />
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={isListVisible}
        onRequestClose={() => setListVisible(false)}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={() => setListVisible(false)}>
          <View style={styles.modalOverlay}>
            {layout && (
              <TouchableWithoutFeedback>
                <View style={[
                  styles.dropdownContainer, 
                  {
                    top: layout.y + layout.height, // Nối liền với ô picker
                    left: layout.x,
                    width: layout.width,
                    maxHeight: ITEM_HEIGHT * 3.5,
                  }
                ]}>
                  <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.value.toString()}
                    showsVerticalScrollIndicator={false}
                    style={styles.flatList}
                    getItemLayout={(data, index) => (
                      { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                    )}
                  />
                </View>
              </TouchableWithoutFeedback>
            )}
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
  // Style cho picker khi mở
  pickerWrapperOpen: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderColor, // Sửa màu viền
    borderTopWidth: 0, // Bỏ viền trên
    borderBottomLeftRadius: theme.borderRadius['level-4'],
    borderBottomRightRadius: theme.borderRadius['level-4'],
    ...theme.shadow.lg,
    overflow: 'hidden',
  },
  flatList: {
    // Không cần style cụ thể
  },
  modalItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['level-3'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  productCodeText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize['level-3'],
  },
  productNameText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize['level-3'],
  },
});

export default ThemedPicker;