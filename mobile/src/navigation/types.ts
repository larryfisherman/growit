export type TodayStackParamList = {
  TodayWorkout: undefined;
  WorkoutDetail: { workoutId: string };
  AddExerciseToWorkout: { workoutId: string };
  StartFromTemplate: undefined;
  TemplateDetail: { templateId: string | null };
  TemplateExercisePicker: { templateId: string };
  TemplateExerciseEdit: {
    templateId: string;
    templateExerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
    restSeconds: number;
    orderIndex: number;
  };
};

export type CalendarStackParamList = {
  CalendarHome: undefined;
  WorkoutDetail: { workoutId: string };
};

export type TemplatesStackParamList = {
  TemplatesList: undefined;
  TemplateDetail: { templateId: string | null };
  TemplateExercisePicker: { templateId: string };
  TemplateExerciseEdit: {
    templateId: string;
    templateExerciseId: string;
    exerciseName: string;
    targetSets: number;
    targetReps: number;
    restSeconds: number;
    orderIndex: number;
  };
};
