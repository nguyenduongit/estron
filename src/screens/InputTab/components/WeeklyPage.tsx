// src/screens/InputTab/components/WeeklyPage.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../theme'; 
import { DailyProductionData, ProductionEntry } from '../../../types/data'; 
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
  onEditEntry: (entry: ProductionEntry) => void;
}

const WeeklyPage: React.FC<WeeklyPageProps> = ({ userId, weekData, quotasExist, onAddProduction, onEditEntry }) => {
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
          <View style={styles.totalWeeklyWorkContainer}>
            <Text style={styles.totalWeeklyWorkLabel}>Tổng công tuần: </Text>
            <Text style={styles.totalWeeklyWorkValue}>
              {weekData.totalWeeklyWork != null ? weekData.totalWeeklyWork.toLocaleString() : '0'}
            </Text>
          </View>
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing['level-2'],
          paddingBottom: theme.spacing['level-8'],
        }}
      >
        {weekData.dailyData
          .slice()
          .reverse()
          .map(day => (
            <DailyCard
              userId={userId}
              key={day.date}
              dailyInfo={day}
              weekHasData={quotasExist}
              onAddProduction={onAddProduction}
              onEditEntry={onEditEntry}
            />
          ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageStyle: {
    flex: 1,
    paddingHorizontal: theme.spacing['level-2'],
  },
  weekHeader: {
    paddingVertical: theme.spacing['level-4'],
    paddingHorizontal: theme.spacing['level-2'],
    marginHorizontal: -theme.spacing['level-2'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background1, 
  },
  weekName: {
    fontSize: theme.typography.fontSize['level-4'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.primary, 
  },
  weekDateRange: {
    fontSize: theme.typography.fontSize['level-2'],
    color: theme.colors.textSecondary, 
  },
  totalWeeklyWorkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalWeeklyWorkLabel: {
    fontSize: theme.typography.fontSize['level-3'],
    color: theme.colors.text,
  },
  totalWeeklyWorkValue: {
    fontSize: theme.typography.fontSize['level-3'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.success, 
  },
});

export default WeeklyPage;
