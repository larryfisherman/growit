using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutDates;

public class GetWorkoutDatesQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutDatesQuery, List<DateOnly>>
{
    public async Task<List<DateOnly>> Handle(GetWorkoutDatesQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Workouts
            .Where(w => w.UserId == request.UserId
                        && w.PerformedAt.Year == request.Year
                        && w.PerformedAt.Month == request.Month)
            .Select(w => w.PerformedAt)
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}
