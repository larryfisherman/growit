using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Contracts.Workouts.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutByDate;

public class GetWorkoutByDateQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutByDateQuery, WorkoutByDateResponse?>
{
    public async Task<WorkoutByDateResponse?> Handle(GetWorkoutByDateQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Workouts
            .OwnedBy(request.UserId)
            .Where(w => w.PerformedAt == request.Date)
            // Mirrors WorkoutProjections.Summary field for field on purpose; a field added to one belongs in the other.
            .Select(w => new WorkoutByDateResponse(
                w.Id,
                w.Name,
                w.PerformedAt,
                w.WorkoutExercises.Count,
                w.PlanDayId,
                w.PlanDay != null ? w.PlanDay.Name : null))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
