import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TemplatesStackParamList } from '../../../navigation/types';
import { useExercises } from '../../exercises/hooks/useExercises';
import { useAddExerciseToTemplate } from '../hooks/useAddExerciseToTemplate';
import { useTemplateExerciseForm } from '../hooks/useTemplateExerciseForm';

type RouteParams = RouteProp<TemplatesStackParamList, 'TemplateExercisePicker'>;

export const TemplateExercisePickerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { templateId } = route.params;
  const { data: exercises, isLoading } = useExercises();
  const { mutate: add, isPending } = useAddExerciseToTemplate(templateId);

  const { selection, setSelection, targets, setTarget, handleSubmit } = useTemplateExerciseForm(
    (payload) => add(payload, { onSuccess: () => navigation.goBack() })
  );

  const isLibrary = selection?.exerciseId != null;
  const customName = selection && !isLibrary ? selection.name : '';

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const renderHeader = () => (
    <View className="p-4 gap-4 border-b border-gray-200">
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1">Własne ćwiczenie</Text>
        <TextInput
          value={customName}
          onChangeText={(t) => setSelection(t.trim() ? { exerciseId: null, name: t } : null)}
          placeholder="Nazwa"
          className="border border-gray-300 rounded-lg px-3 py-2 text-base"
        />
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">Serie</Text>
          <TextInput
            value={targets.sets}
            onChangeText={(t) => setTarget('sets', t)}
            keyboardType="number-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">Powtórzenia</Text>
          <TextInput
            value={targets.reps}
            onChangeText={(t) => setTarget('reps', t)}
            keyboardType="number-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">Przerwa (s)</Text>
          <TextInput
            value={targets.rest}
            onChangeText={(t) => setTarget('rest', t)}
            keyboardType="number-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          />
        </View>
      </View>

      {isLibrary && selection && (
        <View className="bg-blue-50 rounded-lg p-3">
          <Text className="text-sm text-gray-600">Wybrane ćwiczenie</Text>
          <Text className="text-base font-medium">{selection.name}</Text>
        </View>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={!selection || isPending}
        className="bg-black rounded-xl py-3 items-center disabled:opacity-40"
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">Dodaj do szablonu</Text>
        )}
      </Pressable>

      <Text className="text-sm font-medium text-gray-700 mt-2">Lub wybierz z biblioteki</Text>
    </View>
  );

  return (
    <FlatList
      className="bg-white"
      data={exercises}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader()}
      renderItem={({ item }) => {
        const isSelected = selection?.exerciseId === item.id;
        return (
          <Pressable
            onPress={() => setSelection({ exerciseId: item.id, name: item.name })}
            className={`px-4 py-3 border-b border-gray-100 ${isSelected ? 'bg-blue-50' : ''}`}
          >
            <Text className="text-base font-medium">{item.name}</Text>
            <Text className="text-sm text-gray-500">{item.category}</Text>
          </Pressable>
        );
      }}
    />
  );
};
