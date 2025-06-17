import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuthStore } from '../../stores/authStore';
import ModalWrapper from '../common/ModalWrapper';
import Button from '../common/Button';
import { theme } from '../../theme';

export default function UserSwitcherModal() {
  const { isSwitcherVisible, users, activeUserId, toggleSwitcher, switchUser, signOut, startAddingAccount } = useAuthStore();

  const handleAddAccount = () => {
    startAddingAccount();
  };

  const renderUserItem = ({ item }: { item: typeof users[0] }) => {
    const isActive = item.profile.id === activeUserId;
    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => !isActive && switchUser(item.profile.id)}
        disabled={isActive}
      >
        <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={40} color={theme.colors.primary} />
            <View style={styles.userTextContainer}>
                <Text style={styles.userName}>{item.profile.full_name}</Text>
                <Text style={styles.userEmail}>{item.profile.email}</Text>
            </View>
        </View>
        {isActive && <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />}
      </TouchableOpacity>
    );
  };

  return (
    <ModalWrapper visible={isSwitcherVisible} onClose={toggleSwitcher}>
        <View style={styles.header}>
            <Text style={styles.title}>Chuyển tài khoản</Text>
        </View>
        <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.profile.id}
            style={styles.list}
        />
        <Button
            title="Thêm tài khoản"
            onPress={handleAddAccount}
            variant="outline"
            style={styles.button}
        />
        <Button
            title="Đăng xuất"
            onPress={signOut}
            variant="danger"
            style={styles.button}
        />
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: theme.spacing['level-3'],
    marginBottom: theme.spacing['level-3'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize['level-6'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  list: {
    maxHeight: 200,
    marginBottom: theme.spacing['level-4'],
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing['level-3'],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    marginLeft: theme.spacing['level-3'],
  },
  userName: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: theme.typography.fontSize['level-2'],
    color: theme.colors.textSecondary,
  },
  button: {
    marginTop: theme.spacing['level-2'],
  }
});