namespace GrowIt.Contracts.TrainingPlans.Requests;

public record AddExerciseToPlanDayRequest(
    Guid? ExerciseId,
    string? CustomExerciseName,
    int TargetSets,
    int TargetReps,
    int RestSeconds);
