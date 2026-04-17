using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutByDate;

public class GetWorkoutByDateQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutByDateQuery, WorkoutByDateResponse?>
{
    public async Task<WorkoutByDateResponse?> Handle(GetWorkoutByDateQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Workouts
            .Where(w => w.UserId == request.UserId && w.PerformedAt == request.Date)
            .Select(w => new WorkoutByDateResponse(
                w.Id,
                w.Name,
                w.PerformedAt,
                w.WorkoutExercises.Count))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
