using GrowIt.Contracts.TrainingPlans.Requests;
using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.SetPlanDayExercises;

/// Declarative replacement of a day's exercise list: the client sends the state it wants
/// and the handler works out the difference. Re-sending the same list changes nothing,
/// which is what makes a retry after a dropped connection safe.
///
/// Each entry is the request's own PlanDayExerciseSelection (see it for what an entry may
/// name); commands may take Contracts types directly.
public record SetPlanDayExercisesCommand(
    Guid UserId,
    Guid PlanDayId,
    IReadOnlyList<PlanDayExerciseSelection> Selections) : IRequest;
