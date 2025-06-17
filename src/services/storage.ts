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
import { Alert } from 'react-native';
import { formatToYYYYMMDD } from '../utils/dateUtils';

export const getQuotaSettingByProductCode = async (
    productCode: string
): Promise<QuotaSetting | null> => {
    try {
        const { data, error } = await supabase
            .from('quota_settings')
            .select('*')
            .eq('product_code', productCode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('[Supabase] Lỗi khi lấy chi tiết mã sản phẩm từ quota_settings:', error);
            return null;
        }
        return data;
    } catch (e) {
        console.error('[Supabase] Exception khi lấy chi tiết mã sản phẩm:', e);
        return null;
    }
};

// ================== BẮT ĐẦU THÊM HÀM MỚI ==================
export const getQuotaSettingsByProductCodes = async (
    productCodes: string[]
): Promise<QuotaSetting[]> => {
    if (!productCodes || productCodes.length === 0) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('quota_settings')
            .select('*')
            .in('product_code', productCodes);

        if (error) {
            console.error('[Supabase] Lỗi khi lấy nhiều chi tiết mã sản phẩm:', error);
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('[Supabase] Exception khi lấy nhiều chi tiết mã sản phẩm:', e);
        return [];
    }
};
// ================== KẾT THÚC THÊM HÀM MỚI ==================


export const getUserSelectedQuotas = async (userId: string): Promise<UserSelectedQuota[]> => {
    if (!userId) {
        console.error('[Supabase] getUserSelectedQuotas: userId không được cung cấp.');
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('user_selected_quotas')
            .select('*')
            .eq('user_id', userId)
            .order('zindex', { ascending: true });
        if (error) {
            console.error(
                '[Supabase] Lỗi khi lấy danh sách định mức đã chọn của người dùng:',
                error
            );
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('[Supabase] Exception khi lấy danh sách định mức đã chọn:', e);
        return [];
    }
};

export const addUserSelectedQuota = async (
    userId: string,
    productCode: string,
    productName: string,
    zindex: number
): Promise<UserSelectedQuota | null> => {
    if (!userId || !productCode || !productName) {
        console.error(
            '[Supabase] addUserSelectedQuota: Thiếu thông tin userId, productCode, hoặc productName.'
        );
        return null;
    }
    try {
        const { data: existing, error: existingError } = await supabase
            .from('user_selected_quotas')
            .select('product_code')
            .eq('user_id', userId)
            .eq('product_code', productCode)
            .maybeSingle();
        if (existingError && existingError.code !== 'PGRST116') {
            console.error('[Supabase] Lỗi khi kiểm tra định mức đã tồn tại:', existingError);
            return null;
        }
        if (existing) {
            console.warn(`[Supabase] Sản phẩm ${productCode} đã được người dùng ${userId} chọn.`);
            return null;
        }
        const { data, error } = await supabase
            .from('user_selected_quotas')
            .insert([
                {
                    user_id: userId,
                    product_code: productCode,
                    product_name: productName,
                    zindex: zindex,
                },
            ])
            .select()
            .single();
        if (error) {
            console.error('[Supabase] Lỗi khi thêm định mức đã chọn:', error);
            return null;
        }
        return data;
    } catch (e) {
        console.error('[Supabase] Exception khi thêm định mức đã chọn:', e);
        return null;
    }
};

export const deleteUserSelectedQuota = async (
    userId: string,
    productCode: string
): Promise<boolean> => {
    if (!userId || !productCode) {
        console.error(
            '[Supabase] deleteUserSelectedQuota: Thiếu thông tin userId hoặc productCode.'
        );
        return false;
    }
    try {
        const { error, count } = await supabase
            .from('user_selected_quotas')
            .delete({ count: 'exact' })
            .eq('user_id', userId)
            .eq('product_code', productCode);
        if (error) {
            console.error(
                `[Supabase] Lỗi từ Supabase khi xóa product_code '${productCode}':`,
                error
            );
            return false;
        }
        return count !== null && count > 0;
    } catch (e) {
        console.error(`[Supabase] Exception khi xóa product_code '${productCode}':`, e);
        return false;
    }
};

export const saveUserSelectedQuotasOrder = async (
    userId: string,
    quotas: Array<{ product_code: string; zindex: number }>
): Promise<boolean> => {
    if (!userId) {
        console.error('[Supabase] saveUserSelectedQuotasOrder: userId không được cung cấp.');
        return false;
    }
    if (!quotas || quotas.length === 0) {
        return true;
    }
    try {
        const updatePromises = quotas.map(q =>
            supabase
                .from('user_selected_quotas')
                .update({ zindex: q.zindex })
                .eq('user_id', userId)
                .eq('product_code', q.product_code)
        );
        const results = await Promise.all(updatePromises);
        let allSuccessful = true;
        results.forEach((result, index) => {
            if (result.error) {
                console.error(
                    `[Supabase] Lỗi khi cập nhật zindex cho product_code '${quotas[index].product_code}':`,
                    result.error
                );
                allSuccessful = false;
            }
        });
        return allSuccessful;
    } catch (e) {
        console.error('[Supabase] Exception khi cập nhật thứ tự định mức đã chọn:', e);
        return false;
    }
};

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
    if (!userId) {
        console.error('[Supabase] getUserProfile: userId không được cung cấp.');
        return null;
    }
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                console.warn(`[Supabase] Không tìm thấy profile cho user_id: ${userId}`);
            } else {
                console.error('[Supabase] Lỗi khi lấy profile người dùng:', error);
            }
            return null;
        }
        return data;
    } catch (e) {
        console.error('[Supabase] Exception khi lấy profile người dùng:', e);
        return null;
    }
};

