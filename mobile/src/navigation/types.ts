/// The plan-editing screens, mounted in both the Today and Plans stacks so editing a plan
/// never switches tabs.
type PlanEditingParamList = {
  PlanDetail: { planId: string | null };
  PlanDay: { dayId: string };
  PlanDayExercisePicker: { dayId: string };
};

/// The workout-session screens, mounted in both the Today and Calendar stacks so a session
/// opened from either tab can be viewed and extended in place.
export type WorkoutSessionParamList = {
  WorkoutDetail: { workoutId: string };
  AddExerciseToWorkout: { workoutId: string };
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
  StartFromPlanDay: undefined;
} & WorkoutSessionParamList &
  PlanEditingParamList;

export type CalendarStackParamList = {
  CalendarHome: undefined;
} & WorkoutSessionParamList;

export type PlansStackParamList = {
  PlansList: undefined;
} & PlanEditingParamList;

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  Auth: undefined;
};
