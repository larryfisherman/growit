export type TodayStackParamList = {
  TodayWorkout: undefined;
  WorkoutDetail: { workoutId: string };
  AddExerciseToWorkout: { workoutId: string };
  StartFromPlanDay: undefined;
  PlanDetail: { planId: string | null };
  PlanDay: { dayId: string };
  PlanDayExercisePicker: { dayId: string; planId: string };
};

export type CalendarStackParamList = {
  CalendarHome: undefined;
  WorkoutDetail: { workoutId: string };
};

export type PlansStackParamList = {
  PlansList: undefined;
  PlanDetail: { planId: string | null };
  PlanDay: { dayId: string };
  PlanDayExercisePicker: { dayId: string; planId: string };
};

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  Auth: undefined;
};
