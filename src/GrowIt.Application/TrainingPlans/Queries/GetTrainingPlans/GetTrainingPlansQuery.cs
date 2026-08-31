using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;

namespace GrowIt.Application.TrainingPlans.Queries.GetTrainingPlans;

public record GetTrainingPlansQuery(Guid UserId) : IRequest<List<TrainingPlanSummaryResponse>>;
