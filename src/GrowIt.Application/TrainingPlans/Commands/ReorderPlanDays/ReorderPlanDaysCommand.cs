using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.ReorderPlanDays;

/// Day ids in their new order - position in the list becomes OrderIndex.
public record ReorderPlanDaysCommand(Guid UserId, Guid PlanId, IReadOnlyList<Guid> DayIds) : IRequest;
