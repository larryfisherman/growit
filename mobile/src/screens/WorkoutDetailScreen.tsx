import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../navigation/types';
import { apiFetch } from '../api/client';

type Props = NativeStackScreenProps<TodayStackParamList, 'WorkoutDetail'>;

type SetDetail = {
  id: string;
  weightKg: number;
  reps: number;
  orderIndex: number;
};

type WorkoutExerciseDetail = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: string;
  orderIndex: number;
  sets: SetDetail[];
};

type WorkoutDetail = {
  id: string;
  name: string;
  performedAt: string;
  notes: string | null;
  exercises: WorkoutExerciseDetail[];
};

function useWorkoutDetail(workoutId: string) {
  return useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => apiFetch<WorkoutDetail>(`/api/workouts/${workoutId}`),
  });
}

export default function WorkoutDetailScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const { data: workout, isLoading } = useWorkoutDetail(workoutId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.center}>
        <Text>Nie znaleziono treningu</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workout.exercises}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Brak ćwiczeń — dodaj pierwsze</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{item.exerciseName}</Text>
            <Text style={styles.category}>{item.category}</Text>
            {item.sets.length > 0 && (
              <View style={styles.sets}>
                {item.sets.map((set, i) => (
                  <Text key={set.id} style={styles.set}>
                    Seria {i + 1}: {set.weightKg} kg × {set.reps}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AddExerciseToWorkout', { workoutId })}
      >
        <Text style={styles.buttonText}>+ Dodaj ćwiczenie</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
  },
  exerciseCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  sets: {
    marginTop: 8,
    gap: 2,
  },
  set: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
