namespace GrowIt.Contracts.Workouts.Responses;

public record WorkoutHistoryResponse(IReadOnlyList<WorkoutSummaryResponse> Items, int TotalCount);
