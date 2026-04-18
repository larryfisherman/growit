import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutsScreen } from '../features/workouts/screens/WorkoutsScreen';
import { WorkoutDetailScreen } from '../features/workouts/screens/WorkoutDetailScreen';
import { AddExerciseToWorkoutScreen } from '../features/workouts/screens/AddExerciseToWorkoutScreen';
import { TodayStackParamList } from './types';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export const TodayStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="TodayWorkout" component={WorkoutsScreen} options={{ title: 'Dzisiaj' }} />
    <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Trening' }} />
    <Stack.Screen name="AddExerciseToWorkout" component={AddExerciseToWorkoutScreen} options={{ title: 'Dodaj ćwiczenie' }} />
  </Stack.Navigator>
);
