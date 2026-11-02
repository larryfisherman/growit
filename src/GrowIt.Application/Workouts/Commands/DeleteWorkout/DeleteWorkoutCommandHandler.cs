using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.DeleteWorkout;

public class DeleteWorkoutCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<DeleteWorkoutCommand>
{
    public async Task Handle(DeleteWorkoutCommand request, CancellationToken cancellationToken)
    {
        var workout = await dbContext.Workouts
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(w => w.Id == request.WorkoutId, cancellationToken);

        // Already gone is the requested state; see DeleteTrainingPlanCommandHandler.
        if (workout is null) return;

        // Exercises and their sets go with it by cascade in the database. The plan day it
        // came from stays as it was: the next suggested day is worked out from the
        // sessions that remain, so it moves back on its own.
        dbContext.Workouts.Remove(workout);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
