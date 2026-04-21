import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TemplatesStackParamList } from '../../../navigation/types';
import { useUpdateTemplateExercise } from '../hooks/useUpdateTemplateExercise';

type RouteParams = RouteProp<TemplatesStackParamList, 'TemplateExerciseEdit'>;

export const TemplateExerciseEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { templateId, templateExerciseId, exerciseName, orderIndex } = route.params;

  const { mutate: update, isPending } = useUpdateTemplateExercise(templateId);

  const [sets, setSets] = useState(String(route.params.targetSets));
  const [reps, setReps] = useState(String(route.params.targetReps));
  const [rest, setRest] = useState(String(route.params.restSeconds));

  const handleSave = () => {
    const targetSets = parseInt(sets, 10);
    const targetReps = parseInt(reps, 10);
    const restSeconds = parseInt(rest, 10);
    if (!targetSets || !targetReps || isNaN(restSeconds)) return;

    update(
      { templateExerciseId, targetSets, targetReps, restSeconds, orderIndex },
      { onSuccess: () => navigation.goBack() }
    );
  };

  return (
    <View className="flex-1 bg-white p-4 gap-4">
      <Text className="text-lg font-semibold">{exerciseName}</Text>

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

      <Pressable
        onPress={handleSave}
        disabled={isPending}
        className="bg-black rounded-xl py-4 items-center disabled:opacity-40"
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-semibold">Zapisz</Text>
        )}
      </Pressable>
    </View>
  );
};
