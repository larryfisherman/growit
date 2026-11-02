namespace GrowIt.Contracts.Workouts.Requests;

/// The user comes from the token, never from the body.
public record CreateWorkoutRequest(Guid Id, string Name, DateOnly PerformedAt, string? Notes);
