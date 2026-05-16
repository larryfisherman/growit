import { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { TodayStack } from './TodayStack';
import { CalendarStack } from './CalendarStack';
import { TemplatesStack } from './TemplatesStack';
import { AuthStack } from './AuthStack';

const Tab = createBottomTabNavigator();
const Root = createNativeStackNavigator();

const MainTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Dzisiaj" component={TodayStack} options={{ headerShown: false }} />
    <Tab.Screen name="Kalendarz" component={CalendarStack} options={{ headerShown: false }} />
    <Tab.Screen name="Szablony" component={TemplatesStack} options={{ headerShown: false }} />
  </Tab.Navigator>
);

export const RootNavigator = () => {
  // TODO: replace with real auth state (Context / Zustand / SecureStore-backed)
  const [isAuthed] = useState(false);

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isAuthed ? (
          <Root.Screen name="Main" component={MainTabs} />
        ) : (
          <Root.Screen name="Auth" component={AuthStack} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
};
