import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { TemplateExerciseResponse } from '../../../api/generated/schemas';
import { useTemplateExerciseUpdate } from '../hooks/useTemplateExerciseUpdate';
import { Input } from '../../../theme/components/Input';
import { tokens } from '../../../theme/tokens';

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
    if (unchanged) return;

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
    <View style={{ width: 88, justifyContent: 'center', paddingLeft: tokens.space[2] }}>
      <RectButton
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
        style={{
          backgroundColor: tokens.color.danger,
          borderRadius: tokens.radius.md,
          paddingVertical: tokens.space[4],
          alignItems: 'center',
        }}
      >
        <Text style={{ color: tokens.color.fg, fontFamily: tokens.font.sansBold, fontSize: 13, letterSpacing: 1.8, textTransform: 'uppercase' }}>
          Usuń
        </Text>
      </RectButton>
    </View>
  );

  if (isEditing) {
    return (
      <View className="bg-surface rounded-md p-4 gap-3 border border-line">
        <Pressable onPress={() => setIsEditing(false)}>
          <Text className="text-fg font-sans-sb text-body-lg">{exercise.exerciseName}</Text>
        </Pressable>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              label="Serie"
              value={targets.sets}
              onChangeText={(t) => setTarget('sets', t)}
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <Input
              label="Powt."
              value={targets.reps}
              onChangeText={(t) => setTarget('reps', t)}
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <Input
              label="Przerwa"
              value={targets.rest}
              onChangeText={(t) => setTarget('rest', t)}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable onPress={openEdit} className="bg-surface rounded-md p-4 border border-line">
        <Text className="text-fg font-sans-sb text-body-lg">{exercise.exerciseName}</Text>
        <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
          {exercise.targetSets} × {exercise.targetReps} · {exercise.restSeconds}s
        </Text>
      </Pressable>
    </Swipeable>
  );
};
