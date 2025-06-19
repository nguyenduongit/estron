// src/stores/settingsStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  showSunday: boolean;
  toggleShowSunday: () => void;
  initializeSettings: (initialState: Partial<SettingsState>) => void;
}

// Xóa bỏ persist middleware và cấu trúc lại store
export const useSettingsStore = create<SettingsState>((set) => ({
  showSunday: false, // Mặc định là ẩn ngày Chủ Nhật
  toggleShowSunday: () => set((state) => ({ showSunday: !state.showSunday })),
  initializeSettings: (initialState) => set(initialState),
}));