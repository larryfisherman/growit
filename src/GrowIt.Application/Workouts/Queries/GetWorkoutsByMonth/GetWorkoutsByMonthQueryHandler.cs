using GrowIt.Application.Common.Interfaces;
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
            .Where(w => w.UserId == request.UserId
                        && w.PerformedAt.Year == request.Year
                        && w.PerformedAt.Month == request.Month)
            .OrderByDescending(w => w.PerformedAt)
            .Select(w => new WorkoutSummaryResponse(
                w.Id,
                w.Name,
                w.PerformedAt,
                w.WorkoutExercises.Count,
                w.TemplateId,
                w.Template != null ? w.Template.Name : null))
            .ToListAsync(cancellationToken);
    }
}
