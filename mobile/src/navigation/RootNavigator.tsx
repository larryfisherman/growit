import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ExercisesScreen from '../screens/ExercisesScreen';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Dzisiaj" component={WorkoutsScreen} />
        <Tab.Screen name="Historia" component={HistoryScreen} />
        <Tab.Screen name="Kalendarz" component={CalendarScreen} />
        <Tab.Screen name="Ćwiczenia" component={ExercisesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
