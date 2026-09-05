namespace GrowIt.Contracts.TrainingPlans.Requests;

/// Id comes from the client so the plan can be created offline and navigated to
/// immediately; sending the same request twice is a no-op rather than a duplicate.
public record CreateTrainingPlanRequest(Guid Id, string Name, string? Notes);
