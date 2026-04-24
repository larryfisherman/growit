namespace GrowIt.Contracts.Workouts.Responses;

public record WorkoutSummaryResponse(Guid Id, string Name, DateOnly PerformedAt, int ExerciseCount);
