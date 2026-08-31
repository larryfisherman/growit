using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.UpdateTrainingPlan;

public record UpdateTrainingPlanCommand(Guid UserId, Guid PlanId, string Name, string? Notes) : IRequest;
