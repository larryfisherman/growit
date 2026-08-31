namespace GrowIt.Contracts.TrainingPlans.Requests;

/// The day ids in their new order; position in the list becomes OrderIndex.
public record ReorderPlanDaysRequest(IReadOnlyList<Guid> DayIds);
