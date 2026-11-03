import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlansStackParamList } from '../../../navigation/types';
import {
  useDeleteApiTrainingPlansExercisesPlanDayExerciseId,
  useGetApiTrainingPlansDaysDayId,
} from '../../../api/generated/training-plans/training-plans';
import { PlanDayExerciseRow } from '../components/PlanDayExerciseRow';
import { usePlanDayAutoSave } from '../hooks/usePlanDayAutoSave';
import { Input } from '../../../theme/components/Input';
import { ScreenState } from '../../../theme/components/ScreenState';
import { screenStateOf } from '../../../offline/screenStateOf';
import { SectionLabel } from '../../../theme/components/SectionLabel';

type Props = NativeStackScreenProps<PlansStackParamList, 'PlanDay'>;

export const PlanDayScreen = ({ route, navigation }: Props) => {
  const { dayId } = route.params;

  const dayQuery = useGetApiTrainingPlansDaysDayId(dayId);
  const day = dayQuery.data;
  const screenState = screenStateOf(dayQuery);
  const { mutate: removeExercise } = useDeleteApiTrainingPlansExercisesPlanDayExerciseId();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (day) {
      setName(day.name);
      setNotes(day.notes ?? '');
    }
  }, [day]);

  usePlanDayAutoSave({ dayId, day, name, notes });

  if (screenState) return <ScreenState kind={screenState} />;

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="p-4 gap-5">
      <Input label="Nazwa dnia" value={name} onChangeText={setName} placeholder="np. Push A" />

      <Input
        label="Notatki"
        value={notes}
        onChangeText={setNotes}
        placeholder="Opcjonalnie"
        multiline
      />

      <View className="mt-2">
        <SectionLabel className="mb-3">
          [ ĆWICZENIA ]
        </SectionLabel>

        {day && day.exercises.length === 0 ? (
          <View className="items-center justify-center py-8 border border-line rounded-md">
            <Text className="text-muted font-sans-md text-body">Brak ćwiczeń w tym dniu</Text>
          </View>
        ) : (
          <View className="gap-2 mb-3">
            {day?.exercises.map((exercise) => (
              <PlanDayExerciseRow
                key={exercise.id}
                exercise={exercise}
                onDelete={() => removeExercise({ planDayExerciseId: exercise.id })}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={() => navigation.navigate('PlanDayExercisePicker', { dayId })}
          className="border border-line rounded-md py-4 items-center"
        >
          <Text className="text-fg font-sans-sb text-body-sm tracking-label uppercase">
            + Dodaj ćwiczenie
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
