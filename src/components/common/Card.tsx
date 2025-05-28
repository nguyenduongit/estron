// components/common/Card.tsx
import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { theme } from "../../theme";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground, // Giữ nguyên key, giá trị đã cập nhật trong theme
    borderRadius: theme.borderRadius['level-4'], // Thay md bằng level-4
    padding: theme.spacing['level-4'],           // Thay md bằng level-4
    marginBottom: theme.spacing['level-4'],    // Thay md bằng level-4
    ...theme.shadow.sm,                         // Giữ nguyên
  },
});

export default Card;