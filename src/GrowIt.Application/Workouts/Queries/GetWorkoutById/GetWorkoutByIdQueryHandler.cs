using GrowIt.Application.Common.Interfaces;
using GrowIt.Contracts.Workouts.Responses;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Queries.GetWorkoutById;

public class GetWorkoutByIdQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetWorkoutByIdQuery, WorkoutResponse?>
{
    public async Task<WorkoutResponse?> Handle(GetWorkoutByIdQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Workouts
            .Where(w => w.Id == request.WorkoutId)
            .Select(w => new WorkoutResponse(
                w.Id,
                w.Name,
                w.PerformedAt,
                w.Notes,
                w.TemplateId,
                w.Template != null ? w.Template.Name : null,
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
                            .ToList()))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
