// src/services/storage.ts
import {
    ProductionEntry,
    DailySupplementaryData,
    UserSelectedQuota,
    QuotaSetting,
    Profile,
} from '../types/data';
import 'react-native-get-random-values';
import { supabase } from './supabase';
import { formatToYYYYMMDD } from '../utils/dateUtils';

// Helper function để tạo đối tượng lỗi nhất quán
const createError = (message: string, originalError?: any): Error => {
    if (originalError) {
        console.error(`[Storage Service] ${message}:`, originalError);
    } else {
        console.error(`[Storage Service] ${message}`);
    }
    return new Error(message);
};

export const getQuotaSettingByProductCode = async (
    productCode: string
): Promise<{ data: QuotaSetting | null; error: Error | null }> => {
    try {
        const { data, error: supaError } = await supabase
            .from('quota_settings')
            .select('*')
            .eq('product_code', productCode)
            .single();

        if (supaError) {
            if (supaError.code === 'PGRST116') { // "Not found" is not a critical error
                return { data: null, error: null };
            }
            throw createError('Lỗi khi lấy chi tiết mã sản phẩm.', supaError);
        }
        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: e };
    }
};

export const getQuotaSettingsByProductCodes = async (
    productCodes: string[]
): Promise<{ data: QuotaSetting[]; error: Error | null }> => {
    if (!productCodes || productCodes.length === 0) {
        return { data: [], error: null };
    }
    try {
        const { data, error: supaError } = await supabase
            .from('quota_settings')
            .select('*')
            .in('product_code', productCodes);

        if (supaError) {
            throw createError('Lỗi khi lấy nhiều chi tiết mã sản phẩm.', supaError);
        }
        return { data: data || [], error: null };
    } catch (e: any) {
        return { data: [], error: e };
    }
};

export const getUserSelectedQuotas = async (
    userId: string
): Promise<{ data: UserSelectedQuota[]; error: Error | null }> => {
    if (!userId) return { data: [], error: createError('userId không được cung cấp.') };
    try {
        const { data, error: supaError } = await supabase
            .from('user_selected_quotas')
            .select('*')
            .eq('user_id', userId)
            .order('zindex', { ascending: true });
        if (supaError) {
            throw createError('Lỗi khi lấy danh sách định mức đã chọn.', supaError);
        }
        return { data: data || [], error: null };
    } catch (e: any) {
        return { data: [], error: e };
    }
};

export const addUserSelectedQuota = async (
    userId: string,
    productCode: string,
    zindex: number
): Promise<{ data: UserSelectedQuota | null; error: Error | null }> => {
    if (!userId || !productCode) {
        return { data: null, error: createError('Thiếu thông tin userId hoặc productCode.') };
    }
    try {
        const { data: existing, error: existingError } = await supabase
            .from('user_selected_quotas')
            .select('product_code')
            .eq('user_id', userId)
            .eq('product_code', productCode)
            .maybeSingle();
        if (existingError) throw createError('Lỗi khi kiểm tra định mức đã tồn tại.', existingError);
        if (existing) return { data: null, error: createError(`Sản phẩm ${productCode} đã có trong danh sách.`) };

        const { data, error: supaError } = await supabase
            .from('user_selected_quotas')
            .insert([{ user_id: userId, product_code: productCode, zindex: zindex }])
            .select()
            .single();
        if (supaError) throw createError('Lỗi khi thêm định mức đã chọn.', supaError);

        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: e };
    }
};

export const deleteUserSelectedQuota = async (
    userId: string,
    productCode: string
): Promise<{ data: boolean; error: Error | null }> => {
    if (!userId || !productCode) return { data: false, error: createError('Thiếu thông tin userId hoặc productCode.') };
    try {
        const { error: supaError, count } = await supabase
            .from('user_selected_quotas')
            .delete({ count: 'exact' })
            .eq('user_id', userId)
            .eq('product_code', productCode);
        if (supaError) throw createError(`Lỗi từ Supabase khi xóa product_code '${productCode}'.`, supaError);
        
        return { data: count !== null && count > 0, error: null };
    } catch (e: any) {
        return { data: false, error: e };
    }
};

