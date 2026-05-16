import { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TodayStack } from './TodayStack';
import { CalendarStack } from './CalendarStack';
import { TemplatesStack } from './TemplatesStack';
import { AuthStack } from './AuthStack';
import { tokens } from '../theme/tokens';

const Tab = createBottomTabNavigator();
const Root = createNativeStackNavigator();

type TabIconName = 'flash' | 'calendar' | 'document-text';

const tabIcon = (name: TabIconName) => ({ color, size }: { color: string; size: number }) =>
  <Ionicons name={name} size={size} color={color} />;

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: tokens.color.bg,
        borderTopColor: tokens.color.line,
        borderTopWidth: 1,
      },
      tabBarActiveTintColor: tokens.color.lime,
      tabBarInactiveTintColor: tokens.color.muted,
      tabBarLabelStyle: {
        fontFamily: tokens.font.monoMedium,
        fontSize: 10,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
      },
    }}
  >
    <Tab.Screen name="Dzisiaj" component={TodayStack} options={{ tabBarIcon: tabIcon('flash') }} />
    <Tab.Screen name="Kalendarz" component={CalendarStack} options={{ tabBarIcon: tabIcon('calendar') }} />
    <Tab.Screen name="Szablony" component={TemplatesStack} options={{ tabBarIcon: tabIcon('document-text') }} />
  </Tab.Navigator>
);

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: tokens.color.bg,
    card: tokens.color.bg,
    text: tokens.color.fg,
    border: tokens.color.line,
    primary: tokens.color.lime,
  },
};

export const RootNavigator = () => {
  // TODO: replace with real auth state (Context / Zustand / SecureStore-backed)
  const [isAuthed] = useState(false);

  return (
    <NavigationContainer theme={navigationTheme}>
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
