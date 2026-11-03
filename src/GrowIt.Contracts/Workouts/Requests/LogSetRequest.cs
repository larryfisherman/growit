namespace GrowIt.Contracts.Workouts.Requests;

public record LogSetRequest(Guid Id, decimal WeightKg, int Reps, int OrderIndex);
