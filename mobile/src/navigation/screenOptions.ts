import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { tokens } from '../theme/tokens';

export const darkStackOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: tokens.color.bg },
  headerTintColor: tokens.color.fg,
  headerTitleStyle: {
    fontFamily: tokens.font.sansBold,
    color: tokens.color.fg,
  },
  headerShadowVisible: false,
  headerBackTitle: '',
  contentStyle: { backgroundColor: tokens.color.bg },
};

/// Options for the plan-editing screens, shared by every stack that mounts them so their
/// titles and presentation stay the same wherever a plan is edited from.
export const planEditingScreenOptions = {
  PlanDetail: { title: 'Plan' },
  PlanDay: { title: 'Dzień planu' },
  PlanDayExercisePicker: { title: 'Wybierz ćwiczenie', presentation: 'modal' },
} satisfies Record<string, NativeStackNavigationOptions>;

/// Options for the workout-session screens, shared by the Today and Calendar stacks.
export const workoutSessionScreenOptions = {
  WorkoutDetail: { title: 'Trening' },
  AddExerciseToWorkout: { title: 'Dodaj ćwiczenie' },
} satisfies Record<string, NativeStackNavigationOptions>;
