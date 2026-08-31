namespace GrowIt.Contracts.TrainingPlans.Responses;

public record PlanDayExerciseResponse(
    Guid Id,
    Guid? ExerciseId,
    string ExerciseName,
    string? Category,
    int TargetSets,
    int TargetReps,
    int RestSeconds,
    int OrderIndex);
