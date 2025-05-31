// src/screens/InputTab/components/AdditionalInfo.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput as RNTextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; // Không dùng trong file này nhưng giữ lại nếu có kế hoạch
import { theme } from '../../../theme';
import { DailySupplementaryData } from '../../../types/data';
import {
  saveDailySupplementaryData,
  getSupplementaryDataByDate
} from '../../../services/storage';

const HOUR_OPTIONS = [1, 2, 3, 4, 8];

interface AdditionalInfoProps {
  userId: string;
  date: string;
  isFullDayLeave: boolean;
  onFullDayLeaveChange?: (isFullDay: boolean) => void;
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ userId, date, isFullDayLeave, onFullDayLeaveChange }) => {
  const [isLoadingSupp, setIsLoadingSupp] = useState(false);
  const [currentLeaveHours, setCurrentLeaveHours] = useState<number | null | undefined>(undefined);
  const [currentOvertimeHours, setCurrentOvertimeHours] = useState<number | null | undefined>(undefined);
  const [currentMeetingMinutes, setCurrentMeetingMinutes] = useState<string>('');

  // localIsFullDayLeave không còn cần thiết vì đã có isFullDayLeave từ prop
  // const localIsFullDayLeave = currentLeaveHours === 8; 

  useEffect(() => {
    const loadSuppData = async () => {
      if (!date || !userId) return;
      setIsLoadingSupp(true);
      try {
        const suppData = await getSupplementaryDataByDate(userId, date);
        if (suppData) {
          setCurrentLeaveHours(suppData.leaveHours);
          setCurrentOvertimeHours(suppData.overtimeHours);
          setCurrentMeetingMinutes(suppData.meetingMinutes?.toString() || '');
          if (onFullDayLeaveChange) {
            onFullDayLeaveChange(suppData.leaveHours === 8);
          }
        } else {
          setCurrentLeaveHours(undefined);
          setCurrentOvertimeHours(undefined);
          setCurrentMeetingMinutes('');
          if (onFullDayLeaveChange) {
            onFullDayLeaveChange(false);
          }
        }
      } catch (error) {
        console.error("Error loading supplementary data for card:", error);
      } finally {
        setIsLoadingSupp(false);
      }
    };
    loadSuppData();
  }, [date, userId, onFullDayLeaveChange]);

  const handleSaveSupplementaryData = useCallback(async (
    field: keyof Omit<DailySupplementaryData, 'date' | 'user_id'>, // user_id được xử lý riêng
    value: number | string | null,
    options?: { resetOvertimeAndMeeting?: boolean, resetLeave?: boolean }
  ) => {
    if (!userId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng để lưu.");
        return;
    }

    const dataToSave: DailySupplementaryData = { date: date };

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
    // meetingMinutes đã xử lý NaN ở trên

    try {
      await saveDailySupplementaryData(userId, dataToSave);
    } catch (error: any) {
      console.error(`Error saving ${field} for ${date}:`, error);
      Alert.alert("Lỗi", `Không thể lưu dữ liệu ${field}. ${error.message || ''}`);
    }
  }, [date, userId, currentLeaveHours, currentOvertimeHours, currentMeetingMinutes]); // Bỏ onFullDayLeaveChange vì nó được gọi riêng


  const handleHourOptionPress = (type: 'leaveHours' | 'overtimeHours', hours: number) => {
    let newIsFullDayLeave = isFullDayLeave; // Sử dụng prop isFullDayLeave
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
      if (onFullDayLeaveChange) { // Gọi onFullDayLeaveChange để cập nhật state ở DailyCard
        onFullDayLeaveChange(newIsFullDayLeave);
      }
    } else if (type === 'overtimeHours') {
      if (isFullDayLeave) return; 
      const newValue = currentOvertimeHours === hours ? null : hours;
      setCurrentOvertimeHours(newValue);
      handleSaveSupplementaryData('overtimeHours', newValue);
    }
  };

  const handleMeetingMinutesChange = (text: string) => {
    if (isFullDayLeave) return;
    const newMinutes = text.replace(/[^0-9]/g, '');
    setCurrentMeetingMinutes(newMinutes);
  };

  const handleMeetingMinutesBlur = () => {
    if (isFullDayLeave && currentMeetingMinutes !== '') {
        setCurrentMeetingMinutes(''); // Reset nếu nghỉ cả ngày mà vẫn có giá trị
    }
    // Luôn lưu, kể cả khi rỗng (sẽ thành null) hoặc khi isFullDayLeave (sẽ lưu null)
    const minutesToSave = currentMeetingMinutes === '' ? null : Number(currentMeetingMinutes);
    handleSaveSupplementaryData('meetingMinutes', isFullDayLeave ? null : minutesToSave);
  };

  if (isLoadingSupp) {
    return <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loadingIndicator}/>;
  }

  return (
    <View style={styles.additionalSection}>
      {/* Nghỉ */}
      <View style={styles.additionalRow}>
        <Text style={styles.additionalLabel}>Nghỉ:</Text>
        <View style={styles.optionsContainer}>
          {HOUR_OPTIONS.map(hours => {
            const isSelected = currentLeaveHours === hours;
            // Nút nghỉ 8h không bị vô hiệu hóa khi isFullDayLeave (vì chính nó gây ra isFullDayLeave)
            // Các nút nghỉ khác (1,2,3,4h) sẽ bị vô hiệu hóa NẾU nghỉ 8h ĐÃ được chọn (isFullDayLeave = true)
            // VÀ nút đang xét KHÔNG PHẢI là nút 8h.
            const isDisabledByOtherFullDayLeave = isFullDayLeave && hours !== 8;

            return (
              <TouchableOpacity
                key={`leave-${hours}`}
                style={[
                  styles.hourOptionButton,
                  isSelected && hours === 8 && styles.hourOptionSelectedFullDayLeave,
                  isSelected && hours !== 8 && styles.hourOptionSelected,
                  isDisabledByOtherFullDayLeave && styles.disabledButton,
                ]}
                onPress={() => handleHourOptionPress('leaveHours', hours)}
                disabled={isDisabledByOtherFullDayLeave}
              >
                <Text
                  style={[
                    styles.hourOptionText,
                    isSelected && (hours === 8 ? styles.hourOptionSelectedFullDayLeaveText : styles.hourOptionSelectedText),
                    isDisabledByOtherFullDayLeave && styles.disabledText,
                  ]}
                >
                  {`${hours}h`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tăng ca */}
      <View style={styles.additionalRow}>
        <Text style={[styles.additionalLabel, isFullDayLeave && styles.disabledText]}>Tăng ca:</Text>
        <View style={styles.optionsContainer}>
          {HOUR_OPTIONS.map(hours => (
            <TouchableOpacity
              key={`overtime-${hours}`}
              style={[
                styles.hourOptionButton,
                currentOvertimeHours === hours && styles.hourOptionSelected,
                isFullDayLeave && styles.disabledButton,
              ]}
              onPress={() => handleHourOptionPress('overtimeHours', hours)}
              disabled={isFullDayLeave}
            >
              <Text
                style={[
                  styles.hourOptionText,
                  currentOvertimeHours === hours && styles.hourOptionSelectedText,
                  isFullDayLeave && styles.disabledText,
                ]}
              >
                {`${hours}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Họp/Đào tạo */}
      <View style={styles.additionalRow}>
        <Text style={[styles.additionalLabel, isFullDayLeave && styles.disabledText]}>Họp/Đào tạo:</Text>
        <View style={[styles.meetingInputContainer, isFullDayLeave && styles.disabledInputContainer, Platform.OS === 'web' && ({outline: 'none'} as any)]}>
          <RNTextInput
            style={[styles.meetingInput, isFullDayLeave && styles.disabledText, Platform.OS === 'web' && ({outline: 'none'} as any)]}
            value={currentMeetingMinutes}
            onChangeText={handleMeetingMinutesChange}
            onBlur={handleMeetingMinutesBlur}
            keyboardType="numeric"
            placeholder="Số phút"
            placeholderTextColor={isFullDayLeave ? theme.colors.grey /*Hoặc đậm hơn nếu grey quá mờ trên darkGrey*/ : theme.colors.grey}
            editable={!isFullDayLeave}
          />
           <Text style={[styles.unitLabel, isFullDayLeave && styles.disabledText]}>phút</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  additionalSection: {
    paddingHorizontal: theme.spacing['level-4'], // md -> level-4
    paddingVertical: theme.spacing['level-2'], // sm -> level-2
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor, // Giữ nguyên
    backgroundColor: theme.colors.cardBackground, // background -> cardBackground
  },
  additionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing['level-2'], // sm -> level-2
  },
  additionalLabel: {
    fontSize: theme.typography.fontSize['level-3'], // bodySmall.fontSize -> level-3
    color: theme.colors.textSecondary, // Giữ nguyên
    marginRight: theme.spacing['level-2'], // sm -> level-2
    flex: 0.3, // Giữ nguyên
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap', // Giữ nguyên
    flex: 0.7, // Giữ nguyên
  },
  hourOptionButton: {
    height: 28, // Giữ nguyên
    minWidth: 40, // Giữ nguyên
    paddingHorizontal: theme.spacing['level-2'], // sm -> level-2
    paddingVertical: theme.spacing['level-1'], // xs -> level-1
    borderRadius: theme.borderRadius['level-2'], // sm -> level-2
    borderColor: theme.colors.primary, // Giữ nguyên
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, // Giữ nguyên
  },
  hourOptionSelected: {
    backgroundColor: theme.colors.primary, // Giữ nguyên
  },
  hourOptionSelectedFullDayLeave: {
    backgroundColor: theme.colors.danger, // Giữ nguyên
    borderColor: theme.colors.danger, // Giữ nguyên
  },
  hourOptionText: {
    fontSize: theme.typography.fontSize['level-2'], // caption.fontSize -> level-2
    color: theme.colors.primary, // Giữ nguyên
  },
  hourOptionSelectedText: {
    color: theme.colors.textOnPrimary, // white -> textOnPrimary
  },
  hourOptionSelectedFullDayLeaveText: {
    color: theme.colors.textOnPrimary, // white -> textOnPrimary
  },
  meetingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.7, // Giữ nguyên
    borderWidth: 1, // Giữ nguyên
    borderColor: theme.colors.primary, // Giữ nguyên
    borderRadius: theme.borderRadius['level-2'], // sm -> level-2
  },
  meetingInput: {
    flex: 1, // Giữ nguyên
    height: 30, // Giữ nguyên
    fontSize: theme.typography.fontSize['level-3'], // bodySmall.fontSize -> level-3
    paddingLeft: theme.spacing['level-2'], // sm -> level-2
    color: theme.colors.text, // Giữ nguyên
  },
  unitLabel: {
    fontSize: theme.typography.fontSize['level-3'], // bodySmall.fontSize -> level-3
    color: theme.colors.textSecondary, // Giữ nguyên
    paddingHorizontal: theme.spacing['level-2'], // sm -> level-2
  },
  loadingIndicator: {
    alignSelf: 'center',
    marginVertical: theme.spacing['level-2'], // sm -> level-2
  },
  disabledButton: {
    backgroundColor: theme.colors.darkGrey, // lightGrey -> darkGrey
    borderColor: theme.colors.grey, // Giữ nguyên
    opacity: 0.7, // Giữ nguyên
  },
  disabledText: {
    color: theme.colors.grey, // Giữ nguyên
  },
  disabledInputContainer: {
    backgroundColor: theme.colors.darkGrey, // lightGrey -> darkGrey
    borderColor: theme.colors.grey, // Giữ nguyên
    opacity: 0.7, // Giữ nguyên
  }
});

export default AdditionalInfo;