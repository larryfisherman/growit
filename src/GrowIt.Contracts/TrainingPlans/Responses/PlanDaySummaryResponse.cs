namespace GrowIt.Contracts.TrainingPlans.Responses;

public record PlanDaySummaryResponse(Guid Id, string Name, int OrderIndex, int ExerciseCount);
