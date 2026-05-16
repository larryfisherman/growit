import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useGetApiExercises } from '../../../api/generated/exercises/exercises';
import { tokens } from '../../../theme/tokens';

export const ExercisesScreen = () => {
  const { data, isLoading, isError } = useGetApiExercises({
    query: { staleTime: Infinity },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={tokens.color.lime} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-muted font-mono-md text-label tracking-label uppercase">
          [ BŁĄD ŁADOWANIA ]
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      className="bg-bg"
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="bg-surface rounded-md p-4 border border-line">
          <Text className="text-fg font-sans-sb text-body-lg">{item.name}</Text>
          <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
            {item.category}
          </Text>
        </View>
      )}
      contentContainerClassName="p-4 gap-2"
    />
  );
};
