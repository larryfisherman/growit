import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGetApiWorkoutsUserIdByMonth } from '../../../api/generated/workouts/workouts';
import { CalendarStackParamList } from '../../../navigation/types';
import { WorkoutSummaryResponse } from '../../../api/generated/schemas';
import { useTheme } from '../../../theme/useTheme';
import { tokens } from '../../../theme/tokens';

const USER_ID = '00000000-0000-0000-0000-000000000001';

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

  const { data: workouts } = useGetApiWorkoutsUserIdByMonth(USER_ID, { year, month });

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

  const renderItem = ({ item }: { item: WorkoutSummaryResponse }) => (
    <Pressable
      onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
      className="px-4 py-3"
      style={{ borderBottomColor: colors.line, borderBottomWidth: 1 }}
    >
      <Text className="text-xs" style={{ color: colors.muted }}>
        {item.performedAt}
      </Text>
      <Text className="text-base font-medium" style={{ color: colors.fg }}>
        {item.name}
      </Text>
      <Text className="text-sm" style={{ color: colors.muted }}>
        {item.exerciseCount} ćwiczeń
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={visibleWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <Calendar
            key={mode}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            markedDates={markedDates}
            theme={calendarTheme}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center p-6">
            <Text style={{ color: colors.muted }}>
              {selectedDate ? 'Brak treningu w tym dniu' : 'Brak treningów w tym miesiącu'}
            </Text>
          </View>
        }
      />
    </View>
  );
};
