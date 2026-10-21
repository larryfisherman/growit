using GrowIt.Contracts.Workouts.Requests;
using MediatR;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromPlanDay;

public record CreateWorkoutFromPlanDayCommand(
    Guid Id,
    Guid UserId,
    Guid PlanDayId,
    DateOnly PerformedAt,
    IReadOnlyList<WorkoutExerciseIdAssignment> ExerciseIds,
    string? Name = null,
    IReadOnlyList<WorkoutExerciseSnapshot>? Exercises = null) : IRequest<Guid>;
