// src/screens/InputTab/components/WeeklyPage.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../theme';
import { DailyProductionData } from '../../../types/data';
import { EstronWeekPeriod, formatDate } from '../../../utils/dateUtils';
import DailyCard from './DailyCard';

interface ProcessedWeekData {
  weekInfo: EstronWeekPeriod;
  dailyData: DailyProductionData[];
  totalWeeklyWork: number;
}

interface WeeklyPageProps {
  userId: string;
  weekData: ProcessedWeekData;
  quotasExist: boolean;
  onAddProduction: (date: string) => void;
}

const WeeklyPage: React.FC<WeeklyPageProps> = ({
  userId,
  weekData,
  quotasExist,
  onAddProduction,
}) => {
  return (
    <View style={styles.pageStyle}>
      <View style={styles.weekHeader}>
        <View>
          <Text style={styles.weekName}>{weekData.weekInfo.name}</Text>
          <Text style={styles.weekDateRange}>
            ({formatDate(weekData.weekInfo.startDate, 'dd/MM')} - {formatDate(weekData.weekInfo.endDate, 'dd/MM')})
          </Text>
        </View>
        {quotasExist && (
          <Text style={styles.totalWeeklyWorkText}>
            Tổng công tuần: {weekData.totalWeeklyWork != null ? weekData.totalWeeklyWork.toLocaleString() : '0'}
          </Text>
        )}
      </View>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={{ flex: 1 }} 
        contentContainerStyle={{ 
          paddingHorizontal: theme.spacing['level-2'], // sm -> level-2
          paddingBottom: theme.spacing['level-8'] // Thêm padding bottom cho scrollview để nội dung không bị che khuất bởi tabbar/UI khác
        }}
      >
        {weekData.dailyData.map(day => (
          <DailyCard
            userId={userId}
            key={day.date}
            dailyInfo={day}
            weekHasData={quotasExist}
            onAddProduction={onAddProduction}
          />
        ))}
        {/* View đệm cũ height: 80 có thể được thay bằng paddingBottom cho contentContainerStyle */}
        {/* <View style={{ height: 80 }} /> */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageStyle: {
    flex: 1,
    paddingHorizontal: theme.spacing['level-2'], // sm -> level-2
    // backgroundColor: theme.colors.background2 // Nền chính của page nếu muốn tách biệt với ProductScreen (thường là không cần nếu ProductScreen đã có nền)
  },
  weekHeader: {
    paddingVertical: theme.spacing['level-4'], // md -> level-4
    paddingHorizontal: theme.spacing['level-2'], // sm -> level-2
    marginHorizontal: -theme.spacing['level-2'], // sm -> level-2 (để full-width border)
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor, // Giữ nguyên
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background1, // lightGrey -> background1
  },
  weekName: {
    fontSize: theme.typography['level-6'].fontSize, // h3.fontSize -> level-6
    fontWeight: theme.typography['level-6-bold'].fontWeight, // h3.fontWeight -> level-6-bold
    color: theme.colors.primary, // Giữ nguyên
  },
  weekDateRange: {
    fontSize: theme.typography['level-2'].fontSize, // caption.fontSize -> level-2
    color: theme.colors.textSecondary, // Giữ nguyên
  },
  totalWeeklyWorkText: {
    fontSize: theme.typography['level-4'].fontSize, // body.fontSize -> level-4
    fontWeight: theme.typography['level-4-bold'].fontWeight, // 'bold' -> level-4-bold
    color: theme.colors.success, // Giữ nguyên
  },
});

export default WeeklyPage;