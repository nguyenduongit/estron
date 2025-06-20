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
  isAfter,
  parseISO,
  calculateStandardWorkdays,
  getEstronWeeks,
  EstronWeekPeriod,
} from '../utils/dateUtils';


// --- CÁC KIỂU DỮ LIỆU ĐỂ EXPORT ---
export interface WeeklyProductStat {
  product_code: string;
  product_name: string;
  total_quantity: number;
  total_work_done: number;
}

export interface WeeklyStatistics {
  weekInfo: EstronWeekPeriod;
  productStats: WeeklyProductStat[];
  totalWorkInWeek: number;
  totalMeetingMinutesInWeek: number;
  weeklyTarget: number;
}

export interface StatisticsData {
  standardWorkdaysForMonth: number;
  standardWorkdaysToCurrent: number;
  totalProductWorkDone: number;
  monthlyTargetWork: number;
  totalOvertimeHours: number;
  totalLeaveDays: number;
  totalMeetingMinutes: number;
  weeklyStatistics: WeeklyStatistics[];
}

export interface ProductState {
  userProfile: Profile | null;
  userSelectedQuotas: UserSelectedQuota[];
  quotaSettingsMap: Map<string, QuotaSetting>;
  processedDaysData: DailyProductionData[];
  estronWeekInfo: ReturnType<typeof getCurrentEstronWeekInfo> | null;
  targetDate: Date;
  isLoading: boolean;
  error: string | null;
  subscriptions: RealtimeChannel[];
  statistics: StatisticsData | null; // Dành cho màn hình thống kê
}

export interface ProductActions {
  setTargetDate: (date: Date) => void;
  initialize: (userId: string) => void;
  cleanup: () => void;
  processAndCalculateAllData: () => void; // Hàm tính toán thống kê
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
  subscriptions: [],
  statistics: null,

  setTargetDate: (date) => {
    const currentInfo = get().estronWeekInfo;
    const newInfo = getCurrentEstronWeekInfo(date);
    // Chỉ tải lại dữ liệu nếu người dùng chuyển sang tháng Estron khác
    if (currentInfo?.estronMonth.name !== newInfo.estronMonth.name) {
      const userId = get().userProfile?.id;
      if (userId) {
        // Cập nhật ngày và tải lại dữ liệu cho tháng mới
        set({ targetDate: date });
        get().initialize(userId);
      }
    } else {
      set({ targetDate: date });
    }
  },

