import { useRef } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { TemplatesStackParamList } from '../../../navigation/types';
import {
  useGetApiTemplates,
  useDeleteApiTemplatesTemplateId,
  getGetApiTemplatesQueryKey,
} from '../../../api/generated/templates/templates';
import { TemplateSummaryResponse } from '../../../api/generated/schemas';
import { Button } from '../../../theme/components/Button';
import { tokens } from '../../../theme/tokens';

type TemplatesQueryKey = ReturnType<typeof getGetApiTemplatesQueryKey>;

const USER_ID = '00000000-0000-0000-0000-000000000001';

type NavProp = NativeStackNavigationProp<TemplatesStackParamList, 'TemplatesList'>;

type TemplateRowProps = {
  template: TemplateSummaryResponse;
  onPress: () => void;
  onDelete: () => void;
};

const TemplateRow = ({ template, onPress, onDelete }: TemplateRowProps) => {
  const swipeRef = useRef<SwipeableMethods>(null);

  const confirmDelete = () => {
    swipeRef.current?.close();
    Alert.alert('Usuń szablon', `Na pewno usunąć „${template.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: onDelete },
    ]);
  };

  const renderRightActions = () => (
    <View style={{ width: 72, paddingLeft: tokens.space[2], paddingRight: tokens.space[2], paddingVertical: tokens.space[2] }}>
      <RectButton
        onPress={confirmDelete}
        style={{
          flex: 1,
          backgroundColor: tokens.color.danger,
          borderRadius: tokens.radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="trash-outline" size={22} color={tokens.color.fg} />
      </RectButton>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable onPress={onPress} className="bg-bg px-4 py-4 border-b border-line">
        <Text className="text-fg font-sans-sb text-body-lg">{template.name}</Text>
        <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
          {template.exerciseCount} ćwiczeń
        </Text>
      </Pressable>
    </Swipeable>
  );
};

export const TemplatesListScreen = () => {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetApiTemplates({ userId: USER_ID });
  const templatesKey: TemplatesQueryKey = getGetApiTemplatesQueryKey({ userId: USER_ID });

  const { mutate: remove } = useDeleteApiTemplatesTemplateId({
    mutation: {
      onMutate: async ({ templateId }) => {
        await queryClient.cancelQueries({ queryKey: templatesKey });
        const previous = queryClient.getQueryData<TemplateSummaryResponse[]>(templatesKey);
        queryClient.setQueryData<TemplateSummaryResponse[]>(templatesKey, (old) =>
          old?.filter((t) => t.id !== templateId)
        );
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) queryClient.setQueryData(templatesKey, context.previous);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: templatesKey }),
    },
  });

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
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TemplateRow
            template={item}
            onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
            onDelete={() => remove({ templateId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center p-10">
            <Text className="text-muted font-mono-md text-label tracking-label uppercase text-center">
              [ BRAK SZABLONÓW ]
            </Text>
            <Text className="text-fg font-sans-md text-body mt-3 text-center">
              Stwórz pierwszy, żeby zacząć.
            </Text>
          </View>
        }
      />
      <View className="px-4 pt-4 pb-6 border-t border-line">
        <Button
          label="+ Nowy szablon"
          variant="primary"
          onPress={() => navigation.navigate('TemplateDetail', { templateId: null })}
        />
      </View>
    </View>
  );
};
