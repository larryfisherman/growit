import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutsScreen } from '../features/workouts/screens/WorkoutsScreen';
import { WorkoutDetailScreen } from '../features/workouts/screens/WorkoutDetailScreen';
import { AddExerciseToWorkoutScreen } from '../features/workouts/screens/AddExerciseToWorkoutScreen';
import { StartFromTemplateScreen } from '../features/workouts/screens/StartFromTemplateScreen';
import { TemplateDetailScreen } from '../features/templates/screens/TemplateDetailScreen';
import { TemplateExercisePickerScreen } from '../features/templates/screens/TemplateExercisePickerScreen';
import { TodayStackParamList } from './types';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export const TodayStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="TodayWorkout" component={WorkoutsScreen} options={{ title: 'Dzisiaj' }} />
    <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Trening' }} />
    <Stack.Screen name="AddExerciseToWorkout" component={AddExerciseToWorkoutScreen} options={{ title: 'Dodaj ćwiczenie' }} />
    <Stack.Screen name="StartFromTemplate" component={StartFromTemplateScreen} options={{ title: 'Wybierz szablon' }} />
    <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} options={{ title: 'Szablon' }} />
    <Stack.Screen name="TemplateExercisePicker" component={TemplateExercisePickerScreen} options={{ title: 'Wybierz ćwiczenie', presentation: 'modal' }} />
  </Stack.Navigator>
);
