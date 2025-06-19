// src/stores/productionStore.ts
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';
import {
  Profile,
  UserSelectedQuota,
  QuotaSetting,
  DailyProductionData,
  DailySupplementaryData,
  ProductionEntry,
} from '../types/data';
import {
  getUserProfile,
  getUserSelectedQuotas,
  getProductionEntriesByDateRange,
  getSupplementaryDataByDateRange,
  getQuotaSettingsByProductCodes,
  getQuotaValueBySalaryLevel
} from '../services/storage';
import {
  getCurrentEstronWeekInfo,
  formatToYYYYMMDD,
  getDayOfWeekVietnamese,
  formatDate,
  getToday,
  eachDayOfInterval,
  isBefore,
} from '../utils/dateUtils';

interface ProductState {
  userProfile: Profile | null;
  userSelectedQuotas: UserSelectedQuota[];
  quotaSettingsMap: Map<string, QuotaSetting>;
  processedDaysData: DailyProductionData[];
  estronWeekInfo: ReturnType<typeof getCurrentEstronWeekInfo> | null;
  targetDate: Date;
  isLoading: boolean;
  error: string | null;
  isViewingPreviousMonth: boolean;
  subscriptions: RealtimeChannel[];
}

interface ProductActions {
  setTargetDate: (date: Date) => void;
  loadInitialData: (userId: string, dateForData: Date) => Promise<void>;
  handleRealtimeUpdate: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void;
  initialize: (userId: string) => void;
  cleanup: () => void;
}

