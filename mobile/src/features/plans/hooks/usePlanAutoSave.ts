import { usePutApiTrainingPlansPlanId } from '../../../api/generated/training-plans/training-plans';
import { TrainingPlanResponse } from '../../../api/generated/schemas';
import { useNameNotesAutoSave } from './useNameNotesAutoSave';

type Args = {
  planId: string | null;
  plan: TrainingPlanResponse | undefined;
  name: string;
  notes: string;
  delayMs?: number;
};

/// Autosaves the plan header; see useNameNotesAutoSave. A plan not created yet (null id)
/// has nothing to save to.
export const usePlanAutoSave = ({ planId, plan, name, notes, delayMs }: Args) => {
  const { mutate: update } = usePutApiTrainingPlansPlanId();

  useNameNotesAutoSave({
    // `|| null`: an empty id has no plan to save to either, so it holds the write back like null.
    target: planId || null,
    saved: plan,
    name,
    notes,
    delayMs,
    write: (planId, data) => update({ planId, data }),
  });
};
