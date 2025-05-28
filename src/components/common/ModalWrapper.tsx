// components/common/ModalWrapper.tsx
import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Text, TouchableOpacity, Platform, Dimensions, ViewStyle } from "react-native";
import { theme } from "../../theme"; //
import Ionicons from "@expo/vector-icons/Ionicons";

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const ORIGINAL_MAX_WIDTH = 400;

const ModalWrapper: React.FC<ModalWrapperProps> = ({ visible, onClose, children, title }) => {
  const [dynamicMaxWidth, setDynamicMaxWidth] = useState(ORIGINAL_MAX_WIDTH);
  const [dynamicOverlayStyle, setDynamicOverlayStyle] = useState<ViewStyle>(() => styles.overlayBase);

  useEffect(() => {
    const updateModalStyles = () => {
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;

      if (Platform.OS === 'web') {
        const appVisibleWidth = screenHeight / 2;
        const calculatedModalContentMaxWidth = Math.min(appVisibleWidth * 0.90, ORIGINAL_MAX_WIDTH);
        setDynamicMaxWidth(calculatedModalContentMaxWidth < 100 ? appVisibleWidth * 0.9 : calculatedModalContentMaxWidth);

        setDynamicOverlayStyle({
          ...styles.overlayBase,
          width: appVisibleWidth,
          marginHorizontal: 'auto',
        });

      } else {
        setDynamicMaxWidth(Math.min(screenWidth * 0.9, ORIGINAL_MAX_WIDTH));
        setDynamicOverlayStyle(styles.overlayBase);
      }
    };

    updateModalStyles();
    const subscription = Dimensions.addEventListener('change', updateModalStyles);
    return () => {
      subscription?.remove();
    };
  }, []);

  const modalContentStyle: ViewStyle = {
    ...styles.modalContentBase,
    maxWidth: dynamicMaxWidth,
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose} accessible={false}>
        <View style={styles.modalRootContainerWeb}>
          <View style={dynamicOverlayStyle}>
            <TouchableWithoutFeedback accessible={false}>
              <View style={modalContentStyle}>
                {title && (
                  <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}
                {children}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRootContainerWeb: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBase: {
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Tăng độ mờ cho dark theme
    justifyContent: "center",
    alignItems: "center",
    height: Platform.OS === 'web' ? '100%' : undefined,
    width: Platform.OS === 'web' ? undefined : '100%',
    padding: Platform.OS === 'web' ? 0 : undefined,
  },
  modalContentBase: {
    width: "90%",
    backgroundColor: theme.colors.cardBackground, // background -> cardBackground
    borderRadius: theme.borderRadius['level-7'], // lg -> level-7
    padding: theme.spacing['level-6'], // lg -> level-6
    ...theme.shadow.lg, // Giữ nguyên
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing['level-4'], // md -> level-4
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor, // lightGrey -> borderColor
    paddingBottom: theme.spacing['level-2'], // sm -> level-2
  },
  title: {
    fontSize: theme.typography['level-6'].fontSize, // h3.fontSize (20) -> level-6 (20)
    fontWeight: theme.typography['level-6-bold'].fontWeight, // h3.fontWeight ('bold') -> level-6-bold
    color: theme.colors.text, // Giữ nguyên
  },
  closeButton: {
    padding: theme.spacing['level-1'], // xs -> level-1
  },
});

export default ModalWrapper;