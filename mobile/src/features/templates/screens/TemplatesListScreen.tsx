import { View, Text, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TemplatesStackParamList } from '../../../navigation/types';
import { useTemplates } from '../hooks/useTemplates';
import { useDeleteTemplate } from '../hooks/useDeleteTemplate';

type NavProp = NativeStackNavigationProp<TemplatesStackParamList, 'TemplatesList'>;

export const TemplatesListScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { data, isLoading } = useTemplates();
  const { mutate: remove } = useDeleteTemplate();

  const confirmDelete = (id: string, name: string) =>
    Alert.alert('Usuń szablon', `Na pewno usunąć „${name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => remove(id) },
    ]);

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
          <Pressable
            onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
            onLongPress={() => confirmDelete(item.id, item.name)}
            className="px-4 py-3 border-b border-gray-100"
          >
            <Text className="text-base font-medium">{item.name}</Text>
            <Text className="text-sm text-gray-500">{item.exerciseCount} ćwiczeń</Text>
          </Pressable>
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
