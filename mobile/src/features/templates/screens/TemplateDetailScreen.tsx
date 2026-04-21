import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TemplatesStackParamList } from '../../../navigation/types';
import { TemplateExerciseDetail } from '../../../api/types';
import { useTemplate } from '../hooks/useTemplate';
import { useCreateTemplate } from '../hooks/useCreateTemplate';
import { useUpdateTemplate } from '../hooks/useUpdateTemplate';
import { useRemoveExerciseFromTemplate } from '../hooks/useRemoveExerciseFromTemplate';

type NavProp = NativeStackNavigationProp<TemplatesStackParamList, 'TemplateDetail'>;
type RouteParams = RouteProp<TemplatesStackParamList, 'TemplateDetail'>;

type ExerciseRowProps = {
  exercise: TemplateExerciseDetail;
  onEdit: () => void;
  onDelete: () => void;
};

const ExerciseRow = ({ exercise, onEdit, onDelete }: ExerciseRowProps) => {
  const ref = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={{ width: 80, justifyContent: 'center', paddingLeft: 8 }}>
      <RectButton
        onPress={() => {
          console.log('[delete] button pressed, exercise:', exercise.id);
          ref.current?.close();
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

  return (
    <Swipeable ref={ref} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable onPress={onEdit} className="bg-gray-50 rounded-lg p-3">
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

  const { data: template, isLoading } = useTemplate(templateId);
  const { mutate: create, isPending: isCreating } = useCreateTemplate();
  const { mutate: update, isPending: isUpdating } = useUpdateTemplate(templateId ?? '');
  const removeExercise = useRemoveExerciseFromTemplate(templateId ?? '');

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setNotes(template.notes ?? '');
    }
  }, [template]);

  const isNew = templateId === null;

  const handleSave = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), notes: notes.trim() || null };
    if (isNew) {
      create(payload, {
        onSuccess: ({ id }) => navigation.setParams({ templateId: id }),
      });
    } else {
      update(payload);
    }
  };

  if (isLoading) {
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

      <Pressable
        onPress={handleSave}
        disabled={isCreating || isUpdating || !name.trim()}
        className="bg-black rounded-xl py-4 items-center disabled:opacity-40"
      >
        {isCreating || isUpdating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-semibold">
            {isNew ? 'Utwórz szablon' : 'Zapisz zmiany'}
          </Text>
        )}
      </Pressable>

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
                  onEdit={() =>
                    navigation.navigate('TemplateExerciseEdit', {
                      templateId: templateId!,
                      templateExerciseId: ex.id,
                      exerciseName: ex.exerciseName,
                      targetSets: ex.targetSets,
                      targetReps: ex.targetReps,
                      restSeconds: ex.restSeconds,
                      orderIndex: ex.orderIndex,
                    })
                  }
                  onDelete={() => removeExercise.mutate(ex.id)}
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
