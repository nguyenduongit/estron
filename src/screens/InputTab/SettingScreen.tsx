// screens/InputTab/SettingScreen.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform, Keyboard, TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import Ionicons from '@expo/vector-icons/Ionicons';

import { InputStackNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { UserSelectedQuota, QuotaSetting } from '../../types/data';
import { supabase } from '../../services/supabase';
import {
  getQuotaSettingByProductCode,
  getUserSelectedQuotas,
  addUserSelectedQuota,
  deleteUserSelectedQuota,
  saveUserSelectedQuotasOrder,
} from '../../services/storage';

import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import ModalWrapper from '../../components/common/ModalWrapper';

// ================== BẮT ĐẦU: MÃ ẨN SCROLLBAR CHO WEB ==================
if (Platform.OS === 'web') {
  const styleId = 'hide-settings-scrollbar-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    // CSS để nhắm vào container có thể cuộn bên trong DraggableFlatList trên web
    style.textContent = `
      [data-testid="settings-scroll-view"] > div::-webkit-scrollbar {
        display: none;
      }
      [data-testid="settings-scroll-view"] > div {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
  }
}
// ================== KẾT THÚC: MÃ ẨN SCROLLBAR CHO WEB ==================

type SettingScreenNavigationProp = StackNavigationProp<InputStackNavigatorParamList, 'Settings'>;

export default function SettingScreen() {
  const navigation = useNavigation<SettingScreenNavigationProp>();
  const isFocused = useIsFocused();

  const [userSelectedQuotas, setUserSelectedQuotas] = useState<UserSelectedQuota[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [currentProductCodeInput, setCurrentProductCodeInput] = useState('');
  const [foundProduct, setFoundProduct] = useState<QuotaSetting | null>(null);
  const [productSearchMessage, setProductSearchMessage] = useState<string | null>(null);
  const [productSearchMessageType, setProductSearchMessageType] = useState<'success' | 'error' | null>(null);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [quotaToDelete, setQuotaToDelete] = useState<UserSelectedQuota | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
          console.error('[SettingScreen] Lỗi khi lấy user từ Supabase:', userError);
          Alert.alert('Lỗi Xác Thực', 'Không thể lấy thông tin người dùng. Vui lòng thử đăng nhập lại.');
          return;
        }
        if (user) {
          setUserId(user.id);
        } else {
          console.warn('[SettingScreen] Không tìm thấy user nào đang đăng nhập.');
        }
      } catch (error) {
        console.error('[SettingScreen] Exception khi lấy thông tin người dùng:', error);
        Alert.alert('Lỗi', 'Có lỗi nghiêm trọng xảy ra khi lấy thông tin người dùng.');
      }
    };
    fetchUser();
  }, []);

  const loadUserQuotas = useCallback(async () => {
    if (!userId) {
      return;
    }
    setIsLoading(true);
    try {
      const storedQuotas = await getUserSelectedQuotas(userId);
      setUserSelectedQuotas(storedQuotas);
    } catch (error) {
      console.error('[SettingScreen] loadUserQuotas error:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách định mức đã chọn.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isFocused && userId) {
      loadUserQuotas();
    }
  }, [isFocused, userId, loadUserQuotas]);

  const handleSaveOrder = useCallback(async () => {
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng để lưu thứ tự.');
      return;
    }
    if (userSelectedQuotas.length === 0 && isEditMode) {
      setIsEditMode(false);
      return;
    }

    setIsLoading(true);
    const success = await saveUserSelectedQuotasOrder(
      userId,
      userSelectedQuotas.map(q => ({ product_code: q.product_code, zindex: q.zindex }))
    );
    if (success) {
      Alert.alert('Đã lưu', 'Thứ tự định mức đã được cập nhật.');
    } else {
      Alert.alert('Lỗi', 'Không thể lưu thứ tự định mức. Vui lòng thử lại.');
    }
    setIsEditMode(false);
    setIsLoading(false);
  }, [userId, userSelectedQuotas, isEditMode]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (isEditMode) {
              handleSaveOrder();
            } else {
              setIsEditMode(true);
            }
          }}
          style={{ marginRight: theme.spacing['level-3'], padding: theme.spacing['level-1'] }}
        >
          <Text
            style={{
              color: theme.colors.textOnPrimary,
              fontSize: theme.typography.fontSize['level-3'],
              fontWeight: theme.typography.fontWeight['bold'],
            }}
          >
            {isEditMode ? 'Lưu' : 'Sửa'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditMode, userSelectedQuotas, handleSaveOrder]);

  const handleOpenAddModal = () => {
    setCurrentProductCodeInput('');
    setFoundProduct(null);
    setProductSearchMessage(null);
    setProductSearchMessageType(null);
    setIsAddModalVisible(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalVisible(false);
    setCurrentProductCodeInput('');
    setFoundProduct(null);
    setProductSearchMessage(null);
    setProductSearchMessageType(null);
  };

  const handleProductCodeChange = (text: string) => {
    const upperCaseText = text.toUpperCase();
    setCurrentProductCodeInput(upperCaseText);
    setFoundProduct(null);
    setProductSearchMessage(null);
    setProductSearchMessageType(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (upperCaseText.trim() === '') {
      setIsSearchingProduct(false);
      return;
    }

    setIsSearchingProduct(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const productDetails = await getQuotaSettingByProductCode(upperCaseText.trim());
        if (productDetails) {
          setFoundProduct(productDetails);
          setProductSearchMessage(`Tìm thấy: ${productDetails.product_name}`);
          setProductSearchMessageType('success');
        } else {
          setFoundProduct(null);
          setProductSearchMessage(`Mã sản phẩm '${upperCaseText.trim()}' không tồn tại.`);
          setProductSearchMessageType('error');
        }
      } catch (error) {
        console.error('[SettingScreen] Error during product code search:', error);
        setFoundProduct(null);
        setProductSearchMessage('Lỗi khi tra cứu mã sản phẩm. Vui lòng thử lại.');
        setProductSearchMessageType('error');
      } finally {
        setIsSearchingProduct(false);
      }
    }, 600);
  };

  const handleAddProduct = async () => {
    if (!userId) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng.');
      return;
    }
    if (!foundProduct || !currentProductCodeInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã sản phẩm hợp lệ và đã được tìm thấy.');
      return;
    }

    const isAlreadyAdded = userSelectedQuotas.some(quota => quota.product_code === foundProduct.product_code);

    if (isAlreadyAdded) {
      Alert.alert('Thông báo', `Sản phẩm '${foundProduct.product_code}' đã có trong danh sách của bạn.`);
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();
    try {
      const newOrder = userSelectedQuotas.length;
      const addedQuota = await addUserSelectedQuota(
        userId,
        foundProduct.product_code,
        foundProduct.product_name,
        newOrder
      );

      if (addedQuota) {
        await loadUserQuotas();
        handleCloseAddModal();
        Alert.alert('Thành công', `Đã thêm sản phẩm '${addedQuota.product_name}'.`);
      } else {
        Alert.alert(
          'Lỗi',
          `Không thể thêm sản phẩm. Mã '${foundProduct.product_code}' có thể đã tồn tại hoặc có lỗi khác từ server.`
        );
      }
    } catch (error) {
      console.error('[SettingScreen] Exception during handleAddProduct:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi thêm sản phẩm.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuotaPress = (productCodeToDelete: string) => {
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      return;
    }
    if (!isEditMode) {
      return;
    }
    const quota = userSelectedQuotas.find(q => q.product_code === productCodeToDelete);
    if (!quota) {
      return;
    }
    setQuotaToDelete(quota);
    setIsDeleteConfirmModalVisible(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmModalVisible(false);
    setQuotaToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!quotaToDelete || !userId) {
      setIsDeleteConfirmModalVisible(false);
      setQuotaToDelete(null);
      Alert.alert('Lỗi', 'Có lỗi xảy ra, không thể xác định mục cần xóa.');
      return;
    }

    const productCodeToDelete = quotaToDelete.product_code;
    const productName = quotaToDelete.product_name || productCodeToDelete;

    setIsLoading(true);
    setIsDeleteConfirmModalVisible(false);

    const deleteSuccess = await deleteUserSelectedQuota(userId, productCodeToDelete);

    if (deleteSuccess) {
      Alert.alert('Đã xóa', `'${productName}' đã được xóa.`);

      const remainingQuotas = userSelectedQuotas.filter(q => q.product_code !== productCodeToDelete);
      const updatedQuotasWithNewZIndex = remainingQuotas.map((q, index) => ({ ...q, zindex: index }));
      setUserSelectedQuotas(updatedQuotasWithNewZIndex);

      if (updatedQuotasWithNewZIndex.length > 0) {
        const saveOrderSuccess = await saveUserSelectedQuotasOrder(
          userId,
          updatedQuotasWithNewZIndex.map(q => ({ product_code: q.product_code, zindex: q.zindex }))
        );
        if (!saveOrderSuccess) {
          console.error('[SettingScreen] Failed to save order of remaining items post-delete.');
          Alert.alert('Lỗi cập nhật thứ tự', 'Xóa thành công nhưng không thể cập nhật lại thứ tự các mục còn lại.');
        }
      }
    } else {
      Alert.alert('Lỗi', 'Không thể xóa định mức. Vui lòng thử lại.');
    }
    setQuotaToDelete(null);
    setIsLoading(false);
  };

  const renderQuotaItem = ({ item, drag, isActive }: RenderItemParams<UserSelectedQuota>): React.ReactNode => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={isEditMode ? drag : undefined}
          disabled={isActive || !isEditMode}
          style={[styles.itemContainer, isActive && styles.itemActive, !isEditMode && styles.itemNonEditable]}
        >
          {isEditMode && (
            <TouchableOpacity
              onPress={() => {
                handleDeleteQuotaPress(item.product_code);
              }}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="remove-circle" size={26} color={theme.colors.danger} />
            </TouchableOpacity>
          )}
          {!isEditMode && (
            <View
              style={{
                width: styles.deleteButton.paddingHorizontal
                  ? 26 + (styles.deleteButton.paddingHorizontal as number) * 2
                  : 26,
                marginRight: styles.deleteButton.marginRight,
              }}
            />
          )}

          <View style={styles.itemTextContainer}>
            <Text style={styles.itemProductCode}>{item.product_code}</Text>
            <Text style={styles.itemProductName}>{item.product_name || '(Chưa có tên)'}</Text>
          </View>

          {isEditMode ? (
            <TouchableOpacity
              onPressIn={drag}
              disabled={isActive}
              style={styles.dragHandle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="reorder-three-outline" size={30} color={theme.colors.grey} />
            </TouchableOpacity>
          ) : (
            <View
              style={{ width: Platform.OS === 'web' ? 40 : 30, marginLeft: styles.dragHandle.marginLeft as number }}
            />
          )}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  if (isLoading && !isAddModalVisible && !isSearchingProduct && !isDeleteConfirmModalVisible) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing['level-2'] }}>
          Đang tải dữ liệu...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userSelectedQuotas.length === 0 && !isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Chưa có sản phẩm nào được thêm.</Text>
          <Text style={styles.emptyText}>Nhấn "Thêm Sản Phẩm Mới" để bắt đầu.</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={userSelectedQuotas}
          renderItem={renderQuotaItem}
          keyExtractor={item => item.product_code}
          onDragEnd={({ data: reorderedData }) => {
            const updatedDataWithNewZIndex = reorderedData.map((q, index) => ({
              ...q,
              zindex: index,
            }));
            setUserSelectedQuotas(updatedDataWithNewZIndex);
          }}
          containerStyle={{ flex: 1, paddingTop: theme.spacing['level-2'] }}
          ListFooterComponent={<View style={{ height: isEditMode ? theme.spacing['level-4'] : 90 }} />}
          activationDistance={Platform.OS === 'web' ? 5 : 10}
          // ================== THÊM PROP ĐỂ ẨN SCROLLBAR ==================
          showsVerticalScrollIndicator={false}
          testID="settings-scroll-view"
          // ===============================================================
        />
      )}

      {!isEditMode && <Button title="Thêm Sản Phẩm Mới" onPress={handleOpenAddModal} style={styles.addButton} />}

      <ModalWrapper visible={isAddModalVisible} onClose={handleCloseAddModal}>
        <View style={styles.customModalHeaderContainer}>
          <Text style={styles.customModalHeaderText}>Thêm Sản Phẩm</Text>
        </View>
        <View style={styles.modalInnerContent}>
          <TextInput
            label="Mã Sản Phẩm"
            value={currentProductCodeInput}
            onChangeText={handleProductCodeChange}
            placeholder="Ví dụ: 5.2"
            autoCapitalize="characters"
            maxLength={20}
            onSubmitEditing={Keyboard.dismiss}
          />
          {isSearchingProduct && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={{ marginVertical: theme.spacing['level-2'] }}
            />
          )}
          {productSearchMessage && (
            <Text
              style={[
                styles.productSearchMessage,
                productSearchMessageType === 'success' && styles.successText,
                productSearchMessageType === 'error' && styles.errorTextModal,
              ]}
            >
              {productSearchMessage}
            </Text>
          )}
          <View style={styles.modalActions}>
            {/* <Button title="Hủy" onPress={handleCloseAddModal} type="secondary" style={styles.modalButton} /> */}
            <Button
              title={isLoading ? 'Đang thêm...' : 'Thêm vào danh sách'}
              onPress={handleAddProduct}
              type="primary"
              style={styles.modalButton}
              disabled={isLoading || !foundProduct || isSearchingProduct}
            />
          </View>
        </View>
      </ModalWrapper>

      {quotaToDelete && (
        <ModalWrapper visible={isDeleteConfirmModalVisible} onClose={handleCancelDelete}>
          <View style={styles.confirmDeleteModalContainer}>
            <Text style={styles.confirmDeleteTitle}>Xác nhận xóa</Text>
            <Text style={styles.confirmDeleteMessage}>
              Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách đã chọn?
            </Text>
            <View style={styles.confirmDeleteDetails}>
              <Text style={styles.detailTextBold}>Mã SP: {quotaToDelete.product_code}</Text>
              <Text style={styles.detailText}>Tên SP: {quotaToDelete.product_name || '(Chưa có tên)'}</Text>
            </View>
            <View style={styles.modalActions}>
              <Button title="Hủy" onPress={handleCancelDelete} type="secondary" style={styles.modalButton} />
              <Button
                title={isLoading ? 'Đang xóa...' : 'Xóa'}
                onPress={handleConfirmDelete}
                type="danger"
                style={styles.modalButton}
                disabled={isLoading}
              />
            </View>
          </View>
        </ModalWrapper>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background2,
  },
  customModalHeaderContainer: {
    paddingBottom: theme.spacing['level-4'],
    marginBottom: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    alignItems: 'center',
  },
  customModalHeaderText: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  modalInnerContent: {
    paddingHorizontal: theme.spacing['level-1'],
  },
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
  itemContainer: {
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: theme.spacing['level-4'],
    paddingHorizontal: theme.spacing['level-4'],
    marginHorizontal: theme.spacing['level-4'],
    marginVertical: theme.spacing['level-1'] + 2,
    borderRadius: theme.borderRadius['level-4'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadow.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
  },
  itemActive: {
    ...theme.shadow.lg,
    backgroundColor: theme.colors.background1,
    borderColor: theme.colors.primary,
  },
  itemNonEditable: {},
  itemTextContainer: {
    flex: 1,
  },
  itemProductCode: {
    fontSize: theme.typography.fontSize['level-5'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.primary,
  },
  itemProductName: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['level-1'],
  },
  deleteButton: {
    paddingHorizontal: theme.spacing['level-2'],
    paddingVertical: theme.spacing['level-1'],
    marginRight: theme.spacing['level-2'],
  },
  dragHandle: {
    paddingHorizontal: theme.spacing['level-2'],
    paddingVertical: theme.spacing['level-1'],
    marginLeft: theme.spacing['level-2'],
  },
  addButton: {
    marginHorizontal: theme.spacing['level-6'],
    marginVertical: theme.spacing['level-4'],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing['level-6'],
    marginBottom: theme.spacing['level-2'],
  },
  modalButton: {
    flex: 1,
  },
  productSearchMessage: {
    fontSize: theme.typography.fontSize['level-3'],
    textAlign: 'center',
    marginVertical: theme.spacing['level-2'],
    padding: theme.spacing['level-2'],
    borderRadius: theme.borderRadius['level-2'],
    backgroundColor: theme.colors.background1,
  },
  successText: {
    color: theme.colors.success,
  },
  errorTextModal: {
    color: theme.colors.danger,
  },
  confirmDeleteModalContainer: {
    alignItems: 'center',
    padding: theme.spacing['level-2'],
  },
  confirmDeleteTitle: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    marginBottom: theme.spacing['level-4'],
    textAlign: 'center',
  },
  confirmDeleteMessage: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['level-6'],
  },
  confirmDeleteDetails: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.background1,
    padding: theme.spacing['level-4'],
    borderRadius: theme.borderRadius['level-4'],
    marginBottom: theme.spacing['level-6'],
  },
  detailText: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    marginBottom: theme.spacing['level-1'],
  },
  detailTextBold: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing['level-1'],
  },
});