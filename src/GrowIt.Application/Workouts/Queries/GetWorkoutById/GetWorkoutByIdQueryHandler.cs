using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutById;

public class GetWorkoutByIdQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutByIdQuery, WorkoutDetailResponse?>
{
    public async Task<WorkoutDetailResponse?> Handle(GetWorkoutByIdQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Workouts
            .Where(w => w.Id == request.WorkoutId)
            .Select(w => new WorkoutDetailResponse(
                w.Id,
                w.Name,
                w.PerformedAt,
                w.Notes,
                w.WorkoutExercises
                    .OrderBy(we => we.OrderIndex)
                    .Select(we => new WorkoutExerciseDetail(
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
                            .Select(s => new SetDetail(s.Id, s.WeightKg, s.Reps, s.OrderIndex))
                            .ToList()))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
