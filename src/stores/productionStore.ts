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
  addDays // <<< Import thêm addDays
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
  
  // <<< Các trường mới cho mục tiêu còn lại >>>
  workDeficit: number; // monthlyTargetWork - totalProductWorkDone (> 0 là thiếu, < 0 là dư)
  standardWorkdaysRemaining: number; // Ngày công chuẩn còn lại trong tháng
  totalWorkTargetRemaining: number; // Tổng công sản phẩm cần thực hiện từ giờ đến cuối tháng
  productsForQuota: { product_code: string; product_name: string; quota: number; }[]; // Danh sách sản phẩm kèm định mức
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
  
  // <<< State lưu mã sản phẩm được chọn để tính gợi ý >>>
  selectedTargetProductCode: string | null; 
}

export interface ProductActions {
  setTargetDate: (date: Date) => void;
  initialize: (userId: string) => void;
  cleanup: () => void;
  processAndCalculateAllData: (dataForCalculation: DailyProductionData[]) => void;
  // <<< Action cập nhật mã sản phẩm được chọn >>>
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
  selectedTargetProductCode: null, // Khởi tạo giá trị null

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
  
  // Action mới
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
    const totalProductWorkDone = processedDaysData.reduce((sum, day) => sum + (day.totalWorkForDay || 0), 0);
    
    const allSupplementaryData = processedDaysData.map(d => d.supplementaryData).filter(Boolean) as DailySupplementaryData[];
    const totalLeaveHours = allSupplementaryData.reduce((sum, d) => sum + (d.leaveHours || 0), 0);
    const totalMeetingMinutes = allSupplementaryData.reduce((sum, d) => sum + (d.meetingMinutes || 0), 0);
    const totalOvertimeHours = allSupplementaryData.reduce((sum, d) => sum + (d.overtimeHours || 0), 0);
    const totalLeaveDays = totalLeaveHours / 8.0;
    
    const monthlyTargetWork = standardWorkdaysToCurrent - (totalLeaveHours / 8.0) - (totalMeetingMinutes / 480.0) + (totalOvertimeHours / 8.0);

    // <<< TÍNH TOÁN CÔNG CẦN THỰC HIỆN CÒN LẠI >>>
    // 1. Tính công thiếu/dư (Dương là thiếu, Âm là dư)
    const workDeficit = monthlyTargetWork - totalProductWorkDone; 
    
    // 2. Tính ngày công chuẩn còn lại (từ ngày mai đến cuối tháng)
    const tomorrow = startOfDay(addDays(today, 1));
    const isTodayLastDayOfMonth = isAfter(tomorrow, monthInfo.endDate);
    
    let standardWorkdaysRemaining = 0;
    let remainingLeaveHours = 0;
    let remainingOvertimeHours = 0;
    let remainingMeetingMinutes = 0;
    
    if (!isTodayLastDayOfMonth) {
        standardWorkdaysRemaining = calculateStandardWorkdays(tomorrow, monthInfo.endDate);
        
        // Lấy các ngày nghỉ/tăng ca đã nhập trước cho tương lai
        const remainingDaysSuppData = processedDaysData
          .filter(dayData => {
            const dDate = parseISO(dayData.date);
            return isWithinInterval(dDate, { start: tomorrow, end: monthInfo.endDate });
          })
          .map(d => d.supplementaryData)
          .filter(Boolean) as DailySupplementaryData[];
          
        remainingLeaveHours = remainingDaysSuppData.reduce((sum, d) => sum + (d.leaveHours || 0), 0);
        remainingOvertimeHours = remainingDaysSuppData.reduce((sum, d) => sum + (d.overtimeHours || 0), 0);
        remainingMeetingMinutes = remainingDaysSuppData.reduce((sum, d) => sum + (d.meetingMinutes || 0), 0);
    }
    
    // 3. Tính công chuẩn tương lai thực tế (trừ nghỉ, cộng tăng ca tương lai)
    const workdayTargetRemaining = 
        standardWorkdaysRemaining - 
        (remainingLeaveHours / 8.0) - 
        (remainingMeetingMinutes / 480.0) + 
        (remainingOvertimeHours / 8.0);
        
    // 4. Tổng công cần làm = Việc tương lai + Nợ cũ (nếu nợ cũ âm thì tự trừ bớt)
    const totalWorkTargetRemainingRaw = workdayTargetRemaining + workDeficit;
    const totalWorkTargetRemaining = Math.max(0, totalWorkTargetRemainingRaw); 
    
    // 5. Chuẩn bị danh sách sản phẩm và định mức để UI sử dụng
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
            
            const weekSuppData = daysInWeek.map(d => d.supplementaryData).filter(Boolean) as DailySupplementaryData[];
            const totalMeetingMinutesInWeek = weekSuppData.reduce((sum, d) => sum + (d.meetingMinutes || 0), 0);
            
            const totalProductWorkInWeek = daysInWeek.reduce((sum, day) => sum + (day.totalWorkForDay || 0), 0);
            const meetingWorkInWeek = totalMeetingMinutesInWeek / 480.0;
            const totalWorkInWeek = totalProductWorkInWeek + meetingWorkInWeek;

            const productStatsMap = new Map<string, WeeklyProductStat>();
            daysInWeek.flatMap(d => d.entries).forEach(entry => {
                const existing = productStatsMap.get(entry.stageCode) || { product_code: entry.stageCode, product_name: get().quotaSettingsMap.get(entry.stageCode)?.product_name || entry.stageCode, total_quantity: 0, total_work_done: 0 };
                existing.total_quantity += entry.quantity || 0;
                existing.total_work_done += entry.workAmount || 0;
                productStatsMap.set(entry.stageCode, existing);
            });
            const productStats = Array.from(productStatsMap.values());
            
            const standardWorkdaysWeek = calculateStandardWorkdays(weekInfo.startDate, calculationEndDateForWeek);
            const weekLeaveHours = weekSuppData.reduce((sum, d) => sum + (d.leaveHours || 0), 0);
            const weekOvertimeHours = weekSuppData.reduce((sum, d) => sum + (d.overtimeHours || 0), 0);
            const weeklyTarget = standardWorkdaysWeek - (weekLeaveHours / 8.0) + (weekOvertimeHours / 8.0);
            
            return { weekInfo, productStats, totalWorkInWeek, totalMeetingMinutesInWeek, weeklyTarget };
        })
        .filter(Boolean) as WeeklyStatistics[];

    set({
      statistics: {
        standardWorkdaysForMonth, standardWorkdaysToCurrent, totalProductWorkDone,
        monthlyTargetWork, totalOvertimeHours, totalLeaveDays, totalMeetingMinutes,
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
        
        // <<< THIẾT LẬP MẶC ĐỊNH MÃ SẢN PHẨM MỤC TIÊU NẾU CHƯA CÓ >>>
        const firstProductCode = selectedQuotasData.length > 0 ? selectedQuotasData[0].product_code : null;
        const currentSelectedTargetCode = get().selectedTargetProductCode;
        // Nếu chưa chọn hoặc mã đã chọn không còn trong danh sách -> Reset về mã đầu tiên
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
                  targetDay.totalWorkForDay = targetDay.entries.reduce((sum: number, e: any) => sum + (e.workAmount || 0), 0);
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
