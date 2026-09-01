import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlansStackParamList } from '../../../navigation/types';
import { useGetApiExercises } from '../../../api/generated/exercises/exercises';
import { useGetApiTrainingPlansDaysDayId } from '../../../api/generated/training-plans/training-plans';
import { ExerciseResponse, PlanDayExerciseResponse } from '../../../api/generated/schemas';
import { usePlanDayExerciseBatchCommit } from '../hooks/usePlanDayExerciseBatchCommit';
import { isDefaultTargets } from '../constants';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { tokens } from '../../../theme/tokens';
import { searchable } from '../../../lib/text';

type Props = NativeStackScreenProps<PlansStackParamList, 'PlanDayExercisePicker'>;

type Initial = {
  ids: Set<string>;
  byId: Map<string, PlanDayExerciseResponse>;
  performed: boolean;
};

export const PlanDayExercisePickerScreen = ({ route, navigation }: Props) => {
  const { dayId, planId } = route.params;

  const [query, setQuery] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  // Selection is local; nothing hits the API until the screen is left (batch commit).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customNames, setCustomNames] = useState<string[]>([]);
  // Exercises the user already OK'd removing this session - don't ask twice.
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const { data: exercises, isLoading } = useGetApiExercises({ query: { staleTime: Infinity } });
  const { data: day } = useGetApiTrainingPlansDaysDayId(dayId);

  // Snapshot the day as it looked when the picker opened - this is what tells a
  // "fresh this session" pick apart from an established one, and carries the
  // performed flag + original targets used by the confirm rule.
  const seededRef = useRef(false);
  const initialRef = useRef<Initial>({ ids: new Set(), byId: new Map(), performed: false });

  useEffect(() => {
    if (!day || seededRef.current) return;
    const byId = new Map<string, PlanDayExerciseResponse>();
    day.exercises.forEach((e) => {
      if (e.exerciseId) byId.set(e.exerciseId, e);
    });
    initialRef.current = { ids: new Set(byId.keys()), byId, performed: day.hasBeenPerformed };
    setSelectedIds(new Set(byId.keys()));
    seededRef.current = true;
  }, [day]);

  const getState = useCallback(
    () => ({ selectedIds, customNames, existingByExerciseId: initialRef.current.byId }),
    [selectedIds, customNames],
  );
  const commit = usePlanDayExerciseBatchCommit({ dayId, planId, getState });

  // Leaving the screen is the primary flush point.
  useEffect(
    () => navigation.addListener('beforeRemove', () => void commit('beforeRemove')),
    [navigation, commit],
  );

  const removeId = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const toggle = (item: ExerciseResponse) => {
    const id = item.id;

    if (!selectedIds.has(id)) {
      console.log('[picker] toggle ON', item.name);
      setSelectedIds((prev) => new Set(prev).add(id));
      return;
    }

    const { ids: initialIds, byId, performed } = initialRef.current;
    const wasPreExisting = initialIds.has(id);

    if (!wasPreExisting) {
      console.log('[picker] toggle OFF', item.name, '-> silent (fresh)');
      removeId(id);
      return;
    }
    if (confirmedIds.has(id)) {
      console.log('[picker] toggle OFF', item.name, '-> silent (already confirmed)');
      removeId(id);
      return;
    }

    const existing = byId.get(id);
    const needsConfirm = performed || (existing ? !isDefaultTargets(existing) : false);
    if (!needsConfirm) {
      console.log('[picker] toggle OFF', item.name, '-> silent (default & not performed)');
      removeId(id);
      return;
    }

    console.log('[picker] toggle OFF', item.name, '-> confirm shown');
    Alert.alert('Usunąć ćwiczenie?', `„${item.name}" zostanie usunięte z tego dnia.`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          setConfirmedIds((prev) => new Set(prev).add(id));
          removeId(id);
        },
      },
    ]);
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name || customNames.includes(name)) return;
    console.log('[picker] add custom', name);
    setCustomNames((prev) => [...prev, name]);
    setCustomName('');
    setIsCustomOpen(false);
  };

  const removeCustom = (name: string) => {
    // Customs are always this-session, so removing one is silent.
    console.log('[picker] remove custom', name);
    setCustomNames((prev) => prev.filter((n) => n !== name));
  };

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const needle = searchable(query);
    if (!needle) return exercises;
    return exercises.filter(
      (e) => searchable(e.name).includes(needle) || searchable(e.category).includes(needle),
    );
  }, [exercises, query]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={tokens.color.lime} />
      </View>
    );
  }

  const renderHeader = () => (
    <View className="p-4 gap-4 border-b border-line">
      <Input
        label="Szukaj"
        value={query}
        onChangeText={setQuery}
        placeholder="np. przysiad, plecy"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <View className="border border-line rounded-md overflow-hidden">
        <Pressable
          onPress={() => setIsCustomOpen((open) => !open)}
          className="flex-row items-center justify-between px-4 py-4"
          accessibilityRole="button"
        >
          <Text className="text-muted font-mono-md text-label tracking-label uppercase">
            [ WŁASNE ĆWICZENIE ]
          </Text>
          <Ionicons
            name={isCustomOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={tokens.color.muted}
          />
        </Pressable>

        {isCustomOpen && (
          <View className="px-4 pb-4 border-t border-line pt-4 gap-3">
            <Input
              label="Nazwa"
              value={customName}
              onChangeText={setCustomName}
              placeholder="np. Pompki na poręczach"
              autoFocus
              onSubmitEditing={addCustom}
            />
            <Button
              label="Dodaj własne →"
              variant="secondary"
              disabled={!customName.trim()}
              onPress={addCustom}
            />
          </View>
        )}
      </View>

      {customNames.length > 0 && (
        <View className="gap-2">
          {customNames.map((name) => (
            <Pressable
              key={name}
              onPress={() => removeCustom(name)}
              className="flex-row items-center justify-between bg-surface2 rounded-md px-4 py-3 border border-line"
            >
              <Text className="text-fg font-sans-sb text-body">{name}</Text>
              <Ionicons name="close" size={18} color={tokens.color.muted} />
            </Pressable>
          ))}
        </View>
      )}

      <Text className="text-muted font-mono-md text-label tracking-label uppercase mt-2">
        [ Z BIBLIOTEKI ]
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderHeader()}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item)}
              className={`px-4 py-4 border-b border-line flex-row items-center justify-between ${
                isSelected ? 'bg-surface2' : ''
              }`}
            >
              <View className="flex-1">
                <Text className="text-fg font-sans-sb text-body-lg">{item.name}</Text>
                <Text className="text-muted font-mono-md text-label-sm tracking-label uppercase mt-1">
                  {item.category}
                </Text>
              </View>
              {isSelected && <Ionicons name="checkmark" size={20} color={tokens.color.lime} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center p-10">
            <Text className="text-muted font-sans-md text-body text-center">
              Nic nie pasuje do „{query}". Możesz dodać własne ćwiczenie.
            </Text>
          </View>
        }
      />

      <View className="p-4 border-t border-line bg-bg">
        <Button
          label={total > 0 ? `Gotowe (${total}) →` : 'Gotowe →'}
          variant="primary"
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
};
