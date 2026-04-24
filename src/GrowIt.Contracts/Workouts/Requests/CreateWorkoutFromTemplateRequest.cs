namespace GrowIt.Contracts.Workouts.Requests;

public record CreateWorkoutFromTemplateRequest(Guid UserId, Guid TemplateId, DateOnly PerformedAt);