export const saveUserSelectedQuotasOrder = async (
    userId: string,
    quotas: Array<{ product_code: string; zindex: number }>
): Promise<{ data: boolean; error: Error | null }> => {
    if (!userId) return { data: false, error: createError('userId không được cung cấp.') };
    if (!quotas || quotas.length === 0) return { data: true, error: null };
    try {
        const results = await Promise.all(
            quotas.map(q =>
                supabase
                    .from('user_selected_quotas')
                    .update({ zindex: q.zindex })
                    .eq('user_id', userId)
                    .eq('product_code', q.product_code)
            )
        );
        const firstError = results.find(result => result.error);
        if (firstError) throw createError('Lỗi khi cập nhật zindex.', firstError.error);
        
        return { data: true, error: null };
    } catch (e: any) {
        return { data: false, error: e };
    }
};

export const getUserProfile = async (
  userId: string
): Promise<{ data: Profile | null; error: Error | null }> => {
  if (!userId) return { data: null, error: createError('userId không được cung cấp.') };
  try {
    const { data, error: supaError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (supaError) {
      if (supaError.code === 'PGRST116') {
        throw createError(`Không tìm thấy profile cho user_id: ${userId}`, supaError);
      }
      throw createError('Lỗi khi lấy profile người dùng.', supaError);
    }
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

export const getQuotaValueBySalaryLevel = (
    quotaSetting: QuotaSetting | null,
    salaryLevel: string | null | undefined
): number => {
    if (!quotaSetting || !salaryLevel) return 0;
    const formattedSalaryLevel = `level_${salaryLevel.replace('.', '_')}`;
    if (Object.prototype.hasOwnProperty.call(quotaSetting, formattedSalaryLevel)) {
        const quotaValue = (quotaSetting as any)[formattedSalaryLevel];
        return typeof quotaValue === 'number' ? quotaValue : 0;
    }
    console.warn(`[Utils] Không tìm thấy cột định mức '${formattedSalaryLevel}' cho salary_level '${salaryLevel}' trong QuotaSetting.`);
    return 0;
};

export const addProductionBoxEntry = async (
    entryData: Omit<ProductionEntry, 'id' | 'created_at' | 'verified'> & { user_id: string }
): Promise<{ data: ProductionEntry | null; error: Error | null }> => {
    const { user_id, product_code, date, quantity, po, box, batch, quota_percentage } = entryData;
    if (!user_id || !product_code || !date) return { data: null, error: createError('Thiếu thông tin user_id, product_code hoặc date.') };
    
    // Đã thêm quota_percentage vào đây
    const dataToInsert = { user_id, product_code, date, quantity, po, box, batch, quota_percentage };

    try {
        const { data, error: supaError } = await supabase
            .from('entries')
            .insert(dataToInsert)
            .select()
            .single();
        if (supaError) throw createError(`Không thể lưu sản lượng: ${supaError.message}`, supaError);
        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: e };
    }
};

export const getProductionEntriesByDateRange = async (
    userId: string,
    startDate: string,
    endDate: string
): Promise<{ data: ProductionEntry[]; error: Error | null }> => {
    if (!userId) return { data: [], error: createError('userId không được cung cấp.') };
    try {
        const { data, error: supaError } = await supabase
            .from('entries')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });
        if (supaError) throw createError('Lỗi khi lấy sản lượng theo khoảng ngày.', supaError);
        return { data: (data as ProductionEntry[]) || [], error: null };
    } catch (e: any) {
        return { data: [], error: e };
    }
};

export const deleteProductionEntry = async (
    entryId: string
): Promise<{ data: boolean; error: Error | null }> => {
    if (!entryId) return { data: false, error: createError('entryId không được cung cấp.') };
    try {
        const { error: supaError, count } = await supabase
            .from('entries')
            .delete({ count: 'exact' })
            .eq('id', entryId);
        if (supaError) throw createError(`Không thể xóa mục sản lượng: ${supaError.message}`, supaError);
        return { data: count !== null && count > 0, error: null };
    } catch (e: any) {
        return { data: false, error: e };
    }
};

