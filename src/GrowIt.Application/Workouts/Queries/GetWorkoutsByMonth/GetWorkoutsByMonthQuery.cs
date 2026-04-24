using GrowIt.Contracts.Workouts.Responses;
using MediatR;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutsByMonth;

public record GetWorkoutsByMonthQuery(Guid UserId, int Year, int Month) : IRequest<List<WorkoutSummaryResponse>>;
