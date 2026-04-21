import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../../../navigation/types';
import { useTemplates } from '../../templates/hooks/useTemplates';
import { useCreateWorkoutFromTemplate } from '../hooks/useCreateWorkoutFromTemplate';

type NavProp = NativeStackNavigationProp<TodayStackParamList, 'StartFromTemplate'>;

export const StartFromTemplateScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { data: templates, isLoading } = useTemplates();
  const { mutate: start, isPending } = useCreateWorkoutFromTemplate();

  const handleStart = (templateId: string) => {
    start(templateId, {
      onSuccess: ({ id }) => {
        navigation.replace('WorkoutDetail', { workoutId: id });
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleStart(item.id)}
            disabled={isPending}
            className="px-4 py-3 border-b border-gray-100"
          >
            <Text className="text-base font-medium">{item.name}</Text>
            <Text className="text-sm text-gray-500">{item.exerciseCount} ćwiczeń</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center p-10 gap-4">
            <Text className="text-gray-500 text-center">Brak szablonów.</Text>
            <Pressable
              onPress={() => navigation.navigate('TemplateDetail', { templateId: null })}
              className="bg-black rounded-xl py-3 px-6"
            >
              <Text className="text-white text-base font-semibold">Dodaj szablon</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
};
