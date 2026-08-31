namespace GrowIt.Contracts.TrainingPlans.Responses;

public record TrainingPlanSummaryResponse(Guid Id, string Name, bool IsActive, int DayCount);
