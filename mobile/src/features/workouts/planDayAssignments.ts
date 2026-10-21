import type { QueryClient } from '@tanstack/react-query';
import { getGetApiTrainingPlansDaysDayIdQueryKey } from '../../api/generated/training-plans/training-plans';
import type {
  CreateWorkoutFromPlanDayRequest,
  PlanDayResponse,
} from '../../api/generated/schemas';
import { newId } from '../../offline/ids';

type SessionCopy = Pick<CreateWorkoutFromPlanDayRequest, 'exerciseIds' | 'name' | 'exercises'>;

/// The session as this phone starts it from a plan day: the ids its exercises get, and
/// the copy itself.
///
/// The ids are what let the session be opened and written to before the server has
/// answered. The copy is what makes the server keep exactly that session - with those
/// ids - even if the day was edited or deleted on another device before the write
/// landed; without it, sets logged offline could point at rows the server never made.
///
/// Empty when the day was never opened: then there is nothing to copy from, and the
/// server makes the copy and names the rows itself.
export const planDaySessionCopy = (queryClient: QueryClient, planDayId: string): SessionCopy => {
  const day = queryClient.getQueryData<PlanDayResponse>(
    getGetApiTrainingPlansDaysDayIdQueryKey(planDayId),
  );
  if (!day) return { exerciseIds: null, name: null, exercises: null };

  const copied = day.exercises.map((exercise) => ({ row: exercise, workoutExerciseId: newId() }));

  return {
    exerciseIds: copied.map(({ row, workoutExerciseId }) => ({
      planDayExerciseId: row.id,
      workoutExerciseId,
    })),
    name: day.name,
    exercises: copied.map(({ row, workoutExerciseId }) => ({
      workoutExerciseId,
      exerciseId: row.exerciseId,
      customExerciseName: row.exerciseId ? null : row.exerciseName,
      targetSets: row.targetSets,
      targetReps: row.targetReps,
      restSeconds: row.restSeconds,
      orderIndex: row.orderIndex,
    })),
  };
};
