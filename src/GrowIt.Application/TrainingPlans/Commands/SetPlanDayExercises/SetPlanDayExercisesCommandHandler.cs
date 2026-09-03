using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.SetPlanDayExercises;

public class SetPlanDayExercisesCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<SetPlanDayExercisesCommand>
{
    // What a freshly picked exercise starts on; the user tunes it afterwards on the day
    // view. Mirrored by DEFAULT_TARGETS in the mobile app.
    private const int DefaultTargetSets = 3;
    private const int DefaultTargetReps = 10;
    private const int DefaultRestSeconds = 90;

    public async Task Handle(SetPlanDayExercisesCommand request, CancellationToken cancellationToken)
    {
        var day = await dbContext.TrainingPlanDays
            .Include(d => d.Exercises)
            .FirstOrDefaultAsync(
                d => d.Id == request.PlanDayId && d.Plan.UserId == request.UserId,
                cancellationToken);

        if (day is null)
        {
            throw new KeyNotFoundException($"Plan day {request.PlanDayId} not found");
        }

        // Snapshot before touching anything: EF's relationship fix-up pushes rows we add
        // into day.Exercises, and they must not be mistaken for pre-existing ones - neither
        // as reuse candidates nor as rows to drop.
        var originalRows = day.Exercises.ToList();
        var byRowId = originalRows.ToDictionary(e => e.Id);
        var claimed = new HashSet<Guid>();
        var resolved = new TrainingPlanDayExercise?[request.Selections.Count];

        // Rows the caller named outright are claimed first, so the reuse pass below cannot
        // steal one out from under them.
        for (var index = 0; index < request.Selections.Count; index++)
        {
            if (request.Selections[index].PlanDayExerciseId is not { } rowId) continue;

            if (!byRowId.TryGetValue(rowId, out var row))
            {
                throw new ArgumentException($"Plan day exercise {rowId} does not belong to this day");
            }

            claimed.Add(rowId);
            resolved[index] = row;
        }

        // An entry naming only an exercise reuses a row the day already has for it, rather
        // than dropping that row and inserting a twin. That keeps ids - and the targets
        // hanging off them - stable when the same desired list is sent twice.
        for (var index = 0; index < request.Selections.Count; index++)
        {
            if (resolved[index] is not null) continue;

            var selection = request.Selections[index];
            var reusable = originalRows.FirstOrDefault(e =>
                !claimed.Contains(e.Id)
                && (selection.ExerciseId.HasValue
                    ? e.ExerciseId == selection.ExerciseId
                    : e.ExerciseId is null && e.CustomExerciseName == selection.CustomExerciseName));

            if (reusable is not null)
            {
                claimed.Add(reusable.Id);
                resolved[index] = reusable;
                continue;
            }

            var created = new TrainingPlanDayExercise
            {
                Id = Guid.NewGuid(),
                PlanDayId = day.Id,
                ExerciseId = selection.ExerciseId,
                CustomExerciseName = selection.CustomExerciseName,
                TargetSets = DefaultTargetSets,
                TargetReps = DefaultTargetReps,
                RestSeconds = DefaultRestSeconds
            };

            dbContext.TrainingPlanDayExercises.Add(created);
            resolved[index] = created;
        }

        foreach (var dropped in originalRows.Where(e => !claimed.Contains(e.Id)))
        {
            dbContext.TrainingPlanDayExercises.Remove(dropped);
        }

        for (var index = 0; index < resolved.Length; index++)
        {
            resolved[index]!.OrderIndex = index;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
