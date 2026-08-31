namespace GrowIt.Contracts.Workouts.Responses;

public record WorkoutByDateResponse(
    Guid Id,
    string Name,
    DateOnly PerformedAt,
    int ExerciseCount,
    Guid? PlanDayId,
    string? PlanDayName);
