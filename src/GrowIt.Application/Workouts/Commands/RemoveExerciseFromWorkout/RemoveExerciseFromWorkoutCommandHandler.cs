using GrowIt.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.RemoveExerciseFromWorkout;

public class RemoveExerciseFromWorkoutCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<RemoveExerciseFromWorkoutCommand>
{
    public async Task Handle(RemoveExerciseFromWorkoutCommand request, CancellationToken cancellationToken)
    {
        var exercise = await dbContext.WorkoutExercises
            .FirstOrDefaultAsync(
                e => e.Id == request.WorkoutExerciseId && e.Workout.UserId == request.UserId,
                cancellationToken);

        // Already gone is the requested state; see DeleteTrainingPlanCommandHandler.
        if (exercise is null) return;

        // Its sets go with it by cascade in the database.
        dbContext.WorkoutExercises.Remove(exercise);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
