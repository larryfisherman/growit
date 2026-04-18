import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useExercises } from '../hooks/useExercises';

export const ExercisesScreen = () => {
  const { data, isLoading, isError } = useExercises();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Błąd ładowania ćwiczeń</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="bg-gray-100 rounded-lg px-4 py-3">
          <Text className="text-base font-semibold">{item.name}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{item.category}</Text>
        </View>
      )}
      contentContainerClassName="p-4 gap-2"
    />
  );
};
