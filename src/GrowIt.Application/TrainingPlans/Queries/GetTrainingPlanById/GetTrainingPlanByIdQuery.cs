using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;

namespace GrowIt.Application.TrainingPlans.Queries.GetTrainingPlanById;

public record GetTrainingPlanByIdQuery(Guid UserId, Guid PlanId) : IRequest<TrainingPlanResponse?>;
