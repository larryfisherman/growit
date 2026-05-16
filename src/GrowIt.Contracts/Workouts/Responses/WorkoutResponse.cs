namespace GrowIt.Contracts.Workouts.Responses;

public record WorkoutResponse(
    Guid Id,
    string Name,
    DateOnly PerformedAt,
    string? Notes,
    Guid? TemplateId,
    string? TemplateName,
    IReadOnlyList<WorkoutExerciseResponse> Exercises);
