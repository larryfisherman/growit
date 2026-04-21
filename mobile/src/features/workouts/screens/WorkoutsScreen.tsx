import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../../../navigation/types';
import { useTodayWorkout } from '../hooks/useTodayWorkout';
import { useCreateWorkout } from '../hooks/useCreateWorkout';

export const WorkoutsScreen = () => {
  const { data: workout, isLoading } = useTodayWorkout();
  const { mutate: createWorkout, isPending } = useCreateWorkout();
  const navigation = useNavigation<NativeStackNavigationProp<TodayStackParamList>>();

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 p-6">
      <Text className="text-xl font-semibold mb-6 capitalize">{today}</Text>

      {workout ? (
        <TouchableOpacity
          className="bg-gray-100 rounded-xl p-5"
          onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
        >
          <Text className="text-lg font-semibold">{workout.name}</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {workout.exerciseCount === 0
              ? 'Brak ćwiczeń'
              : `${workout.exerciseCount} ćwiczenie${workout.exerciseCount > 1 ? 'ń' : ''}`}
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="gap-3">
          <TouchableOpacity
            className="bg-black rounded-xl py-4 items-center"
            onPress={() => navigation.navigate('StartFromTemplate')}
          >
            <Text className="text-white text-base font-semibold">Rozpocznij z szablonu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-100 rounded-xl py-4 items-center"
            onPress={() => createWorkout()}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-base font-semibold">Rozpocznij pusty trening</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
