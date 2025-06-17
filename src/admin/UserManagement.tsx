// src/admin/UserManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Checkbox from 'expo-checkbox'; 
import { getAllUserProfiles, updateUsersStatus } from '../../src/services/storage';
import { Profile } from '../../src/types/data';
import { theme } from '../../src/theme';
import CustomButton from '../../src/auth/components/CustomButton';
import AlertModal, { AlertButtonType } from '../../src/components/common/AlertModal';

const StatusBadge: React.FC<{ isActive: boolean | null | undefined }> = ({ isActive }) => {
  const text = isActive ? 'Đang hoạt động' : 'Vô hiệu hóa';
  const backgroundColor = isActive ? theme.colors.success : theme.colors.grey;
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
};

const UserManagement = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertButtons, setAlertButtons] = useState<AlertButtonType[]>([]);

    const showAlert = (message: string, buttons: AlertButtonType[]) => {
      setAlertMessage(message);
      setAlertButtons(buttons);
      setIsAlertVisible(true);
    };
    
    const hideAlert = () => setIsAlertVisible(false);

    const fetchProfiles = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllUserProfiles();
        setProfiles(data);
      } catch (err) {
        setError('Không thể tải danh sách người dùng.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, []);
  
    useEffect(() => {      
      fetchProfiles();
    }, [fetchProfiles]);
  
    const handleToggleSelectAll = () => {
      if (selectedIds.length === profiles.length) {
        setSelectedIds([]);
      } else {
        setSelectedIds(profiles.map(p => p.id));
      }
    };
  
    const handleToggleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    };
  
    // === CẬP NHẬT HÀM ĐỂ XỬ LÝ NÚT "KÍCH HOẠT" ===
    const handleAction = async (action: 'activate' | 'deactivate' | 'delete') => {
        const selectedCount = selectedIds.length;
        if (selectedCount === 0) return;
  
        if (action === 'delete') {
            showAlert("Chức năng Xóa người dùng đang được phát triển để đảm bảo an toàn dữ liệu.", [{ text: 'Đã hiểu', onPress: hideAlert }]);
            return;
        }

        // Cấu hình thông điệp và hành động dựa trên nút được nhấn
        let confirmMessage = '';
        let successMessage = '';
        let statusToSet = false;
        let actionStyle: 'primary' | 'danger' = 'primary';

        if (action === 'activate') {
            confirmMessage = `Bạn có chắc chắn muốn kích hoạt lại ${selectedCount} tài khoản đã chọn không?`;
            successMessage = `Đã kích hoạt lại ${selectedCount} tài khoản.`;
            statusToSet = true;
            actionStyle = 'primary';
        } else { // 'deactivate'
            confirmMessage = `Bạn có chắc chắn muốn vô hiệu hóa ${selectedCount} tài khoản đã chọn không?`;
            successMessage = `Đã vô hiệu hóa ${selectedCount} tài khoản.`;
            statusToSet = false;
            actionStyle = 'danger';
        }
        
        showAlert(confirmMessage, [
            { text: "Hủy", style: "secondary", onPress: hideAlert },
            {
                text: "Xác nhận",
                style: actionStyle,
                onPress: async () => {
                    hideAlert();
                    setIsSubmitting(true);
                    const success = await updateUsersStatus(selectedIds, statusToSet);
                    if (success) {
                        Alert.alert("Thành công", successMessage);
                        await fetchProfiles();
                        setSelectedIds([]);
                    }
                    // Hàm updateUsersStatus đã có Alert khi lỗi
                    setIsSubmitting(false);
                }
            }
        ]);
    };
  
    const renderHeader = () => {
        const isAllSelected = selectedIds.length === profiles.length && profiles.length > 0;
        return (
          <View style={styles.tableRowHeader}>
              <View style={[styles.cell, styles.cellCheckbox]}>
                  <Checkbox
                      style={styles.checkbox}
                      value={isAllSelected}
                      onValueChange={handleToggleSelectAll}
                      color={isAllSelected ? theme.colors.primary : undefined}
                  />
              </View>
              <Text style={[styles.headerText, styles.cell, { flex: 1.5 }]}>Mã nhân viên</Text>
              <Text style={[styles.headerText, styles.cell, { flex: 2.5 }]}>Tên nhân viên</Text>
              <Text style={[styles.headerText, styles.cell, { flex: 3 }]}>Email</Text>
              <Text style={[styles.headerText, styles.cell, { flex: 2 }]}>Trạng thái</Text>
          </View>
        );
    };
  
    const renderItem = ({ item }: { item: Profile }) => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <View style={styles.tableRow}>
              <View style={[styles.cell, styles.cellCheckbox]}>
                  <Checkbox
                      style={styles.checkbox}
                      value={isSelected}
                      onValueChange={() => handleToggleSelectOne(item.id)}
                      color={isSelected ? theme.colors.primary : undefined}
                  />
              </View>
              <Text style={[styles.cellText, styles.cell, { flex: 1.5 }]}>{item.username}</Text>
              <Text style={[styles.cellText, styles.cell, { flex: 2.5 }]}>{item.full_name}</Text>
              <Text style={[styles.cellText, styles.cell, { flex: 3 }]}>{item.email}</Text>
              <View style={[styles.cell, { flex: 2 }]}><StatusBadge isActive={item.is_active} /></View>
          </View>
        );
    };
  
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />;
    }
    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
  
    return (
      <View style={styles.container}>
        <AlertModal
            visible={isAlertVisible}
            message={alertMessage}
            buttons={alertButtons}
            onClose={hideAlert}
        />

        <View style={styles.content}>
          <Text style={styles.title}>Quản lý nhân viên</Text>
          
          {/* === THÊM NÚT "KÍCH HOẠT" VÀO TOOLBAR === */}
          <View style={styles.toolbar}>
              <CustomButton
                  title="Kích hoạt"
                  onPress={() => handleAction('activate')}
                  disabled={selectedIds.length === 0 || isSubmitting}
                  variant="outline"
                  buttonStyle={[styles.actionButton, styles.activateButton]}
                  textStyle={[styles.actionButtonText, styles.activateButtonText]}
              />
              <CustomButton
                  title="Vô hiệu hóa"
                  onPress={() => handleAction('deactivate')}
                  disabled={selectedIds.length === 0 || isSubmitting}
                  variant="outline"
                  buttonStyle={styles.actionButton}
                  textStyle={styles.actionButtonText}
              />
              <CustomButton
                  title="Xóa"
                  onPress={() => handleAction('delete')}
                  disabled={selectedIds.length === 0 || isSubmitting}
                  variant="outline"
                  buttonStyle={[styles.actionButton, styles.deleteButton]}
                  textStyle={[styles.actionButtonText, styles.deleteButtonText]}
              />
          </View>
          
          <View style={styles.tableContainer}>
            <FlatList
              data={profiles}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderHeader}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              extraData={selectedIds}
            />
          </View>
        </View>
        
        <View style={styles.statusBar}>
            <Text style={styles.statusBarText}>
                  Đã chọn: {selectedIds.length} / {profiles.length}
            </Text>
        </View>
      </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
        justifyContent: 'space-between', 
      },
      content: {
        flex: 1,
        padding: theme.spacing['level-6'],
        paddingBottom: 0, 
      },
      title: {
        fontSize: theme.typography.fontSize['level-7'],
        fontWeight: 'bold',
        color: '#111',
        marginBottom: theme.spacing['level-4'],
      },
      toolbar: {
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center', 
          paddingVertical: theme.spacing['level-2'],
          marginBottom: theme.spacing['level-4'],
      },
      actionButton: {
          width: 'auto', 
          marginBottom: 0, 
          paddingVertical: theme.spacing['level-1'],
          paddingHorizontal: theme.spacing['level-3'],
          marginRight: theme.spacing['level-2'], 
          minHeight: 36,
          borderColor: theme.colors.grey,
      },
      actionButtonText: {
          fontSize: theme.typography.fontSize['level-3'],
          color: theme.colors.grey
      },
      // === THÊM STYLE CHO NÚT KÍCH HOẠT ===
      activateButton: {
          borderColor: theme.colors.success,
      },
      activateButtonText: {
          color: theme.colors.success,
      },
      deleteButton: {
          borderColor: theme.colors.danger,
      },
      deleteButtonText: {
          color: theme.colors.danger,
      },
      tableContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.lightGrey,
        borderRadius: theme.borderRadius['level-4'],
        overflow: 'hidden',
      },
      tableRowHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: theme.colors.lightGrey,
        backgroundColor: '#F9FAFB',
        paddingVertical: theme.spacing['level-3'],
        paddingHorizontal: theme.spacing['level-3'],
        alignItems: 'center',
      },
      tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: theme.colors.lightGrey,
        paddingVertical: theme.spacing['level-4'],
        paddingHorizontal: theme.spacing['level-3'],
        alignItems: 'center',
        backgroundColor: theme.colors.white,
      },
      headerText: {
        fontSize: theme.typography.fontSize['level-3'],
        fontWeight: 'bold',
        color: theme.colors.grey,
      },
      cellText: {
        fontSize: theme.typography.fontSize['level-3'],
        color: '#333',
      },
      cell: {
        paddingHorizontal: theme.spacing['level-2'],
      },
      cellCheckbox: {
        flex: 0.5,
        alignItems: 'center',
        justifyContent: 'center',
      },
      checkbox: {
        margin: 8,
      },
      badge: {
        paddingVertical: theme.spacing['level-1'],
        paddingHorizontal: theme.spacing['level-2'],
        borderRadius: theme.borderRadius['round'],
        alignSelf: 'flex-start',
      },
      badgeText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize['level-2'],
        fontWeight: 'bold',
      },
      errorText: {
          textAlign: 'center',
          marginTop: 40,
          color: theme.colors.danger,
          fontSize: theme.typography.fontSize['level-4']
      },
      statusBar: {
          paddingVertical: theme.spacing['level-3'],
          paddingHorizontal: theme.spacing['level-4'],
          backgroundColor: theme.colors.background1,
          borderTopWidth: 1,
          borderColor: theme.colors.borderColor,
      },
      statusBarText: {
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize['level-3'],
          textAlign: 'left',
      },
});

export default UserManagement;