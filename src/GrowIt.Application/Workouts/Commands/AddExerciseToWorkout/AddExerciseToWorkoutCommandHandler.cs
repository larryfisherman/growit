using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Idempotency;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.AddExerciseToWorkout;

public class AddExerciseToWorkoutCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<AddExerciseToWorkoutCommand, Guid>
{
    public async Task<Guid> Handle(AddExerciseToWorkoutCommand request, CancellationToken cancellationToken)
    {
        var existing = dbContext.WorkoutExercises
            .Where(e => e.Id == request.Id)
            .Select(e => new ExistingRow(e.Workout.UserId, e.WorkoutId));

        var create = new IdempotentCreate(dbContext, existing, request.Id, request.UserId, request.WorkoutId);

        if (await create.AlreadyCreatedAsync(cancellationToken))
        {
            return request.Id;
        }

        // The workout id comes from the route; only its owner may append to it.
        var workoutIsMine = await dbContext.Workouts
            .OwnedBy(request.UserId)
            .AnyAsync(w => w.Id == request.WorkoutId, cancellationToken);

        if (!workoutIsMine)
        {
            throw new NotFoundException($"Workout {request.WorkoutId} not found");
        }

        var workoutExercise = new WorkoutExercise
        {
            Id = request.Id,
            WorkoutId = request.WorkoutId,
            ExerciseId = request.ExerciseId,
            // Position is the client's call: several rows may have been added offline,
            // and only it knows what order the user put them in.
            OrderIndex = request.OrderIndex,
            TargetSets = request.TargetSets,
            TargetReps = request.TargetReps,
            RestSeconds = request.RestSeconds
        };

        dbContext.WorkoutExercises.Add(workoutExercise);
        await create.SaveAsync(cancellationToken);

        return workoutExercise.Id;
    }
}
