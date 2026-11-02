using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Application.Workouts.Common;
using GrowIt.Contracts.Workouts.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutById;

public class GetWorkoutByIdQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutByIdQuery, WorkoutResponse?>
{
    public async Task<WorkoutResponse?> Handle(GetWorkoutByIdQuery request, CancellationToken cancellationToken)
    {
        var row = await dbContext.Workouts
            .OwnedBy(request.UserId)
            .Where(w => w.Id == request.WorkoutId)
            .Select(w => new
            {
                Response = new WorkoutResponse(
                    w.Id,
                    w.Name,
                    w.PerformedAt,
                    w.Notes,
                    w.PlanDayId,
                    w.PlanDay != null ? w.PlanDay.Name : null,
                    w.WorkoutExercises
                        .OrderBy(we => we.OrderIndex)
                        .Select(we => new WorkoutExerciseResponse(
                            we.Id,
                            we.ExerciseId,
                            we.Exercise != null ? we.Exercise.Name : we.CustomExerciseName!,
                            we.Exercise != null ? we.Exercise.Category : null,
                            we.TargetSets,
                            we.TargetReps,
                            we.RestSeconds,
                            we.OrderIndex,
                            we.Sets
                                .OrderBy(s => s.OrderIndex)
                                .Select(s => new SetResponse(s.Id, s.WeightKg, s.Reps, s.OrderIndex))
                                .ToList(),
                            null))
                        .ToList()),
                w.CreatedAt,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null) return null;

        var workout = row.Response;

        var exerciseIds = workout.Exercises
            .Where(e => e.ExerciseId != null)
            .Select(e => e.ExerciseId!.Value)
            .Distinct()
            .ToList();

        var last = await LastPerformanceLookup.FindAsync(
            dbContext,
            request.UserId,
            exerciseIds,
            new SessionMoment(workout.Id, workout.PerformedAt, row.CreatedAt),
            cancellationToken);

        return workout with
        {
            Exercises = workout.Exercises
                .Select(e => e with
                {
                    LastPerformance = e.ExerciseId is { } id ? last.GetValueOrDefault(id) : null,
                })
                .ToList(),
        };
    }
}
