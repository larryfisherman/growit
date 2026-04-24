namespace GrowIt.Contracts.Workouts.Responses;

public record SetResponse(Guid Id, decimal WeightKg, int Reps, int OrderIndex);
