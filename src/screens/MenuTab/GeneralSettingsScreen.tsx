// src/screens/MenuTab/GeneralSettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { theme } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';

export default function GeneralSettingsScreen() {
  const { showSunday, toggleShowSunday } = useSettingsStore();

  return (
    <View style={styles.container}>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Hiển thị ngày Chủ Nhật</Text>
        <Switch
          trackColor={{ false: theme.colors.darkGrey, true: theme.colors.primary }}
          thumbColor={showSunday ? theme.colors.white : theme.colors.lightGrey}
          ios_backgroundColor={theme.colors.darkGrey}
          onValueChange={toggleShowSunday}
          value={showSunday}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background2,
        paddingTop: theme.spacing['level-5'],
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.cardBackground,
        paddingHorizontal: theme.spacing['level-4'],
        paddingVertical: theme.spacing['level-3'],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderColor,
    },
    settingLabel: {
        color: theme.colors.text,
        fontSize: theme.typography.fontSize['level-4'],
    },
});