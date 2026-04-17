import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../navigation/types';
import { apiFetch } from '../api/client';

const USER_ID = '00000000-0000-0000-0000-000000000001';

type TodayWorkout = {
  id: string;
  name: string;
  performedAt: string;
  exerciseCount: number;
};

function useTodayWorkout() {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['workout', 'by-date', today],
    queryFn: () => apiFetch<TodayWorkout | null>(`/api/workouts/${USER_ID}/by-date?date=${today}`),
  });
}

function useCreateWorkout() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  return useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>('/api/workouts', {
        method: 'POST',
        body: JSON.stringify({
          userId: USER_ID,
          name: `Trening ${new Date().toLocaleDateString('pl-PL')}`,
          performedAt: today,
          notes: null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', 'by-date', today] });
    },
  });
}

export default function WorkoutsScreen() {
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
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{today}</Text>

      {workout ? (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('WorkoutDetail', { workoutId: workout.id })}
        >
          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={styles.meta}>
            {workout.exerciseCount === 0
              ? 'Brak ćwiczeń'
              : `${workout.exerciseCount} ćwiczenie${workout.exerciseCount > 1 ? 'ń' : ''}`}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => createWorkout()}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Rozpocznij trening</Text>
          )}
        </TouchableOpacity>
      )}
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
    padding: 24,
  },
  date: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
  },
  meta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  button: {
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
