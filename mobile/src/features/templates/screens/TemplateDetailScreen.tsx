import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TemplatesStackParamList } from '../../../navigation/types';
import {
  useGetApiTemplatesTemplateId,
  usePostApiTemplates,
  getGetApiTemplatesQueryKey,
} from '../../../api/generated/templates/templates';
import { ExerciseRow } from '../components/ExerciseRow';
import { useTemplateAutoSave } from '../hooks/useTemplateAutoSave';
import { useTemplateExerciseDelete } from '../hooks/useTemplateExerciseDelete';

const USER_ID = '00000000-0000-0000-0000-000000000001';

type NavProp = NativeStackNavigationProp<TemplatesStackParamList, 'TemplateDetail'>;
type RouteParams = RouteProp<TemplatesStackParamList, 'TemplateDetail'>;

export const TemplateDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteParams>();
  const templateId = route.params.templateId;
  const queryClient = useQueryClient();

  const isNew = templateId === null;

  const { data: template, isLoading } = useGetApiTemplatesTemplateId(templateId ?? '', {
    query: { enabled: !isNew },
  });

  const { mutate: create, isPending: isCreating } = usePostApiTemplates({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: getGetApiTemplatesQueryKey({ userId: USER_ID }) }),
    },
  });

  const { mutate: removeExercise } = useTemplateExerciseDelete(templateId ?? '');

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setNotes(template.notes ?? '');
    }
  }, [template]);

  useTemplateAutoSave({ templateId, template, name, notes });

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
            onPress={() => navigation.navigate('TemplateExercisePicker', { templateId: templateId! })}
            className="bg-gray-100 rounded-xl py-3 items-center"
          >
            <Text className="text-base font-medium">+ Dodaj ćwiczenie</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
};
