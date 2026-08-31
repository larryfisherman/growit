namespace GrowIt.Contracts.Workouts.Requests;

public record CreateWorkoutFromPlanDayRequest(Guid PlanDayId, DateOnly PerformedAt);