  processAndCalculateAllData: () => {
    const { processedDaysData, estronWeekInfo, userProfile } = get();

    if (!estronWeekInfo || !userProfile) {
      set({ statistics: null });
      return;
    }

    const today = getToday();
    const allSupplementaryData = processedDaysData.map(d => d.supplementaryData).filter(Boolean) as DailySupplementaryData[];
    const monthInfo = estronWeekInfo.estronMonth;
    const calculationEndDateForMonth = isBefore(today, monthInfo.endDate) ? today : monthInfo.endDate;

    const standardWorkdaysForMonth = calculateStandardWorkdays(monthInfo.startDate, monthInfo.endDate);
    const standardWorkdaysToCurrent = calculateStandardWorkdays(monthInfo.startDate, calculationEndDateForMonth);
    const totalProductWorkDone = processedDaysData.reduce((sum, day) => sum + (day.totalWorkForDay || 0), 0);
    const totalLeaveHours = allSupplementaryData.reduce((sum, d) => sum + (d.leaveHours || 0), 0);
    const totalMeetingMinutes = allSupplementaryData.reduce((sum, d) => sum + (d.meetingMinutes || 0), 0);
    const totalOvertimeHours = allSupplementaryData.reduce((sum, d) => sum + (d.overtimeHours || 0), 0);
    const totalLeaveDays = totalLeaveHours / 8.0;
    const meetingWorkdays = totalMeetingMinutes / 480.0;
    const overtimeWorkdays = totalOvertimeHours / 8.0;
    const monthlyTargetWork = standardWorkdaysToCurrent - totalLeaveDays - meetingWorkdays + overtimeWorkdays;

    const allWeeksInMonth = getEstronWeeks(monthInfo);
    const weeklyStatistics = allWeeksInMonth.map(weekInfo => {
      const { startDate, endDate } = weekInfo;
      if (isAfter(startDate, today)) return null;

      const isCurrentWeek = today >= startDate && today <= endDate;
      const calculationEndDateForWeek = isCurrentWeek ? today : endDate;
      const daysInWeek = processedDaysData.filter(d => {
        const dDate = parseISO(d.date);
        return dDate >= startDate && dDate <= calculationEndDateForWeek;
      });
      const weekSuppData = daysInWeek.map(d => d.supplementaryData).filter(Boolean) as DailySupplementaryData[];
      const totalWorkInWeek = daysInWeek.reduce((sum, day) => sum + (day.totalWorkForDay || 0), 0);
      const totalMeetingMinutesInWeek = weekSuppData.reduce((sum, d) => sum + (d.meetingMinutes || 0), 0);
      
      const productStatsMap = new Map<string, WeeklyProductStat>();
      daysInWeek.flatMap(d => d.entries).forEach(entry => {
        const stageCode = entry.stageCode;
        const existing = productStatsMap.get(stageCode) || { product_code: stageCode, product_name: get().quotaSettingsMap.get(stageCode)?.product_name || stageCode, total_quantity: 0, total_work_done: 0 };
        existing.total_quantity += entry.quantity || 0;
        existing.total_work_done += entry.workAmount || 0;
        productStatsMap.set(stageCode, existing);
      });
      const productStats = Array.from(productStatsMap.values());

      const standardWorkdaysWeek = calculateStandardWorkdays(startDate, calculationEndDateForWeek);
      const weekLeaveDays = weekSuppData.reduce((sum, d) => sum + (d.leaveHours || 0), 0) / 8.0;
      const weekMeetingWorkdays = totalMeetingMinutesInWeek / 480.0;
      const weekOvertimeWorkdays = weekSuppData.reduce((sum, d) => sum + (d.overtimeHours || 0), 0) / 8.0;
      const weeklyTarget = standardWorkdaysWeek - weekLeaveDays  + weekOvertimeWorkdays;
      
      return { weekInfo, productStats, totalWorkInWeek, totalMeetingMinutesInWeek, weeklyTarget };
    }).filter(Boolean) as WeeklyStatistics[];

    set({
      statistics: {
        standardWorkdaysForMonth, standardWorkdaysToCurrent, totalProductWorkDone,
        monthlyTargetWork, totalOvertimeHours, totalLeaveDays, totalMeetingMinutes,
        weeklyStatistics,
      },
    });
  },

