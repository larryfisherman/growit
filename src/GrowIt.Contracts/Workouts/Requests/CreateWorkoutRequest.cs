namespace GrowIt.Contracts.Workouts.Requests;

public record CreateWorkoutRequest(Guid UserId, string Name, DateOnly PerformedAt, string? Notes);
