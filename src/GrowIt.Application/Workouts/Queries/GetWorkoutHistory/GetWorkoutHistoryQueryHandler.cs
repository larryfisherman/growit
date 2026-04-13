using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutHistory;

public class GetWorkoutHistoryQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutHistoryQuery, WorkoutHistoryResponse>
{
    public async Task<WorkoutHistoryResponse> Handle(GetWorkoutHistoryQuery request, CancellationToken cancellationToken)
    {
        var query = dbContext.Workouts
            .Where(w => w.UserId == request.UserId)
            .OrderByDescending(w => w.PerformedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(w => new WorkoutSummary(
                w.Id,
                w.Name,
                w.PerformedAt,
                w.WorkoutExercises.Count))
            .ToListAsync(cancellationToken);

        return new WorkoutHistoryResponse(items, totalCount);
    }
}
