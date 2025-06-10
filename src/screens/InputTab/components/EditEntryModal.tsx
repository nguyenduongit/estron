import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ModalWrapper from '../../../components/common/ModalWrapper';
import TextInput from '../../../components/common/TextInput';
import Button from '../../../components/common/Button';
import { ProductionEntry } from '../../../types/data';
import { theme } from '../../../theme';
import { formatDate } from '../../../utils/dateUtils';

interface EditEntryModalProps {
  visible: boolean;
  onClose: () => void;
  entry: ProductionEntry | null;
  onUpdate: (updatedData: Partial<Omit<ProductionEntry, 'id'>>) => void;
  onDelete: (entry: ProductionEntry) => void;
  isSaving: boolean;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({
  visible,
  onClose,
  entry,
  onUpdate,
  onDelete,
  isSaving,
}) => {
  const [quantity, setQuantity] = useState('');
  const [po, setPo] = useState('');
  const [box, setBox] = useState('');
  const [batch, setBatch] = useState('');

  useEffect(() => {
    if (entry) {
      setQuantity(entry.quantity?.toString() ?? '');
      setPo(entry.po ?? '');
      setBox(entry.box ?? '');
      setBatch(entry.batch ?? '');
    }
  }, [entry]);

  const handleUpdate = () => {
    const quantityValue = quantity.trim() ? parseFloat(quantity) : null;
    onUpdate({
      quantity: quantityValue,
      po: po.trim() || null,
      box: box.trim() || null,
      batch: batch.trim() || null,
    });
  };

  if (!entry) return null;

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="close-outline" size={28} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sửa thông tin</Text>
        <TouchableOpacity
          onPress={() => onDelete(entry)}
          style={styles.headerButton}
          disabled={!!entry.verified}
        >
          <Ionicons
            name="trash-outline"
            size={24}
            color={entry.verified ? theme.colors.grey : theme.colors.danger}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        {entry.product_code} - Ngày: {formatDate(entry.date, 'dd/MM/yyyy')}
      </Text>

      <View style={styles.formContainer}>
        <TextInput
          label="Số lượng"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Nhập số lượng"
          keyboardType="numeric"
          editable={!entry.verified}
        />
        <TextInput
          label="PO"
          value={po}
          onChangeText={setPo}
          placeholder="Nhập số PO"
          editable={!entry.verified}
        />
        <TextInput
          label="Hộp"
          value={box}
          onChangeText={setBox}
          placeholder="Nhập mã hộp"
          editable={!entry.verified}
        />
        <TextInput
          label="Batch"
          value={batch}
          onChangeText={setBatch}
          placeholder="Nhập số batch"
          editable={!entry.verified}
        />
      </View>
      <View style={styles.actions}>
        <Button title="Hủy" onPress={onClose} type="secondary" style={styles.button} />
        <Button
          title={isSaving ? 'Đang lưu...' : 'Lưu'}
          onPress={handleUpdate}
          type="primary"
          style={styles.button}
          disabled={isSaving || !!entry.verified}
        />
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing['level-2'],
    marginBottom: theme.spacing['level-1'],
  },
  headerButton: {
    padding: theme.spacing['level-1'],
  },
  title: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    textAlign: 'center',
    width: '100%',
    paddingBottom: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  formContainer: {
    paddingHorizontal: theme.spacing['level-2'],
    marginTop: theme.spacing['level-4'],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing['level-6'],
    marginBottom: theme.spacing['level-2'],
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing['level-2'],
  },
});

export default EditEntryModal;