// src/utils/dateUtils.ts
import {
  format,
  getDate,
  getMonth,
  getYear,
  startOfWeek,
  endOfWeek,
  addDays,
  eachDayOfInterval,
  isSunday,
  isMonday,
  parseISO as dateFnsParseISO,
  isBefore,
  isAfter,
  isEqual,
  getDay, // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  startOfDay,
  isWithinInterval,
  endOfDay,
} from 'date-fns';
import { vi } from 'date-fns/locale';

// Re-export parseISO để các module khác có thể dùng từ dateUtils
export const parseISO = dateFnsParseISO;
export { getDay, eachDayOfInterval, addDays, isBefore, isAfter, isEqual, startOfDay, isWithinInterval, endOfDay };

export interface EstronMonthPeriod {
  year: number;
  month: number;
  estronMonth: number;
  startDate: Date;
  endDate: Date;
  name: string;
}

export interface EstronWeekPeriod {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  name: string;
  days: Date[];
}

/**
 * Lấy thông tin tháng Estron dựa trên một ngày cụ thể.
 * Tháng Estron N bắt đầu từ 21 tháng (N-1) dương lịch đến 20 tháng N dương lịch.
 */
export const getEstronMonthPeriod = (date: Date): EstronMonthPeriod => {
  const currentDayOfMonth = getDate(date);
  const currentMonthIndex = getMonth(date);
  const currentYear = getYear(date);

  let estronMonthName: number;
  let startDate: Date;
  let endDate: Date;

  if (currentDayOfMonth >= 21) {
    estronMonthName = currentMonthIndex + 2;
    startDate = new Date(currentYear, currentMonthIndex, 21);
    if (currentMonthIndex === 11) {
      endDate = new Date(currentYear + 1, 0, 20);
    } else {
      endDate = new Date(currentYear, currentMonthIndex + 1, 20);
    }
  } else {
    estronMonthName = currentMonthIndex + 1;
    endDate = new Date(currentYear, currentMonthIndex, 20);
    if (currentMonthIndex === 0) {
      startDate = new Date(currentYear - 1, 11, 21);
    } else {
      startDate = new Date(currentYear, currentMonthIndex - 1, 21);
    }
  }

  if (estronMonthName > 12) {
    estronMonthName -= 12;
  }

  return {
    year: getYear(startDate),
    month: getMonth(startDate) + 1,
    estronMonth: estronMonthName,
    startDate,
    endDate,
    name: `Tháng ${estronMonthName} Estron (${format(startDate, 'dd/MM', { locale: vi })} - ${format(endDate, 'dd/MM/yyyy', { locale: vi })})`,
  };
};

/**
 * Lấy danh sách các tuần Estron trong một tháng Estron.
 * Tuần 1: từ ngày đầu tháng Estron đến Chủ Nhật kế đó.
 * Tuần 2,3,4...: từ Thứ 2 đến Chủ Nhật.
 * Tuần cuối: từ Thứ 2 đến ngày cuối tháng Estron.
 */
export const getEstronWeeks = (estronMonthPeriod: EstronMonthPeriod): EstronWeekPeriod[] => {
  const weeks: EstronWeekPeriod[] = [];
  let currentProcessingDate = estronMonthPeriod.startDate;
  let weekNumber = 1;

  while (isBefore(currentProcessingDate, estronMonthPeriod.endDate) || isEqual(currentProcessingDate, estronMonthPeriod.endDate)) {
    let weekStartDate: Date;
    let weekEndDate: Date;

    if (weekNumber === 1) {
      weekStartDate = estronMonthPeriod.startDate;
      const firstSundayOrMonthEnd = endOfWeek(weekStartDate, { weekStartsOn: 1, locale: vi });
      weekEndDate = isBefore(firstSundayOrMonthEnd, estronMonthPeriod.endDate) ? firstSundayOrMonthEnd : estronMonthPeriod.endDate;
    } else {
      weekStartDate = currentProcessingDate;
      const currentWeekSundayOrMonthEnd = endOfWeek(weekStartDate, { weekStartsOn: 1, locale: vi });
      weekEndDate = isBefore(currentWeekSundayOrMonthEnd, estronMonthPeriod.endDate) ? currentWeekSundayOrMonthEnd : estronMonthPeriod.endDate;
    }

    const daysInWeek = eachDayOfInterval({ start: weekStartDate, end: weekEndDate });

    weeks.push({
      weekNumber,
      startDate: weekStartDate,
      endDate: weekEndDate,
      name: `Tuần ${weekNumber}`,
      days: daysInWeek,
    });

    // =========================================================================
    // <<< ĐÂY LÀ DÒNG CODE QUAN TRỌNG NHẤT ĐƯỢC SỬA LỖI >>>
    currentProcessingDate = startOfDay(addDays(weekEndDate, 1));
    // =========================================================================
    
    weekNumber++;

    if (isAfter(currentProcessingDate, estronMonthPeriod.endDate)) {
      break;
    }
  }
  return weeks;
};

// --- Tiện ích định dạng và lấy ngày ---
export const formatDate = (date: Date | number | string, formatString: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  try {
    return format(dateObj, formatString, { locale: vi });
  } catch (error) {
    console.error("Error formatting date:", date, formatString, error);
    return "Invalid Date";
  }
};

export const formatToDayOfWeekAndDate = (date: Date | string): string => {
  return formatDate(date, 'EEEE, dd/MM');
};

export const formatToYYYYMMDD = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getToday = (): Date => new Date();

export const getDayOfWeekVietnamese = (date: Date): string => {
    const dayIndex = getDay(date);
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return days[dayIndex];
}

export const getCurrentEstronWeekInfo = (
  targetDate: Date
): {
  estronMonth: EstronMonthPeriod;
  currentWeek: EstronWeekPeriod | undefined;
  allWeeksInMonth: EstronWeekPeriod[];
  visibleWeeks: EstronWeekPeriod[];
} => {
  const estronMonth = getEstronMonthPeriod(targetDate);
  const allWeeksInMonth = getEstronWeeks(estronMonth);
  let currentWeek: EstronWeekPeriod | undefined = undefined;
  const visibleWeeks: EstronWeekPeriod[] = [];

  for (const week of allWeeksInMonth) {
    const isTargetInWeek = (targetDate >= week.startDate && targetDate <= week.endDate);
    
    if (!currentWeek && isTargetInWeek) {
        currentWeek = week;
    }

    if (isBefore(week.startDate, targetDate) || isEqual(week.startDate, targetDate) || isTargetInWeek) {
      if (!visibleWeeks.find(vw => vw.weekNumber === week.weekNumber)) {
          visibleWeeks.push(week);
      }
    }
    if (currentWeek && isAfter(week.startDate, targetDate) && week.weekNumber > currentWeek.weekNumber) {
        break;
    }
  }
  visibleWeeks.sort((a, b) => a.weekNumber - b.weekNumber);

  return { estronMonth, currentWeek, allWeeksInMonth, visibleWeeks };
};

/**
 * Tính toán số ngày công chuẩn trong một khoảng thời gian.
 * Định nghĩa: T2-T6 = 1 công; T7 = 0.5 công; CN = 0 công.
 */
export const calculateStandardWorkdays = (startDate: Date, endDate: Date): number => {
  if (!startDate || !endDate || isAfter(startDate, endDate)) {
    return 0;
  }

  const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
  let totalWorkdays = 0;

  daysInPeriod.forEach(day => {
    const dayOfWeek = getDay(day);

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      totalWorkdays += 1;
    } else if (dayOfWeek === 6) {
      totalWorkdays += 0.5;
    }
  });

  return totalWorkdays;
};
