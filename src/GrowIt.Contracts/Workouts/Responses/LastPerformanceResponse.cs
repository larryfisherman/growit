namespace GrowIt.Contracts.Workouts.Responses;

/// What the user lifted on this exercise the last time they did it - the number they
/// are trying to match or beat.
public record LastPerformanceResponse(DateOnly PerformedAt, IReadOnlyList<LastSetResponse> Sets);

public record LastSetResponse(decimal WeightKg, int Reps);
