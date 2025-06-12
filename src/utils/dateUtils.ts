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
  parseISO as dateFnsParseISO, // Import với tên khác để tránh xung đột nếu cần và để re-export rõ ràng
  isBefore,
  isAfter,
  isEqual,
  getDay, // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
} from 'date-fns';
import { vi } from 'date-fns/locale'; // Import locale tiếng Việt

// Re-export parseISO để các module khác có thể dùng từ dateUtils
export const parseISO = dateFnsParseISO;
export { getDay };

export interface EstronMonthPeriod {
  year: number; // Năm dương lịch của ngày bắt đầu tháng Estron
  month: number; // Tháng dương lịch của ngày bắt đầu tháng Estron (1-12)
  estronMonth: number; // Tên tháng Estron (ví dụ: 5 cho tháng 5 Estron)
  startDate: Date; //
  endDate: Date; //
  name: string; // Ví dụ: "Tháng 5 Estron (21/04/YYYY - 20/05/YYYY)"
}

export interface EstronWeekPeriod {
  weekNumber: number; // 1, 2, 3...
  startDate: Date; //
  endDate: Date; //
  name: string; // Ví dụ: "Tuần 1" (Đã sửa, không còn chứa dải ngày)
  days: Date[]; // Danh sách các ngày trong tuần đó
}

/**
 * Lấy thông tin tháng Estron dựa trên một ngày cụ thể.
 * Tháng Estron N bắt đầu từ 21 tháng (N-1) dương lịch đến 20 tháng N dương lịch.
 */
export const getEstronMonthPeriod = (date: Date): EstronMonthPeriod => { //
  const currentDayOfMonth = getDate(date); //
  const currentMonthIndex = getMonth(date); // 0-11
  const currentYear = getYear(date); //

  let estronMonthName: number; //
  let startDate: Date; //
  let endDate: Date; //

  if (currentDayOfMonth >= 21) { //
    estronMonthName = currentMonthIndex + 2; // +1 vì index, +1 vì là tháng sau
    startDate = new Date(currentYear, currentMonthIndex, 21); //
    if (currentMonthIndex === 11) { // Tháng 12 (index 11) //
      endDate = new Date(currentYear + 1, 0, 20); // 20/01 năm sau
    } else {
      endDate = new Date(currentYear, currentMonthIndex + 1, 20); //
    }
  } else {
    estronMonthName = currentMonthIndex + 1; //
    endDate = new Date(currentYear, currentMonthIndex, 20); //
    if (currentMonthIndex === 0) { // Tháng 1 (index 0) //
      startDate = new Date(currentYear - 1, 11, 21); // 21/12 năm trước
    } else {
      startDate = new Date(currentYear, currentMonthIndex - 1, 21); //
    }
  }

  if (estronMonthName > 12) { //
    estronMonthName -= 12; //
  }

  return {
    year: getYear(startDate), //
    month: getMonth(startDate) + 1, //
    estronMonth: estronMonthName, //
    startDate, //
    endDate, //
    name: `Tháng ${estronMonthName} Estron (${format(startDate, 'dd/MM', { locale: vi })} - ${format(endDate, 'dd/MM/yyyy', { locale: vi })})`, //
  };
};

/**
 * Lấy danh sách các tuần Estron trong một tháng Estron.
 * Tuần 1: từ ngày đầu tháng Estron đến Chủ Nhật kế đó.
 * Tuần 2,3,4...: từ Thứ 2 đến Chủ Nhật.
 * Tuần cuối: từ Thứ 2 đến ngày cuối tháng Estron.
 */
export const getEstronWeeks = (estronMonthPeriod: EstronMonthPeriod): EstronWeekPeriod[] => { //
  const weeks: EstronWeekPeriod[] = []; //
  let currentProcessingDate = estronMonthPeriod.startDate; //
  let weekNumber = 1; //

  while (isBefore(currentProcessingDate, estronMonthPeriod.endDate) || isEqual(currentProcessingDate, estronMonthPeriod.endDate)) { //
    let weekStartDate: Date; //
    let weekEndDate: Date; //

    if (weekNumber === 1) { //
      weekStartDate = estronMonthPeriod.startDate; //
      const firstSundayOrMonthEnd = endOfWeek(weekStartDate, { weekStartsOn: 1, locale: vi }); //
      weekEndDate = isBefore(firstSundayOrMonthEnd, estronMonthPeriod.endDate) ? firstSundayOrMonthEnd : estronMonthPeriod.endDate; //
    } else {
      weekStartDate = currentProcessingDate; //
      const currentWeekSundayOrMonthEnd = endOfWeek(weekStartDate, { weekStartsOn: 1, locale: vi }); //
      weekEndDate = isBefore(currentWeekSundayOrMonthEnd, estronMonthPeriod.endDate) ? currentWeekSundayOrMonthEnd : estronMonthPeriod.endDate; //
    }

    const daysInWeek = eachDayOfInterval({ start: weekStartDate, end: weekEndDate }); //

    weeks.push({
      weekNumber, //
      startDate: weekStartDate, //
      endDate: weekEndDate, //
      name: `Tuần ${weekNumber}`, // Tên tuần đã được sửa
      days: daysInWeek, //
    });

    currentProcessingDate = addDays(weekEndDate, 1); //
    weekNumber++; //

    if (isAfter(currentProcessingDate, estronMonthPeriod.endDate) && weeks.length > 0) { //
        if (isAfter(currentProcessingDate, estronMonthPeriod.endDate)) { //
             break; //
        }
    }
  }
  return weeks; //
};

