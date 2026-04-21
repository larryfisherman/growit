import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { TodayStack } from './TodayStack';
import { CalendarStack } from './CalendarStack';
import { TemplatesStack } from './TemplatesStack';

const Tab = createBottomTabNavigator();

export const RootNavigator = () => (
  <NavigationContainer>
    <Tab.Navigator>
      <Tab.Screen name="Dzisiaj" component={TodayStack} options={{ headerShown: false }} />
      <Tab.Screen name="Kalendarz" component={CalendarStack} options={{ headerShown: false }} />
      <Tab.Screen name="Szablony" component={TemplatesStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  </NavigationContainer>
);
