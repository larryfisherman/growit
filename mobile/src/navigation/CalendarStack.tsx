import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarScreen } from '../features/calendar/screens/CalendarScreen';
import { WorkoutDetailScreen } from '../features/workouts/screens/WorkoutDetailScreen';
import { CalendarStackParamList } from './types';
import { darkStackOptions } from './screenOptions';

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export const CalendarStack = () => (
  <Stack.Navigator screenOptions={darkStackOptions}>
    <Stack.Screen name="CalendarHome" component={CalendarScreen} options={{ title: 'Kalendarz' }} />
    <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Trening' }} />
  </Stack.Navigator>
);
