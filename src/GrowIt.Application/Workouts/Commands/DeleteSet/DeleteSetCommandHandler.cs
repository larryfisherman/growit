using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.DeleteSet;

public class DeleteSetCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<DeleteSetCommand>
{
    public async Task Handle(DeleteSetCommand request, CancellationToken cancellationToken)
    {
        var set = await dbContext.Sets
            .FirstOrDefaultAsync(
                s => s.Id == request.SetId && s.WorkoutExercise.Workout.UserId == request.UserId,
                cancellationToken);

        // Already gone is the requested state; see DeleteTrainingPlanCommandHandler.
        if (set is null) return;

        // The sets left behind keep their positions. Nothing reads them as contiguous - the
        // phone numbers sets by where they stand, and appends after the highest one.
        dbContext.Sets.Remove(set);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
