namespace GrowIt.Application.Workouts.Queries.GetWorkoutHistory;

public record WorkoutHistoryResponse(IReadOnlyList<WorkoutSummary> Items, int TotalCount);

public record WorkoutSummary(Guid Id, string Name, DateOnly PerformedAt, int ExerciseCount);
