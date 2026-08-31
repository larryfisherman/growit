using MediatR;

namespace GrowIt.Application.TrainingPlans.Commands.AddExerciseToPlanDay;

public record AddExerciseToPlanDayCommand(
    Guid UserId,
    Guid PlanDayId,
    Guid? ExerciseId,
    string? CustomExerciseName,
    int TargetSets,
    int TargetReps,
    int RestSeconds) : IRequest<Guid>;
