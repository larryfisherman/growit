using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;

namespace GrowIt.Application.Workouts.Commands.AddExerciseToWorkout;

public class AddExerciseToWorkoutHandler(IApplicationDbContext dbContext) : IRequestHandler<AddExerciseToWorkoutCommand, Guid>
{
    public async Task<Guid> Handle(AddExerciseToWorkoutCommand request, CancellationToken cancellationToken)
    {
        var workoutExercise = new WorkoutExercise
        {
            Id = Guid.NewGuid(),
            WorkoutId = request.WorkoutId,
            ExerciseId = request.ExerciseId,
            OrderIndex = 0
        };
        
        dbContext.WorkoutExercises.Add(workoutExercise);
        await dbContext.SaveChangesAsync(cancellationToken);
        return workoutExercise.Id;
    }
}