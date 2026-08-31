using MediatR;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromPlanDay;

public record CreateWorkoutFromPlanDayCommand(
    Guid UserId,
    Guid PlanDayId,
    DateOnly PerformedAt) : IRequest<Guid>;
