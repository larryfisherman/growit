using MediatR;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutByDate;

public record GetWorkoutByDateQuery(Guid UserId, DateOnly Date) : IRequest<WorkoutByDateResponse?>;

public record WorkoutByDateResponse(Guid Id, string Name, DateOnly PerformedAt, int ExerciseCount);
