import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput as RNTextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../../theme';
import { DailySupplementaryData } from '../../../types/data';
import {
  saveDailySupplementaryData
} from '../../../services/storage';

// THAY ĐỔI: Tách các tùy chọn cho Nghỉ và Tăng ca
const LEAVE_OPTIONS = [
  { label: 'Nữa ngày', value: 4 },
  { label: 'Cả ngày', value: 8 },
];
const OVERTIME_OPTIONS = [1, 2, 3, 4, 8];

interface AdditionalInfoProps {
  userId: string;
  date: string;
  initialData: DailySupplementaryData | null | undefined;
  onDataChange: (newData: DailySupplementaryData) => void;
  isFullDayLeave: boolean;
  onFullDayLeaveChange?: (isFullDay: boolean) => void;
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ userId, date, initialData, onDataChange, isFullDayLeave, onFullDayLeaveChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLeaveHours, setCurrentLeaveHours] = useState<number | null | undefined>(undefined);
  const [currentOvertimeHours, setCurrentOvertimeHours] = useState<number | null | undefined>(undefined);
  const [currentMeetingMinutes, setCurrentMeetingMinutes] = useState<string>('');
  
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showWarningMessage = (message: string) => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    setWarningMessage(message);
    warningTimeoutRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    if (initialData) {
        setCurrentLeaveHours(initialData.leaveHours);
        setCurrentOvertimeHours(initialData.overtimeHours);
        setCurrentMeetingMinutes(initialData.meetingMinutes?.toString() || '');
    } else {
        setCurrentLeaveHours(undefined);
        setCurrentOvertimeHours(undefined);
        setCurrentMeetingMinutes('');
    }
    setIsLoading(false);
  }, [initialData]);

  const handleSaveSupplementaryData = useCallback(async (
    field: keyof Omit<DailySupplementaryData, 'date' | 'user_id' | 'leaveVerified' | 'overtimeVerified' | 'meetingVerified'>,
    value: number | string | null,
    options?: { resetOvertimeAndMeeting?: boolean, resetLeave?: boolean }
  ) => {
    if (!userId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng để lưu.");
        return;
    }

    const dataToSave: DailySupplementaryData = {
        date: date,
        leaveVerified: initialData?.leaveVerified || false,
        overtimeVerified: initialData?.overtimeVerified || false,
        meetingVerified: initialData?.meetingVerified || false,
    };

    dataToSave.leaveHours = field === 'leaveHours'
        ? (value as number | null)
        : (options?.resetLeave ? null : (currentLeaveHours === undefined ? null : currentLeaveHours));

    dataToSave.overtimeHours = field === 'overtimeHours'
        ? (value as number | null)
        : (options?.resetOvertimeAndMeeting ? null : (currentOvertimeHours === undefined ? null : currentOvertimeHours));

    const meetingVal = field === 'meetingMinutes'
        ? (value === '' || value === null ? null : Number(value))
        : (options?.resetOvertimeAndMeeting ? null : (currentMeetingMinutes === '' ? null : Number(currentMeetingMinutes)));
    
    dataToSave.meetingMinutes = meetingVal === undefined || isNaN(meetingVal as number) ? null : meetingVal;

    if (dataToSave.leaveHours === undefined) dataToSave.leaveHours = null;
    if (dataToSave.overtimeHours === undefined) dataToSave.overtimeHours = null;

    try {
      const savedData = await saveDailySupplementaryData(userId, dataToSave);
      if (savedData) {
        onDataChange(savedData);
      }
    } catch (error: any) {
      console.error(`Error saving ${field} for ${date}:`, error);
      Alert.alert("Lỗi", `Không thể lưu dữ liệu ${field}. ${error.message || ''}`);
    }
  }, [date, userId, currentLeaveHours, currentOvertimeHours, currentMeetingMinutes, onDataChange, initialData]);

  const handleHourOptionPress = (type: 'leaveHours' | 'overtimeHours', hours: number) => {
    const warningText = "Dữ liệu này đã được xác nhận và không thể thay đổi.";
    if (type === 'leaveHours' && initialData?.leaveVerified) {
      showWarningMessage(warningText);
      return;
    }
    if (type === 'overtimeHours' && (initialData?.overtimeVerified || isFullDayLeave)) {
      if(initialData?.overtimeVerified) showWarningMessage(warningText);
      return;
    }

    let newIsFullDayLeave = isFullDayLeave;
    if (type === 'leaveHours') {
      const newValue = currentLeaveHours === hours ? null : hours;
      setCurrentLeaveHours(newValue);
      newIsFullDayLeave = newValue === 8;
      if (newIsFullDayLeave) {
        setCurrentOvertimeHours(null);
        setCurrentMeetingMinutes('');
        handleSaveSupplementaryData('leaveHours', newValue, { resetOvertimeAndMeeting: true });
      } else {
        handleSaveSupplementaryData('leaveHours', newValue);
      }
      if (onFullDayLeaveChange) {
        onFullDayLeaveChange(newIsFullDayLeave);
      }
    } else if (type === 'overtimeHours') {
      const newValue = currentOvertimeHours === hours ? null : hours;
      setCurrentOvertimeHours(newValue);
      handleSaveSupplementaryData('overtimeHours', newValue);
    }
  };

  const handleMeetingMinutesChange = (text: string) => {
    if (isFullDayLeave || initialData?.meetingVerified) return;
    const newMinutes = text.replace(/[^0-9]/g, '');
    setCurrentMeetingMinutes(newMinutes);
  };

  const handleMeetingMinutesBlur = () => {
    if (initialData?.meetingVerified) return;
    if (isFullDayLeave && currentMeetingMinutes !== '') {
        setCurrentMeetingMinutes('');
    }
    const minutesToSave = currentMeetingMinutes === '' ? null : Number(currentMeetingMinutes);
    handleSaveSupplementaryData('meetingMinutes', isFullDayLeave ? null : minutesToSave);
  };

  if (isLoading) {
    return <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loadingIndicator}/>;
  }
  
  const isLeaveDisabled = !!initialData?.leaveVerified;
  const isOvertimeDisabled = isFullDayLeave || !!initialData?.overtimeVerified;
  const isMeetingDisabled = isFullDayLeave || !!initialData?.meetingVerified;

  return (
    <View style={styles.additionalSection}>
      {warningMessage && (
        <Text style={styles.warningText}>{warningMessage}</Text>
      )}

      {/* THAY ĐỔI: Mục Nghỉ */}
      <View style={styles.additionalRow}>
        <Text style={[styles.additionalLabel, isLeaveDisabled && styles.disabledText]}>Nghỉ:</Text>
        <View style={styles.optionsContainer}>
          {LEAVE_OPTIONS.map(option => {
            const isSelected = currentLeaveHours === option.value;
            // Chỉ vô hiệu hóa nút "Nữa ngày" (4h) nếu nút "Cả ngày" (8h) ĐANG được chọn
            const isDisabledByFullDay = isFullDayLeave && !isSelected;

            return (
              <TouchableOpacity
                key={`leave-${option.value}`}
                style={[
                  styles.hourOptionButton,
                  styles.leaveOptionButton, // Style mới để các nút rộng hơn
                  isSelected && option.value === 8 && styles.hourOptionSelectedFullDayLeave,
                  isSelected && option.value !== 8 && styles.hourOptionSelected,
                  (isDisabledByFullDay || isLeaveDisabled) && styles.disabledButton,
                ]}
                onPress={() => handleHourOptionPress('leaveHours', option.value)}
                disabled={isDisabledByFullDay || isLeaveDisabled}
              >
                <Text
                  style={[
                    styles.hourOptionText,
                    isSelected && (option.value === 8 ? styles.hourOptionSelectedFullDayLeaveText : styles.hourOptionSelectedText),
                    (isDisabledByFullDay || isLeaveDisabled) && styles.disabledText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Mục Tăng ca giữ nguyên */}
      <View style={styles.additionalRow}>
        <Text style={[styles.additionalLabel, isOvertimeDisabled && styles.disabledText]}>Tăng ca:</Text>
        <View style={styles.optionsContainer}>
          {OVERTIME_OPTIONS.map(hours => (
            <TouchableOpacity
              key={`overtime-${hours}`}
              style={[
                styles.hourOptionButton,
                currentOvertimeHours === hours && styles.hourOptionSelected,
                isOvertimeDisabled && styles.disabledButton,
              ]}
              onPress={() => handleHourOptionPress('overtimeHours', hours)}
              disabled={isOvertimeDisabled}
            >
              <Text
                style={[
                  styles.hourOptionText,
                  currentOvertimeHours === hours && styles.hourOptionSelectedText,
                  isOvertimeDisabled && styles.disabledText,
                ]}
              >
                {`${hours}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mục Họp/Đào tạo giữ nguyên */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (isMeetingDisabled) {
            showWarningMessage("Dữ liệu này đã được xác nhận và không thể thay đổi.");
          }
        }}
      >
        <View style={styles.additionalRow}>
          <Text style={[styles.additionalLabel, isMeetingDisabled && styles.disabledText]}>Họp/Đào tạo:</Text>
          <View style={[styles.meetingInputContainer, isMeetingDisabled && styles.disabledInputContainer, Platform.OS === 'web' && ({outline: 'none'} as any)]}>
            <RNTextInput
              style={[styles.meetingInput, isMeetingDisabled && styles.disabledText, Platform.OS === 'web' && ({outline: 'none'} as any)]}
              value={currentMeetingMinutes}
              onChangeText={handleMeetingMinutesChange}
              onBlur={handleMeetingMinutesBlur}
              keyboardType="numeric"
              placeholder="Số phút"
              placeholderTextColor={isMeetingDisabled ? theme.colors.grey : theme.colors.grey}
              editable={!isMeetingDisabled}
              pointerEvents={isMeetingDisabled ? 'none' : 'auto'}
            />
            <Text style={[styles.unitLabel, isMeetingDisabled && styles.disabledText]}>phút</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  additionalSection: {
    paddingHorizontal: theme.spacing['level-4'],
    paddingTop: theme.spacing['level-2'],
    paddingBottom: theme.spacing['level-2'],
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
    backgroundColor: theme.colors.cardBackground,
  },
  warningText: {
    color: theme.colors.danger,
    fontSize: theme.typography.fontSize['level-2'],
    textAlign: 'center',
    marginBottom: theme.spacing['level-2'],
    paddingHorizontal: theme.spacing['level-2'],
  },
  additionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing['level-2'],
  },
  additionalLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    marginRight: theme.spacing['level-2'],
    flex: 0.3,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    flex: 0.7,
  },
  hourOptionButton: {
    height: 28,
    minWidth: 40,
    paddingVertical: theme.spacing['level-1'],
    borderRadius: theme.borderRadius['level-2'],
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: theme.spacing['level-1'],
    marginHorizontal: 2,
  },
  // THAY ĐỔI: Style mới cho các nút Nghỉ để chúng rộng hơn
  leaveOptionButton: {
      flex: 1, // Cho phép các nút co giãn đều nhau
      paddingHorizontal: theme.spacing['level-2'],
  },
  hourOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  hourOptionSelectedFullDayLeave: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  hourOptionText: {
    fontSize: theme.typography.fontSize['level-2'],
    color: theme.colors.primary,
    fontWeight: '500',
  },
  hourOptionSelectedText: {
    color: theme.colors.textOnPrimary,
  },
  hourOptionSelectedFullDayLeaveText: {
    color: theme.colors.textOnPrimary,
  },
  meetingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.7,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius['level-2'],
  },
  meetingInput: {
    flex: 1,
    height: 30,
    fontSize: theme.typography.fontSize['level-3'],
    paddingLeft: theme.spacing['level-2'],
    color: theme.colors.text,
  },
  unitLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing['level-2'],
  },
  loadingIndicator: {
    alignSelf: 'center',
    marginVertical: theme.spacing['level-2'],
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: theme.colors.darkGrey,
    borderColor: theme.colors.grey,
  },
  disabledText: {
    color: theme.colors.grey,
  },
  disabledInputContainer: {
    backgroundColor: theme.colors.darkGrey,
    borderColor: theme.colors.grey,
    opacity: 0.7,
  }
});

export default AdditionalInfo;