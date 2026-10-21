using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.UpdateSet;

public class UpdateSetCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<UpdateSetCommand>
{
    public async Task Handle(UpdateSetCommand request, CancellationToken cancellationToken)
    {
        // Carries the whole desired state of the set, so a replay changes nothing and the
        // phone may drop older queued copies of it. See coalesce.ts.
        var set = await dbContext.Sets
            .FirstOrDefaultAsync(
                s => s.Id == request.SetId && s.WorkoutExercise.Workout.UserId == request.UserId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Set {request.SetId} not found");

        set.WeightKg = request.WeightKg;
        set.Reps = request.Reps;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
