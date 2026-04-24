import { useRef } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
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

const USER_ID = '00000000-0000-0000-0000-000000000001';

type NavProp = NativeStackNavigationProp<TemplatesStackParamList, 'TemplatesList'>;

type TemplateRowProps = {
  template: TemplateSummaryResponse;
  onPress: () => void;
  onDelete: () => void;
};

const TemplateRow = ({ template, onPress, onDelete }: TemplateRowProps) => {
  const swipeRef = useRef<Swipeable>(null);

  const confirmDelete = () => {
    swipeRef.current?.close();
    Alert.alert('Usuń szablon', `Na pewno usunąć „${template.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: onDelete },
    ]);
  };

  const renderRightActions = () => (
    <View style={{ width: 80, justifyContent: 'center', paddingLeft: 8, paddingRight: 8 }}>
      <RectButton
        onPress={confirmDelete}
        style={{
          backgroundColor: '#ef4444',
          borderRadius: 8,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Usuń</Text>
      </RectButton>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable onPress={onPress} className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="text-base font-medium">{template.name}</Text>
        <Text className="text-sm text-gray-500">{template.exerciseCount} ćwiczeń</Text>
      </Pressable>
    </Swipeable>
  );
};

export const TemplatesListScreen = () => {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetApiTemplates({ userId: USER_ID });
  const { mutate: remove } = useDeleteApiTemplatesTemplateId({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: getGetApiTemplatesQueryKey({ userId: USER_ID }) }),
    },
  });

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
            <Text className="text-gray-500 text-center">
              Brak szablonów. Stwórz pierwszy, żeby zacząć.
            </Text>
          </View>
        }
        contentContainerClassName="py-2"
      />
      <View className="p-4 border-t border-gray-200">
        <Pressable
          onPress={() => navigation.navigate('TemplateDetail', { templateId: null })}
          className="bg-black rounded-xl py-4 items-center"
        >
          <Text className="text-white text-base font-semibold">Nowy szablon</Text>
        </Pressable>
      </View>
    </View>
  );
};
