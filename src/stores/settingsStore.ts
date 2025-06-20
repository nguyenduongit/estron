// src/stores/settingsStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'app-settings-storage';

interface SettingsState {
  showSunday: boolean;
  isHydrated: boolean; // Dùng để biết cài đặt đã được tải từ bộ nhớ hay chưa
  toggleShowSunday: () => Promise<void>;
  hydrateSettings: () => Promise<void>; // Hàm để tải cài đặt khi ứng dụng khởi động
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  showSunday: false, // Giá trị mặc định ban đầu
  isHydrated: false, // Ban đầu, cài đặt chưa được tải

  toggleShowSunday: async () => {
    const newState = !get().showSunday;
    set({ showSunday: newState });
    try {
      const settingsToSave = JSON.stringify({ showSunday: newState });
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, settingsToSave);
    } catch (e) {
      console.error("Lỗi khi lưu cài đặt 'showSunday':", e);
    }
  },

  hydrateSettings: async () => {
    try {
      const settingsString = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsString) {
        const storedSettings = JSON.parse(settingsString);
        if (storedSettings.showSunday !== undefined) {
          set({ showSunday: storedSettings.showSunday });
        }
      }
    } catch (e) {
      console.error("Lỗi khi tải cài đặt từ AsyncStorage:", e);
    } finally {
      // Đánh dấu là đã tải xong, dù thành công hay thất bại
      set({ isHydrated: true });
    }
  },
}));