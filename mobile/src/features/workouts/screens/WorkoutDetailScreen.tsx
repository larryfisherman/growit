import { useLayoutEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TodayStackParamList } from '../../../navigation/types';
import {
  useDeleteApiWorkoutsExercisesWorkoutExerciseId,
  useDeleteApiWorkoutsWorkoutId,
  useGetApiWorkoutsWorkoutId,
} from '../../../api/generated/workouts/workouts';
import { LastPerformanceResponse, WorkoutExerciseResponse } from '../../../api/generated/schemas';
import { SetLogger } from '../components/SetLogger';
import { SetRow } from '../components/SetRow';
import { Button } from '../../../theme/components/Button';
import { ScreenState, screenStateOf } from '../../../theme/components/ScreenState';
import { formatDayMonth } from '../../../lib/date';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<TodayStackParamList, 'WorkoutDetail'>;

/// What was lifted last time, so the number to match is on screen while logging.
const LastTime = ({ last }: { last: NonNullable<LastPerformanceResponse> }) => (
  <Text className="text-muted font-sans-md text-body-sm mt-2">
    Ostatnio ({formatDayMonth(last.performedAt)}):{' '}
    <Text className="text-fg font-mono-md">
      {last.sets.map((set) => `${set.weightKg}×${set.reps}`).join(' · ')}
    </Text>
  </Text>
);

const ExerciseCard = ({
  item,
  onRemove,
}: {
  item: WorkoutExerciseResponse;
  onRemove: () => void;
}) => (
  <View className="bg-surface rounded-md p-4 border border-line">
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <Text className="text-fg font-sans-sb text-body-lg">{item.exerciseName}</Text>
        {item.category && (
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
            {item.category}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Usuń ${item.exerciseName} z treningu`}
      >
        <Ionicons name="trash-outline" size={18} color={tokens.color.muted} />
      </Pressable>
    </View>
    {item.targetSets != null && item.targetReps != null && (
      <Text className="text-muted font-sans-md text-body-sm mt-2">
        Cel: {item.targetSets} × {item.targetReps}
        {item.restSeconds != null ? ` · przerwa ${item.restSeconds}s` : ''}
      </Text>
    )}
    {item.lastPerformance && item.lastPerformance.sets.length > 0 && (
      <LastTime last={item.lastPerformance} />
    )}
    {item.sets.length > 0 && (
      <View className="mt-3 gap-1 pt-3 border-t border-line">
        {item.sets.map((set, i) => (
          <SetRow key={set.id} set={set} position={i + 1} />
        ))}
      </View>
    )}
    <SetLogger exercise={item} />
  </View>
);

export const WorkoutDetailScreen = ({ route, navigation }: Props) => {
  const { workoutId } = route.params;
  const workoutQuery = useGetApiWorkoutsWorkoutId(workoutId);
  const workout = workoutQuery.data;
  const screenState = screenStateOf(workoutQuery);

  const { mutate: deleteWorkout } = useDeleteApiWorkoutsWorkoutId();
  const { mutate: removeExercise } = useDeleteApiWorkoutsExercisesWorkoutExerciseId();

  useLayoutEffect(() => {
    if (!workout) return;

    const confirmDelete = () =>
      Alert.alert('Usunąć trening?', `„${workout.name}" zniknie razem ze wszystkimi seriami.`, [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            deleteWorkout({ workoutId });
            navigation.goBack();
          },
        },
      ]);

    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={confirmDelete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Usuń trening"
          className="w-9 h-9 rounded-pill border border-line-strong items-center justify-center"
        >
          <Ionicons name="trash-outline" size={18} color={tokens.color.danger} />
        </Pressable>
      ),
    });
  }, [navigation, workout, workoutId, deleteWorkout]);

  const confirmRemoveExercise = (exercise: WorkoutExerciseResponse) => {
    if (exercise.sets.length === 0) {
      removeExercise({ workoutExerciseId: exercise.id });
      return;
    }

    Alert.alert(
      'Usunąć ćwiczenie?',
      `„${exercise.exerciseName}" zniknie z treningu razem z zapisanymi seriami (${exercise.sets.length}).`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => removeExercise({ workoutExerciseId: exercise.id }),
        },
      ],
    );
  };

  if (screenState) return <ScreenState kind={screenState} />;

  if (!workout) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-muted font-mono-md text-label tracking-label uppercase">
          [ NIE ZNALEZIONO ]
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={workout.exercises}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <Text className="text-muted font-mono-md text-label tracking-label uppercase">
              [ BRAK ĆWICZEŃ ]
            </Text>
            <Text className="text-fg font-sans-md text-body mt-3">Dodaj pierwsze poniżej.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExerciseCard item={item} onRemove={() => confirmRemoveExercise(item)} />
        )}
        contentContainerClassName="p-4 gap-3 pb-28"
        // Logging and correcting sets both tap a button with the keyboard up; without this
        // the first tap only closes the keyboard.
        keyboardShouldPersistTaps="handled"
      />
      <View className="absolute bottom-6 left-4 right-4">
        <Button
          label="+ Dodaj ćwiczenie"
          variant="primary"
          onPress={() => navigation.navigate('AddExerciseToWorkout', { workoutId })}
        />
      </View>
    </View>
  );
};
