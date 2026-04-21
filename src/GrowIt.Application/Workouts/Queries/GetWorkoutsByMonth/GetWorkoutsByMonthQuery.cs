using GrowIt.Application.Workouts.Queries.GetWorkoutHistory;
using MediatR;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutsByMonth;

public record GetWorkoutsByMonthQuery(Guid UserId, int Year, int Month) : IRequest<List<WorkoutSummary>>;
