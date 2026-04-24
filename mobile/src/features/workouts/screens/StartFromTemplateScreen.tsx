import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TodayStackParamList } from '../../../navigation/types';
import { useGetApiTemplates } from '../../../api/generated/templates/templates';
import {
  usePostApiWorkoutsFromTemplate,
  getGetApiWorkoutsUserIdByDateQueryKey,
} from '../../../api/generated/workouts/workouts';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const getToday = () => new Date().toISOString().split('T')[0];

type NavProp = NativeStackNavigationProp<TodayStackParamList, 'StartFromTemplate'>;

export const StartFromTemplateScreen = () => {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const today = getToday();

  const { data: templates, isLoading } = useGetApiTemplates({ userId: USER_ID });
  const { mutate: start, isPending } = usePostApiWorkoutsFromTemplate({
    mutation: {
      onSuccess: ({ id }) => {
        queryClient.invalidateQueries({
          queryKey: getGetApiWorkoutsUserIdByDateQueryKey(USER_ID, { date: today }),
        });
        navigation.replace('WorkoutDetail', { workoutId: id });
      },
    },
  });

  const handleStart = (templateId: string) => {
    start({ data: { userId: USER_ID, templateId, performedAt: today } });
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
