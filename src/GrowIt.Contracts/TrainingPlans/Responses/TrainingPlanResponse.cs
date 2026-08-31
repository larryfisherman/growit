namespace GrowIt.Contracts.TrainingPlans.Responses;

public record TrainingPlanResponse(
    Guid Id,
    string Name,
    string? Notes,
    bool IsActive,
    IReadOnlyList<PlanDaySummaryResponse> Days);
