namespace GrowIt.Contracts.Workouts.Requests;

/// UserId is gone on purpose: it was ignored anyway, since the controller takes the
/// user from the token. Leaving it in the contract only suggested otherwise.
public record CreateWorkoutRequest(Guid Id, string Name, DateOnly PerformedAt, string? Notes);
