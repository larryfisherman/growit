using GrowIt.Contracts.Workouts.Responses;
using MediatR;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutById;

public record GetWorkoutByIdQuery(Guid UserId, Guid WorkoutId) : IRequest<WorkoutResponse?>;
