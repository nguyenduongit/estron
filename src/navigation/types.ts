// navigation/types.ts
export type AuthStackParamList = {
  SignIn: undefined; // Màn hình SignIn không nhận tham số
  SignUp: undefined; // Màn hình SignUp không nhận tham số
  // Thêm các màn hình khác của Auth stack nếu có
};

// Định nghĩa các params cho từng màn hình trong Stack Nhập liệu
// 'Settings' đã được chuyển sang MenuStack
export type InputStackNavigatorParamList = {
  ProductList: undefined; // Màn hình Product (đổi tên từ ProductScreen để rõ ràng hơn)
  InputDetails: { date?: string; entryId?: string }; // Màn hình Input
};

// Định nghĩa các params cho từng màn hình trong Stack Menu
export type MenuStackNavigatorParamList = {
  Menu: undefined;
  Setting: undefined;
  LookupNorms: undefined;
  LookupErrors: undefined;
  GeneralSettings: undefined;
};

// Định nghĩa các params cho từng Tab
export type BottomTabNavigatorParamList = {
  InputTab: undefined; // Tab Nhập liệu (sẽ chứa InputStackNavigator)
  StatisticsTab: undefined; // Tab Thống kê
  MenuTab: undefined; // Tab Menu (chứa MenuStackNavigator)
};