import React from "react";
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Text, TouchableOpacity } from "react-native";
import { theme } from "../../theme";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ visible, onClose, children, title }) => {
  return (
    <Modal
      animationType="fade" // 'fade' cho hiệu ứng mượt mà và ổn định hơn
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Lớp phủ ngoài cùng, bấm vào sẽ đóng modal */}
      <TouchableWithoutFeedback onPress={onClose} accessible={false}>
        <View style={styles.overlay}>
          {/* Container chứa nội dung của modal, bấm vào không bị đóng */}
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.modalContent}>
              {/* Tiêu đề (tùy chọn) */}
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
              {/* Nội dung chính của modal được truyền vào */}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Lớp phủ màu đen mờ bao trọn màn hình
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    // Thêm padding để modal không bị dính sát vào cạnh màn hình
    padding: theme.spacing['level-4'],
  },
  // Khung chứa nội dung chính của modal
  modalContent: {
    width: "100%",
    maxWidth: 420, // Chiều rộng tối đa để không quá lớn trên màn hình desktop
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius['level-6'],
    padding: theme.spacing['level-5'], // Padding cho nội dung bên trong
    ...theme.shadow.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing['level-4'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    paddingBottom: theme.spacing['level-2'],
  },
  title: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing['level-1'],
  },
});

export default ModalWrapper;