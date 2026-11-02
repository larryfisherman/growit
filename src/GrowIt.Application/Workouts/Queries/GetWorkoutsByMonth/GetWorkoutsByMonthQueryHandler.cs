using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Application.Workouts.Common;
using GrowIt.Contracts.Workouts.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutsByMonth;

public class GetWorkoutsByMonthQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutsByMonthQuery, List<WorkoutSummaryResponse>>
{
    public async Task<List<WorkoutSummaryResponse>> Handle(GetWorkoutsByMonthQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Workouts
            .OwnedBy(request.UserId)
            .Where(w => w.PerformedAt.Year == request.Year && w.PerformedAt.Month == request.Month)
            .OrderByDescending(w => w.PerformedAt)
            .Select(WorkoutProjections.Summary)
            .ToListAsync(cancellationToken);
    }
}
