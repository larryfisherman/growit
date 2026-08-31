import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutsScreen } from '../features/workouts/screens/WorkoutsScreen';
import { WorkoutDetailScreen } from '../features/workouts/screens/WorkoutDetailScreen';
import { AddExerciseToWorkoutScreen } from '../features/workouts/screens/AddExerciseToWorkoutScreen';
import { StartFromPlanDayScreen } from '../features/workouts/screens/StartFromPlanDayScreen';
import { PlanDetailScreen } from '../features/plans/screens/PlanDetailScreen';
import { PlanDayScreen } from '../features/plans/screens/PlanDayScreen';
import { PlanDayExercisePickerScreen } from '../features/plans/screens/PlanDayExercisePickerScreen';
import { TodayStackParamList } from './types';
import { darkStackOptions } from './screenOptions';
import { SettingsButton } from '../theme/components/SettingsButton';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export const TodayStack = () => (
  <Stack.Navigator screenOptions={darkStackOptions}>
    <Stack.Screen
      name="TodayWorkout"
      component={WorkoutsScreen}
      options={{ title: 'Dzisiaj', headerRight: () => <SettingsButton /> }}
    />
    <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Trening' }} />
    <Stack.Screen
      name="AddExerciseToWorkout"
      component={AddExerciseToWorkoutScreen}
      options={{ title: 'Dodaj ćwiczenie' }}
    />
    <Stack.Screen
      name="StartFromPlanDay"
      component={StartFromPlanDayScreen}
      options={{ title: 'Wybierz dzień' }}
    />
    <Stack.Screen name="PlanDetail" component={PlanDetailScreen} options={{ title: 'Plan' }} />
    <Stack.Screen name="PlanDay" component={PlanDayScreen} options={{ title: 'Dzień planu' }} />
    <Stack.Screen
      name="PlanDayExercisePicker"
      component={PlanDayExercisePickerScreen}
      options={{ title: 'Wybierz ćwiczenie', presentation: 'modal' }}
    />
  </Stack.Navigator>
);
