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
import { Button } from '../../../theme/components/Button';
import { tokens } from '../../../theme/tokens';
import { getToday } from '../../../lib/date';
import { exerciseCountLabel } from '../../../lib/plurals';
import { useUserId } from '../../../auth/AuthContext';


type NavProp = NativeStackNavigationProp<TodayStackParamList, 'StartFromTemplate'>;

export const StartFromTemplateScreen = () => {
  const navigation = useNavigation<NavProp>();
  const userId = useUserId();
  const queryClient = useQueryClient();
  const today = getToday();

  const { data: templates, isLoading } = useGetApiTemplates({ userId: userId });
  const { mutate: start, isPending } = usePostApiWorkoutsFromTemplate({
    mutation: {
      onSuccess: ({ id }) => {
        queryClient.invalidateQueries({
          queryKey: getGetApiWorkoutsUserIdByDateQueryKey(userId, { date: today }),
        });
        navigation.replace('WorkoutDetail', { workoutId: id });
      },
    },
  });

  const handleStart = (templateId: string) => {
    start({ data: { userId: userId, templateId, performedAt: today } });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={tokens.color.lime} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleStart(item.id)}
            disabled={isPending}
            className="bg-surface rounded-md p-4 border border-line"
          >
            <Text className="text-fg font-sans-sb text-body-lg">{item.name}</Text>
            <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
              {exerciseCountLabel(item.exerciseCount)}
            </Text>
          </Pressable>
        )}
        contentContainerClassName="p-4 gap-2"
        ListEmptyComponent={
          <View className="items-center justify-center p-10 gap-4">
            <Text className="text-muted font-mono-md text-label tracking-label uppercase">
              [ BRAK SZABLONÓW ]
            </Text>
            <Button
              label="+ Dodaj szablon"
              variant="primary"
              fullWidth={false}
              onPress={() => navigation.navigate('TemplateDetail', { templateId: null })}
            />
          </View>
        }
      />
    </View>
  );
};
