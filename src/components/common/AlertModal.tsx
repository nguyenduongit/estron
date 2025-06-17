//src/components/common/AlertModal.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { theme } from '../../theme'; //
import Button from './Button'; //

export interface AlertButtonType {
  text: string;
  onPress?: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

interface AlertModalProps {
  visible: boolean;
  message: string;
  buttons: AlertButtonType[];
  onClose?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  message,
  buttons,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.alertContainer} onPress={() => {}}>
          <Text style={styles.messageText}>{message}</Text>
          <View style={styles.buttonRow}>
            {buttons.map((button, index) => (
              <Button
                key={index}
                title={button.text}
                onPress={() => {
                  if (button.onPress) {
                    button.onPress();
                  }
                }}
                variant={button.style || 'primary'}
                style={[
                  styles.button,
                  ...(buttons.length > 1 ? [styles.buttonWithMargin] : []),
                ]}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['level-6'],
  },
  alertContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: theme.colors.cardBackground, //
    borderRadius: theme.borderRadius['level-4'], //
    padding: theme.spacing['level-5'],
    alignItems: 'center',
    ...theme.shadow.lg, //
  },
  messageText: {
    fontSize: theme.typography.fontSize['level-4'], //
    color: theme.colors.text, //
    textAlign: 'center',
    marginBottom: theme.spacing['level-5'],
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Hoạt động tốt hơn khi các nút có flex: 1
    width: '100%',
  },
  button: {
    flex: 1, // Để các nút chia đều không gian nếu có nhiều hơn 1
             // Nếu chỉ có 1 nút, nó sẽ chiếm toàn bộ chiều rộng của buttonRow
  },
  buttonWithMargin: {
    // Nếu có nhiều hơn 1 button, áp dụng margin này cho TẤT CẢ CÁC BUTTON
    // Để tạo khoảng cách đều, button đầu tiên và cuối cùng có thể cần xử lý đặc biệt
    // hoặc đơn giản là chấp nhận margin ở cả hai phía.
    // Hoặc, chỉ áp dụng margin cho các button không phải là button đầu tiên:
    // index > 0 ? { marginLeft: theme.spacing['level-2'] } : {}
    // Hiện tại, để đơn giản, chúng ta sẽ để cho buttonRow xử lý việc phân bổ không gian
    // và margin này sẽ tạo khoảng cách giữa chúng.
    // Nếu chỉ có 2 button, 'justifyContent: space-between' sẽ hoạt động tốt hơn là margin.
    // Nếu nhiều hơn 2, 'space-around' hoặc margin sẽ cần thiết.
    // Với flex:1 cho mỗi button, chúng ta có thể thêm margin nhỏ.
    marginHorizontal: theme.spacing['level-1'],
  },
});

export default AlertModal;