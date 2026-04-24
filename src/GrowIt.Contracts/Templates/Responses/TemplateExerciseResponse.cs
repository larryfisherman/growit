namespace GrowIt.Contracts.Templates.Responses;

public record TemplateExerciseResponse(
    Guid Id,
    Guid? ExerciseId,
    string ExerciseName,
    string? Category,
    int TargetSets,
    int TargetReps,
    int RestSeconds,
    int OrderIndex);
