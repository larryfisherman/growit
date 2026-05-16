import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TemplatesListScreen } from '../features/templates/screens/TemplatesListScreen';
import { TemplateDetailScreen } from '../features/templates/screens/TemplateDetailScreen';
import { TemplateExercisePickerScreen } from '../features/templates/screens/TemplateExercisePickerScreen';
import { TemplatesStackParamList } from './types';
import { darkStackOptions } from './screenOptions';

const Stack = createNativeStackNavigator<TemplatesStackParamList>();

export const TemplatesStack = () => (
  <Stack.Navigator screenOptions={darkStackOptions}>
    <Stack.Screen name="TemplatesList" component={TemplatesListScreen} options={{ title: 'Szablony' }} />
    <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} options={{ title: 'Szablon' }} />
    <Stack.Screen
      name="TemplateExercisePicker"
      component={TemplateExercisePickerScreen}
      options={{ title: 'Wybierz ćwiczenie', presentation: 'modal' }}
    />
  </Stack.Navigator>
);
