using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Application.Workouts.Common;
using GrowIt.Contracts.Workouts.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutHistory;

public class GetWorkoutHistoryQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutHistoryQuery, WorkoutHistoryResponse>
{
    public async Task<WorkoutHistoryResponse> Handle(GetWorkoutHistoryQuery request, CancellationToken cancellationToken)
    {
        var query = dbContext.Workouts
            .OwnedBy(request.UserId)
            .OrderByDescending(w => w.PerformedAt);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(WorkoutProjections.Summary)
            .ToListAsync(cancellationToken);

        return new WorkoutHistoryResponse(items, totalCount);
    }
}
