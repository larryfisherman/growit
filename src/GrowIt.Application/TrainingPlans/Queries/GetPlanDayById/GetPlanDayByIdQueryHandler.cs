using GrowIt.Application.Common.Interfaces;
using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Queries.GetPlanDayById;

public class GetPlanDayByIdQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetPlanDayByIdQuery, PlanDayResponse?>
{
    public async Task<PlanDayResponse?> Handle(GetPlanDayByIdQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.TrainingPlanDays
            .Where(d => d.Id == request.PlanDayId && d.Plan.UserId == request.UserId)
            .Select(d => new PlanDayResponse(
                d.Id,
                d.PlanId,
                d.Name,
                d.Notes,
                d.OrderIndex,
                // A day counts as "performed" once any workout was logged from it,
                // even a partial one - that is what marks its exercises as used.
                dbContext.Workouts.Any(w => w.PlanDayId == d.Id),
                d.Exercises
                    .OrderBy(e => e.OrderIndex)
                    .Select(e => new PlanDayExerciseResponse(
                        e.Id,
                        e.ExerciseId,
                        e.Exercise != null ? e.Exercise.Name : e.CustomExerciseName!,
                        e.Exercise != null ? e.Exercise.Category : null,
                        e.TargetSets,
                        e.TargetReps,
                        e.RestSeconds,
                        e.OrderIndex))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
