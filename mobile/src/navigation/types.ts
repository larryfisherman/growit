/// The plan-editing screens, mounted in both the Today and Plans stacks so editing a plan
/// never switches tabs.
type PlanEditingParamList = {
  PlanDetail: { planId: string | null };
  PlanDay: { dayId: string };
  PlanDayExercisePicker: { dayId: string; planId: string };
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ConfirmSignUp: { email: string; password?: string };
  ForgotPassword: { email?: string };
  ResetPassword: { email: string };
};

export type TodayStackParamList = {
  TodayWorkout: undefined;
  WorkoutDetail: { workoutId: string };
  AddExerciseToWorkout: { workoutId: string };
  StartFromPlanDay: undefined;
} & PlanEditingParamList;

export type CalendarStackParamList = {
  CalendarHome: undefined;
  WorkoutDetail: { workoutId: string };
};

export type PlansStackParamList = {
  PlansList: undefined;
} & PlanEditingParamList;

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  Auth: undefined;
};
