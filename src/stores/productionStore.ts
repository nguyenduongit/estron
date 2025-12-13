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
  startOfDay,
  endOfDay,
  isWithinInterval,
  addDays
} from '../utils/dateUtils';

// --- HÀM TIỆN ÍCH: Cắt lấy 3 chữ số thập phân ---
const floorTo3 = (num: number): number => {
  return Math.floor(num * 1000) / 1000;
};

// --- HÀM TIỆN ÍCH MỚI: Chuyển đổi sang số nguyên để cộng (tránh lỗi Floating Point) ---
const toInt = (num: number): number => {
  // Nhân 1000 và làm tròn để đảm bảo 1.065 -> 1065 chuẩn xác
  return Math.round(num * 1000);
};

// --- CÁC KIỂU DỮ LIỆU ĐỂ EXPORT ---
export interface WeeklyProductStat {
  product_code: string;
  product_name: string;
  total_quantity: number;
  total_work_done: number;
}
// ... (Giữ nguyên các interface khác: WeeklyStatistics, StatisticsData, ProductState, ProductActions)
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
  
  workDeficit: number;
  standardWorkdaysRemaining: number;
  totalWorkTargetRemaining: number;
  productsForQuota: { product_code: string; product_name: string; quota: number; }[];
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
  statistics: StatisticsData | null;
  
  selectedTargetProductCode: string | null; 
}

export interface ProductActions {
  setTargetDate: (date: Date) => void;
  initialize: (userId: string) => void;
  cleanup: () => void;
  processAndCalculateAllData: (dataForCalculation: DailyProductionData[]) => void;
  setSelectedTargetProductCode: (code: string) => void;
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
  selectedTargetProductCode: null,

  setTargetDate: (date) => {
    const currentInfo = get().estronWeekInfo;
    const newInfo = getCurrentEstronWeekInfo(date);
    if (currentInfo?.estronMonth.name !== newInfo.estronMonth.name) {
      const userId = get().userProfile?.id;
      if (userId) {
        set({ targetDate: date });
        get().initialize(userId);
      }
    } else {
      set({ targetDate: date });
    }
  },
  
  setSelectedTargetProductCode: (code) => {
    set({ selectedTargetProductCode: code });
  },

