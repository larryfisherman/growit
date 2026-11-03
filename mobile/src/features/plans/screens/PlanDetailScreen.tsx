import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlansStackParamList } from '../../../navigation/types';
import {
  useGetApiTrainingPlansPlanId,
  usePostApiTrainingPlans,
  usePostApiTrainingPlansPlanIdDays,
  usePutApiTrainingPlansPlanIdActive,
} from '../../../api/generated/training-plans/training-plans';
import { usePlanAutoSave } from '../hooks/usePlanAutoSave';
import { PlanDayRow } from '../components/PlanDayRow';
import { Button } from '../../../theme/components/Button';
import { Input } from '../../../theme/components/Input';
import { ScreenState } from '../../../theme/components/ScreenState';
import { newId } from '../../../offline/ids';
import { isInFlight } from '../../../offline/isInFlight';
import { screenStateOf } from '../../../offline/screenStateOf';
import { SectionLabel } from '../../../theme/components/SectionLabel';

type Props = NativeStackScreenProps<PlansStackParamList, 'PlanDetail'>;

export const PlanDetailScreen = ({ route, navigation }: Props) => {
  const { planId } = route.params;

  const isNew = planId === null;

  const planQuery = useGetApiTrainingPlansPlanId(planId ?? '', {
    query: { enabled: !isNew },
  });
  const plan = planQuery.data;
  // A new plan has no query to wait on (it is disabled, which reads as pending forever).
  const screenState = isNew ? null : screenStateOf(planQuery);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setNotes(plan.notes ?? '');
    }
  }, [plan]);

  usePlanAutoSave({ planId, plan, name, notes });

  const { mutate: create, isPending: isCreating } = usePostApiTrainingPlans();

  // Offline these writes wait in the queue paused; the buttons only wait on a write that
  // is actually on the wire.
  const addDayMutation = usePostApiTrainingPlansPlanIdDays();
  const { mutate: addDay } = addDayMutation;
  const isAddingDay = isInFlight(addDayMutation);

  const setActiveMutation = usePutApiTrainingPlansPlanIdActive();
  const { mutate: setActive } = setActiveMutation;
  const isActivating = isInFlight(setActiveMutation);

  const handleCreate = () => {
    if (!name.trim()) return;

    // The screen flips from "new" to "editing" on our own id rather than on the server's
    // answer, so it does not sit waiting for a round trip that may be hours away.
    const id = newId();
    create({ data: { id, name: name.trim(), notes: notes.trim() || null } });
    navigation.setParams({ planId: id });
  };

  const handleAddDay = () => {
    if (!planId) return;

    // Safe to open straight away: the registry seeds the day into the cache in onMutate,
    // so the screen finds it there instead of racing the write to a 404.
    const id = newId();
    const dayNumber = (plan?.days.length ?? 0) + 1;
    addDay({ planId, data: { id, name: `Dzień ${dayNumber}`, notes: null } });
    navigation.navigate('PlanDay', { dayId: id });
  };

  if (screenState) {
    return <ScreenState kind={screenState} />;
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="p-4 gap-5">
      <Input label="Nazwa" value={name} onChangeText={setName} placeholder="np. PUSH/PULL 4 dni" />

      <Input
        label="Notatki"
        value={notes}
        onChangeText={setNotes}
        placeholder="Opcjonalnie"
        multiline
      />

      {isNew && (
        <Button
          label={isCreating ? 'Tworzenie...' : 'Utwórz plan →'}
          variant="primary"
          loading={isCreating}
          disabled={isCreating || !name.trim()}
          onPress={handleCreate}
        />
      )}

      {planId !== null && plan && (
        <>
          {!plan.isActive && (
            <Button
              label={isActivating ? 'Ustawiam...' : 'Ustaw jako aktywny'}
              variant="secondary"
              loading={isActivating}
              disabled={isActivating}
              onPress={() => setActive({ planId })}
            />
          )}

          <View className="mt-2">
            <SectionLabel className="mb-3">
              [ DNI ]
            </SectionLabel>

            {plan.days.length === 0 ? (
              <View className="items-center justify-center py-8 border border-line rounded-md">
                <Text className="text-muted font-sans-md text-body">Brak dni w planie</Text>
              </View>
            ) : (
              <View className="gap-2 mb-3">
                {plan.days.map((day, index) => (
                  <PlanDayRow
                    key={day.id}
                    name={day.name}
                    exerciseCount={day.exerciseCount}
                    position={index + 1}
                    onPress={() => navigation.navigate('PlanDay', { dayId: day.id })}
                  />
                ))}
              </View>
            )}

            <Pressable
              onPress={handleAddDay}
              disabled={isAddingDay}
              className="border border-line rounded-md py-4 items-center"
            >
              <Text className="text-fg font-sans-sb text-body-sm tracking-label uppercase">
                {isAddingDay ? 'Dodaję...' : '+ Dodaj dzień'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
};