export const getQuotaValueBySalaryLevel = (
    quotaSetting: QuotaSetting | null,
    salaryLevel: string | null | undefined
): number => {
    if (!quotaSetting || !salaryLevel) {
        return 0;
    }
    const formattedSalaryLevel = `level_${salaryLevel.replace('.', '_')}`;
    if (Object.prototype.hasOwnProperty.call(quotaSetting, formattedSalaryLevel)) {
        const quotaValue = (quotaSetting as any)[formattedSalaryLevel];
        return typeof quotaValue === 'number' ? quotaValue : 0;
    }
    console.warn(
        `[Utils] Không tìm thấy cột định mức '${formattedSalaryLevel}' cho salary_level '${salaryLevel}' trong QuotaSetting.`
    );
    return 0;
};

export const addProductionBoxEntry = async (
    entryData: Omit<ProductionEntry, 'id' | 'created_at' | 'verified' | 'quota_percentage'> & {
        user_id: string;
    }
): Promise<ProductionEntry | null> => {
    const { user_id, product_code, date, quantity, po, box, batch } = entryData;

    if (!user_id || !product_code || !date) {
        Alert.alert('Lỗi', 'Thiếu thông tin user_id, product_code hoặc date để lưu sản lượng.');
        console.error('addProductionBoxEntry: Missing user_id, product_code, or date.', entryData);
        return null;
    }

    const dataToInsert: {
        user_id: string;
        product_code: string;
        date: string;
        quantity?: number | null;
        po?: string | null;
        box?: string | null;
        batch?: string | null;
    } = {
        user_id,
        product_code,
        date,
    };

    if (quantity !== undefined) dataToInsert.quantity = quantity;
    if (po !== undefined) dataToInsert.po = po;
    if (box !== undefined) dataToInsert.box = box;
    if (batch !== undefined) dataToInsert.batch = batch;

    try {
        const { data, error } = await supabase
            .from('entries')
            .insert(dataToInsert)
            .select()
            .single();

        if (error) {
            console.error('[Supabase] Lỗi khi thêm hộp sản lượng mới:', error);
            Alert.alert(
                'Lỗi Lưu Sản Lượng',
                `Không thể lưu hộp sản lượng: ${error.message}. Chi tiết: ${error.details || ''}`
            );
            return null;
        }
        return data as ProductionEntry;
    } catch (e: any) {
        console.error('[Supabase] Exception khi thêm hộp sản lượng mới:', e);
        Alert.alert(
            'Lỗi Hệ Thống',
            `Có lỗi không mong muốn xảy ra khi lưu hộp sản lượng: ${e.message}`
        );
        return null;
    }
};

