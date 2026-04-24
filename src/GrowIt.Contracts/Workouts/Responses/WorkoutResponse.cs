namespace GrowIt.Contracts.Workouts.Responses;

public record WorkoutResponse(
    Guid Id,
    string Name,
    DateOnly PerformedAt,
    string? Notes,
    IReadOnlyList<WorkoutExerciseResponse> Exercises);
