import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { TemplateExerciseResponse } from '../../../api/generated/schemas';
import { useTemplateExerciseUpdate } from '../hooks/useTemplateExerciseUpdate';

type Props = {
  exercise: TemplateExerciseResponse;
  templateId: string;
  onDelete: () => void;
};

const SAVE_DELAY_MS = 600;

export const ExerciseRow = ({ exercise, templateId, onDelete }: Props) => {
  const swipeRef = useRef<Swipeable>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: update } = useTemplateExerciseUpdate(templateId);

  const [isEditing, setIsEditing] = useState(false);
  const [targets, setTargets] = useState({
    sets: String(exercise.targetSets),
    reps: String(exercise.targetReps),
    rest: String(exercise.restSeconds),
  });

  useEffect(() => {
    if (!isEditing) return;

    const targetSets = parseInt(targets.sets, 10);
    const targetReps = parseInt(targets.reps, 10);
    const restSeconds = parseInt(targets.rest, 10);
    if (!targetSets || !targetReps || isNaN(restSeconds)) return;

    const unchanged =
      targetSets === exercise.targetSets &&
      targetReps === exercise.targetReps &&
      restSeconds === exercise.restSeconds;
    if (unchanged) { return };

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      update({
        templateExerciseId: exercise.id,
        data: { targetSets, targetReps, restSeconds, orderIndex: exercise.orderIndex },
      });
    }, SAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [targets, isEditing, exercise, update]);

  const openEdit = () => {
    setTargets({
      sets: String(exercise.targetSets),
      reps: String(exercise.targetReps),
      rest: String(exercise.restSeconds),
    });
    setIsEditing(true);
  };

  const setTarget = (key: 'sets' | 'reps' | 'rest', value: string) =>
    setTargets((prev) => ({ ...prev, [key]: value }));

  const renderRightActions = () => (
    <View style={{ width: 80, justifyContent: 'center', paddingLeft: 8 }}>
      <RectButton
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
        style={{
          backgroundColor: '#ef4444',
          borderRadius: 8,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Usuń</Text>
      </RectButton>
    </View>
  );

  if (isEditing) {
    return (
      <View className="bg-gray-50 rounded-lg p-3 gap-3">
        <Pressable onPress={() => setIsEditing(false)}>
          <Text className="text-base font-medium">{exercise.exerciseName}</Text>
        </Pressable>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Serie</Text>
            <TextInput
              value={targets.sets}
              onChangeText={(t) => setTarget('sets', t)}
              keyboardType="number-pad"
              className="border border-gray-300 rounded-md px-2 py-1.5 text-base bg-white"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Powtórzenia</Text>
            <TextInput
              value={targets.reps}
              onChangeText={(t) => setTarget('reps', t)}
              keyboardType="number-pad"
              className="border border-gray-300 rounded-md px-2 py-1.5 text-base bg-white"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Przerwa (s)</Text>
            <TextInput
              value={targets.rest}
              onChangeText={(t) => setTarget('rest', t)}
              keyboardType="number-pad"
              className="border border-gray-300 rounded-md px-2 py-1.5 text-base bg-white"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable onPress={openEdit} className="bg-gray-50 rounded-lg p-3">
        <Text className="text-base font-medium">{exercise.exerciseName}</Text>
        <Text className="text-sm text-gray-500">
          {exercise.targetSets} × {exercise.targetReps} · przerwa {exercise.restSeconds}s
        </Text>
      </Pressable>
    </Swipeable>
  );
};
