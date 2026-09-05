namespace GrowIt.Contracts.TrainingPlans.Requests;

public record CreatePlanDayRequest(Guid Id, string Name, string? Notes);
