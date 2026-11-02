import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlansListScreen } from '../features/plans/screens/PlansListScreen';
import { PlanDetailScreen } from '../features/plans/screens/PlanDetailScreen';
import { PlanDayScreen } from '../features/plans/screens/PlanDayScreen';
import { PlanDayExercisePickerScreen } from '../features/plans/screens/PlanDayExercisePickerScreen';
import { PlansStackParamList } from './types';
import { darkStackOptions, planEditingScreenOptions } from './screenOptions';
import { SettingsButton } from '../theme/components/SettingsButton';

const Stack = createNativeStackNavigator<PlansStackParamList>();

export const PlansStack = () => (
  <Stack.Navigator screenOptions={darkStackOptions}>
    <Stack.Screen
      name="PlansList"
      component={PlansListScreen}
      options={{ title: 'Plany', headerRight: () => <SettingsButton /> }}
    />
    <Stack.Screen
      name="PlanDetail"
      component={PlanDetailScreen}
      options={planEditingScreenOptions.PlanDetail}
    />
    <Stack.Screen
      name="PlanDay"
      component={PlanDayScreen}
      options={planEditingScreenOptions.PlanDay}
    />
    <Stack.Screen
      name="PlanDayExercisePicker"
      component={PlanDayExercisePickerScreen}
      options={planEditingScreenOptions.PlanDayExercisePicker}
    />
  </Stack.Navigator>
);
