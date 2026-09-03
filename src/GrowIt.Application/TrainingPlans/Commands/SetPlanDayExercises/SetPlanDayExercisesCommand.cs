using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.SetPlanDayExercises;

/// Declarative replacement of a day's exercise list: the client sends the state it wants
/// and the handler works out the difference. Re-sending the same list changes nothing,
/// which is what makes a retry after a dropped connection safe.
public record SetPlanDayExercisesCommand(
    Guid UserId,
    Guid PlanDayId,
    IReadOnlyList<PlanDayExerciseSelectionInput> Selections) : IRequest;

/// Exactly one of the three identifies the entry; see SetPlanDayExercisesRequest.
public record PlanDayExerciseSelectionInput(
    Guid? PlanDayExerciseId,
    Guid? ExerciseId,
    string? CustomExerciseName);
