using MediatR;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutHistory;

public record GetWorkoutHistoryQuery(Guid UserId, int Page = 1, int PageSize = 20) : IRequest<WorkoutHistoryResponse>;