export const getProductionEntriesByDate = async (
    userId: string,
    date: string
): Promise<ProductionEntry[]> => {
    if (!userId) {
        console.error('[Supabase] getProductionEntriesByDate: userId không được cung cấp.');
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[Supabase] Lỗi khi lấy sản lượng theo ngày:', error);
            return [];
        }
        return (data as ProductionEntry[]) || [];
    } catch (e) {
        console.error('[Supabase] Exception khi lấy sản lượng theo ngày:', e);
        return [];
    }
};

export const getProductionEntriesByDateRange = async (
    userId: string,
    startDate: string,
    endDate: string
): Promise<ProductionEntry[]> => {
    if (!userId) {
        console.error('[Supabase] getProductionEntriesByDateRange: userId không được cung cấp.');
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('entries')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Supabase] Lỗi khi lấy sản lượng theo khoảng ngày:', error);
            return [];
        }
        return (data as ProductionEntry[]) || [];
    } catch (e) {
        console.error('[Supabase] Exception khi lấy sản lượng theo khoảng ngày:', e);
        return [];
    }
};

export const deleteProductionEntry = async (entryId: string): Promise<boolean> => {
    if (!entryId) {
        console.error('[Supabase] deleteProductionEntry: entryId không được cung cấp.');
        return false;
    }
    try {
        const { error, count } = await supabase
            .from('entries')
            .delete({ count: 'exact' })
            .eq('id', entryId);

        if (error) {
            console.error('[Supabase] Lỗi khi xóa sản lượng:', error);
            Alert.alert('Lỗi Xóa Sản Lượng', `Không thể xóa mục sản lượng: ${error.message}`);
            return false;
        }
        return count !== null && count > 0;
    } catch (e: any) {
        console.error('[Supabase] Exception khi xóa sản lượng:', e);
        Alert.alert(
            'Lỗi Hệ Thống',
            `Có lỗi không mong muốn xảy ra khi xóa sản lượng: ${e.message}`
        );
        return false;
    }
};

export const getSupplementaryDataByDate = async (
    userId: string,
    date: string
): Promise<DailySupplementaryData | null> => {
    if (!userId) {
        console.error('[Supabase] getSupplementaryDataByDate: userId không được cung cấp.');
        return null;
    }
    try {
        const { data, error } = await supabase
            .from('additional')
            .select(
                'date, leave, overtime, meeting, leave_verified, overtime_verified, meeting_verified'
            )
            .eq('user_id', userId)
            .eq('date', date)
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Lỗi khi lấy dữ liệu phụ trợ theo ngày:', error);
            return null;
        }
        if (data) {
            return {
                date: data.date,
                leaveHours: data.leave,
                overtimeHours: data.overtime,
                meetingMinutes: data.meeting,
                leaveVerified: data.leave_verified,
                overtimeVerified: data.overtime_verified,
                meetingVerified: data.meeting_verified,
            };
        }
        return null;
    } catch (e) {
        console.error('[Supabase] Exception khi lấy dữ liệu phụ trợ theo ngày:', e);
        return null;
    }
};

