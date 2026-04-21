using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Workouts.Queries.GetWorkoutHistory;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutsByMonth;

public class GetWorkoutsByMonthQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutsByMonthQuery, List<WorkoutSummary>>
{
    public async Task<List<WorkoutSummary>> Handle(GetWorkoutsByMonthQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Workouts
            .Where(w => w.UserId == request.UserId
                        && w.PerformedAt.Year == request.Year
                        && w.PerformedAt.Month == request.Month)
            .OrderByDescending(w => w.PerformedAt)
            .Select(w => new WorkoutSummary(
                w.Id,
                w.Name,
                w.PerformedAt,
                w.WorkoutExercises.Count))
            .ToListAsync(cancellationToken);
    }
}
