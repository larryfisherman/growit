import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarScreen } from '../features/calendar/screens/CalendarScreen';
import { WorkoutDetailScreen } from '../features/workouts/screens/WorkoutDetailScreen';
import { AddExerciseToWorkoutScreen } from '../features/workouts/screens/AddExerciseToWorkoutScreen';
import { CalendarStackParamList } from './types';
import { darkStackOptions, workoutSessionScreenOptions } from './screenOptions';
import { SettingsButton } from '../features/settings/components/SettingsButton';

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export const CalendarStack = () => (
  <Stack.Navigator screenOptions={darkStackOptions}>
    <Stack.Screen
      name="CalendarHome"
      component={CalendarScreen}
      options={{ title: 'Kalendarz', headerRight: () => <SettingsButton /> }}
    />
    <Stack.Screen
      name="WorkoutDetail"
      component={WorkoutDetailScreen}
      options={workoutSessionScreenOptions.WorkoutDetail}
    />
    <Stack.Screen
      name="AddExerciseToWorkout"
      component={AddExerciseToWorkoutScreen}
      options={workoutSessionScreenOptions.AddExerciseToWorkout}
    />
  </Stack.Navigator>
);
