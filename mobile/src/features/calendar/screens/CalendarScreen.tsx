import { useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGetApiWorkoutsByMonth } from '../../../api/generated/workouts/workouts';
import { CalendarStackParamList } from '../../../navigation/types';
import { WorkoutSummaryResponse } from '../../../api/generated/schemas';
import { useTheme } from '../../../theme/useTheme';
import { tokens } from '../../../theme/tokens';
import { WorkoutSummaryCard } from '../../workouts/components/WorkoutSummaryCard';

const CardGap = () => <View className="h-2" />;

type NavProp = NativeStackNavigationProp<CalendarStackParamList, 'CalendarHome'>;

const getInitial = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

export const CalendarScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { mode, colors } = useTheme();
  const [{ year, month }, setMonth] = useState(getInitial);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: workouts } = useGetApiWorkoutsByMonth({ year, month });

  const markedDates = useMemo(() => {
    const acc: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {};
    workouts?.forEach((w) => {
      acc[w.performedAt] = { marked: true, dotColor: colors.lime };
    });
    if (selectedDate) {
      acc[selectedDate] = { ...(acc[selectedDate] ?? {}), selected: true, selectedColor: colors.lime };
    }
    return acc;
  }, [workouts, selectedDate, colors.lime]);

  const calendarTheme = useMemo(
    () => ({
      calendarBackground: colors.bg,
      backgroundColor: colors.bg,
      monthTextColor: colors.fg,
      textSectionTitleColor: colors.muted,
      dayTextColor: colors.fg,
      textDisabledColor: colors.dim,
      todayTextColor: colors.lime,
      selectedDayBackgroundColor: colors.lime,
      selectedDayTextColor: colors.limeInk,
      dotColor: colors.lime,
      selectedDotColor: colors.limeInk,
      arrowColor: colors.fg,
      textDayFontFamily: tokens.font.sansMedium,
      textMonthFontFamily: tokens.font.sansSemi,
      textDayHeaderFontFamily: tokens.font.monoMedium,
    }),
    [colors],
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate((prev) => (prev === day.dateString ? null : day.dateString));
  };

  const handleMonthChange = (m: DateData) => {
    setMonth({ year: m.year, month: m.month });
    setSelectedDate(null);
  };

  const visibleWorkouts = useMemo(() => {
    if (!workouts) return [];
    if (!selectedDate) return workouts;
    return workouts.filter((w) => w.performedAt === selectedDate);
  }, [workouts, selectedDate]);

  // Same card as the last workout on the today screen. Colours come from the theme's
  // token classes; the Calendar widget itself takes plain values, hence useTheme above.
  const renderItem = ({ item }: { item: WorkoutSummaryResponse }) => (
    <View className="px-4">
      <WorkoutSummaryCard
        workout={item}
        onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={visibleWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerClassName="pb-10"
        ItemSeparatorComponent={CardGap}
        ListHeaderComponent={
          <View className="mb-4">
            <Calendar
              key={mode}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              markedDates={markedDates}
              theme={calendarTheme}
            />
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center p-6">
            <Text className="text-muted font-sans-md text-body-sm">
              {selectedDate ? 'Brak treningu w tym dniu' : 'Brak treningów w tym miesiącu'}
            </Text>
          </View>
        }
      />
    </View>
  );
};
