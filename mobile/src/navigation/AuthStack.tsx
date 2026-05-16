// mobile/src/navigation/AuthStack.tsx
// Hosts welcome + (future) login/register screens.

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../features/auth/screens/WelcomeScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;     // TODO — coming next
  Register: undefined;  // TODO — coming next
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0a' } }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
    {/* <Stack.Screen name="Register" component={RegisterScreen} /> */}
  </Stack.Navigator>
);
