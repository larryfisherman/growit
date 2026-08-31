namespace GrowIt.Contracts.TrainingPlans.Requests;

public record UpdatePlanDayExerciseRequest(
    int TargetSets,
    int TargetReps,
    int RestSeconds,
    int OrderIndex);
