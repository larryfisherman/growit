using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.SetActiveTrainingPlan;

public record SetActiveTrainingPlanCommand(Guid UserId, Guid PlanId) : IRequest;
