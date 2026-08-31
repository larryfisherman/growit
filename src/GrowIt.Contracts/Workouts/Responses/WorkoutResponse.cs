namespace GrowIt.Contracts.Workouts.Responses;

public record WorkoutResponse(
    Guid Id,
    string Name,
    DateOnly PerformedAt,
    string? Notes,
    Guid? PlanDayId,
    string? PlanDayName,
    IReadOnlyList<WorkoutExerciseResponse> Exercises);
