namespace GrowIt.API.Models;

public record UpdateTemplateRequest(string Name, string? Notes);

public record AddExerciseToTemplateRequest(
    Guid? ExerciseId,
    string? CustomExerciseName,
    int TargetSets,
    int TargetReps,
    int RestSeconds);

public record UpdateTemplateExerciseRequest(
    int TargetSets,
    int TargetReps,
    int RestSeconds,
    int OrderIndex);

public record CreateWorkoutFromTemplateRequest(Guid UserId, Guid TemplateId, DateOnly PerformedAt);