// --- Tiện ích định dạng và lấy ngày ---
export const formatDate = (date: Date | number | string, formatString: string = 'dd/MM/yyyy'): string => { //
  const dateObj = typeof date === 'string' ? parseISO(date) : date; // Sử dụng parseISO đã import và re-export
  try {
    return format(dateObj, formatString, { locale: vi }); //
  } catch (error) {
    console.error("Error formatting date:", date, formatString, error); //
    return "Invalid Date"; //
  }
};

export const formatToDayOfWeekAndDate = (date: Date | string): string => { //
  return formatDate(date, 'EEEE, dd/MM'); //
};

export const formatToYYYYMMDD = (date: Date): string => { //
  return format(date, 'yyyy-MM-dd'); //
};

export const getToday = (): Date => new Date(); //

export const getDayOfWeekVietnamese = (date: Date): string => { //
    const dayIndex = getDay(date); // 0 = CN, 1 = T2, ..., 6 = T7
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]; //
    return days[dayIndex]; //
}

export const getCurrentEstronWeekInfo = (
  targetDate: Date
): {
  estronMonth: EstronMonthPeriod; //
  currentWeek: EstronWeekPeriod | undefined; //
  allWeeksInMonth: EstronWeekPeriod[]; //
  visibleWeeks: EstronWeekPeriod[]; //
} => {
  const estronMonth = getEstronMonthPeriod(targetDate); //
  const allWeeksInMonth = getEstronWeeks(estronMonth); //
  let currentWeek: EstronWeekPeriod | undefined = undefined; //
  const visibleWeeks: EstronWeekPeriod[] = []; //

  for (const week of allWeeksInMonth) { //
    const isTargetInWeek = (targetDate >= week.startDate && targetDate <= week.endDate); //
    
    if (!currentWeek && isTargetInWeek) { //
        currentWeek = week; //
    }

    // Chỉ thêm các tuần cho đến và bao gồm tuần chứa targetDate
    // Hoặc tuần đó bắt đầu trước hoặc cùng ngày với targetDate
    if (isBefore(week.startDate, targetDate) || isEqual(week.startDate, targetDate) || isTargetInWeek) { //
      // Để tránh thêm trùng lặp nếu currentWeek đã được xác định và tuần đó đã được thêm
      if (!visibleWeeks.find(vw => vw.weekNumber === week.weekNumber)) { //
          visibleWeeks.push(week); //
      }
    }
    // Nếu tuần đang xét bắt đầu sau targetDate VÀ currentWeek đã được tìm thấy (tức là targetDate nằm trong currentWeek hoặc trước đó)
    // thì không cần thêm các tuần sau nữa (vì chúng là tuần tương lai so với targetDate)
    if (currentWeek && isAfter(week.startDate, targetDate) && week.weekNumber > currentWeek.weekNumber) { //
        break; //
    }
  }
  // Sắp xếp lại visibleWeeks để đảm bảo đúng thứ tự tuần
  visibleWeeks.sort((a, b) => a.weekNumber - b.weekNumber); //

  return { estronMonth, currentWeek, allWeeksInMonth, visibleWeeks }; //
};

/**
 * Tính toán số ngày công chuẩn trong một khoảng thời gian.
 * Định nghĩa: T2-T6 = 1 công; T7 = 0.5 công; CN = 0 công.
 */
export const calculateStandardWorkdays = (startDate: Date, endDate: Date): number => { //
  if (!startDate || !endDate || isAfter(startDate, endDate)) { // Sửa điều kiện endDate < startDate thành isAfter
    return 0; //
  }

  const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate }); //
  let totalWorkdays = 0; //

  daysInPeriod.forEach(day => { //
    const dayOfWeek = getDay(day); // Chủ Nhật = 0, Thứ Hai = 1, ..., Thứ Bảy = 6

    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Thứ Hai đến Thứ Sáu
      totalWorkdays += 1; //
    } else if (dayOfWeek === 6) { // Thứ Bảy
      totalWorkdays += 0.5; //
    }
    // Chủ Nhật (dayOfWeek === 0) không cộng gì cả
  });

  return totalWorkdays; //
};