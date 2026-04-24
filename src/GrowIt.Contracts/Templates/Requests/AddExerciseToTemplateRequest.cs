namespace GrowIt.Contracts.Templates.Requests;

public record AddExerciseToTemplateRequest(
    Guid? ExerciseId,
    string? CustomExerciseName,
    int TargetSets,
    int TargetReps,
    int RestSeconds);
