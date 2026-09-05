namespace GrowIt.Contracts.Exercises.Requests;

public record LogSetRequest(Guid Id, decimal WeightKg, int Reps, int OrderIndex);