export const saveDailySupplementaryData = async (
    userId: string,
    entryToUpdate: DailySupplementaryData
): Promise<{ data: DailySupplementaryData | null; error: Error | null }> => {
    if (!userId) return { data: null, error: createError('userId không được cung cấp.') };

    const { date, leaveHours, overtimeHours, meetingMinutes } = entryToUpdate;
    const shouldDelete = (leaveHours === null || leaveHours === undefined) &&
                         (overtimeHours === null || overtimeHours === undefined) &&
                         (meetingMinutes === null || meetingMinutes === undefined);
    
    try {
        if (shouldDelete) {
            const { error: supaError } = await supabase.from('additional').delete().match({ user_id: userId, date });
            if (supaError) throw createError('Lỗi khi xóa dữ liệu phụ trợ rỗng.', supaError);
            return { data: { date, leaveHours: null, overtimeHours: null, meetingMinutes: null, leaveVerified: false, overtimeVerified: false, meetingVerified: false }, error: null };
        } else {
            const dataToUpsert = { user_id: userId, date, leave: leaveHours, overtime: overtimeHours, meeting: meetingMinutes };
            const { data, error: supaError } = await supabase
                .from('additional')
                .upsert(dataToUpsert, { onConflict: 'user_id, date' })
                .select('date, leave, overtime, meeting, leave_verified, overtime_verified, meeting_verified')
                .single();
            if (supaError) throw createError('Lỗi khi upsert dữ liệu phụ trợ.', supaError);
            const result = { date: data.date, leaveHours: data.leave, overtimeHours: data.overtime, meetingMinutes: data.meeting, leaveVerified: data.leave_verified, overtimeVerified: data.overtime_verified, meetingVerified: data.meeting_verified };
            return { data: result, error: null };
        }
    } catch (e: any) {
        return { data: null, error: e };
    }
};

export const getSupplementaryDataByDateRange = async (
    userId: string,
    startDate: string,
    endDate: string
): Promise<{ data: DailySupplementaryData[]; error: Error | null }> => {
    if (!userId) return { data: [], error: createError('userId không được cung cấp.') };
    try {
        const { data, error: supaError } = await supabase
            .from('additional')
            .select('date, leave, overtime, meeting, leave_verified, overtime_verified, meeting_verified')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });
        if (supaError) throw createError('Lỗi khi lấy dữ liệu phụ trợ theo khoảng ngày.', supaError);
        
        const result = (data || []).map(item => ({ date: item.date, leaveHours: item.leave, overtimeHours: item.overtime, meetingMinutes: item.meeting, leaveVerified: item.leave_verified, overtimeVerified: item.overtime_verified, meetingVerified: item.meeting_verified }));
        return { data: result, error: null };
    } catch (e: any) {
        return { data: [], error: e };
    }
};

export const updateProductionEntryById = async (
    entryId: string,
    entryData: Partial<Omit<ProductionEntry, 'id' | 'user_id' | 'product_code' | 'date' | 'created_at' | 'verified' | 'quota_percentage'>>
): Promise<{ data: ProductionEntry | null; error: Error | null }> => {
    if (!entryId) return { data: null, error: createError('Thiếu ID của mục sản lượng để cập nhật.') };
    if (Object.keys(entryData).length === 0) return { data: null, error: createError('Không có thông tin nào để cập nhật.') };
    
    try {
        const { data, error: supaError } = await supabase
            .from('entries')
            .update(entryData)
            .eq('id', entryId)
            .select()
            .single();

        if (supaError) throw createError(`Không thể cập nhật sản lượng: ${supaError.message}`, supaError);
        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: e };
    }
};

// export const getStatisticsRPC = async (
//     userId: string,
//     date: Date
// ): Promise<{ data: any | null; error: Error | null }> => {
//     if (!userId) return { data: null, error: createError("userId không hợp lệ.") };
//     try {
//         const dateString = formatToYYYYMMDD(date);
//         const { data, error: supaError } = await supabase.rpc('get_user_monthly_stats', {
//             user_id_param: userId,
//             today_param: dateString
//         });

//         if (supaError) throw createError(`Không thể lấy dữ liệu thống kê từ máy chủ: ${supaError.message}`, supaError);
//         return { data, error: null };
//     } catch (e: any) {
//         return { data: null, error: e };
//     }
// };

export const clearAllLocalData = async () => {
    // This function is intended for local data sources like AsyncStorage, which are not used for primary data storage in this app.
    console.log('clearAllLocalData: No specific local data to clear.');
};