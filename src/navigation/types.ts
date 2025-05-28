    // navigation/types.ts
    import { Quota } from "../types/data"; // Đảm bảo đường dẫn đúng

    export type AuthStackParamList = {
      SignIn: undefined; // Màn hình SignIn không nhận tham số
      SignUp: undefined; // Màn hình SignUp không nhận tham số
      // Thêm các màn hình khác của Auth stack nếu có
    };

    // Định nghĩa các params cho từng màn hình trong Stack Nhập liệu
    export type InputStackNavigatorParamList = {
      ProductList: undefined; // Màn hình Product (đổi tên từ ProductScreen để rõ ràng hơn)
      InputDetails: { stageCode: string; quotaValue: number; date?: string }; // Màn hình Input
      Settings: undefined; // Màn hình Setting
    };

    // Định nghĩa các params cho từng Tab
    export type BottomTabNavigatorParamList = {
      InputTab: undefined; // Tab Nhập liệu (sẽ chứa InputStackNavigator)
      StatisticsTab: undefined; // Tab Thống kê
    };

    // Bạn có thể cần import StackScreenProps, BottomTabScreenProps từ @react-navigation
    // import type { StackScreenProps } from '@react-navigation/stack';
    // import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

    // Ví dụ sử dụng:
    // type ProductListScreenProps = StackScreenProps<InputStackNavigatorParamList, 'ProductList'>;
    // type InputDetailsScreenProps = StackScreenProps<InputStackNavigatorParamList, 'InputDetails'>;
    