export const saveDailySupplementaryData = async (
    userId: string,
    entryToUpdate: DailySupplementaryData
): Promise<DailySupplementaryData | null> => {
    if (!userId) {
        console.error('[Supabase] saveDailySupplementaryData: userId không được cung cấp.');
        Alert.alert('Lỗi', 'Không thể xác định người dùng để lưu dữ liệu.');
        return null;
    }

    const { date, leaveHours, overtimeHours, meetingMinutes } = entryToUpdate;

    const shouldDelete =
        (leaveHours === null || leaveHours === undefined) &&
        (overtimeHours === null || overtimeHours === undefined) &&
        (meetingMinutes === null || meetingMinutes === undefined);

    if (shouldDelete) {
        try {
            const { error } = await supabase
                .from('additional')
                .delete()
                .match({ user_id: userId, date: date });

            if (error) {
                console.error('[Supabase] Lỗi khi xóa dòng dữ liệu phụ trợ rỗng:', error.message);
                Alert.alert('Lỗi Xóa Dữ Liệu', `Không thể xóa dòng dữ liệu rỗng: ${error.message}`);
                return entryToUpdate;
            }

            return {
                date: date,
                leaveHours: null,
                overtimeHours: null,
                meetingMinutes: null,
                leaveVerified: false,
                overtimeVerified: false,
                meetingVerified: false,
            };
        } catch (e: any) {
            console.error('[Supabase] Exception khi xóa dòng dữ liệu phụ trợ rỗng:', e.message);
            Alert.alert('Lỗi Hệ Thống', `Có lỗi không mong muốn xảy ra: ${e.message}`);
            return entryToUpdate;
        }
    } else {
        const dataToUpsert = {
            user_id: userId,
            date: date,
            leave: leaveHours === undefined ? null : leaveHours,
            overtime: overtimeHours === undefined ? null : overtimeHours,
            meeting: meetingMinutes === undefined ? null : meetingMinutes,
        };
        try {
            const { data, error } = await supabase
                .from('additional')
                .upsert(dataToUpsert, { onConflict: 'user_id, date' })
                .select(
                    'date, leave, overtime, meeting, leave_verified, overtime_verified, meeting_verified'
                )
                .single();

            if (error) {
                console.error('[Supabase] Lỗi khi upsert dữ liệu phụ trợ:', error.message);
                Alert.alert('Lỗi Lưu Trữ', `Không thể lưu dữ liệu phụ trợ: ${error.message}`);
                return null;
            }

            if (data) {
                return {
                    date: data.date,
                    leaveHours: data.leave,
                    overtimeHours: data.overtime,
                    meetingMinutes: data.meeting,
                    leaveVerified: data.leave_verified,
                    overtimeVerified: data.overtime_verified,
                    meetingVerified: data.meeting_verified,
                };
            }
            return null;
        } catch (e: any) {
            console.error('[Supabase] Exception khi upsert dữ liệu phụ trợ:', e.message);
            Alert.alert('Lỗi Hệ Thống', `Có lỗi không mong muốn xảy ra: ${e.message}`);
            return null;
        }
    }
};

export const getSupplementaryDataByDateRange = async (
    userId: string,
    startDate: string,
    endDate: string
): Promise<DailySupplementaryData[]> => {
    if (!userId) {
        console.error('[Supabase] getSupplementaryDataByDateRange: userId không được cung cấp.');
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('additional')
            .select(
                'date, leave, overtime, meeting, leave_verified, overtime_verified, meeting_verified'
            )
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });
        if (error) {
            console.error('[Supabase] Lỗi khi lấy dữ liệu phụ trợ theo khoảng ngày:', error);
            return [];
        }
        if (!data) {
            return [];
        }
        return data.map(item => ({
            date: item.date,
            leaveHours: item.leave,
            overtimeHours: item.overtime,
            meetingMinutes: item.meeting,
            leaveVerified: item.leave_verified,
            overtimeVerified: item.overtime_verified,
            meetingVerified: item.meeting_verified,
        }));
    } catch (e) {
        console.error('[Supabase] Exception khi lấy dữ liệu phụ trợ theo khoảng ngày:', e);
        return [];
    }
};

