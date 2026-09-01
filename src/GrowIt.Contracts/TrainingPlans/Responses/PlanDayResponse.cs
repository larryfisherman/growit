namespace GrowIt.Contracts.TrainingPlans.Responses;

public record PlanDayResponse(
    Guid Id,
    Guid PlanId,
    string Name,
    string? Notes,
    int OrderIndex,
    bool HasBeenPerformed,
    IReadOnlyList<PlanDayExerciseResponse> Exercises);
