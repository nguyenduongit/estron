import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import ModalWrapper from '../../../components/common/ModalWrapper';
import { UserSelectedQuota } from '../../../types/data';
import { theme } from '../../../theme';
import { formatDate } from '../../../utils/dateUtils';

interface SelectProductModalProps {
  visible: boolean;
  onClose: () => void;
  userSelectedQuotas: UserSelectedQuota[];
  onSelectProduct: (quota: UserSelectedQuota) => void;
  selectedDate: string;
}

const SelectProductModal: React.FC<SelectProductModalProps> = ({
  visible,
  onClose,
  userSelectedQuotas,
  onSelectProduct,
  selectedDate,
}) => {
  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Chọn sản phẩm</Text>
        <Text style={styles.subtitle}>
          Ngày nhập: {selectedDate ? formatDate(selectedDate, 'dd/MM/yyyy') : ''}
        </Text>
      </View>
      {userSelectedQuotas.length > 0 ? (
        <FlatList
          data={userSelectedQuotas}
          keyExtractor={item => item.product_code}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.productItem} onPress={() => onSelectProduct(item)}>
              <Text style={styles.productCode}>{item.product_code}</Text>
              <Text style={styles.productName} numberOfLines={2}>
                {item.product_name || '(Chưa có tên SP)'}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.productList}
        />
      ) : (
        <Text style={styles.emptyText}>Không có sản phẩm nào trong cài đặt.</Text>
      )}
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['level-2'],
    paddingBottom: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  title: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    marginBottom: theme.spacing['level-1'],
  },
  subtitle: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
  },
  productList: {
    maxHeight: 400,
  },
  productItem: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginVertical: theme.spacing['level-1'],
    padding: theme.spacing['level-2'],
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius['level-3'],
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  productCode: {
    minWidth: 80,
    paddingHorizontal: theme.spacing['level-3'],
    fontSize: theme.typography.fontSize['level-5'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.textOnPrimary,
    textAlign: 'left',
  },
  productName: {
    flex: 1,
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textOnPrimary,
    textAlign: 'left',
    paddingRight: theme.spacing['level-3'],
  },
  emptyText: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing['level-6'],
  },
});

export default SelectProductModal;