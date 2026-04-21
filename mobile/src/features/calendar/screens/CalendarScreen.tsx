import { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorkoutsByMonth } from '../hooks/useWorkoutsByMonth';
import { CalendarStackParamList } from '../../../navigation/types';
import { WorkoutSummary } from '../../../api/types';

type NavProp = NativeStackNavigationProp<CalendarStackParamList, 'CalendarHome'>;

const getInitial = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const DOT_COLOR = '#2563eb';

export const CalendarScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [{ year, month }, setMonth] = useState(getInitial);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: workouts } = useWorkoutsByMonth(year, month);

  const markedDates = useMemo(() => {
    const acc: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {};
    workouts?.forEach((w) => {
      acc[w.performedAt] = { marked: true, dotColor: DOT_COLOR };
    });
    if (selectedDate) {
      acc[selectedDate] = { ...(acc[selectedDate] ?? {}), selected: true, selectedColor: DOT_COLOR };
    }
    return acc;
  }, [workouts, selectedDate]);

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

  const renderItem = ({ item }: { item: WorkoutSummary }) => (
    <Pressable
      onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
      className="border-b border-gray-200 px-4 py-3"
    >
      <Text className="text-xs text-gray-500">{item.performedAt}</Text>
      <Text className="text-base font-medium text-gray-900">{item.name}</Text>
      <Text className="text-sm text-gray-500">{item.exerciseCount} ćwiczeń</Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={visibleWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <Calendar
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            markedDates={markedDates}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center p-6">
            <Text className="text-gray-500">
              {selectedDate ? 'Brak treningu w tym dniu' : 'Brak treningów w tym miesiącu'}
            </Text>
          </View>
        }
      />
    </View>
  );
};