  initialize: async (userId) => {
    set({ isLoading: true, error: null });
    try {
        const dateForData = get().targetDate;
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
        
        const codesFromEntries = productionEntriesFromSupabase.map(entry => entry.product_code);
        const codesFromSettings = selectedQuotasData.map(usq => usq.product_code);
        const allQuotaSettingsNeededCodes = [...new Set([...codesFromEntries, ...codesFromSettings])];

        const newQuotaSettingsMap = new Map<string, QuotaSetting>();
        if (allQuotaSettingsNeededCodes.length > 0) {
            const { data: settingsResults, error: settingsError } = await getQuotaSettingsByProductCodes(allQuotaSettingsNeededCodes);
            if (settingsError) throw settingsError;
            (settingsResults || []).forEach(qs => newQuotaSettingsMap.set(qs.product_code, qs));
        }

        const isCurrentMonth = dateForData.getMonth() === today.getMonth() && dateForData.getFullYear() === today.getFullYear();
        const lastDayOfMonth = isCurrentMonth ? (isBefore(today, endDate) ? today : endDate) : endDate;
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
                        workAmount = (entry.quantity / dailyQuota) / (percentage / 100);
                    }
                }
                totalDailyWork += workAmount;
                return { id: entry.id, stageCode: entry.product_code, quantity: entry.quantity || 0, workAmount, po: entry.po, box: entry.box, batch: entry.batch, verified: entry.verified, quota_percentage: entry.quota_percentage };
            });
            
            return {
                date: yyyymmdd, dayOfWeek: getDayOfWeekVietnamese(dayDate), formattedDate: formatDate(dayDate, 'dd/MM'),
                entries: dailyEntries, totalWorkForDay: totalDailyWork, supplementaryData: suppDataForDay
            };
        });
        
        dailyDataList.sort((a, b) => b.date.localeCompare(a.date));

        set({
            userProfile: profileData, userSelectedQuotas: selectedQuotasData, quotaSettingsMap: newQuotaSettingsMap,
            estronWeekInfo: currentEstronInfo, processedDaysData: dailyDataList, isLoading: false,
        });

        get().processAndCalculateAllData(); // Tính toán thống kê sau khi tải xong

        if (get().subscriptions.length === 0) {
          const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
              const { userProfile, quotaSettingsMap, initialize } = get();
              if (!userProfile?.id || !userProfile.salary_level) {
                  if (userProfile?.id) { initialize(userProfile.id); }
                  return;
              }
              const record = (payload.new || payload.old) as Partial<ProductionEntry & DailySupplementaryData>;
              if (!record || !record.date) return;
              set(state => {
                  const newDaysData = JSON.parse(JSON.stringify(state.processedDaysData));
                  const dayIndex = newDaysData.findIndex((d: DailyProductionData) => d.date === record.date);
                  
                  if (dayIndex === -1) { return state; } // Không thay đổi state nếu không tìm thấy ngày
                  
                  const targetDay = newDaysData[dayIndex];
          
                  if (payload.table === 'entries') {
                      const entryRecord = record as ProductionEntry;
                      targetDay.entries = targetDay.entries.filter((e: any) => e.id !== entryRecord.id);
                      if (payload.eventType !== 'DELETE') {
                          const newEntry = payload.new as ProductionEntry;
                          const quotaSetting = quotaSettingsMap.get(newEntry.product_code);
                          let workAmount = 0;
                          if (quotaSetting && userProfile.salary_level && newEntry.quantity != null) {
                              const dailyQuota = getQuotaValueBySalaryLevel(quotaSetting, userProfile.salary_level);
                              if (dailyQuota > 0) {
                                  const percentage = newEntry.quota_percentage ?? 100;
                                  workAmount = (newEntry.quantity / dailyQuota) / (percentage / 100);
                              }
                          }
                          targetDay.entries.push({ id: newEntry.id, stageCode: newEntry.product_code, quantity: newEntry.quantity || 0, workAmount, po: newEntry.po, box: newEntry.box, batch: newEntry.batch, verified: newEntry.verified, quota_percentage: newEntry.quota_percentage });
                      }
                      targetDay.totalWorkForDay = targetDay.entries.reduce((sum: number, e: any) => sum + (e.workAmount || 0), 0);
                  } else if (payload.table === 'additional') {
                      if (payload.eventType !== 'DELETE') {
                          const newSuppData = payload.new as any;
                          targetDay.supplementaryData = { date: newSuppData.date, leaveHours: newSuppData.leave, overtimeHours: newSuppData.overtime, meetingMinutes: newSuppData.meeting, leaveVerified: newSuppData.leave_verified, overtimeVerified: newSuppData.overtime_verified, meetingVerified: newSuppData.meeting_verified };
                      } else {
                          targetDay.supplementaryData = null;
                      }
                  }
                  return { processedDaysData: newDaysData };
              });
              // Tính toán lại thống kê sau khi cập nhật state
              get().processAndCalculateAllData();
          };

          const entriesChannel = supabase.channel(`rt-entries-user-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: `user_id=eq.${userId}`}, handleRealtimeUpdate).subscribe();
          const additionalChannel = supabase.channel(`rt-additional-user-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'additional', filter: `user_id=eq.${userId}`}, handleRealtimeUpdate).subscribe();
          set({ subscriptions: [entriesChannel, additionalChannel] });
        }

    } catch (error: any) {
        set({ error: error.message, isLoading: false });
    }
  },

  cleanup: () => {
    get().subscriptions.forEach(sub => supabase.removeChannel(sub));
    set({ subscriptions: [] });
  },
}));