import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { PlansStackParamList } from '../../../navigation/types';
import { useGetApiExercises } from '../../../api/generated/exercises/exercises';
import {
  useGetApiTrainingPlansDaysDayId,
  getGetApiTrainingPlansDaysDayIdQueryKey,
} from '../../../api/generated/training-plans/training-plans';
import {
  ExerciseResponse,
  PlanDayExerciseResponse,
  PlanDayExerciseSelection,
  PlanDayResponse,
} from '../../../api/generated/schemas';
import { usePlanDayExercisesSync } from '../hooks/usePlanDayExercisesSync';
import { DEFAULT_TARGETS, TEMP_ID_PREFIX, isDefaultTargets } from '../constants';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { tokens } from '../../../theme/tokens';
import { searchable } from '../../../lib/text';

type Props = NativeStackScreenProps<PlansStackParamList, 'PlanDayExercisePicker'>;

/// The day's exercises as the user currently wants them, in order. Kept as a list rather
/// than a set because position is what the server turns into OrderIndex.
type Pick =
  | { kind: 'existing'; row: PlanDayExerciseResponse }
  | { kind: 'library'; exerciseId: string; name: string; category: string | null }
  | { kind: 'custom'; name: string };

type Snapshot = {
  ids: Set<string>;
  byId: Map<string, PlanDayExerciseResponse>;
  performed: boolean;
};

const pickExerciseId = (pick: Pick) =>
  pick.kind === 'existing' ? pick.row.exerciseId : pick.kind === 'library' ? pick.exerciseId : null;

const toSelection = (pick: Pick): PlanDayExerciseSelection => {
  if (pick.kind === 'existing') {
    return { planDayExerciseId: pick.row.id, exerciseId: null, customExerciseName: null };
  }
  if (pick.kind === 'library') {
    return { planDayExerciseId: null, exerciseId: pick.exerciseId, customExerciseName: null };
  }
  return { planDayExerciseId: null, exerciseId: null, customExerciseName: pick.name };
};

/// Renders the picks as day exercises for the optimistic cache. Each pick is resolved
/// against what the day already holds, so once a write lands and the day refetches, the
/// placeholder rows quietly turn into the real ones - ids, tuned targets and all.
const toDayExercises = (picks: Pick[], day: PlanDayResponse): PlanDayExerciseResponse[] =>
  picks.map((pick, orderIndex) => {
    const live =
      pick.kind === 'existing'
        ? day.exercises.find((e) => e.id === pick.row.id)
        : pick.kind === 'library'
          ? day.exercises.find((e) => e.exerciseId === pick.exerciseId)
          : day.exercises.find((e) => e.exerciseId === null && e.exerciseName === pick.name);

    if (live) return { ...live, orderIndex };
    if (pick.kind === 'existing') return { ...pick.row, orderIndex };

    const isLibrary = pick.kind === 'library';
    return {
      id: `${TEMP_ID_PREFIX}${isLibrary ? pick.exerciseId : `custom:${pick.name}`}`,
      exerciseId: isLibrary ? pick.exerciseId : null,
      exerciseName: isLibrary ? pick.name : pick.name,
      category: isLibrary ? pick.category : null,
      targetSets: DEFAULT_TARGETS.sets,
      targetReps: DEFAULT_TARGETS.reps,
      restSeconds: DEFAULT_TARGETS.restSeconds,
      orderIndex,
    };
  });

