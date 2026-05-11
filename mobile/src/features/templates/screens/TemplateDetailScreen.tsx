import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TemplatesStackParamList } from '../../../navigation/types';
import {
  useGetApiTemplatesTemplateId,
  usePostApiTemplates,
  usePutApiTemplatesTemplateId,
  useDeleteApiTemplatesExercisesTemplateExerciseId,
  usePutApiTemplatesExercisesTemplateExerciseId,
  getGetApiTemplatesTemplateIdQueryKey,
  getGetApiTemplatesQueryKey,
} from '../../../api/generated/templates/templates';
import { TemplateExerciseResponse, TemplateResponse } from '../../../api/generated/schemas';

const USER_ID = '00000000-0000-0000-0000-000000000001';

type NavProp = NativeStackNavigationProp<TemplatesStackParamList, 'TemplateDetail'>;
type RouteParams = RouteProp<TemplatesStackParamList, 'TemplateDetail'>;

type ExerciseRowProps = {
  exercise: TemplateExerciseResponse;
  templateId: string;
  onDelete: () => void;
};

const ExerciseRow = ({ exercise, templateId, onDelete }: ExerciseRowProps) => {
  const swipeRef = useRef<Swipeable>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const templateKey = getGetApiTemplatesTemplateIdQueryKey(templateId);

  const { mutate: update } = usePutApiTemplatesExercisesTemplateExerciseId({
    mutation: {
      onMutate: async ({ templateExerciseId, data }) => {
        await queryClient.cancelQueries({ queryKey: templateKey });
        const previous = queryClient.getQueryData<TemplateResponse>(templateKey);
        // podmieniamy pola targetu dla tego jednego ćwiczenia w cache
        queryClient.setQueryData<TemplateResponse>(templateKey, (old) =>
          old
            ? {
                ...old,
                exercises: old.exercises.map((e) =>
                  e.id === templateExerciseId
                    ? {
                        ...e,
                        targetSets: data.targetSets,
                        targetReps: data.targetReps,
                        restSeconds: data.restSeconds,
                        orderIndex: data.orderIndex,
                      }
                    : e
                ),
              }
            : old
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) queryClient.setQueryData(templateKey, context.previous);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: templateKey }),
    },
  });

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
        data: {
          targetSets,
          targetReps,
          restSeconds,
          orderIndex: exercise.orderIndex,
        },
      });
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [targets, isEditing]);

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

export const TemplateDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteParams>();
  const templateId = route.params.templateId;
  const queryClient = useQueryClient();

  const isNew = templateId === null;

  const { data: template, isLoading } = useGetApiTemplatesTemplateId(templateId ?? '', {
    query: { enabled: !isNew },
  });
  const templateKey = templateId ? getGetApiTemplatesTemplateIdQueryKey(templateId) : null;

  const { mutate: create, isPending: isCreating } = usePostApiTemplates({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: getGetApiTemplatesQueryKey({ userId: USER_ID }) }),
    },
  });

  const { mutate: update } = usePutApiTemplatesTemplateId({
    mutation: {
      onMutate: async ({ data }) => {
        if (!templateKey) return;
        await queryClient.cancelQueries({ queryKey: templateKey });
        const previous = queryClient.getQueryData<TemplateResponse>(templateKey);
        // podmieniamy nazwę/notatki natychmiast — reszta (ćwiczenia) zostaje nietknięta
        queryClient.setQueryData<TemplateResponse>(templateKey, (old) =>
          old ? { ...old, name: data.name, notes: data.notes ?? null } : old
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (templateKey && context?.previous) {
          queryClient.setQueryData(templateKey, context.previous);
        }
      },
      onSettled: () => {
        if (templateKey) queryClient.invalidateQueries({ queryKey: templateKey });
      },
    },
  });

  const { mutate: removeExercise } = useDeleteApiTemplatesExercisesTemplateExerciseId({
    mutation: {
      onMutate: async ({ templateExerciseId }) => {
        if (!templateKey) return;
        await queryClient.cancelQueries({ queryKey: templateKey });
        const previous = queryClient.getQueryData<TemplateResponse>(templateKey);
        // usuwamy ćwiczenie z cache od razu — UI przestaje je pokazywać
        queryClient.setQueryData<TemplateResponse>(templateKey, (old) =>
          old ? { ...old, exercises: old.exercises.filter((e) => e.id !== templateExerciseId) } : old
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (templateKey && context?.previous) {
          queryClient.setQueryData(templateKey, context.previous);
        }
      },
      onSettled: () => {
        if (templateKey) queryClient.invalidateQueries({ queryKey: templateKey });
      },
    },
  });

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setNotes(template.notes ?? '');
    }
  }, [template]);

  useEffect(() => {
    if (isNew || !template || !templateId) return;
    if (!name.trim()) return;

    const trimmedNotes = notes.trim() || null;
    const unchanged = name.trim() === template.name && trimmedNotes === (template.notes ?? null);
    if (unchanged) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      update({ templateId, data: { name: name.trim(), notes: trimmedNotes } });
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [name, notes, template, isNew, templateId]);

  const handleCreate = () => {
    if (!name.trim()) return;
    create(
      { data: { userId: USER_ID, name: name.trim(), notes: notes.trim() || null } },
      { onSuccess: ({ id }) => navigation.setParams({ templateId: id }) }
    );
  };

  if (!isNew && isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-4 gap-4">
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1">Nazwa</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="np. Push Day A"
          className="border border-gray-300 rounded-lg px-3 py-2 text-base"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1">Notatki</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Opcjonalnie"
          multiline
          className="border border-gray-300 rounded-lg px-3 py-2 text-base min-h-[80px]"
        />
      </View>

      {isNew && (
        <Pressable
          onPress={handleCreate}
          disabled={isCreating || !name.trim()}
          className="bg-black rounded-xl py-4 items-center disabled:opacity-40"
        >
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Utwórz szablon</Text>
          )}
        </Pressable>
      )}

      {!isNew && template && (
        <View className="mt-2">
          <Text className="text-base font-semibold mb-2">Ćwiczenia</Text>
          {template.exercises.length === 0 ? (
            <View className="items-center justify-center py-6">
              <Text className="text-gray-500">Brak ćwiczeń w szablonie</Text>
            </View>
          ) : (
            <View className="gap-2 mb-2">
              {template.exercises.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  templateId={templateId!}
                  onDelete={() => removeExercise({ templateExerciseId: ex.id })}
                />
              ))}
            </View>
          )}
          <Pressable
            onPress={() =>
              navigation.navigate('TemplateExercisePicker', { templateId: templateId! })
            }
            className="bg-gray-100 rounded-xl py-3 items-center"
          >
            <Text className="text-base font-medium">+ Dodaj ćwiczenie</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
};
