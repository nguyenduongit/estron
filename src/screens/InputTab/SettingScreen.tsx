// screens/InputTab/SettingScreen.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform, Keyboard, TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MenuStackNavigatorParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { UserSelectedQuota, QuotaSetting } from '../../types/data';
import {
  getQuotaSettingByProductCode,
  getUserSelectedQuotas,
  getQuotaSettingsByProductCodes,
  addUserSelectedQuota,
  deleteUserSelectedQuota,
  saveUserSelectedQuotasOrder,
} from '../../services/storage';

import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import ModalWrapper from '../../components/common/ModalWrapper';
import { useAuthStore } from '../../stores/authStore';

if (Platform.OS === 'web') {
  const styleId = 'hide-settings-scrollbar-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
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

type SettingScreenNavigationProp = StackNavigationProp<MenuStackNavigatorParamList, 'Setting'>;

const SALARY_LEVELS = [
  { key: 'level_0_9', label: 'Bậc 0.9' },
  { key: 'level_1_0', label: 'Bậc 1.0' },
  { key: 'level_1_1', label: 'Bậc 1.1' },
  { key: 'level_2_0', label: 'Bậc 2.0' },
  { key: 'level_2_1', label: 'Bậc 2.1' },
  { key: 'level_2_2', label: 'Bậc 2.2' },
  { key: 'level_2_5', label: 'Bậc 2.5' },
] as const;

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
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [quotaToDelete, setQuotaToDelete] = useState<UserSelectedQuota | null>(null);

  const activeUserId = useAuthStore(state => state.authUser?.profile.id);
  const [expandedProductCode, setExpandedProductCode] = useState<string | null>(null);
  const [quotaDetailsMap, setQuotaDetailsMap] = useState<Map<string, QuotaSetting>>(new Map());

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadUserQuotas = useCallback(async () => {
    if (!activeUserId) return;
    setIsLoading(true);
    try {
      const { data: storedQuotas, error: quotasError } = await getUserSelectedQuotas(activeUserId);
      if (quotasError) throw quotasError;
      
      setUserSelectedQuotas(storedQuotas || []);

      if (storedQuotas && storedQuotas.length > 0) {
        const productCodes = storedQuotas.map(q => q.product_code);
        const { data: details, error: detailsError } = await getQuotaSettingsByProductCodes(productCodes);
        if (detailsError) throw detailsError;

        const detailsMap = new Map<string, QuotaSetting>();
        if (details) {
            details.forEach((detail: QuotaSetting) => {
                detailsMap.set(detail.product_code, detail);
            });
        }
        setQuotaDetailsMap(detailsMap);
      } else {
        setQuotaDetailsMap(new Map());
      }
    } catch (error: any) {
      console.error('[SettingScreen] loadUserQuotas error:', error);
      Alert.alert('Lỗi', `Không thể tải danh sách định mức: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    if (activeUserId) {
      loadUserQuotas();
    }
  }, [ activeUserId, loadUserQuotas]);

  const handleSaveOrder = useCallback(async () => {
    if (!activeUserId) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng.');
      return;
    }
    setIsLoading(true);
    const { data: success, error } = await saveUserSelectedQuotasOrder(
      activeUserId,
      userSelectedQuotas.map((q, index) => ({ product_code: q.product_code, zindex: index }))
    );
    
    if (error) {
        Alert.alert('Lỗi', `Không thể lưu thứ tự: ${error.message}`);
    } else if (success) {
        Alert.alert('Đã lưu', 'Thứ tự định mức đã được cập nhật.');
    }
    
    setIsEditMode(false);
    setIsLoading(false);
  }, [activeUserId, userSelectedQuotas]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => (isEditMode ? handleSaveOrder() : setIsEditMode(true))}
          style={{ marginRight: theme.spacing['level-3'], padding: theme.spacing['level-1'] }}
        >
          <Text
            style={{
              color: theme.colors.textOnPrimary,
              fontSize: theme.typography.fontSize['level-3'],
              fontWeight: 'bold',
            }}
          >
            {isEditMode ? 'Lưu' : 'Sửa'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditMode, handleSaveOrder]);

  const handleOpenAddModal = () => {
    setCurrentProductCodeInput('');
    setFoundProduct(null);
    setProductSearchMessage(null);
    setIsAddModalVisible(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalVisible(false);
    setCurrentProductCodeInput('');
    setFoundProduct(null);
    setProductSearchMessage(null);
  };

  const handleProductCodeChange = (text: string) => {
    const upperCaseText = text.toUpperCase();
    setCurrentProductCodeInput(upperCaseText);
    setFoundProduct(null);
    setProductSearchMessage(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (upperCaseText.trim() === '') {
      setIsSearchingProduct(false);
      return;
    }
    setIsSearchingProduct(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: productDetails, error } = await getQuotaSettingByProductCode(upperCaseText.trim());
        if (error) throw error;
        
        if (productDetails) {
          setFoundProduct(productDetails);
          setProductSearchMessage(null);
        } else {
          setFoundProduct(null);
          setProductSearchMessage(`Mã sản phẩm '${upperCaseText.trim()}' không tồn tại.`);
        }
      } catch (error: any) {
        setFoundProduct(null);
        setProductSearchMessage(`Lỗi khi tra cứu: ${error.message}`);
      } finally {
        setIsSearchingProduct(false);
      }
    }, 600);
  };

  const handleAddProduct = async () => {
    if (!activeUserId || !foundProduct) return;
    if (userSelectedQuotas.some(q => q.product_code === foundProduct.product_code)) {
      Alert.alert('Thông báo', `Sản phẩm '${foundProduct.product_code}' đã có trong danh sách.`);
      return;
    }
    setIsLoading(true);
    Keyboard.dismiss();
    try {
      const newOrder = userSelectedQuotas.length;
      const { data: addedQuota, error } = await addUserSelectedQuota(
        activeUserId,
        foundProduct.product_code,
        newOrder
      );

      if (error) throw error;

      if (addedQuota) {
        await loadUserQuotas();
        handleCloseAddModal();
        Alert.alert('Thành công', `Đã thêm sản phẩm '${foundProduct.product_name}'.`);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', `Đã có lỗi xảy ra: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuotaPress = (quota: UserSelectedQuota) => {
    if (!isEditMode) return;
    setQuotaToDelete(quota);
    setIsDeleteConfirmModalVisible(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmModalVisible(false);
    setQuotaToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!quotaToDelete || !activeUserId) return;
    const { product_code } = quotaToDelete;
    const productName = quotaDetailsMap.get(product_code)?.product_name;

    setIsLoading(true);
    setIsDeleteConfirmModalVisible(false);
    
    const { data: success, error } = await deleteUserSelectedQuota(activeUserId, product_code);

    if (error) {
      Alert.alert('Lỗi', `Không thể xóa: ${error.message}`);
    } else if (success) {
      Alert.alert('Đã xóa', `'${productName || product_code}' đã được xóa.`);
      const remaining = userSelectedQuotas.filter(q => q.product_code !== product_code);
      const updated = remaining.map((q, index) => ({ ...q, zindex: index }));
      setUserSelectedQuotas(updated);
      if (updated.length > 0) {
        await saveUserSelectedQuotasOrder(
          activeUserId,
          updated.map(q => ({ product_code: q.product_code, zindex: q.zindex }))
        );
      }
    }
    
    setQuotaToDelete(null);
    setIsLoading(false);
  };

  const renderQuotaItem = ({ item, drag, isActive }: RenderItemParams<UserSelectedQuota>): React.ReactNode => {
    const isExpanded = expandedProductCode === item.product_code;
    const details = quotaDetailsMap.get(item.product_code);
    const productName = details?.product_name || '(Chưa có tên)';

    const handlePress = () => {
      if (isEditMode) return;
      setExpandedProductCode(isExpanded ? null : item.product_code);
    };

    return (
      <ScaleDecorator>
        <View style={styles.itemOuterContainer}>
          <TouchableOpacity
            onPress={handlePress}
            onLongPress={isEditMode ? drag : undefined}
            disabled={isActive}
            style={[styles.itemContainer, isActive && styles.itemActive]}
          >
            {isEditMode && (
              <TouchableOpacity onPress={() => handleDeleteQuotaPress(item)} style={styles.deleteButton}>
                <Ionicons name="remove-circle" size={26} color={theme.colors.danger} />
              </TouchableOpacity>
            )}

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{item.product_code}</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.itemProductName} numberOfLines={2}>
                {productName}
              </Text>
            </View>

            {isEditMode && (
              <View style={styles.dragHandleContainer}>
                <TouchableOpacity onPressIn={drag} disabled={isActive} style={styles.dragHandle}>
                  <Ionicons name="reorder-three-outline" size={30} color={theme.colors.grey} />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {isExpanded && details && (
            <View style={styles.detailsContainer}>
              {SALARY_LEVELS.map((level, index) => {
                const quotaValue = details[level.key as keyof QuotaSetting] as number | null | undefined;
                const isLastRow = index === SALARY_LEVELS.length - 1;
                return (
                  <View key={level.key} style={[styles.quotaRow, isLastRow && styles.quotaRowLast]}>
                    <Text style={styles.quotaLabel}>{level.label}:</Text>
                    <Text style={styles.quotaValue}>{quotaValue?.toLocaleString() ?? 'N/A'}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScaleDecorator>
    );
  };

  if (isLoading && !isAddModalVisible && !isSearchingProduct && !isDeleteConfirmModalVisible) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userSelectedQuotas.length === 0 && !isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Chưa có công đoạn nào được thêm.</Text>
          <Text style={styles.emptyText}>Nhấn "Thêm Công Đoạn Mới" để bắt đầu.</Text>
        </View>
      ) : (
        <DraggableFlatList
          testID="settings-scroll-view"
          showsVerticalScrollIndicator={false}
          data={userSelectedQuotas}
          renderItem={renderQuotaItem}
          keyExtractor={item => item.product_code}
          onDragEnd={({ data: reorderedData }) => {
            const updatedDataWithNewZIndex = reorderedData.map((q, index) => ({ ...q, zindex: index }));
            setUserSelectedQuotas(updatedDataWithNewZIndex);
          }}
          containerStyle={{ flex: 1, paddingTop: theme.spacing['level-2'] }}
          ListFooterComponent={<View style={{ height: isEditMode ? theme.spacing['level-4'] : 90 }} />}
          activationDistance={Platform.OS === 'web' ? 5 : 10}
        />
      )}

      {!isEditMode && <Button title="Thêm Công Đoạn Mới" onPress={handleOpenAddModal} style={styles.addButton} />}

      <ModalWrapper visible={isAddModalVisible} onClose={handleCloseAddModal}>
        <View style={styles.customModalHeaderContainer}>
          <Text style={styles.customModalHeaderText}>Thêm Công Đoạn</Text>
        </View>
        <View style={styles.modalInnerContent}>
          <TextInput
            label="Mã Công Đoạn"
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

          {foundProduct && !isSearchingProduct && (
            <View style={styles.modalProductDetails}>
              <Text style={styles.foundProductName}>{foundProduct.product_name}</Text>
            </View>
          )}

          {!foundProduct && productSearchMessage && !isSearchingProduct && (
            <Text style={styles.errorTextModal}>{productSearchMessage}</Text>
          )}

          <View style={styles.modalActions}>
            <Button
              title={isLoading ? 'Đang thêm...' : 'Thêm vào danh sách'}
              onPress={handleAddProduct}
              variant="primary"
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
              <Text style={styles.detailText}>Tên SP: {quotaDetailsMap.get(quotaToDelete.product_code)?.product_name || '(Chưa có tên)'}</Text>
            </View>
            <View style={styles.modalActions}>
              <Button title="Hủy" onPress={handleCancelDelete} variant="secondary" style={styles.modalButton} />
              <Button
                title={isLoading ? 'Đang xóa...' : 'Xóa'}
                onPress={handleConfirmDelete}
                variant="danger"
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
  itemOuterContainer: {
    marginHorizontal: theme.spacing['level-4'],
    marginVertical: theme.spacing['level-1'] + 2,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius['level-4'],
    ...theme.shadow.sm,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: theme.colors.borderColor,
    overflow: 'hidden',
  },
  itemActive: {
    borderColor: theme.colors.primary,
  },
  deleteButton: {
    paddingHorizontal: theme.spacing['level-3'],
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  codeBox: {
    width: 100,
    height: 70,
    backgroundColor: theme.colors.background1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeText: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  infoContainer: {
    flex: 1,
    paddingVertical: theme.spacing['level-2'],
    paddingHorizontal: theme.spacing['level-3'],
  },
  itemProductName: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
  },
  dragHandleContainer: {
    width: 44,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: theme.spacing['level-2'],
  },
  dragHandle: {
    padding: theme.spacing['level-2'],
  },
  detailsContainer: {
    borderColor: theme.colors.borderColor,
    borderTopWidth: 0,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  quotaRowLast: {},
  quotaLabel: {
    width: 100,
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.background1,
    padding: theme.spacing['level-3'],
  },
  quotaValue: {
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: 'bold',
    color: theme.colors.text,
    paddingRight: theme.spacing['level-3'],
  },
  addButton: {
    position: 'absolute',
    bottom: theme.spacing['level-4'],
    left: theme.spacing['level-6'],
    right: theme.spacing['level-6'],
  },
  modalInnerContent: {
    paddingHorizontal: theme.spacing['level-1'],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing['level-6'],
    marginBottom: theme.spacing['level-2'],
    gap: theme.spacing['level-2'],
  },
  modalButton: {
    flex: 1,
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
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalProductDetails: {
    paddingTop: theme.spacing['level-4'],
    paddingBottom: theme.spacing['level-2'], // Thêm padding bottom để không bị dính nút
  },
  foundProductName: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.success,
    textAlign: 'center',
  },
  // Style này không còn được dùng trong modal nữa, nhưng giữ lại vì nó được dùng ở chỗ khác
  modalQuotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:'center',
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.borderColor,
  },
  errorTextModal: {
    fontSize: theme.typography.fontSize['level-3'],
    textAlign: 'center',
    marginVertical: theme.spacing['level-2'],
    padding: theme.spacing['level-2'],
    borderRadius: theme.borderRadius['level-2'],
    color: theme.colors.danger,
  },
  confirmDeleteModalContainer: {
    alignItems: 'center',
    padding: theme.spacing['level-2'],
  },
  confirmDeleteTitle: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: 'bold',
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