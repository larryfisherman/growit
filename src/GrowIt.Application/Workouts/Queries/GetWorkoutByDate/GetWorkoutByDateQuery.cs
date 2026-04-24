using GrowIt.Contracts.Workouts.Responses;
using MediatR;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutByDate;

public record GetWorkoutByDateQuery(Guid UserId, DateOnly Date) : IRequest<WorkoutByDateResponse?>;
