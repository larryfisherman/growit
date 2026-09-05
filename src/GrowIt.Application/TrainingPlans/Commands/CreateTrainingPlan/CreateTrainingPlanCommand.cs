using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.CreateTrainingPlan;

public record CreateTrainingPlanCommand(Guid Id, Guid UserId, string Name, string? Notes) : IRequest<Guid>;
