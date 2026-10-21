using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Workouts.Common;
using GrowIt.Contracts.TrainingPlans.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Queries.GetPlanDayById;

public class GetPlanDayByIdQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetPlanDayByIdQuery, PlanDayResponse?>
{
    public async Task<PlanDayResponse?> Handle(GetPlanDayByIdQuery request, CancellationToken cancellationToken)
    {
        var day = await dbContext.TrainingPlanDays
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
                        e.OrderIndex,
                        null))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        if (day is null) return null;

        var exerciseIds = day.Exercises
            .Where(e => e.ExerciseId != null)
            .Select(e => e.ExerciseId!.Value)
            .Distinct()
            .ToList();

        // No cut-off: a session started from this day copies the hint from here, often
        // with no signal, so it has to be the latest one there is.
        var last = await LastPerformanceLookup.FindAsync(
            dbContext, request.UserId, exerciseIds, before: null, cancellationToken);

        return day with
        {
            Exercises = day.Exercises
                .Select(e => e with
                {
                    LastPerformance = e.ExerciseId is { } id ? last.GetValueOrDefault(id) : null,
                })
                .ToList(),
        };
    }
}
