import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../navigation/types';
import { apiFetch } from '../api/client';

type Props = NativeStackScreenProps<TodayStackParamList, 'AddExerciseToWorkout'>;

type Exercise = {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
};

function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: () => apiFetch<Exercise[]>('/api/exercises'),
  });
}

export default function AddExerciseToWorkoutScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const { data: exercises, isLoading } = useExercises();
  const queryClient = useQueryClient();

  const { mutate: addExercise, isPending } = useMutation({
    mutationFn: (exerciseId: string) =>
      apiFetch(`/api/workouts/${workoutId}/exercises`, {
        method: 'POST',
        body: JSON.stringify({ exerciseId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
      navigation.goBack();
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={exercises}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => addExercise(item.id)}
          disabled={isPending}
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    gap: 8,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
