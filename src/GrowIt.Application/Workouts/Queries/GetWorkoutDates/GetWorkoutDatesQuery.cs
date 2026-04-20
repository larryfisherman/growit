using MediatR;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutDates;

public record GetWorkoutDatesQuery(Guid UserId, int Year, int Month) : IRequest<List<DateOnly>>;
