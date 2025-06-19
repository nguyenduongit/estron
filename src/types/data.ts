// src/types/data.ts
export interface Quota {
  id: string;
  stageCode: string;
  dailyQuota: number;
  order: number;
}

export interface ProductionEntry {
  id: string; // UUID, duy nhất cho mỗi lần nhập (từ Supabase)
  user_id?: string | null;
  product_code: string; // Mã công đoạn/sản phẩm, tham chiếu đến QuotaSetting.product_code
  date: string; // Định dạng yyyy-MM-DD
  po?: string | null; // Đổi thành string | null theo schema mới
  quantity?: number | null;
  quota_percentage?: number | null;  // Mặc định là 100 trên DB
  box?: string | null; // Đổi thành string | null theo schema mới
  batch?: string | null; // Đổi thành string | null theo schema mới
  created_at?: string;
  verified?: boolean | null;
}

export interface DailyProductionData {
  date: string;
  dayOfWeek: string;
  formattedDate: string;
  entries: Array<{
    id: string;
    stageCode: string; // product_code từ ProductionEntry
    quantity: number;
    workAmount?: number;
    po?: string | null;
    box?: string | null;
    batch?: string | null;
    verified?: boolean | null; // <<< THÊM DÒNG NÀY
    quota_percentage?: number | null;
  }>;
  totalWorkForDay?: number;
  supplementaryData?: DailySupplementaryData | null;
}

export interface DailySupplementaryData {
  date: string; //
  leaveHours?: number | null; //
  overtimeHours?: number | null; //
  meetingMinutes?: number | null; //
   leaveVerified: boolean;
  overtimeVerified: boolean;
  meetingVerified: boolean;
}

export interface QuotaSetting {
  product_code: string; // PK
  product_name: string;
  level_0_9?: number | null;
  level_1_0?: number | null;
  level_1_1?: number | null;
  level_2_0?: number | null;
  level_2_1?: number | null;
  level_2_2?: number | null;
  level_2_5?: number | null;
  created_at?: string;
}

export interface UserSelectedQuota {
  user_id: string; // PK
  product_code: string; // PK
  zindex: number;
  created_at?: string;
}

export interface Profile {
  id: string;
  email?: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  salary_level?: string | null;
  role?: string | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;
}