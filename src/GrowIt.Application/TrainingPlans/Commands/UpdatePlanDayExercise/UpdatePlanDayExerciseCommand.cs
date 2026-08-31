using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDayExercise;

public record UpdatePlanDayExerciseCommand(
    Guid UserId,
    Guid PlanDayExerciseId,
    int TargetSets,
    int TargetReps,
    int RestSeconds,
    int OrderIndex) : IRequest;