export const clearAllLocalData = async () => {
    try {
        console.log(
            'clearAllLocalData: Không có dữ liệu cục bộ (AsyncStorage) nào được chỉ định để xóa trong hàm này.'
        );
    } catch (e) {
        console.error('Lỗi khi xóa dữ liệu AsyncStorage:', e);
    }
};

export const updateProductionEntryById = async (
    entryId: string,
    entryData: Partial<
        Omit<
            ProductionEntry,
            | 'id'
            | 'user_id'
            | 'product_code'
            | 'date'
            | 'created_at'
            | 'verified'
            | 'quota_percentage'
        >
    >
): Promise<ProductionEntry | null> => {
    if (!entryId) {
        Alert.alert('Lỗi', 'Thiếu ID của mục sản lượng để cập nhật.');
        console.error('[Supabase] updateProductionEntryById: entryId không được cung cấp.');
        return null;
    }

    const dataToUpdate: typeof entryData = {};
    if (entryData.hasOwnProperty('quantity')) dataToUpdate.quantity = entryData.quantity;
    if (entryData.hasOwnProperty('po')) dataToUpdate.po = entryData.po;
    if (entryData.hasOwnProperty('box')) dataToUpdate.box = entryData.box;
    if (entryData.hasOwnProperty('batch')) dataToUpdate.batch = entryData.batch;

    if (Object.keys(dataToUpdate).length === 0) {
        Alert.alert('Thông báo', 'Không có thông tin nào để cập nhật.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('entries')
            .update(dataToUpdate)
            .eq('id', entryId)
            .select()
            .single();

        if (error) {
            console.error('[Supabase] Lỗi khi cập nhật sản lượng bằng ID:', error);
            Alert.alert('Lỗi Cập Nhật Sản Lượng', `Không thể cập nhật: ${error.message}`);
            return null;
        }
        return data as ProductionEntry;
    } catch (e: any) {
        console.error('[Supabase] Exception khi cập nhật sản lượng bằng ID:', e);
        Alert.alert('Lỗi Hệ Thống', `Lỗi không mong muốn khi cập nhật: ${e.message}`);
        return null;
    }
};

export const getStatisticsRPC = async (userId: string, date: Date): Promise<any | null> => {
    try {
        const dateString = formatToYYYYMMDD(date);
        const { data, error } = await supabase.rpc('get_user_monthly_stats', {
            user_id_param: userId,
            today_param: dateString
        });

        if (error) {
            console.error('[Supabase RPC] Lỗi khi gọi hàm get_user_monthly_stats:', error);
            Alert.alert("Lỗi máy chủ", "Không thể lấy dữ liệu thống kê từ máy chủ. " + error.message);
            return null;
        }
        return data;
    } catch (e: any) {
        console.error('[Supabase RPC] Exception khi gọi hàm thống kê:', e.message);
        Alert.alert("Lỗi ứng dụng", "Có lỗi xảy ra khi gọi hàm thống kê.");
        return null;
    }
};

export const getAllUserProfiles = async (): Promise<Profile[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, email, is_active, role, created_at')
            .neq('role', 'admin') // Chỉ lấy các profile không phải là 'admin'
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Supabase] Lỗi khi lấy danh sách profile người dùng:', error);
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('[Supabase] Exception khi lấy danh sách profile:', e);
        return [];
    }
};

export const updateUsersStatus = async (userIds: string[], isActive: boolean): Promise<boolean> => {
    if (!userIds || userIds.length === 0) return true;

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: isActive })
            .in('id', userIds);

        if (error) {
            console.error('[Supabase] Lỗi khi cập nhật trạng thái người dùng:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái người dùng. Vui lòng thử lại.');
            return false;
        }
        return true;
    } catch (e) {
        console.error('[Supabase] Exception khi cập nhật trạng thái người dùng:', e);
        Alert.alert('Lỗi hệ thống', 'Đã có lỗi không mong muốn xảy ra.');
        return false;
    }
}