using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;

namespace GrowIt.Application.TrainingPlans.Queries.GetPlanDayById;

public record GetPlanDayByIdQuery(Guid UserId, Guid PlanDayId) : IRequest<PlanDayResponse?>;
