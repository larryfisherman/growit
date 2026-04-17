import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import AddExerciseToWorkoutScreen from '../screens/AddExerciseToWorkoutScreen';
import { TodayStackParamList } from './types';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export default function TodayStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TodayWorkout" component={WorkoutsScreen} options={{ title: 'Dzisiaj' }} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Trening' }} />
      <Stack.Screen name="AddExerciseToWorkout" component={AddExerciseToWorkoutScreen} options={{ title: 'Dodaj ćwiczenie' }} />
    </Stack.Navigator>
  );
}
