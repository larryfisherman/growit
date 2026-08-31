using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.DeleteTrainingPlan;

public record DeleteTrainingPlanCommand(Guid UserId, Guid PlanId) : IRequest;
