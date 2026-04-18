import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { TodayStack } from './TodayStack';
import { HistoryScreen } from '../screens/HistoryScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ExercisesScreen } from '../screens/ExercisesScreen';

const Tab = createBottomTabNavigator();

export const RootNavigator = () => (
  <NavigationContainer>
    <Tab.Navigator>
      <Tab.Screen name="Dzisiaj" component={TodayStack} options={{ headerShown: false }} />
      <Tab.Screen name="Historia" component={HistoryScreen} />
      <Tab.Screen name="Kalendarz" component={CalendarScreen} />
      <Tab.Screen name="Ćwiczenia" component={ExercisesScreen} />
    </Tab.Navigator>
  </NavigationContainer>
);
