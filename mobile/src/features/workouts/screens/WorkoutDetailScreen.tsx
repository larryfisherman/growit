import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../../../navigation/types';
import { useWorkoutDetail } from '../hooks/useWorkoutDetail';
import { WorkoutExerciseDetail } from '../../../api/types';

type Props = NativeStackScreenProps<TodayStackParamList, 'WorkoutDetail'>;

const ExerciseCard = ({ item }: { item: WorkoutExerciseDetail }) => (
  <View className="bg-gray-100 rounded-xl p-4">
    <Text className="text-base font-semibold">{item.exerciseName}</Text>
    {item.category && <Text className="text-sm text-gray-500 mt-0.5">{item.category}</Text>}
    {item.targetSets != null && item.targetReps != null && (
      <Text className="text-sm text-gray-600 mt-1">
        Cel: {item.targetSets} × {item.targetReps}
        {item.restSeconds != null ? ` · przerwa ${item.restSeconds}s` : ''}
      </Text>
    )}
    {item.sets.length > 0 && (
      <View className="mt-2 gap-0.5">
        {item.sets.map((set, i) => (
          <Text key={set.id} className="text-sm text-gray-700">
            Seria {i + 1}: {set.weightKg} kg × {set.reps}
          </Text>
        ))}
      </View>
    )}
  </View>
);

export const WorkoutDetailScreen = ({ route, navigation }: Props) => {
  const { workoutId } = route.params;
  const { data: workout, isLoading } = useWorkoutDetail(workoutId);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!workout) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Nie znaleziono treningu</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={workout.exercises}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-10">Brak ćwiczeń — dodaj pierwsze</Text>
        }
        renderItem={({ item }) => <ExerciseCard item={item} />}
        contentContainerClassName="p-4 gap-3 pb-28"
      />
      <TouchableOpacity
        className="absolute bottom-8 left-4 right-4 bg-black rounded-xl py-4 items-center"
        onPress={() => navigation.navigate('AddExerciseToWorkout', { workoutId })}
      >
        <Text className="text-white text-base font-semibold">+ Dodaj ćwiczenie</Text>
      </TouchableOpacity>
    </View>
  );
};
