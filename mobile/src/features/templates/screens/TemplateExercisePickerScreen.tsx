import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { TemplatesStackParamList } from '../../../navigation/types';
import { useGetApiExercises } from '../../../api/generated/exercises/exercises';
import {
  usePostApiTemplatesTemplateIdExercises,
  getGetApiTemplatesTemplateIdQueryKey,
  getGetApiTemplatesQueryKey,
} from '../../../api/generated/templates/templates';
import { useTemplateExerciseForm } from '../hooks/useTemplateExerciseForm';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { tokens } from '../../../theme/tokens';

const USER_ID = '00000000-0000-0000-0000-000000000001';

type RouteParams = RouteProp<TemplatesStackParamList, 'TemplateExercisePicker'>;

export const TemplateExercisePickerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { templateId } = route.params;
  const queryClient = useQueryClient();

  const { data: exercises, isLoading } = useGetApiExercises({
    query: { staleTime: Infinity },
  });
  const { mutate: add, isPending } = usePostApiTemplatesTemplateIdExercises({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiTemplatesTemplateIdQueryKey(templateId),
        });
        queryClient.invalidateQueries({
          queryKey: getGetApiTemplatesQueryKey({ userId: USER_ID }),
        });
        navigation.goBack();
      },
    },
  });

  const { selection, setSelection, targets, setTarget, handleSubmit } = useTemplateExerciseForm(
    (payload) => add({ templateId, data: payload })
  );

  const isLibrary = selection?.exerciseId != null;
  const customName = selection && !isLibrary ? selection.name : '';

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={tokens.color.lime} />
      </View>
    );
  }

  const renderHeader = () => (
    <View className="p-4 gap-4 border-b border-line">
      <Input
        label="Własne ćwiczenie"
        value={customName}
        onChangeText={(t) => setSelection(t.trim() ? { exerciseId: null, name: t } : null)}
        placeholder="Nazwa"
      />

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

      {isLibrary && selection && (
        <View className="bg-surface rounded-md p-3 border border-line">
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase">
            Wybrane
          </Text>
          <Text className="text-fg font-sans-sb text-body-lg mt-1">{selection.name}</Text>
        </View>
      )}

      <Button
        label="Dodaj do szablonu →"
        variant="primary"
        loading={isPending}
        disabled={!selection || isPending}
        onPress={handleSubmit}
      />

      <Text className="text-muted font-mono-md text-label tracking-label uppercase mt-2">
        [ LUB Z BIBLIOTEKI ]
      </Text>
    </View>
  );

  return (
    <FlatList
      className="bg-bg"
      data={exercises}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader()}
      renderItem={({ item }) => {
        const isSelected = selection?.exerciseId === item.id;
        return (
          <Pressable
            onPress={() => setSelection({ exerciseId: item.id, name: item.name })}
            className={`px-4 py-4 border-b border-line ${isSelected ? 'bg-surface2' : ''}`}
          >
            <Text className="text-fg font-sans-sb text-body-lg">{item.name}</Text>
            <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
              {item.category}
            </Text>
          </Pressable>
        );
      }}
    />
  );
};
