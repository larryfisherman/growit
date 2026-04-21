import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TemplatesStackParamList } from '../../../navigation/types';
import { useExercises } from '../../exercises/hooks/useExercises';
import { useAddExerciseToTemplate } from '../hooks/useAddExerciseToTemplate';

type RouteParams = RouteProp<TemplatesStackParamList, 'TemplateExercisePicker'>;

type Selection =
  | { kind: 'library'; id: string; name: string }
  | { kind: 'custom'; name: string };

export const TemplateExercisePickerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { templateId } = route.params;
  const { data: exercises, isLoading } = useExercises();
  const { mutate: add, isPending } = useAddExerciseToTemplate(templateId);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [customName, setCustomName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [rest, setRest] = useState('90');

  const handleSubmit = () => {
    if (!selection) return;
    const targetSets = parseInt(sets, 10);
    const targetReps = parseInt(reps, 10);
    const restSeconds = parseInt(rest, 10);
    if (!targetSets || !targetReps || isNaN(restSeconds)) return;

    add(
      {
        exerciseId: selection.kind === 'library' ? selection.id : null,
        customExerciseName: selection.kind === 'custom' ? selection.name : null,
        targetSets,
        targetReps,
        restSeconds,
      },
      { onSuccess: () => navigation.goBack() }
    );
  };

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
        <View className="flex-row gap-2">
          <TextInput
            value={customName}
            onChangeText={(t) => {
              setCustomName(t);
              setSelection(t.trim() ? { kind: 'custom', name: t.trim() } : null);
            }}
            placeholder="Nazwa"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
          />
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">Serie</Text>
          <TextInput
            value={sets}
            onChangeText={setSets}
            keyboardType="number-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">Powtórzenia</Text>
          <TextInput
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">Przerwa (s)</Text>
          <TextInput
            value={rest}
            onChangeText={setRest}
            keyboardType="number-pad"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base"
          />
        </View>
      </View>

      {selection?.kind === 'library' && (
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
        const isSelected = selection?.kind === 'library' && selection.id === item.id;
        return (
          <Pressable
            onPress={() => {
              setCustomName('');
              setSelection({ kind: 'library', id: item.id, name: item.name });
            }}
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