export const useProductionStore = create<ProductState & ProductActions>((set, get) => ({
  userProfile: null,
  userSelectedQuotas: [],
  quotaSettingsMap: new Map(),
  processedDaysData: [],
  estronWeekInfo: null,
  targetDate: getToday(),
  isLoading: true,
  error: null,
  isViewingPreviousMonth: false,
  subscriptions: [],

  // Actions
  setTargetDate: (date) => {
    const today = getToday();
    const isViewingPrev = date.getDate() !== today.getDate() || date.getMonth() !== today.getMonth() || date.getFullYear() !== today.getFullYear();
    set({ targetDate: date, isViewingPreviousMonth: isViewingPrev });
    const userId = get().userProfile?.id;
    if (userId) {
      get().loadInitialData(userId, date);
    }
  },

  loadInitialData: async (userId, dateForData) => {
    set({ isLoading: true, error: null });
    try {
        const today = getToday();
        const currentEstronInfo = getCurrentEstronWeekInfo(dateForData);
        const { startDate, endDate } = currentEstronInfo.estronMonth;
        const [profileRes, quotasRes, productionRes, supplementaryRes] = await Promise.all([
            getUserProfile(userId),
            getUserSelectedQuotas(userId),
            getProductionEntriesByDateRange(userId, formatToYYYYMMDD(startDate), formatToYYYYMMDD(endDate)),
            getSupplementaryDataByDateRange(userId, formatToYYYYMMDD(startDate), formatToYYYYMMDD(endDate))
        ]);
        if (profileRes.error || quotasRes.error || productionRes.error || supplementaryRes.error) {
            throw new Error(profileRes.error?.message || quotasRes.error?.message || productionRes.error?.message || supplementaryRes.error?.message || 'Lỗi không xác định');
        }
        const profileData = profileRes.data;
        const selectedQuotasData = quotasRes.data || [];
        const productionEntriesFromSupabase = productionRes.data || [];
        const supplementaryDataForMonth = supplementaryRes.data || [];
        const supplementaryDataMap = new Map<string, DailySupplementaryData>();
        supplementaryDataForMonth.forEach(data => { if (data.date) supplementaryDataMap.set(data.date, data); });
        
        // <<< START: SỬA LỖI TẠI ĐÂY >>>
        // Lấy mã công đoạn từ cả sản lượng đã nhập và từ cài đặt của người dùng
        const codesFromEntries = productionEntriesFromSupabase.map(entry => entry.product_code);
        const codesFromSettings = selectedQuotasData.map(usq => usq.product_code);
        // Kết hợp và loại bỏ các mã trùng lặp để lấy tất cả định mức cần thiết
        const allQuotaSettingsNeededCodes = [...new Set([...codesFromEntries, ...codesFromSettings])];
        // <<< END: SỬA LỖI TẠI ĐÂY >>>

        const newQuotaSettingsMap = new Map<string, QuotaSetting>();
        if (allQuotaSettingsNeededCodes.length > 0) {
            const { data: settingsResults, error: settingsError } = await getQuotaSettingsByProductCodes(allQuotaSettingsNeededCodes);
            if (settingsError) throw settingsError;
            (settingsResults || []).forEach(qs => newQuotaSettingsMap.set(qs.product_code, qs));
        }

        const isViewingPreviousMonth = get().isViewingPreviousMonth;
        const lastDayOfMonth = isViewingPreviousMonth ? endDate : (isBefore(today, endDate) ? today : endDate);
        const effectiveEndDate = isBefore(lastDayOfMonth, startDate) ? startDate : lastDayOfMonth;
        const daysInMonthToDisplay = eachDayOfInterval({ start: startDate, end: effectiveEndDate });

        const dailyDataList: DailyProductionData[] = daysInMonthToDisplay.map(dayDate => {
            const yyyymmdd = formatToYYYYMMDD(dayDate);
            const entriesForDay = productionEntriesFromSupabase.filter(entry => entry.date === yyyymmdd);
            const suppDataForDay = supplementaryDataMap.get(yyyymmdd);
            let totalDailyWork = 0;
            const dailyEntries = entriesForDay.map(entry => {
                const quotaSetting = newQuotaSettingsMap.get(entry.product_code);
                let workAmount = 0;
                if (quotaSetting && profileData?.salary_level && entry.quantity != null) {
                    const dailyQuota = getQuotaValueBySalaryLevel(quotaSetting, profileData.salary_level);
                    if (dailyQuota > 0) {
                        const percentage = entry.quota_percentage ?? 100;
                        // Công thức đúng: (Số lượng / Định mức) / (Tỷ lệ % / 100)
                        workAmount = (entry.quantity / dailyQuota) / (percentage / 100);
                    }
                }
                totalDailyWork += workAmount;
                return { id: entry.id, stageCode: entry.product_code, quantity: entry.quantity || 0, workAmount: parseFloat(workAmount.toFixed(2)), po: entry.po, box: entry.box, batch: entry.batch, verified: entry.verified, quota_percentage: entry.quota_percentage };
            });
            
            return {
                date: yyyymmdd,
                dayOfWeek: getDayOfWeekVietnamese(dayDate),
                formattedDate: formatDate(dayDate, 'dd/MM'),
                entries: dailyEntries,
                totalWorkForDay: parseFloat(totalDailyWork.toFixed(2)),
                supplementaryData: suppDataForDay
            };
        });
        
        dailyDataList.sort((a, b) => b.date.localeCompare(a.date));

        set({
            userProfile: profileData,
            userSelectedQuotas: selectedQuotasData,
            quotaSettingsMap: newQuotaSettingsMap,
            estronWeekInfo: currentEstronInfo,
            processedDaysData: dailyDataList,
            isLoading: false,
        });

    } catch (error: any) {
        set({ error: error.message, isLoading: false });
    }
  },

  handleRealtimeUpdate: (payload) => {
    const { userProfile, quotaSettingsMap, loadInitialData, targetDate } = get();
    if (!userProfile?.salary_level || !userProfile.id || quotaSettingsMap.size === 0) {
      if (userProfile) { loadInitialData(userProfile.id, targetDate); }
      return;
    }
    const record = (payload.new || payload.old) as { date: string; [key: string]: any };
    if (!record || !record.date) return;
    set(state => {
      const newDaysData = JSON.parse(JSON.stringify(state.processedDaysData));
      const dayIndex = newDaysData.findIndex((d: DailyProductionData) => d.date === record.date);
      
      if (dayIndex === -1) {
        loadInitialData(userProfile.id, state.targetDate);
        return state;
      }
      
      const targetDay = newDaysData[dayIndex];

      if (payload.table === 'entries') {
        const entryRecord = record as ProductionEntry;
        targetDay.entries = targetDay.entries.filter((e: any) => e.id !== entryRecord.id);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newEntry = payload.new as ProductionEntry;
          const quotaSetting = quotaSettingsMap.get(newEntry.product_code);
          let workAmount = 0;
          if (quotaSetting && userProfile.salary_level && newEntry.quantity != null) {
            const dailyQuota = getQuotaValueBySalaryLevel(quotaSetting, userProfile.salary_level);
            if (dailyQuota > 0) {
                const percentage = newEntry.quota_percentage ?? 100;
                // <<< START: SỬA LỖI TÍNH TOÁN SAI >>>
                // Sửa từ phép nhân thành phép chia để đồng bộ với `loadInitialData`
                workAmount = (newEntry.quantity / dailyQuota) / (percentage / 100);
                // <<< END: SỬA LỖI TÍNH TOÁN SAI >>>
            }
          }
          targetDay.entries.push({ id: newEntry.id, stageCode: newEntry.product_code, quantity: newEntry.quantity || 0, workAmount: parseFloat(workAmount.toFixed(2)), po: newEntry.po, box: newEntry.box, batch: newEntry.batch, verified: newEntry.verified, quota_percentage: newEntry.quota_percentage });
        }
        const newTotalDailyWork = targetDay.entries.reduce((sum: number, e: any) => sum + (e.workAmount || 0), 0);
        targetDay.totalWorkForDay = parseFloat(newTotalDailyWork.toFixed(2));
      } else if (payload.table === 'additional') {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newSuppData = payload.new;
          targetDay.supplementaryData = { date: newSuppData.date, leaveHours: newSuppData.leave, overtimeHours: newSuppData.overtime, meetingMinutes: newSuppData.meeting, leaveVerified: newSuppData.leave_verified, overtimeVerified: newSuppData.overtime_verified, meetingVerified: newSuppData.meeting_verified };
        } else if (payload.eventType === 'DELETE') {
          targetDay.supplementaryData = null;
        }
      }
      return { processedDaysData: newDaysData };
    });
  },
  initialize: (userId) => {
    get().cleanup();
    get().loadInitialData(userId, get().targetDate);
    const entriesChannel = supabase.channel(`rt-entries-user-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: `user_id=eq.${userId}`}, get().handleRealtimeUpdate).subscribe();
    const additionalChannel = supabase.channel(`rt-additional-user-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'additional', filter: `user_id=eq.${userId}`}, get().handleRealtimeUpdate).subscribe();
    set({ subscriptions: [entriesChannel, additionalChannel] });
  },
  cleanup: () => {
    get().subscriptions.forEach(sub => supabase.removeChannel(sub));
    set({ subscriptions: [] });
  },
}));