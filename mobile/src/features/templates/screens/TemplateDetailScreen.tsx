import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
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
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { tokens } from '../../../theme/tokens';

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
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={tokens.color.lime} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="p-4 gap-5">
      <Input
        label="Nazwa"
        value={name}
        onChangeText={setName}
        placeholder="np. Push Day A"
      />

      <Input
        label="Notatki"
        value={notes}
        onChangeText={setNotes}
        placeholder="Opcjonalnie"
        multiline
      />

      {isNew && (
        <Button
          label={isCreating ? 'Tworzenie...' : 'Utwórz szablon →'}
          variant="primary"
          loading={isCreating}
          disabled={isCreating || !name.trim()}
          onPress={handleCreate}
        />
      )}

      {!isNew && template && (
        <View className="mt-2">
          <Text className="text-muted font-mono-md text-label tracking-label uppercase mb-3">
            [ ĆWICZENIA ]
          </Text>
          {template.exercises.length === 0 ? (
            <View className="items-center justify-center py-8 border border-line rounded-md">
              <Text className="text-muted font-sans-md text-body">Brak ćwiczeń w szablonie</Text>
            </View>
          ) : (
            <View className="gap-2 mb-3">
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
            className="border border-line rounded-md py-4 items-center"
          >
            <Text className="text-fg font-sans-sb text-body-sm tracking-label uppercase">
              + Dodaj ćwiczenie
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
};
