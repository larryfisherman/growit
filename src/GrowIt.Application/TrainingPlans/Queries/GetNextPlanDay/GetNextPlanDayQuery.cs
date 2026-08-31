using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;

namespace GrowIt.Application.TrainingPlans.Queries.GetNextPlanDay;

/// The day the today screen suggests: the one following the last session performed
/// from the active plan, wrapping back to the first day after the last.
public record GetNextPlanDayQuery(Guid UserId) : IRequest<PlanDaySummaryResponse?>;