  processAndCalculateAllData: (dataForCalculation: DailyProductionData[]) => {
    const { estronWeekInfo, userProfile } = get();
    const processedDaysData = dataForCalculation;

    if (!estronWeekInfo || !userProfile) {
      set({ statistics: null });
      return;
    }

    const today = getToday();
    const monthInfo = estronWeekInfo.estronMonth;

    const calculationEndDateForMonth = isBefore(today, monthInfo.endDate) ? today : monthInfo.endDate;
    const standardWorkdaysForMonth = calculateStandardWorkdays(monthInfo.startDate, monthInfo.endDate);
    const standardWorkdaysToCurrent = calculateStandardWorkdays(monthInfo.startDate, calculationEndDateForMonth);
    
    // [CẬP NHẬT] Tổng công tháng: Cộng dồn dạng số nguyên
    const totalProductWorkDoneInt = processedDaysData.reduce((sum, day) => sum + toInt(day.totalWorkForDay || 0), 0);
    const totalProductWorkDone = totalProductWorkDoneInt / 1000;
    
    const allSupplementaryData = processedDaysData.map(d => d.supplementaryData).filter(Boolean) as DailySupplementaryData[];
    
    // [CẬP NHẬT] Tổng các loại công phụ: Cộng dồn dạng số nguyên
    const totalLeaveWorkDaysInt = allSupplementaryData.reduce((sum, d) => sum + toInt(floorTo3((d.leaveHours || 0) / 8.0)), 0);
    const totalMeetingWorkDaysInt = allSupplementaryData.reduce((sum, d) => sum + toInt(floorTo3((d.meetingMinutes || 0) / 480.0)), 0);
    const totalOvertimeWorkDaysInt = allSupplementaryData.reduce((sum, d) => sum + toInt(floorTo3((d.overtimeHours || 0) / 8.0)), 0);

    const totalLeaveWorkDays = totalLeaveWorkDaysInt / 1000;
    const totalMeetingWorkDays = totalMeetingWorkDaysInt / 1000;
    const totalOvertimeWorkDays = totalOvertimeWorkDaysInt / 1000;

    const totalLeaveHours = allSupplementaryData.reduce((sum, d) => sum + (d.leaveHours || 0), 0);
    const totalMeetingMinutes = allSupplementaryData.reduce((sum, d) => sum + (d.meetingMinutes || 0), 0);
    const totalOvertimeHours = allSupplementaryData.reduce((sum, d) => sum + (d.overtimeHours || 0), 0);
    
    // Mục tiêu tháng (dùng floorTo3 cuối cùng vì standardWorkdaysToCurrent là số chính xác 0.5/1.0)
    const monthlyTargetWork = floorTo3(standardWorkdaysToCurrent - totalLeaveWorkDays - totalMeetingWorkDays + totalOvertimeWorkDays);

    // 1. Tính công thiếu/dư (Sử dụng số nguyên để trừ)
    const monthlyTargetInt = toInt(monthlyTargetWork);
    const workDeficit = (monthlyTargetInt - totalProductWorkDoneInt) / 1000;
    
    // 2. Tính ngày công chuẩn còn lại
    const tomorrow = startOfDay(addDays(today, 1));
    const isTodayLastDayOfMonth = isAfter(tomorrow, monthInfo.endDate);
    
    let standardWorkdaysRemaining = 0;
    let remainingLeaveWorkDaysInt = 0;
    let remainingOvertimeWorkDaysInt = 0;
    let remainingMeetingWorkDaysInt = 0;
    
    if (!isTodayLastDayOfMonth) {
        standardWorkdaysRemaining = calculateStandardWorkdays(tomorrow, monthInfo.endDate);
        
        const remainingDaysSuppData = processedDaysData
          .filter(dayData => {
            const dDate = parseISO(dayData.date);
            return isWithinInterval(dDate, { start: tomorrow, end: monthInfo.endDate });
          })
          .map(d => d.supplementaryData)
          .filter(Boolean) as DailySupplementaryData[];
          
        remainingLeaveWorkDaysInt = remainingDaysSuppData.reduce((sum, d) => sum + toInt(floorTo3((d.leaveHours || 0) / 8.0)), 0);
        remainingOvertimeWorkDaysInt = remainingDaysSuppData.reduce((sum, d) => sum + toInt(floorTo3((d.overtimeHours || 0) / 8.0)), 0);
        remainingMeetingWorkDaysInt = remainingDaysSuppData.reduce((sum, d) => sum + toInt(floorTo3((d.meetingMinutes || 0) / 480.0)), 0);
    }
    
    // 3. Tính công chuẩn tương lai thực tế
    // Chuyển standardWorkdaysRemaining sang int
    const standardWorkdaysRemainingInt = toInt(standardWorkdaysRemaining);
    const workdayTargetRemainingInt = standardWorkdaysRemainingInt - remainingLeaveWorkDaysInt - remainingMeetingWorkDaysInt + remainingOvertimeWorkDaysInt;
        
    // 4. Tổng công cần làm (Tương lai + Thiếu hụt)
    // Lưu ý: workDeficit có thể âm, cần nhân 1000 để cộng với int
    const workDeficitInt = monthlyTargetInt - totalProductWorkDoneInt; 
    const totalWorkTargetRemainingRawInt = workdayTargetRemainingInt + workDeficitInt;
    const totalWorkTargetRemaining = Math.max(0, totalWorkTargetRemainingRawInt / 1000); 
    
    // 5. Chuẩn bị danh sách sản phẩm
    const productsForQuota = get().userSelectedQuotas.map(usq => {
        const setting = get().quotaSettingsMap.get(usq.product_code);
        const quota = setting && userProfile?.salary_level ? getQuotaValueBySalaryLevel(setting, userProfile.salary_level) : 0;
        return { 
          product_code: usq.product_code, 
          product_name: setting?.product_name || usq.product_code, 
          quota 
        };
    });

    const allWeeksInMonth = getEstronWeeks(monthInfo);

    const weeklyStatistics = allWeeksInMonth
        .map(weekInfo => {
            if (isAfter(startOfDay(weekInfo.startDate), startOfDay(today))) {
                return null;
            }

            const isCurrentWeek = today >= weekInfo.startDate && today <= weekInfo.endDate;
            const calculationEndDateForWeek = isCurrentWeek ? endOfDay(today) : weekInfo.endDate;

            const daysInWeek = processedDaysData.filter(dayData => {
                const dDate = parseISO(dayData.date);
                return isWithinInterval(dDate, { start: weekInfo.startDate, end: calculationEndDateForWeek });
            });
            
            if (daysInWeek.length === 0) {
                 const emptyWeeklyTarget = calculateStandardWorkdays(weekInfo.startDate, calculationEndDateForWeek);
                 return { weekInfo, productStats: [], totalWorkInWeek: 0, totalMeetingMinutesInWeek: 0, weeklyTarget: emptyWeeklyTarget };
            }
            
            // [SỬA LỖI CHÍNH] Tính công họp tuần bằng Integer Math
            const meetingWorkInWeekInt = daysInWeek.reduce((sum, d) => {
               const mins = d.supplementaryData?.meetingMinutes || 0;
               // Tính công ngày -> floorTo3 -> chuyển sang Int
               const dayMeetingWorkInt = toInt(floorTo3(mins / 480.0));
               return sum + dayMeetingWorkInt;
            }, 0);
            const meetingWorkInWeek = meetingWorkInWeekInt / 1000;

            const totalMeetingMinutesInWeek = daysInWeek.reduce((sum, d) => sum + (d.supplementaryData?.meetingMinutes || 0), 0);
            
            // [SỬA LỖI CHÍNH] Tính tổng công SP tuần bằng Integer Math
            const totalProductWorkInWeekInt = daysInWeek.reduce((sum, day) => sum + toInt(day.totalWorkForDay || 0), 0);
            
            // Tổng công tuần = (Tổng SP Int + Tổng Họp Int) / 1000
            const totalWorkInWeek = (totalProductWorkInWeekInt + meetingWorkInWeekInt) / 1000;

            // [SỬA LỖI CHÍNH] Thống kê sản phẩm (prodStat.total_work_done)
            const productStatsMap = new Map<string, WeeklyProductStat>();
            daysInWeek.forEach(day => {
                const dailyProductMap = new Map<string, { quantity: number, work: number }>();
                day.entries.forEach(entry => {
                    const current = dailyProductMap.get(entry.stageCode) || { quantity: 0, work: 0 };
                    current.quantity += entry.quantity || 0;
                    current.work += entry.workAmount || 0;
                    dailyProductMap.set(entry.stageCode, current);
                });

                dailyProductMap.forEach((val, code) => {
                    const existing = productStatsMap.get(code) || { 
                        product_code: code, 
                        product_name: get().quotaSettingsMap.get(code)?.product_name || code, 
                        total_quantity: 0, 
                        total_work_done: 0 // Đây sẽ là biến chứa tổng Integer tạm thời
                    };
                    existing.total_quantity += val.quantity;
                    
                    // QUAN TRỌNG: Làm tròn ngày -> Chuyển sang Int -> Cộng dồn
                    const dayWorkDone = floorTo3(val.work);
                    existing.total_work_done += toInt(dayWorkDone); 
                    
                    productStatsMap.set(code, existing);
                });
            });

            // Chuyển đổi total_work_done từ Int về Float cho tất cả sản phẩm
            productStatsMap.forEach((val, key) => {
                val.total_work_done = val.total_work_done / 1000;
            });

            const productStats = Array.from(productStatsMap.values());
            
            const standardWorkdaysWeek = calculateStandardWorkdays(weekInfo.startDate, calculationEndDateForWeek);
            
            // Mục tiêu tuần: Tính toán trên Int
            const weekLeaveWorkDaysInt = daysInWeek.reduce((sum, d) => sum + toInt(floorTo3((d.supplementaryData?.leaveHours || 0) / 8.0)), 0);
            const weekOvertimeWorkDaysInt = daysInWeek.reduce((sum, d) => sum + toInt(floorTo3((d.supplementaryData?.overtimeHours || 0) / 8.0)), 0);
            
            const standardWorkdaysWeekInt = toInt(standardWorkdaysWeek);
            const weeklyTarget = (standardWorkdaysWeekInt - weekLeaveWorkDaysInt + weekOvertimeWorkDaysInt) / 1000;
            
            return { weekInfo, productStats, totalWorkInWeek, totalMeetingMinutesInWeek, weeklyTarget };
        })
        .filter(Boolean) as WeeklyStatistics[];

    set({
      statistics: {
        standardWorkdaysForMonth, standardWorkdaysToCurrent, totalProductWorkDone,
        monthlyTargetWork, totalOvertimeHours, 
        totalLeaveDays: totalLeaveWorkDays, 
        totalMeetingMinutes,
        weeklyStatistics,
        workDeficit, 
        standardWorkdaysRemaining,
        totalWorkTargetRemaining,
        productsForQuota,
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
        
        const firstProductCode = selectedQuotasData.length > 0 ? selectedQuotasData[0].product_code : null;
        const currentSelectedTargetCode = get().selectedTargetProductCode;
        if (!currentSelectedTargetCode || !selectedQuotasData.some(q => q.product_code === currentSelectedTargetCode)) {
            set({ selectedTargetProductCode: firstProductCode });
        }

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
            
            const totalWorkForDayFinal = floorTo3(totalDailyWork);
            
            return {
                date: yyyymmdd, dayOfWeek: getDayOfWeekVietnamese(dayDate), formattedDate: formatDate(dayDate, 'dd/MM'),
                entries: dailyEntries, totalWorkForDay: totalWorkForDayFinal, supplementaryData: suppDataForDay
            };
        });
        
        dailyDataList.sort((a, b) => b.date.localeCompare(a.date));

        set({
            userProfile: profileData, userSelectedQuotas: selectedQuotasData, quotaSettingsMap: newQuotaSettingsMap,
            estronWeekInfo: currentEstronInfo, processedDaysData: dailyDataList, isLoading: false,
        });

        get().processAndCalculateAllData(dailyDataList);

        if (get().subscriptions.length === 0) {
          const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
              const { userProfile, initialize } = get();
              if (!userProfile?.id) return;
              
              const record = (payload.new || payload.old) as Partial<ProductionEntry & DailySupplementaryData>;
              if (!record || !record.date) return;

              const currentState = get();
              const newDaysData = JSON.parse(JSON.stringify(currentState.processedDaysData));
              const dayIndex = newDaysData.findIndex((d: DailyProductionData) => d.date === record.date);
              
              if (dayIndex === -1) {
                  initialize(userProfile.id);
                  return;
              }
              
              const targetDay = newDaysData[dayIndex];
      
              if (payload.table === 'entries') {
                  const entryRecord = record as ProductionEntry;
                  targetDay.entries = targetDay.entries.filter((e: any) => e.id !== entryRecord.id);
                  if (payload.eventType !== 'DELETE') {
                      const newEntry = payload.new as ProductionEntry;
                      const quotaSetting = currentState.quotaSettingsMap.get(newEntry.product_code);
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
                  
                  const rawTotal = targetDay.entries.reduce((sum: number, e: any) => sum + (e.workAmount || 0), 0);
                  targetDay.totalWorkForDay = floorTo3(rawTotal);

              } else if (payload.table === 'additional') {
                  if (payload.eventType !== 'DELETE') {
                      const newSuppData = payload.new as any;
                      targetDay.supplementaryData = { date: newSuppData.date, leaveHours: newSuppData.leave, overtimeHours: newSuppData.overtime, meetingMinutes: newSuppData.meeting, leaveVerified: newSuppData.leave_verified, overtimeVerified: newSuppData.overtime_verified, meetingVerified: newSuppData.meeting_verified };
                  } else {
                      targetDay.supplementaryData = null;
                  }
              }

              set({ processedDaysData: newDaysData });
              get().processAndCalculateAllData(newDaysData);
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
