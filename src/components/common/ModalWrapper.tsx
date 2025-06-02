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
        setDynamicMaxWidth(Math.min(screenWidth , ORIGINAL_MAX_WIDTH));
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    height: '100%',
    width: Platform.OS === 'web' ? undefined : '100%',
    padding: Platform.OS === 'web' ? 0 : undefined,
    },
    modalContentBase: {
    width: "100%",
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius['level-6'],
    padding: theme.spacing['level-2'],
    ...theme.shadow.lg,
    marginHorizontal:theme.spacing['level-8'],
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