export const PlanDayExercisePickerScreen = ({ route, navigation }: Props) => {
  const { dayId, planId } = route.params;
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  const [picks, setPicks] = useState<Pick[] | null>(null);
  // Exercises the user already OK'd removing this session - don't ask twice.
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const { data: exercises, isLoading } = useGetApiExercises({ query: { staleTime: Infinity } });
  const { data: day } = useGetApiTrainingPlansDaysDayId(dayId);

  // The day as it looked when the picker opened. This is what separates a pick made just
  // now from one that has been around - and it carries the performed flag and the
  // original targets that the confirm rule reads.
  const seededRef = useRef(false);
  const snapshotRef = useRef<Snapshot>({ ids: new Set(), byId: new Map(), performed: false });

  useEffect(() => {
    if (!day || seededRef.current) return;

    const byId = new Map<string, PlanDayExerciseResponse>();
    day.exercises.forEach((e) => {
      if (e.exerciseId) byId.set(e.exerciseId, e);
    });
    snapshotRef.current = {
      ids: new Set(byId.keys()),
      byId,
      performed: day.hasBeenPerformed,
    };
    setPicks(day.exercises.map((row) => ({ kind: 'existing', row })));
    seededRef.current = true;
  }, [day]);

  const items = useMemo(() => picks?.map(toSelection) ?? null, [picks]);

  const handleSyncError = useCallback(() => {
    Alert.alert(
      'Nie udało się zapisać',
      'Zmiany w ćwiczeniach tego dnia nie zostały zapisane. Sprawdź połączenie i spróbuj ponownie.',
    );
  }, []);

  const flush = usePlanDayExercisesSync({ dayId, planId, items, onError: handleSyncError });

  // Show the change on the day view straight away; the write follows in the background.
  useEffect(() => {
    if (!picks) return;
    queryClient.setQueryData<PlanDayResponse>(
      getGetApiTrainingPlansDaysDayIdQueryKey(dayId),
      (old) => (old ? { ...old, exercises: toDayExercises(picks, old) } : old),
    );
  }, [picks, queryClient, dayId]);

  // Leaving the screen should not wait for the debounce.
  useEffect(
    () => navigation.addListener('beforeRemove', () => void flush('beforeRemove')),
    [navigation, flush],
  );

  const selectedIds = useMemo(() => {
    const ids = new Set<string>();
    picks?.forEach((pick) => {
      const id = pickExerciseId(pick);
      if (id) ids.add(id);
    });
    return ids;
  }, [picks]);

  const dropByExerciseId = (exerciseId: string) =>
    setPicks((prev) => (prev ?? []).filter((pick) => pickExerciseId(pick) !== exerciseId));

  const toggle = (item: ExerciseResponse) => {
    const id = item.id;

    if (!selectedIds.has(id)) {
      console.log('[picker] toggle ON', item.name);
      setPicks((prev) => [
        ...(prev ?? []),
        { kind: 'library', exerciseId: id, name: item.name, category: item.category },
      ]);
      return;
    }

    const { ids: initialIds, byId, performed } = snapshotRef.current;

    if (!initialIds.has(id)) {
      console.log('[picker] toggle OFF', item.name, '-> silent (fresh)');
      dropByExerciseId(id);
      return;
    }
    if (confirmedIds.has(id)) {
      console.log('[picker] toggle OFF', item.name, '-> silent (already confirmed)');
      dropByExerciseId(id);
      return;
    }

    const existing = byId.get(id);
    const needsConfirm = performed || (existing ? !isDefaultTargets(existing) : false);
    if (!needsConfirm) {
      console.log('[picker] toggle OFF', item.name, '-> silent (default & not performed)');
      dropByExerciseId(id);
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
          dropByExerciseId(id);
        },
      },
    ]);
  };

  const customPicks = useMemo(
    () => (picks ?? []).filter((pick): pick is Extract<Pick, { kind: 'custom' }> => pick.kind === 'custom'),
    [picks],
  );

  const addCustom = () => {
    const name = customName.trim();
    if (!name || customPicks.some((pick) => pick.name === name)) return;
    console.log('[picker] add custom', name);
    setPicks((prev) => [...(prev ?? []), { kind: 'custom', name }]);
    setCustomName('');
    setIsCustomOpen(false);
  };

  const removeCustom = (name: string) => {
    // Customs are always added in this session, so removing one is silent.
    console.log('[picker] remove custom', name);
    setPicks((prev) =>
      (prev ?? []).filter((pick) => !(pick.kind === 'custom' && pick.name === name)),
    );
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

      {customPicks.length > 0 && (
        <View className="gap-2">
          {customPicks.map((pick) => (
            <Pressable
              key={pick.name}
              onPress={() => removeCustom(pick.name)}
              className="flex-row items-center justify-between bg-surface2 rounded-md px-4 py-3 border border-line"
            >
              <Text className="text-fg font-sans-sb text-body">{pick.name}</Text>
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
    <FlatList
      className="bg-bg"
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
  );
};
