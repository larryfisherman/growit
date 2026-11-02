import { usePutApiTrainingPlansDaysDayId } from '../../../api/generated/training-plans/training-plans';
import { PlanDayResponse } from '../../../api/generated/schemas';
import { useNameNotesAutoSave } from './useNameNotesAutoSave';

type Args = {
  dayId: string;
  day: PlanDayResponse | undefined;
  name: string;
  notes: string;
  delayMs?: number;
};

/// Autosaves the plan-day header; see useNameNotesAutoSave.
export const usePlanDayAutoSave = ({ dayId, day, name, notes, delayMs }: Args) => {
  const { mutate: update } = usePutApiTrainingPlansDaysDayId();

  useNameNotesAutoSave({
    target: dayId,
    saved: day,
    name,
    notes,
    delayMs,
    write: (dayId, data) => update({ dayId, data }),
  });
};
